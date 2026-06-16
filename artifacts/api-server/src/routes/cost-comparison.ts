import { Router } from "express";

const router = Router();

const costData = [
  { procedure: "Hair Transplant", ukCost: 6500, turkeyCost: 1750, chinaCost: 2200, savings: 4750, savingsPercent: 73 },
  { procedure: "Dental Implant (per tooth)", ukCost: 2500, turkeyCost: 550, chinaCost: 700, savings: 1950, savingsPercent: 78 },
  { procedure: "All-on-4 Dental", ukCost: 18000, turkeyCost: 5500, chinaCost: 7000, savings: 12500, savingsPercent: 69 },
  { procedure: "Rhinoplasty", ukCost: 8000, turkeyCost: 2999, chinaCost: 3500, savings: 5001, savingsPercent: 63 },
  { procedure: "Bariatric Surgery", ukCost: 12000, turkeyCost: 4500, chinaCost: 5500, savings: 7500, savingsPercent: 63 },
  { procedure: "IVF (single cycle)", ukCost: 5000, turkeyCost: 2200, chinaCost: 2800, savings: 2800, savingsPercent: 56 },
  { procedure: "Facelift", ukCost: 10000, turkeyCost: 3500, chinaCost: null, savings: 6500, savingsPercent: 65 },
  { procedure: "Orthopaedic Surgery", ukCost: 15000, turkeyCost: 5500, chinaCost: 7000, savings: 9500, savingsPercent: 63 },
];

router.get("/", (_req, res) => {
  res.json(costData);
});

export default router;
