import { pgTable, text, serial, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const destinationsTable = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  clinicCount: integer("clinic_count").notNull().default(0),
  averageSavings: numeric("average_savings", { precision: 5, scale: 2 }).notNull(),
  popularTreatments: text("popular_treatments").array().notNull().default([]),
  qualityScore: numeric("quality_score", { precision: 3, scale: 1 }).notNull(),
  imageUrl: text("image_url").notNull(),
  flag: text("flag").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDestinationSchema = createInsertSchema(destinationsTable).omit({ id: true, createdAt: true });
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinationsTable.$inferSelect;
