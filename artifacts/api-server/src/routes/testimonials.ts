import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashDocument, isBlockchainConfigured, anchorCredential, verifyOnChain } from "../services/blockchain.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(testimonialsTable);
    const testimonials = rows.map((r) => ({
      id: r.id,
      name: r.anonymous ? "Anonymous Patient" : r.name,
      location: r.anonymous ? "" : r.location,
      procedure: r.procedure,
      clinic: r.clinic,
      rating: Number(r.rating),
      beforeText: r.beforeText,
      afterText: r.afterText,
      savings: Number(r.savings),
      avatarUrl: r.avatarUrl,
      anonymous: r.anonymous,
      patientWallet: r.patientWallet ?? undefined,
      documentHash: r.documentHash ?? undefined,
      onChainTxHash: r.onChainTxHash ?? undefined,
      onChainTimestamp: r.onChainTimestamp ? Number(r.onChainTimestamp) : undefined,
      verified: !!(r.onChainTxHash && r.documentHash),
    }));
    res.json(testimonials);
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to fetch testimonials");
    res.status(500).json({ error: "Failed to fetch testimonials" });
    return;
  }
});

router.post("/:id/anchor", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid testimonial ID" });
      return;
    }
    const [row] = await db.select().from(testimonialsTable).where(eq(testimonialsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    if (!isBlockchainConfigured()) {
      res.status(503).json({ error: "Blockchain not configured" });
      return;
    }
    const content = `${row.name}|${row.procedure}|${row.clinic}|${row.rating}|${row.afterText}`;
    const hash = hashDocument(content);
    const entityId = `testimonial-${id}`;
    const result = await anchorCredential(entityId, hash, "VitaVia", "PatientReview");
    await db.update(testimonialsTable).set({
      documentHash: hash,
      onChainTxHash: result.txHash,
      onChainTimestamp: result.timestamp,
    }).where(eq(testimonialsTable.id, id));
    res.json({ txHash: result.txHash, timestamp: result.timestamp, hash });
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to anchor testimonial");
    res.status(500).json({ error: "Failed to anchor testimonial" });
    return;
  }
});

router.post("/:id/verify", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid testimonial ID" });
      return;
    }
    const [row] = await db.select().from(testimonialsTable).where(eq(testimonialsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }
    if (!row.documentHash) {
      res.status(400).json({ error: "Testimonial not anchored yet" });
      return;
    }
    const entityId = `testimonial-${id}`;
    const result = await verifyOnChain(entityId, row.documentHash);
    res.json({
      documentHash: row.documentHash,
      onChainMatch: result.found,
      onChainTimestamp: result.timestamp,
      tamperDetected: !result.found,
    });
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to verify testimonial");
    res.status(500).json({ error: "Failed to verify testimonial" });
    return;
  }
});

export default router;
