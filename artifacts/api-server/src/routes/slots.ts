import { Router } from "express";
import { db, treatmentSlotsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { treatmentId, destinationId } = req.query as Record<string, string>;
    let rows = await db.select().from(treatmentSlotsTable);

    if (treatmentId) {
      const tid = parseInt(treatmentId);
      if (!isNaN(tid)) rows = rows.filter((r) => r.treatmentId === tid);
    }
    if (destinationId) {
      const did = parseInt(destinationId);
      if (!isNaN(did)) rows = rows.filter((r) => r.destinationId === did);
    }

    const slots = rows.map((r) => ({
      id: r.id,
      treatmentName: r.treatmentName,
      clinicName: r.clinicName,
      city: r.city,
      slotsRemaining: r.slotsRemaining,
      price: Number(r.price),
      originalPrice: Number(r.originalPrice),
      savings: Number(r.savings),
      availability: r.availability as "high" | "limited" | "critical",
      nextAvailableDate: r.nextAvailableDate,
    }));
    res.json(slots);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch slots");
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

export default router;
