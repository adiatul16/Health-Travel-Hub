import { pgTable, text, serial, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const treatmentSlotsTable = pgTable("treatment_slots", {
  id: serial("id").primaryKey(),
  treatmentName: text("treatment_name").notNull(),
  clinicName: text("clinic_name").notNull(),
  city: text("city").notNull(),
  slotsRemaining: integer("slots_remaining").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
  savings: numeric("savings", { precision: 10, scale: 2 }).notNull(),
  availability: text("availability").notNull().default("high"),
  nextAvailableDate: text("next_available_date").notNull(),
  treatmentId: integer("treatment_id"),
  destinationId: integer("destination_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTreatmentSlotSchema = createInsertSchema(treatmentSlotsTable).omit({ id: true, createdAt: true });
export type InsertTreatmentSlot = z.infer<typeof insertTreatmentSlotSchema>;
export type TreatmentSlot = typeof treatmentSlotsTable.$inferSelect;
