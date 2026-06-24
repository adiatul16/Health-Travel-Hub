import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { doctorsTable } from "./doctors";
import { patientsTable } from "./patients";

export const accessRequestsTable = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id")
    .references(() => doctorsTable.id, { onDelete: "cascade" })
    .notNull(),
  patientId: integer("patient_id")
    .references(() => patientsTable.id, { onDelete: "cascade" })
    .notNull(),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AccessRequest = typeof accessRequestsTable.$inferSelect;
