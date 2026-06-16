import { Router } from "express";
import { db, treatmentsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(treatmentsTable);
    const treatments = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      ukPrice: Number(r.ukPrice),
      turkeyPrice: Number(r.turkeyPrice),
      chinaPrice: r.chinaPrice !== null ? Number(r.chinaPrice) : null,
      savings: Number(r.savings),
      savingsPercent: r.savingsPercent,
      description: r.description,
      imageUrl: r.imageUrl,
      duration: r.duration ?? undefined,
      recoveryTime: r.recoveryTime ?? undefined,
    }));
    res.json(treatments);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch treatments");
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.get("/popular", async (req, res) => {
  try {
    const rows = await db.select().from(treatmentsTable);
    const popular = rows.slice(0, 6).map((r) => ({
      id: r.id,
      name: r.name,
      bookingsThisMonth: Math.floor(Math.random() * 50 + 20),
      averageSavings: Number(r.savings),
      successRate: 95 + Math.random() * 4,
      imageUrl: r.imageUrl,
    }));
    res.json(popular);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch popular treatments");
    res.status(500).json({ error: "Failed to fetch popular treatments" });
  }
});

export default router;
