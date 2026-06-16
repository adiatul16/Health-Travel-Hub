import { useGetClinic } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const clinicId = parseInt(id ?? "0");
  const { data: clinic, isLoading, error } = useGetClinic(clinicId, {
    query: { enabled: !isNaN(clinicId) && clinicId > 0 },
  });

  if (isLoading) {
    return (
      <div className="container py-16 px-4 mx-auto max-w-5xl">
        <div className="h-72 rounded-2xl bg-muted animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="container py-24 px-4 mx-auto max-w-xl text-center">
        <div className="text-5xl mb-4">🏥</div>
        <h1 className="text-2xl font-bold mb-2">Clinic not found</h1>
        <p className="text-muted-foreground mb-6">This clinic may have moved or been removed from the marketplace.</p>
        <Button asChild>
          <Link href="/clinics">Browse All Clinics</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={clinic.imageUrl}
          alt={clinic.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container px-4 pb-8 mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2 mb-3">
            {clinic.jciAccredited && (
              <Badge className="bg-yellow-400 text-yellow-950 hover:bg-yellow-400 font-bold">
                JCI Accredited
              </Badge>
            )}
            {clinic.accreditations.filter(a => a !== "JCI").map((acc) => (
              <Badge key={acc} variant="secondary" className="bg-white/20 text-white border-white/30">
                {acc}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{clinic.name}</h1>
          <p className="text-white/80 text-lg">{clinic.city}, {clinic.country}</p>
        </div>
      </div>

      <div className="container py-10 px-4 mx-auto max-w-5xl">
        {/* Key stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: "Rating", value: `${Number(clinic.rating).toFixed(1)} / 5`, sub: `${clinic.reviewCount.toLocaleString()} reviews` },
            { label: "Success Rate", value: `${Number(clinic.successRate).toFixed(1)}%`, sub: "Verified outcomes" },
            { label: "Available Slots", value: String(clinic.availableSlots), sub: "This month" },
            { label: "Est.", value: String(clinic.yearsEstablished), sub: `${new Date().getFullYear() - clinic.yearsEstablished} years' experience` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-card border rounded-xl p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {clinic.description && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h2 className="text-xl font-bold mb-3">About the clinic</h2>
                <p className="text-muted-foreground leading-relaxed">{clinic.description}</p>
              </motion.section>
            )}

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <h2 className="text-xl font-bold mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {clinic.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-sm px-3 py-1">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xl font-bold mb-3">Accreditations & Certifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {clinic.accreditations.map((acc) => (
                  <div key={acc} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium">
                    <span className="text-green-500 font-bold">✓</span>
                    {acc}
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <h2 className="text-xl font-bold mb-3">Why choose {clinic.name}?</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Internationally accredited with verified patient outcomes</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> {new Date().getFullYear() - clinic.yearsEstablished} years of clinical excellence since {clinic.yearsEstablished}</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> English-speaking patient coordinators available 24/7</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> MediBridge-verified for safety, quality, and transparency</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Includes complimentary airport transfer and aftercare guide</li>
              </ul>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border rounded-2xl p-6 shadow-sm sticky top-6"
            >
              <div className="text-sm text-muted-foreground mb-1">Treatments starting from</div>
              <div className="text-3xl font-bold text-primary mb-1">£{Number(clinic.startingFrom).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mb-5">Prices include consultation, procedure, and follow-up</div>

              <div className="text-sm mb-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Availability</span>
                  <span className={`font-semibold ${clinic.availableSlots <= 3 ? "text-red-500" : clinic.availableSlots <= 7 ? "text-amber-500" : "text-green-600"}`}>
                    {clinic.availableSlots} slots this month
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Success rate</span>
                  <span className="font-semibold">{Number(clinic.successRate).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Patient rating</span>
                  <span className="font-semibold">★ {Number(clinic.rating).toFixed(1)} / 5</span>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg" data-testid="book-consultation">
                Book Free Consultation
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/packages" data-testid="build-package-link">
                  Build My Package
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                No obligation · Free consultation · Response within 2 hours
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
