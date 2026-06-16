import { pgTable, text, serial, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clinicsTable = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  accreditations: text("accreditations").array().notNull().default([]),
  specialties: text("specialties").array().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  availableSlots: integer("available_slots").notNull().default(0),
  startingFrom: numeric("starting_from", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  jciAccredited: boolean("jci_accredited").notNull().default(false),
  yearsEstablished: integer("years_established").notNull(),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClinicSchema = createInsertSchema(clinicsTable).omit({ id: true, createdAt: true });
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Clinic = typeof clinicsTable.$inferSelect;
