import { Router } from "express";
import { db, clinicsTable, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query as Record<string, string>;
    let rows = await db.select().from(clinicsTable);

    if (q.destination) {
      rows = rows.filter((r) => r.city.toLowerCase().includes(q.destination.toLowerCase()) || r.country.toLowerCase().includes(q.destination.toLowerCase()));
    }
    if (q.featured === "true") {
      rows = rows.filter((r) => r.featured);
    }
    if (q.treatment) {
      rows = rows.filter((r) => r.specialties.some((s) => s.toLowerCase().includes(q.treatment.toLowerCase())));
    }
    if (q.country) {
      rows = rows.filter((r) => r.country.toLowerCase() === q.country.toLowerCase());
    }
    if (q.jci === "true") {
      rows = rows.filter((r) => r.jciAccredited);
    }
    if (q.minRating) {
      const min = parseFloat(q.minRating);
      rows = rows.filter((r) => Number(r.rating) >= min);
    }
    if (q.minSlots) {
      const min = parseInt(q.minSlots);
      rows = rows.filter((r) => r.availableSlots >= min);
    }
    if (q.specialty) {
      rows = rows.filter((r) => r.specialties.some((s) => s.toLowerCase().includes(q.specialty.toLowerCase())));
    }

    // Sorting
    const sortBy = q.sortBy || "featured";
    const sortDir = q.sortDir === "desc" ? -1 : 1;
    rows.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (Number(b.rating) - Number(a.rating)) * sortDir;
        case "slots":
          return (b.availableSlots - a.availableSlots) * sortDir;
        case "price":
          return (Number(a.startingFrom) - Number(b.startingFrom)) * sortDir;
        case "name":
          return a.name.localeCompare(b.name) * sortDir;
        case "established":
          return (b.yearsEstablished - a.yearsEstablished) * sortDir;
        case "featured":
        default:
          return ((b.featured ? 1 : 0) - (a.featured ? 1 : 0)) * sortDir || a.name.localeCompare(b.name);
      }
    });

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

    const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.clinicId, id));

    return res.json({
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
      doctors: doctors.map((d) => ({
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
        onChainTimestamp: d.onChainTimestamp ?? undefined,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch clinic");
    return res.status(500).json({ error: "Failed to fetch clinic" });
  }
});

export default router;
