import { Router } from "express";
import { OptimizePackageBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { clinicsTable, treatmentsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

const TRAVEL_ESTIMATES: Record<string, {
  airline: string;
  flightPrice: number;
  hotelPricePerNight: number;
  hotelName: string;
  transferPrice: number;
  insuranceProvider: string;
  insurancePrice: number;
  nights: number;
}> = {
  Turkey: {
    airline: "Turkish Airlines",
    flightPrice: 220,
    hotelPricePerNight: 70,
    hotelName: "Ramada Plaza Istanbul",
    transferPrice: 40,
    insuranceProvider: "AXA",
    insurancePrice: 75,
    nights: 4,
  },
  China: {
    airline: "Air China",
    flightPrice: 580,
    hotelPricePerNight: 90,
    hotelName: "Holiday Inn Shanghai",
    transferPrice: 60,
    insuranceProvider: "Cigna Global",
    insurancePrice: 110,
    nights: 5,
  },
  default: {
    airline: "easyJet",
    flightPrice: 180,
    hotelPricePerNight: 65,
    hotelName: "Premier Inn",
    transferPrice: 35,
    insuranceProvider: "AXA",
    insurancePrice: 65,
    nights: 3,
  },
};

function nextAvailableDate(index: number): string {
  const now = new Date();
  const offsetWeeks = 2 + (index % 6) * 2;
  const d = new Date(now.getTime() + offsetWeeks * 7 * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

router.post("/optimize", async (req, res) => {
  try {
    const parsed = OptimizePackageBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { procedureId, budget } = parsed.data;

    const [treatment] = await db
      .select()
      .from(treatmentsTable)
      .where(eq(treatmentsTable.id, procedureId));

    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    const clinics = await db
      .select()
      .from(clinicsTable)
      .orderBy(asc(clinicsTable.startingFrom));

    const ukPrice = parseFloat(treatment.ukPrice as string);

    const options = clinics
      .map((clinic, idx) => {
        const travel = TRAVEL_ESTIMATES[clinic.country as keyof typeof TRAVEL_ESTIMATES] ?? TRAVEL_ESTIMATES.default;
        const procedurePrice = parseFloat(clinic.startingFrom as string);
        const hotelPrice = travel.hotelPricePerNight * travel.nights;
        const total = procedurePrice + travel.flightPrice + hotelPrice + travel.transferPrice + travel.insurancePrice;
        const savings = ukPrice - total;
        const savingsPercent = Math.round((savings / ukPrice) * 100);

        return {
          clinicId: clinic.id,
          clinicName: clinic.name,
          city: clinic.city,
          imageUrl: clinic.imageUrl,
          rating: parseFloat(clinic.rating as string),
          reviewCount: clinic.reviewCount,
          jciAccredited: clinic.jciAccredited,
          procedure: treatment.name,
          procedurePrice,
          airline: travel.airline,
          flightPrice: travel.flightPrice,
          hotelName: travel.hotelName,
          hotelPrice,
          transferPrice: travel.transferPrice,
          insuranceProvider: travel.insuranceProvider,
          insurancePrice: travel.insurancePrice,
          total,
          ukPrice,
          savings,
          savingsPercent,
          successRate: parseFloat(clinic.successRate as string),
          availableSlots: clinic.availableSlots,
          nextAvailableDate: nextAvailableDate(idx),
        };
      })
      .filter((pkg) => pkg.total <= budget && pkg.savings > 0)
      .sort((a, b) => a.total - b.total);

    return res.json({ options });
  } catch (err) {
    req.log.error({ err }, "Failed to optimize package");
    return res.status(500).json({ error: "Failed to optimize package" });
  }
});

export default router;
