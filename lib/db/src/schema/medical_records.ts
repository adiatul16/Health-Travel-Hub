import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";

export const medicalRecordsTable = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .references(() => patientsTable.id, { onDelete: "cascade" })
    .notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  ipfsCid: text("ipfs_cid").notNull(),
  dataHash: text("data_hash").notNull(),
  encKeyCiphertext: text("enc_key_ciphertext").notNull(),
  encKeyIv: text("enc_key_iv").notNull(),
  encKeyAuthTag: text("enc_key_auth_tag").notNull(),
  contentIv: text("content_iv").notNull(),
  contentAuthTag: text("content_auth_tag").notNull(),
  phase: text("phase").notNull().default("pre-op"),
  onChainTxHash: text("on_chain_tx_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MedicalRecord = typeof medicalRecordsTable.$inferSelect;
