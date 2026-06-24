import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { clinicsTable } from "./clinics";

export const credentialsTable = pgTable("credentials", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id")
    .references(() => clinicsTable.id, { onDelete: "cascade" })
    .notNull(),
  credentialType: text("credential_type").notNull(),
  issuingBody: text("issuing_body").notNull(),
  issueDate: text("issue_date").notNull(),
  documentName: text("document_name"),
  documentHash: text("document_hash"),
  ipfsCid: text("ipfs_cid"),
  onChainTxHash: text("on_chain_tx_hash"),
  onChainTimestamp: timestamp("on_chain_timestamp", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  anchoredAt: timestamp("anchored_at", { withTimezone: true }),
});

export type Credential = typeof credentialsTable.$inferSelect;
