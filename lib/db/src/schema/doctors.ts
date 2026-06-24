import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { clinicsTable } from "./clinics";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id")
    .references(() => clinicsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  specialty: text("specialty").notNull(),
  licenseNumber: text("license_number").notNull(),
  yearsExperience: integer("years_experience").notNull().default(0),
  certifications: text("certifications").array().notNull().default([]),
  bio: text("bio"),
  imageUrl: text("image_url"),
  languages: text("languages").array().notNull().default([]),
  email: text("email").unique(),
  clerkUserId: text("clerk_user_id").unique(),
  walletAddress: text("wallet_address").unique(),
  documentHash: text("document_hash"),
  onChainTxHash: text("on_chain_tx_hash"),
  onChainTimestamp: timestamp("on_chain_timestamp", { withTimezone: true }),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
