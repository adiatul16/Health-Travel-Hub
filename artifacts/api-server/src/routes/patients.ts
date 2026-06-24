import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { ensurePatient } from "../services/patients.js";

const router: IRouter = Router();

/** Ensure a patient profile (with on-chain wallet address) exists for the signed-in Clerk user. */
router.post("/profile", requireAuth, async (req, res) => {
  try {
    const clerkUserId = (req as any).auth.userId as string;
    const patient = await ensurePatient(clerkUserId);
    res.json({ id: patient.id, email: patient.email, walletAddress: patient.walletAddress });
  } catch (err: any) {
    req.log.error({ err }, "Failed to ensure patient profile");
    res.status(500).json({ error: err.message ?? "Failed to load patient profile" });
  }
});

export default router;
