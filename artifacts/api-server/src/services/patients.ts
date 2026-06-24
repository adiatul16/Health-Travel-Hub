import { db, patientsTable, type Patient } from "@workspace/db";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { generateWalletAddress } from "./blockchain.js";

async function getClerkEmail(clerkUserId: string): Promise<string> {
  const user = await clerkClient.users.getUser(clerkUserId);
  const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
    ?? user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Signed-in user has no email address on file");
  return email;
}

/** Look up the patient profile for a signed-in Clerk user, creating one (with a fresh wallet) on first use. */
export async function ensurePatient(clerkUserId: string): Promise<Patient> {
  const [existing] = await db.select().from(patientsTable).where(eq(patientsTable.clerkUserId, clerkUserId));
  if (existing) return existing;

  const email = await getClerkEmail(clerkUserId);
  const [created] = await db
    .insert(patientsTable)
    .values({ clerkUserId, email, walletAddress: generateWalletAddress() })
    .returning();
  return created;
}

export async function getPatientByClerkId(clerkUserId: string): Promise<Patient | null> {
  const [row] = await db.select().from(patientsTable).where(eq(patientsTable.clerkUserId, clerkUserId));
  return row ?? null;
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  const [row] = await db.select().from(patientsTable).where(eq(patientsTable.email, email));
  return row ?? null;
}
