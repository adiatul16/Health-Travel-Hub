import { Router } from "express";
import { db, accessRequestsTable, medicalRecordsTable, recordGrantsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { getDoctorByClerkId } from "../services/doctorAuth.js";
import { getPatientByClerkId, getPatientByEmail } from "../services/patients.js";
import { grantConsent, txUrl } from "../services/blockchain.js";

const router = Router();

/** Doctor: request access to a patient's records by their email. */
router.post("/", requireAuth, async (req, res) => {
  try {
    const clerkUserId = (req as any).auth.userId as string;
    const doctor = await getDoctorByClerkId(clerkUserId);
    if (!doctor) {
      res.status(403).json({ error: "not_a_doctor", message: "Your account isn't linked to a doctor profile." });
      return;
    }

    const { patientEmail, note } = req.body as { patientEmail?: string; note?: string };
    if (!patientEmail) {
      res.status(400).json({ error: "patientEmail is required" });
      return;
    }

    const patient = await getPatientByEmail(patientEmail);
    if (!patient) {
      res.status(404).json({
        error: "patient_not_found",
        message: "No patient with that email has signed in to VitaVia yet.",
      });
      return;
    }

    const [request] = await db
      .insert(accessRequestsTable)
      .values({ doctorId: doctor.id, patientId: patient.id, note })
      .returning();
    res.json({ id: request.id, status: request.status, createdAt: request.createdAt });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create access request");
    res.status(500).json({ error: err.message ?? "Failed to create access request" });
  }
});

/** Patient: list pending requests against my records. */
router.get("/", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).auth.userId as string;
  const patient = await getPatientByClerkId(clerkUserId);
  if (!patient) {
    res.json([]);
    return;
  }

  const requests = await db
    .select({
      id: accessRequestsTable.id,
      note: accessRequestsTable.note,
      status: accessRequestsTable.status,
      createdAt: accessRequestsTable.createdAt,
      doctorId: doctorsTable.id,
      doctorName: doctorsTable.name,
    })
    .from(accessRequestsTable)
    .innerJoin(doctorsTable, eq(accessRequestsTable.doctorId, doctorsTable.id))
    .where(and(eq(accessRequestsTable.patientId, patient.id), eq(accessRequestsTable.status, "pending")));

  res.json(requests);
});

/** Patient: grant access to one or more of their own records for a pending request. */
router.post("/:id/grant", requireAuth, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id as string, 10);
    const { recordIds } = req.body as { recordIds?: number[] };
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      res.status(400).json({ error: "recordIds is required" });
      return;
    }

    const clerkUserId = (req as any).auth.userId as string;
    const patient = await getPatientByClerkId(clerkUserId);
    if (!patient) {
      res.status(403).json({ error: "No patient profile" });
      return;
    }

    const [request] = await db
      .select()
      .from(accessRequestsTable)
      .where(and(eq(accessRequestsTable.id, requestId), eq(accessRequestsTable.patientId, patient.id)));
    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, request.doctorId));
    if (!doctor?.walletAddress) {
      res.status(400).json({ error: "Doctor has no on-chain identity yet" });
      return;
    }

    const created = [];
    for (const recordId of recordIds) {
      const [record] = await db
        .select()
        .from(medicalRecordsTable)
        .where(and(eq(medicalRecordsTable.id, recordId), eq(medicalRecordsTable.patientId, patient.id)));
      if (!record) continue;

      const onChain = await grantConsent(patient.walletAddress, doctor.walletAddress, record.dataHash);
      const [grant] = await db
        .insert(recordGrantsTable)
        .values({
          recordId: record.id,
          doctorId: doctor.id,
          patientId: patient.id,
          status: "granted",
          onChainTxHash: onChain.txHash,
        })
        .returning();
      created.push({ id: grant.id, recordId: grant.recordId, txHash: onChain.txHash, txUrl: txUrl(onChain.txHash) });
    }

    await db.update(accessRequestsTable).set({ status: "resolved" }).where(eq(accessRequestsTable.id, requestId));

    res.json({ grants: created });
  } catch (err: any) {
    req.log.error({ err }, "Failed to grant access");
    res.status(500).json({ error: err.message ?? "Failed to grant access" });
  }
});

export default router;
