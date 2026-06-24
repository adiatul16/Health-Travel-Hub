import { Router } from "express";
import { db, recordGrantsTable, medicalRecordsTable, patientsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { getDoctorByClerkId } from "../services/doctorAuth.js";
import { getPatientByClerkId } from "../services/patients.js";
import { revokeConsent, txUrl } from "../services/blockchain.js";

const router = Router();

/** Doctor: list records currently granted to me. */
router.get("/", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).auth.userId as string;
  const doctor = await getDoctorByClerkId(clerkUserId);
  if (!doctor) {
    res.json([]);
    return;
  }

  const grants = await db
    .select({
      id: recordGrantsTable.id,
      status: recordGrantsTable.status,
      recordId: medicalRecordsTable.id,
      fileName: medicalRecordsTable.fileName,
      phase: medicalRecordsTable.phase,
      patientEmail: patientsTable.email,
    })
    .from(recordGrantsTable)
    .innerJoin(medicalRecordsTable, eq(recordGrantsTable.recordId, medicalRecordsTable.id))
    .innerJoin(patientsTable, eq(recordGrantsTable.patientId, patientsTable.id))
    .where(and(eq(recordGrantsTable.doctorId, doctor.id), eq(recordGrantsTable.status, "granted")));

  res.json(grants);
});

/** Patient: revoke a grant they previously made. */
router.post("/:id/revoke", requireAuth, async (req, res) => {
  try {
    const grantId = parseInt(req.params.id as string, 10);
    const clerkUserId = (req as any).auth.userId as string;
    const patient = await getPatientByClerkId(clerkUserId);
    if (!patient) {
      res.status(403).json({ error: "No patient profile" });
      return;
    }

    const [grant] = await db
      .select()
      .from(recordGrantsTable)
      .where(and(eq(recordGrantsTable.id, grantId), eq(recordGrantsTable.patientId, patient.id)));
    if (!grant) {
      res.status(404).json({ error: "Grant not found" });
      return;
    }

    const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, grant.recordId));
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, grant.doctorId));
    if (!record || !doctor?.walletAddress) {
      res.status(400).json({ error: "Missing record or doctor identity" });
      return;
    }

    const onChain = await revokeConsent(patient.walletAddress, doctor.walletAddress, record.dataHash);
    await db
      .update(recordGrantsTable)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(eq(recordGrantsTable.id, grantId));

    res.json({ status: "revoked", txHash: onChain.txHash, txUrl: txUrl(onChain.txHash) });
  } catch (err: any) {
    req.log.error({ err }, "Failed to revoke access");
    res.status(500).json({ error: err.message ?? "Failed to revoke access" });
  }
});

export default router;
