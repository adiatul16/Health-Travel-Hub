import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  addRecord,
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
} from "../services/blockchain.js";

const router = Router();

/* Health check */
router.get("/health", (_req, res) => {
  res.json({ configured: isBlockchainConfigured() });
});

/* ─── Write operations (backend wallet) ─── */

// Anchor a medical record hash (open to all users — record hash is anonymous)
router.post("/record", async (req, res) => {
  try {
    const { dataHash, ref, phase } = req.body;
    if (!dataHash || !ref) {
      res.status(400).json({ error: "dataHash and ref are required" });
      return;
    }
    const userId = (req as any).auth?.userId || "anonymous";
    const result = await addRecord(userId, dataHash, ref, phase || "pre-op");
    res.json({ txHash: result.txHash, url: txUrl(result.txHash) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
    const userId = (req as any).auth?.userId || "anonymous";
    const result = await addReview(userId, clinicAddress, rating, comment || "");
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

router.get("/events", async (_req, res) => {
  try {
    const all = await getAllEvents();
    res.json({
      clinicEvents: all.clinicEvents.map((e: any) => ({
        name: "ClinicVerified",
        args: e.args,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      doctorEvents: all.doctorEvents.map((e: any) => ({
        name: "DoctorVerified",
        args: e.args,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      recordEvents: all.recordEvents.map((e: any) => ({
        name: "RecordAdded",
        args: e.args,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      consentGrantEvents: all.consentGrantEvents.map((e: any) => ({
        name: "ConsentGranted",
        args: e.args,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      consentRevokeEvents: all.consentRevokeEvents.map((e: any) => ({
        name: "ConsentRevoked",
        args: e.args,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
      reviewEvents: all.reviewEvents.map((e: any) => ({
        name: "ReviewAdded",
        args: e.args,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
