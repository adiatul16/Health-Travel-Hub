import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { medicalRecordsTable } from "./medical_records";
import { doctorsTable } from "./doctors";
import { patientsTable } from "./patients";

export const recordGrantsTable = pgTable("record_grants", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id")
    .references(() => medicalRecordsTable.id, { onDelete: "cascade" })
    .notNull(),
  doctorId: integer("doctor_id")
    .references(() => doctorsTable.id, { onDelete: "cascade" })
    .notNull(),
  patientId: integer("patient_id")
    .references(() => patientsTable.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").notNull().default("granted"),
  onChainTxHash: text("on_chain_tx_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type RecordGrant = typeof recordGrantsTable.$inferSelect;
