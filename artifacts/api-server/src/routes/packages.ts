import { Router } from "express";
import { OptimizePackageBody } from "@workspace/api-zod";

const router = Router();

const packageData = {
  cheapest: {
    type: "cheapest" as const,
    clinicName: "Cosmedica Clinic",
    procedure: "FUE Hair Transplant",
    procedurePrice: 1499,
    airline: "Pegasus Airlines",
    flightPrice: 189,
    hotelName: "Tulip Inn Istanbul",
    hotelPrice: 180,
    transferPrice: 35,
    insuranceProvider: "AXA",
    insurancePrice: 65,
    ukPrice: 6500,
    successRate: 94.5,
    availableSlots: 12,
  },
  best_value: {
    type: "best_value" as const,
    clinicName: "Acibadem Healthcare Group",
    procedure: "FUE Hair Transplant",
    procedurePrice: 1750,
    airline: "Turkish Airlines",
    flightPrice: 220,
    hotelName: "Ramada Plaza Istanbul",
    hotelPrice: 240,
    transferPrice: 45,
    insuranceProvider: "Allianz",
    insurancePrice: 85,
    ukPrice: 6500,
    successRate: 98.2,
    availableSlots: 6,
  },
  premium: {
    type: "premium" as const,
    clinicName: "Memorial Hospital Istanbul",
    procedure: "FUE Hair Transplant",
    procedurePrice: 2299,
    airline: "Turkish Airlines (Business)",
    flightPrice: 450,
    hotelName: "Ritz-Carlton Istanbul",
    hotelPrice: 520,
    transferPrice: 85,
    insuranceProvider: "Cigna Global",
    insurancePrice: 150,
    ukPrice: 6500,
    successRate: 99.1,
    availableSlots: 3,
  },
};

router.post("/optimize", async (req, res) => {
  try {
    const parsed = OptimizePackageBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { budget, packageType } = parsed.data;
    const types: Array<"cheapest" | "best_value" | "premium"> = packageType
      ? [packageType as "cheapest" | "best_value" | "premium"]
      : ["cheapest", "best_value", "premium"];

    const options = types.map((t) => {
      const base = packageData[t];
      const total = base.procedurePrice + base.flightPrice + base.hotelPrice + base.transferPrice + base.insurancePrice;
      const savings = base.ukPrice - total;
      const savingsPercent = Math.round((savings / base.ukPrice) * 100);
      return { ...base, total, savings, savingsPercent };
    });

    res.json({ options });
  } catch (err) {
    req.log.error({ err }, "Failed to optimize package");
    res.status(500).json({ error: "Failed to optimize package" });
  }
});

export default router;
