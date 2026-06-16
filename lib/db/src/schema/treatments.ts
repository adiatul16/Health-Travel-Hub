import { pgTable, text, serial, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const treatmentsTable = pgTable("treatments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ukPrice: numeric("uk_price", { precision: 10, scale: 2 }).notNull(),
  turkeyPrice: numeric("turkey_price", { precision: 10, scale: 2 }).notNull(),
  chinaPrice: numeric("china_price", { precision: 10, scale: 2 }),
  savings: numeric("savings", { precision: 10, scale: 2 }).notNull(),
  savingsPercent: integer("savings_percent").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  duration: text("duration"),
  recoveryTime: text("recovery_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTreatmentSchema = createInsertSchema(treatmentsTable).omit({ id: true, createdAt: true });
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type Treatment = typeof treatmentsTable.$inferSelect;
