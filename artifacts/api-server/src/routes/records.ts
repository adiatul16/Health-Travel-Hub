import { Router } from "express";
import multer from "multer";
import { db, medicalRecordsTable, recordGrantsTable, patientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { ensurePatient, getPatientByClerkId } from "../services/patients.js";
import { getDoctorByClerkId } from "../services/doctorAuth.js";
import {
  generateRecordKey,
  encryptContent,
  decryptContent,
  wrapRecordKey,
  unwrapRecordKey,
  sha256Hex,
} from "../services/encryption.js";
import { pinToIPFS, fetchFromIPFS } from "../services/ipfs.js";
import { addRecord, hasConsent, txUrl } from "../services/blockchain.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

/** Patient uploads a record: encrypt -> pin to IPFS -> anchor hash on-chain under their own wallet. */
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const phase = (req.body.phase as string) || "pre-op";
    const clerkUserId = (req as any).auth.userId as string;
    const patient = await ensurePatient(clerkUserId);

    const dataHash = sha256Hex(file.buffer);
    const recordKey = generateRecordKey();
    const { ciphertext, contentIv, contentAuthTag } = encryptContent(file.buffer, recordKey);
    const cid = await pinToIPFS(ciphertext, file.originalname);
    const { encKeyCiphertext, encKeyIv, encKeyAuthTag } = wrapRecordKey(recordKey);

    const onChain = await addRecord(patient.walletAddress, dataHash, `Patient record: ${file.originalname}`, phase);

    const [record] = await db
      .insert(medicalRecordsTable)
      .values({
        patientId: patient.id,
        fileName: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        ipfsCid: cid,
        dataHash,
        encKeyCiphertext,
        encKeyIv,
        encKeyAuthTag,
        contentIv,
        contentAuthTag,
        phase,
        onChainTxHash: onChain.txHash,
      })
      .returning();

    res.json({
      id: record.id,
      fileName: record.fileName,
      phase: record.phase,
      createdAt: record.createdAt,
      txHash: onChain.txHash,
      txUrl: txUrl(onChain.txHash),
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to upload record");
    res.status(500).json({ error: err.message ?? "Failed to upload record" });
  }
});

/** Patient: list my own records and who currently has access to each. */
router.get("/", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).auth.userId as string;
  const patient = await getPatientByClerkId(clerkUserId);
  if (!patient) {
    res.json([]);
    return;
  }

  const records = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.patientId, patient.id));
  const grants = await db.select().from(recordGrantsTable).where(eq(recordGrantsTable.patientId, patient.id));

  res.json(
    records.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      contentType: r.contentType,
      sizeBytes: r.sizeBytes,
      phase: r.phase,
      dataHash: r.dataHash,
      onChainTxHash: r.onChainTxHash,
      createdAt: r.createdAt,
      grants: grants.filter((g) => g.recordId === r.id).map((g) => ({ id: g.id, doctorId: g.doctorId, status: g.status })),
    })),
  );
});

/** Doctor: view (decrypt) a record they've been granted access to. */
router.get("/:id/content", requireAuth, async (req, res) => {
  try {
    const recordId = parseInt(req.params.id as string, 10);
    if (isNaN(recordId)) {
      res.status(400).json({ error: "invalid_id", message: "Invalid record id." });
      return;
    }

    const clerkUserId = (req as any).auth.userId as string;
    const doctor = await getDoctorByClerkId(clerkUserId);
    if (!doctor) {
      res.status(403).json({ error: "not_a_doctor", message: "Your account isn't linked to a doctor profile." });
      return;
    }

    const [record] = await db.select().from(medicalRecordsTable).where(eq(medicalRecordsTable.id, recordId));
    if (!record) {
      res.status(404).json({ error: "not_found", message: "Record not found." });
      return;
    }

    const [grant] = await db
      .select()
      .from(recordGrantsTable)
      .where(and(eq(recordGrantsTable.recordId, recordId), eq(recordGrantsTable.doctorId, doctor.id)));

    if (!grant || grant.status !== "granted") {
      res.status(403).json({
        error: grant?.status === "revoked" ? "access_revoked" : "access_denied",
        message:
          grant?.status === "revoked"
            ? "The patient has revoked your access to this record."
            : "You don't have access to this record yet. Ask the patient to grant access.",
      });
      return;
    }

    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, record.patientId));
    const stillConsented =
      doctor.walletAddress && patient?.walletAddress
        ? await hasConsent(patient.walletAddress, doctor.walletAddress, record.dataHash)
        : false;

    if (!stillConsented) {
      res.status(403).json({
        error: "access_revoked",
        message: "The patient has revoked your access to this record.",
      });
      return;
    }

    const ciphertext = await fetchFromIPFS(record.ipfsCid);
    const recordKey = unwrapRecordKey(record.encKeyCiphertext, record.encKeyIv, record.encKeyAuthTag);
    const plaintext = decryptContent(ciphertext, recordKey, record.contentIv, record.contentAuthTag);

    res.setHeader("Content-Type", record.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${record.fileName}"`);
    res.send(plaintext);
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch record content");
    res.status(500).json({ error: "server_error", message: err.message ?? "Failed to fetch record content" });
  }
});

export default router;
