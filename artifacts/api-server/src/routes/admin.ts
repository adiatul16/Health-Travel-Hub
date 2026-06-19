import { Router } from "express";
import { db } from "@workspace/db";
import { credentialsTable, clinicsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  anchorCredential,
  hashDocument,
  isBlockchainConfigured,
} from "../services/blockchain.js";
import { createClerkClient } from "@clerk/backend";

const router = Router();

function getClerkClient() {
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY ?? "" });
}

router.get("/metrics", (_req, res) => {
  res.json({
    totalPatients: 1842,
    totalBookings: 2156,
    treatmentRevenue: 892450,
    affiliateRevenue: 124300,
    hotelRevenue: 87600,
    insuranceRevenue: 52100,
    recoveryRevenue: 34200,
    conversionRate: 18.4,
    monthlyRevenueTrend: [
      { month: "Jan", revenue: 68000, bookings: 142 },
      { month: "Feb", revenue: 74500, bookings: 158 },
      { month: "Mar", revenue: 82300, bookings: 176 },
      { month: "Apr", revenue: 91000, bookings: 195 },
      { month: "May", revenue: 98500, bookings: 211 },
      { month: "Jun", revenue: 112400, bookings: 239 },
    ],
    popularTreatments: [
      { name: "Hair Transplant", bookings: 842, revenue: 312400 },
      { name: "Dental Implants", bookings: 524, revenue: 198700 },
      { name: "Rhinoplasty", bookings: 312, revenue: 156000 },
      { name: "Bariatric Surgery", bookings: 198, revenue: 143000 },
      { name: "IVF", bookings: 156, revenue: 82400 },
    ],
    availableSlots: 87,
    inventoryUtilization: 68.4,
  });
});

router.get("/credentials", async (_req, res) => {
  const rows = await db
    .select({
      id: credentialsTable.id,
      clinicId: credentialsTable.clinicId,
      clinicName: clinicsTable.name,
      credentialType: credentialsTable.credentialType,
      issuingBody: credentialsTable.issuingBody,
      issueDate: credentialsTable.issueDate,
      documentName: credentialsTable.documentName,
      documentHash: credentialsTable.documentHash,
      onChainTxHash: credentialsTable.onChainTxHash,
      onChainTimestamp: credentialsTable.onChainTimestamp,
      status: credentialsTable.status,
      adminNotes: credentialsTable.adminNotes,
      submittedAt: credentialsTable.submittedAt,
      anchoredAt: credentialsTable.anchoredAt,
    })
    .from(credentialsTable)
    .leftJoin(clinicsTable, eq(credentialsTable.clinicId, clinicsTable.id))
    .orderBy(desc(credentialsTable.submittedAt));

  res.json(
    rows.map((r) => ({
      ...r,
      polygonScanUrl: r.onChainTxHash
        ? `https://amoy.polygonscan.com/tx/${r.onChainTxHash}`
        : null,
      blockchainConfigured: isBlockchainConfigured(),
    }))
  );
});

router.post("/credentials", async (req, res) => {
  const {
    clinicId,
    credentialType,
    issuingBody,
    issueDate,
    documentName,
    documentHash,
    documentContent,
  } = req.body as {
    clinicId: number;
    credentialType: string;
    issuingBody: string;
    issueDate: string;
    documentName?: string;
    documentHash?: string;
    documentContent?: string;
  };

  if (!clinicId || !credentialType || !issuingBody || !issueDate) {
    res.status(400).json({ error: "clinicId, credentialType, issuingBody, issueDate required" });
    return;
  }

  const finalHash = documentHash ?? (documentContent ? hashDocument(documentContent) : null);

  const [created] = await db
    .insert(credentialsTable)
    .values({
      clinicId,
      credentialType,
      issuingBody,
      issueDate,
      documentName: documentName ?? null,
      documentHash: finalHash,
      status: "pending",
    })
    .returning();

  res.status(201).json(created);
});

router.post("/credentials/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [credential] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.id, id))
    .limit(1);

  if (!credential) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }
  if (credential.status === "anchored") {
    res.status(400).json({ error: "Already anchored on-chain" });
    return;
  }

  if (!isBlockchainConfigured()) {
    res.status(503).json({
      error:
        "Blockchain not configured. Add POLYGON_PRIVATE_KEY and CREDENTIAL_CONTRACT_ADDRESS to Secrets, then deploy the contract.",
    });
    return;
  }

  if (!credential.documentHash) {
    res.status(400).json({ error: "No document hash to anchor" });
    return;
  }

  const entityId = `clinic-${credential.clinicId}`;
  const { txHash, timestamp } = await anchorCredential(
    entityId,
    credential.documentHash,
    credential.issuingBody,
    credential.credentialType
  );

  const [updated] = await db
    .update(credentialsTable)
    .set({
      status: "anchored",
      onChainTxHash: txHash,
      onChainTimestamp: timestamp,
      anchoredAt: timestamp,
    })
    .where(eq(credentialsTable.id, id))
    .returning();

  res.json({
    ...updated,
    polygonScanUrl: `https://amoy.polygonscan.com/tx/${txHash}`,
  });
});

router.post("/credentials/:id/reject", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { adminNotes } = req.body as { adminNotes?: string };

  const [updated] = await db
    .update(credentialsTable)
    .set({ status: "rejected", adminNotes: adminNotes ?? null })
    .where(eq(credentialsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }
  res.json(updated);
});

router.delete("/credentials/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(credentialsTable).where(eq(credentialsTable.id, id));
  res.json({ success: true });
});

/* ——— User Role Management via Clerk Backend API ——— */

router.get("/users", async (req, res) => {
  try {
    const response = await getClerkClient().users.getUserList({ limit: 100 });
    return res.json({
      users: response.data.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.emailAddresses[0]?.emailAddress,
        role: u.publicMetadata?.role || u.unsafeMetadata?.role || "user",
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    return res.status(500).json({ error: "Failed to list users" });
  }
});

router.post("/users/:id/role", async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body as { role?: string };
  if (!role) {
    return res.status(400).json({ error: "role is required" });
  }
  try {
    await getClerkClient().users.updateUser(userId, {
      publicMetadata: { role },
    });
    return res.json({ success: true, userId, role });
  } catch (err) {
    req.log.error({ err }, "Failed to update user role");
    return res.status(500).json({ error: "Failed to update user role" });
  }
});

export default router;
