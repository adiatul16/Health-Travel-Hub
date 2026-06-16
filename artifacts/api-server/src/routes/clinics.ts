import { Router } from "express";
import { db, clinicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { destination, treatment, featured } = req.query as Record<string, string>;
    let rows = await db.select().from(clinicsTable);

    if (destination) {
      rows = rows.filter((r) => r.city.toLowerCase().includes(destination.toLowerCase()) || r.country.toLowerCase().includes(destination.toLowerCase()));
    }
    if (featured === "true") {
      rows = rows.filter((r) => r.featured);
    }
    if (treatment) {
      rows = rows.filter((r) => r.specialties.some((s) => s.toLowerCase().includes(treatment.toLowerCase())));
    }

    const clinics = rows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      country: r.country,
      accreditations: r.accreditations,
      specialties: r.specialties,
      rating: Number(r.rating),
      reviewCount: r.reviewCount,
      availableSlots: r.availableSlots,
      startingFrom: Number(r.startingFrom),
      imageUrl: r.imageUrl,
      jciAccredited: r.jciAccredited,
      yearsEstablished: r.yearsEstablished,
      successRate: Number(r.successRate),
      description: r.description ?? undefined,
    }));
    res.json(clinics);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch clinics");
    res.status(500).json({ error: "Failed to fetch clinics" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const [row] = await db.select().from(clinicsTable).where(eq(clinicsTable.id, id));
    if (!row) return res.status(404).json({ error: "Clinic not found" });

    res.json({
      id: row.id,
      name: row.name,
      city: row.city,
      country: row.country,
      accreditations: row.accreditations,
      specialties: row.specialties,
      rating: Number(row.rating),
      reviewCount: row.reviewCount,
      availableSlots: row.availableSlots,
      startingFrom: Number(row.startingFrom),
      imageUrl: row.imageUrl,
      jciAccredited: row.jciAccredited,
      yearsEstablished: row.yearsEstablished,
      successRate: Number(row.successRate),
      description: row.description ?? undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch clinic");
    res.status(500).json({ error: "Failed to fetch clinic" });
  }
});

export default router;
