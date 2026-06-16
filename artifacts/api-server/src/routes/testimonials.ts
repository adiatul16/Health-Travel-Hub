import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(testimonialsTable);
    const testimonials = rows.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      procedure: r.procedure,
      clinic: r.clinic,
      rating: Number(r.rating),
      beforeText: r.beforeText,
      afterText: r.afterText,
      savings: Number(r.savings),
      avatarUrl: r.avatarUrl,
    }));
    res.json(testimonials);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch testimonials");
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

export default router;
