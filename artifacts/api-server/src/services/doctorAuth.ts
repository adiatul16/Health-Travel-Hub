import { db, doctorsTable, type Doctor } from "@workspace/db";
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

/**
 * Link a signed-in Clerk user to their doctor row by email match.
 * Doctor rows (with an email) are created by clinic admins ahead of time —
 * this just claims the row on the doctor's first sign-in.
 */
export async function linkDoctor(clerkUserId: string): Promise<Doctor | null> {
  const [byClerkId] = await db.select().from(doctorsTable).where(eq(doctorsTable.clerkUserId, clerkUserId));
  if (byClerkId) return byClerkId;

  const email = await getClerkEmail(clerkUserId);
  const [byEmail] = await db.select().from(doctorsTable).where(eq(doctorsTable.email, email));
  if (!byEmail) return null;

  const [linked] = await db
    .update(doctorsTable)
    .set({
      clerkUserId,
      walletAddress: byEmail.walletAddress ?? generateWalletAddress(),
    })
    .where(eq(doctorsTable.id, byEmail.id))
    .returning();
  return linked;
}

export async function getDoctorByClerkId(clerkUserId: string): Promise<Doctor | null> {
  const [row] = await db.select().from(doctorsTable).where(eq(doctorsTable.clerkUserId, clerkUserId));
  return row ?? null;
}
