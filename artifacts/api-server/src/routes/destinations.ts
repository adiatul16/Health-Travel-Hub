import { Router } from "express";
import { db, destinationsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(destinationsTable);
    const destinations = rows.map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      clinicCount: r.clinicCount,
      averageSavings: Number(r.averageSavings),
      popularTreatments: r.popularTreatments,
      qualityScore: Number(r.qualityScore),
      imageUrl: r.imageUrl,
      flag: r.flag,
      description: r.description ?? undefined,
    }));
    res.json(destinations);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch destinations");
    res.status(500).json({ error: "Failed to fetch destinations" });
  }
});

export default router;
