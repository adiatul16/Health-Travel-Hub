import { Router } from "express";

const router = Router();

router.get("/metrics", (_req, res) => {
  res.json({
    totalPatients: 1842,
    totalBookings: 2156,
    treatmentRevenue: 892450,
    affiliateRevenue: 124300,
    hotelRevenue: 87600,
    insuranceRevenue: 52100,
    recoveryRevenue: 34200,
    conversionRate: 18.4,
    monthlyRevenueTrend: [
      { month: "Jan", revenue: 68000, bookings: 142 },
      { month: "Feb", revenue: 74500, bookings: 158 },
      { month: "Mar", revenue: 82300, bookings: 176 },
      { month: "Apr", revenue: 91000, bookings: 195 },
      { month: "May", revenue: 98500, bookings: 211 },
      { month: "Jun", revenue: 112400, bookings: 239 },
    ],
    popularTreatments: [
      { name: "Hair Transplant", bookings: 842, revenue: 312400 },
      { name: "Dental Implants", bookings: 524, revenue: 198700 },
      { name: "Rhinoplasty", bookings: 312, revenue: 156000 },
      { name: "Bariatric Surgery", bookings: 198, revenue: 143000 },
      { name: "IVF", bookings: 156, revenue: 82400 },
    ],
    availableSlots: 87,
    inventoryUtilization: 68.4,
  });
});

export default router;
