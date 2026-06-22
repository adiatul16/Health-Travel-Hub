import { Router } from "express";
import { db, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashDocument, isBlockchainConfigured, verifyOnChain } from "../services/blockchain.js";

const router = Router();

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
