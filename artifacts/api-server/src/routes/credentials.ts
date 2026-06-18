import { Router } from "express";
import { db } from "@workspace/db";
import { credentialsTable, clinicsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { hashDocument, isBlockchainConfigured, verifyOnChain } from "../services/blockchain.js";

const router = Router();

router.get("/clinic/:clinicId", async (req, res) => {
  const clinicId = parseInt(req.params.clinicId);
  if (isNaN(clinicId)) {
    res.status(400).json({ error: "Invalid clinic ID" });
    return;
  }

  const credentials = await db
    .select()
    .from(credentialsTable)
    .where(
      and(
        eq(credentialsTable.clinicId, clinicId),
        eq(credentialsTable.status, "anchored")
      )
    )
    .orderBy(credentialsTable.anchoredAt);

  res.json(
    credentials.map((c) => ({
      id: c.id,
      credentialType: c.credentialType,
      issuingBody: c.issuingBody,
      issueDate: c.issueDate,
      documentName: c.documentName,
      documentHash: c.documentHash,
      onChainTxHash: c.onChainTxHash,
      onChainTimestamp: c.onChainTimestamp,
      anchoredAt: c.anchoredAt,
      polygonScanUrl: c.onChainTxHash
        ? `https://amoy.polygonscan.com/tx/${c.onChainTxHash}`
        : null,
      blockchainConfigured: isBlockchainConfigured(),
    }))
  );
});

router.post("/:id/check-hash", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid credential ID" });
    return;
  }

  const { inputHash, inputContent } = req.body as {
    inputHash?: string;
    inputContent?: string;
  };

  const [credential] = await db
    .select()
    .from(credentialsTable)
    .where(eq(credentialsTable.id, id))
    .limit(1);

  if (!credential) {
    res.status(404).json({ error: "Credential not found" });
    return;
  }

  const hashToCheck = inputHash ?? (inputContent ? hashDocument(inputContent) : null);
  if (!hashToCheck) {
    res.status(400).json({ error: "Provide inputHash or inputContent" });
    return;
  }

  const storedHash = credential.documentHash;
  const localMatch = storedHash === hashToCheck;

  let onChainMatch: boolean | null = null;
  let onChainTimestamp: number | null = null;

  if (isBlockchainConfigured() && credential.clinicId && storedHash) {
    try {
      const entityId = `clinic-${credential.clinicId}`;
      const result = await verifyOnChain(entityId, hashToCheck);
      onChainMatch = result.found;
      onChainTimestamp = result.timestamp;
    } catch {
      onChainMatch = null;
    }
  }

  res.json({
    computedHash: hashToCheck,
    storedHash,
    localMatch,
    onChainMatch,
    onChainTimestamp,
    tamperDetected: !localMatch || onChainMatch === false,
  });
});

export default router;
