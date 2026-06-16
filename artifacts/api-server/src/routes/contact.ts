import { Router } from "express";
import { db, contactsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const parsed = SubmitContactBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { name, email, phone, procedure, destination, budget, preferredContact, message } = parsed.data;

    const [row] = await db.insert(contactsTable).values({
      name,
      email,
      phone: phone ?? null,
      procedure,
      destination,
      budget: budget !== undefined && budget !== null ? String(budget) : null,
      preferredContact: preferredContact ?? null,
      message: message ?? null,
    }).returning({ id: contactsTable.id });

    res.status(201).json({
      id: row.id,
      message: "Thank you! A MediBridge consultant will contact you within 24 hours.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact");
    res.status(500).json({ error: "Failed to submit contact" });
  }
});

export default router;
