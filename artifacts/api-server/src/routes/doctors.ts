import { Router } from "express";
import { db, doctorsTable, clinicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  hashDocument,
  isBlockchainConfigured,
  isLedgerConfigured,
  verifyOnChain,
  verifyDoctor,
  generateWalletAddress,
  txUrl,
} from "../services/blockchain.js";
import { requireAuth } from "../middlewares/auth.js";
import { linkDoctor } from "../services/doctorAuth.js";

const router = Router();

/** Create a doctor (real on-chain wallet identity) and verify them on the Care Network. */
router.post("/", async (req, res) => {
  try {
    const { clinicId, name, title, specialty, licenseNumber, email, expiryDays } = req.body as {
      clinicId: number;
      name: string;
      title?: string;
      specialty?: string;
      licenseNumber: string;
      email?: string;
      expiryDays?: number;
    };
    if (!clinicId || !name || !licenseNumber) {
      res.status(400).json({ error: "clinicId, name, and licenseNumber are required" });
      return;
    }

    const [clinic] = await db.select().from(clinicsTable).where(eq(clinicsTable.id, clinicId));
    if (!clinic) {
      res.status(404).json({ error: "Clinic not found" });
      return;
    }

    let clinicWalletAddress = clinic.walletAddress;
    if (!clinicWalletAddress) {
      clinicWalletAddress = generateWalletAddress();
      await db.update(clinicsTable).set({ walletAddress: clinicWalletAddress }).where(eq(clinicsTable.id, clinicId));
    }

    const walletAddress = generateWalletAddress();
    const [doctor] = await db
      .insert(doctorsTable)
      .values({
        clinicId,
        name,
        title: title || "Dr.",
        specialty: specialty || "General",
        licenseNumber,
        email: email || null,
        walletAddress,
      })
      .returning();

    let onChainTxHash: string | null = null;
    if (isLedgerConfigured()) {
      const result = await verifyDoctor(walletAddress, clinicWalletAddress, licenseNumber, expiryDays ?? 365);
      onChainTxHash = result.txHash;
      await db.update(doctorsTable).set({ verified: true, onChainTxHash }).where(eq(doctorsTable.id, doctor.id));
    }

    res.status(201).json({
      ...doctor,
      verified: !!onChainTxHash,
      onChainTxHash,
      txUrl: onChainTxHash ? txUrl(onChainTxHash) : null,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create doctor");
    res.status(500).json({ error: err.message ?? "Failed to create doctor" });
  }
});

/** Link the signed-in Clerk user to their doctor row (by email) on first sign-in. */
router.post("/profile", requireAuth, async (req, res) => {
  try {
    const clerkUserId = (req as any).auth.userId as string;
    const doctor = await linkDoctor(clerkUserId);
    if (!doctor) {
      res.status(404).json({
        error: "no_doctor_profile",
        message: "No doctor profile found for your email. Ask your clinic admin to add you first.",
      });
      return;
    }
    res.json({ id: doctor.id, name: doctor.name, clinicId: doctor.clinicId, walletAddress: doctor.walletAddress });
  } catch (err: any) {
    req.log.error({ err }, "Failed to link doctor profile");
    res.status(500).json({ error: err.message ?? "Failed to load doctor profile" });
  }
});

router.get("/clinic/:clinicId", async (req, res) => {
  try {
    const clinicId = parseInt(req.params.clinicId);
    if (isNaN(clinicId)) {
      res.status(400).json({ error: "Invalid clinic ID" });
      return;
    }

    const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.clinicId, clinicId));

    res.json(
      doctors.map((d) => ({
        id: d.id,
        name: d.name,
        title: d.title,
        specialty: d.specialty,
        licenseNumber: d.licenseNumber,
        yearsExperience: d.yearsExperience,
        certifications: d.certifications,
        bio: d.bio ?? undefined,
        imageUrl: d.imageUrl ?? undefined,
        languages: d.languages,
        verified: d.verified,
        documentHash: d.documentHash ?? undefined,
        onChainTxHash: d.onChainTxHash ?? undefined,
        onChainTimestamp: d.onChainTimestamp ? Number(d.onChainTimestamp) : undefined,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch doctors");
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

router.post("/:id/verify", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid doctor ID" });
      return;
    }
    const [row] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Doctor not found" });
      return;
    }
    if (!row.documentHash) {
      res.status(400).json({ error: "Doctor not anchored yet" });
      return;
    }
    const entityId = `doctor-${id}`;
    const result = await verifyOnChain(entityId, row.documentHash);
    res.json({
      documentHash: row.documentHash,
      onChainMatch: result.found,
      onChainTimestamp: result.timestamp,
      tamperDetected: !result.found,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to verify doctor");
    res.status(500).json({ error: "Failed to verify doctor" });
  }
});

export default router;
