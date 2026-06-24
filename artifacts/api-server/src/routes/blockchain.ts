import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { ensurePatient } from "../services/patients.js";
import {
  verifyClinic,
  verifyDoctor,
  addReview,
  isClinicVerified,
  isDoctorVerified,
  getClinicInfo,
  getDoctorInfo,
  getReviewCount,
  getRecordCount,
  hasOnChainInteraction,
  getAllEvents,
  isBlockchainConfigured,
  txUrl,
  LEDGER_ADDRESS,
} from "../services/blockchain.js";

const router = Router();

/* Health check */
router.get("/health", (_req, res) => {
  res.json({ configured: isBlockchainConfigured() });
});

router.get("/stats", async (_req, res) => {
  try {
    const count = await getRecordCount();
    res.json({
      contractAddress: LEDGER_ADDRESS,
      recordCount: count,
      polygonScan: `https://amoy.polygonscan.com/address/${LEDGER_ADDRESS}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Write operations (backend wallet) ─── */

// Verify a clinic (admin only)
router.post("/verify-clinic", requireAuth, async (req, res) => {
  try {
    const { clinicAddress, name, accreditation, expiryDays } = req.body;
    if (!clinicAddress || !name || !accreditation) {
      res.status(400).json({ error: "clinicAddress, name, and accreditation are required" });
      return;
    }
    const result = await verifyClinic(clinicAddress, name, accreditation, expiryDays || 365);
    res.json({ txHash: result.txHash, url: txUrl(result.txHash) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify a doctor
router.post("/verify-doctor", requireAuth, async (req, res) => {
  try {
    const { doctorAddress, clinicAddress, license, expiryDays } = req.body;
    if (!doctorAddress || !clinicAddress || !license) {
      res.status(400).json({ error: "doctorAddress, clinicAddress, and license are required" });
      return;
    }
    const result = await verifyDoctor(doctorAddress, clinicAddress, license, expiryDays || 365);
    res.json({ txHash: result.txHash, url: txUrl(result.txHash) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add a review
router.post("/review", requireAuth, async (req, res) => {
  try {
    const { clinicAddress, rating, comment } = req.body;
    if (!clinicAddress || !rating) {
      res.status(400).json({ error: "clinicAddress and rating are required" });
      return;
    }
    const clerkUserId = (req as any).auth.userId as string;
    const patient = await ensurePatient(clerkUserId);
    const result = await addReview(patient.walletAddress, clinicAddress, rating, comment || "");
    res.json({ txHash: result.txHash, url: txUrl(result.txHash) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Read operations (free) ─── */

router.get("/clinic-verified/:address", async (req, res) => {
  try {
    const verified = await isClinicVerified(req.params.address);
    res.json({ address: req.params.address, verified });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/doctor-verified/:address", async (req, res) => {
  try {
    const verified = await isDoctorVerified(req.params.address);
    res.json({ address: req.params.address, verified });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/clinic-info/:address", async (req, res) => {
  try {
    const info = await getClinicInfo(req.params.address);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/doctor-info/:address", async (req, res) => {
  try {
    const info = await getDoctorInfo(req.params.address);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/review-count/:address", async (req, res) => {
  try {
    const count = await getReviewCount(req.params.address);
    res.json({ address: req.params.address, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/record-count", async (_req, res) => {
  try {
    const count = await getRecordCount();
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/has-interaction/:address", async (req, res) => {
  try {
    const has = await hasOnChainInteraction(req.params.address);
    res.json({ address: req.params.address, hasInteraction: has });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function serializeArgs(args: any): any {
  if (args == null) return args;
  if (typeof args === "bigint") return args.toString();
  if (Array.isArray(args)) return args.map(serializeArgs);
  if (typeof args === "object") {
    const out: any = {};
    for (const k of Object.keys(args)) {
      out[k] = serializeArgs(args[k]);
    }
    return out;
  }
  return args;
}

router.get("/events", async (_req, res) => {
  try {
    const all = await getAllEvents();
    res.json({
      clinicEvents: all.clinicEvents.map((e: any) => ({
        name: "ClinicVerified",
        args: serializeArgs(e.args),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      doctorEvents: all.doctorEvents.map((e: any) => ({
        name: "DoctorVerified",
        args: serializeArgs(e.args),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      recordEvents: all.recordEvents.map((e: any) => ({
        name: "RecordAdded",
        args: serializeArgs(e.args),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      consentGrantEvents: all.consentGrantEvents.map((e: any) => ({
        name: "ConsentGranted",
        args: serializeArgs(e.args),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      consentRevokeEvents: all.consentRevokeEvents.map((e: any) => ({
        name: "ConsentRevoked",
        args: serializeArgs(e.args),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      reviewEvents: all.reviewEvents.map((e: any) => ({
        name: "ReviewAdded",
        args: serializeArgs(e.args),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
