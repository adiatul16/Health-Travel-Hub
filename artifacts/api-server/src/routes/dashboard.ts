import { Router } from "express";

const router = Router();

router.get("/summary", (_req, res) => {
  res.json({
    upcomingTreatments: [
      {
        id: 1,
        procedure: "FUE Hair Transplant",
        clinic: "Acibadem Healthcare Group",
        city: "Istanbul",
        date: "2026-07-15",
        status: "confirmed",
        packageTotal: 2340,
      },
    ],
    totalSavings: 4160,
    nextFlightDate: "2026-07-13",
    nextHotelCheckIn: "2026-07-13",
    messageCount: 3,
    recoveryProgress: 0,
  });
});

export default router;
