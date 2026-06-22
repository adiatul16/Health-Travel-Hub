import { pgTable, text, serial, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  procedure: text("procedure").notNull(),
  clinic: text("clinic").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  beforeText: text("before_text").notNull(),
  afterText: text("after_text").notNull(),
  savings: numeric("savings", { precision: 10, scale: 2 }).notNull(),
  avatarUrl: text("avatar_url").notNull(),
  anonymous: boolean("anonymous").notNull().default(false),
  patientWallet: text("patient_wallet"),
  documentHash: text("document_hash"),
  onChainTxHash: text("on_chain_tx_hash"),
  onChainTimestamp: timestamp("on_chain_timestamp", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonialsTable).omit({ id: true, createdAt: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;
