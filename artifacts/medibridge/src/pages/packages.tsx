import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  useListTreatments,
  useListDestinations,
  useOptimizePackage,
} from "@workspace/api-client-react";
import type { PackageOption } from "@workspace/api-client-react";
import { BookingModal } from "@/components/booking-modal";

const CITY_IATA: Record<string, string> = {
  Istanbul: "ist",
  Antalya: "ayt",
  Ankara: "esb",
  Shanghai: "pvg",
  Beijing: "pek",
  Shenzhen: "szx",
};

function getSkyscannerLink(city: string): string {
  const dest = CITY_IATA[city] ?? city.toLowerCase().replace(/\s/g, "").slice(0, 3);
  return `https://www.skyscanner.net/transport/flights/lond/${dest}/`;
}

function getBookingLink(city: string): string {
  const checkin = new Date();
  checkin.setMonth(checkin.getMonth() + 2);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${fmt(checkin)}&checkout=${fmt(checkout)}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STEP_LABELS = ["Procedure", "Destination", "Budget & Dates", "Clinics"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : isDone
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-colors duration-300 ${stepNum < current ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ClinicCard({
  pkg,
  rank,
  onReserve,
}: {
  pkg: PackageOption;
  rank: number;
  onReserve: (pkg: PackageOption) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.06 }}
      className="rounded-2xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Clinic image */}
        <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0">
          <img
            src={pkg.imageUrl}
            alt={pkg.clinicName}
            className="w-full h-full object-cover"
          />
          {rank === 0 && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow">
              Best Price
            </div>
          )}
          {pkg.jciAccredited && (
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow">
              <span className="text-green-600">✓</span> JCI Accredited
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-lg leading-tight">{pkg.clinicName}</h3>
              <p className="text-muted-foreground text-sm">{pkg.city}</p>
              <StarRating rating={pkg.rating} />
              <p className="text-xs text-muted-foreground mt-0.5">{pkg.reviewCount} reviews</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black text-primary">£{pkg.total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground line-through">£{pkg.ukPrice.toLocaleString()} UK</div>
              <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200 mt-1">
                Save £{pkg.savings.toLocaleString()} ({pkg.savingsPercent}%)
              </Badge>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-xs text-muted-foreground">Success Rate</div>
              <div className="text-sm font-bold">{pkg.successRate}%</div>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-xs text-muted-foreground">Slots Left</div>
              <div className={`text-sm font-bold ${pkg.availableSlots <= 3 ? "text-red-500" : "text-foreground"}`}>
                {pkg.availableSlots}
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg p-2 text-center">
              <div className="text-xs text-muted-foreground">Next Date</div>
              <div className="text-xs font-semibold">{pkg.nextAvailableDate}</div>
            </div>
          </div>

          {/* Expandable price breakdown */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline text-left mb-3 flex items-center gap-1"
          >
            {expanded ? "▲ Hide" : "▼ Show"} price breakdown
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="bg-muted/30 rounded-xl p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">🏥 {pkg.procedure}</span>
                    <span className="font-medium">£{pkg.procedurePrice.toLocaleString()}</span>
                  </div>
                  {pkg.airline && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        ✈️ {pkg.airline}
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">est.</span>
                      </span>
                      <span className="font-medium flex items-center gap-2">
                        £{pkg.flightPrice.toLocaleString()}
                        <a
                          href={getSkyscannerLink(pkg.city)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Real prices →
                        </a>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      🏨 {pkg.hotelName}
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">est.</span>
                    </span>
                    <span className="font-medium flex items-center gap-2">
                      £{pkg.hotelPrice.toLocaleString()}
                      <a
                        href={getBookingLink(pkg.city)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Real prices →
                      </a>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">🚗 Airport Transfer</span>
                    <span className="font-medium">£{pkg.transferPrice.toLocaleString()}</span>
                  </div>
                  {pkg.insuranceProvider && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">🛡️ {pkg.insuranceProvider}</span>
                      <span className="font-medium">£{pkg.insurancePrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 font-bold">
                    <span>Total Package</span>
                    <span className="text-primary">£{pkg.total.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 pt-0.5 leading-tight">
                    ⚠️ Flight and hotel costs are typical estimates based on departure from London. Click "Real prices →" for live fares.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            className="w-full mt-auto"
            onClick={() => onReserve(pkg)}
            data-testid={`reserve-${pkg.clinicId}`}
          >
            Reserve at {pkg.clinicName}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Packages() {
  const [step, setStep] = useState(1);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [budget, setBudget] = useState(5000);
  const [travelMonth, setTravelMonth] = useState(MONTHS[new Date().getMonth() + 1] || "July");
  const [bookingPkg, setBookingPkg] = useState<PackageOption | null>(null);

  const { data: treatments, isLoading: loadingTreatments } = useListTreatments();
  const { data: destinations, isLoading: loadingDestinations } = useListDestinations();
  const optimizeMutation = useOptimizePackage();

  const handleOptimize = () => {
    if (!selectedTreatmentId || !selectedDestinationId) return;
    optimizeMutation.mutate(
      {
        data: {
          procedureId: selectedTreatmentId,
          destinationId: selectedDestinationId,
          budget,
          travelMonth,
        },
      },
      {
        onSuccess: () => setStep(4),
      }
    );
  };

  const clinicOptions = optimizeMutation.data?.options ?? [];
  const selectedTreatment = treatments?.find((t) => t.id === selectedTreatmentId);
  const selectedDestination = destinations?.find((d) => d.id === selectedDestinationId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {bookingPkg && (
        <BookingModal pkg={bookingPkg} onClose={() => setBookingPkg(null)} />
      )}

      <div className="container py-12 px-4 mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Smart Package Optimizer</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build your entire medical journey in seconds. Treatment, flights, hotel, transfers and insurance all in one.
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* STEP 1: Choose Treatment */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card border rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold mb-2">What treatment are you looking for?</h2>
              <p className="text-muted-foreground mb-6">Select the procedure you'd like to have abroad.</p>

              {loadingTreatments ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  {treatments?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTreatmentId(t.id)}
                      data-testid={`treatment-option-${t.id}`}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 ${
                        selectedTreatmentId === t.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="font-semibold text-sm leading-tight">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">Save up to {t.savingsPercent}%</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={!selectedTreatmentId}
                  data-testid="step1-next"
                >
                  Next: Choose Destination →
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Choose Destination */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card border rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold mb-2">Select your destination</h2>
              <p className="text-muted-foreground mb-6">Choose where you'd like to travel for your treatment.</p>

              {loadingDestinations ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {destinations?.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDestinationId(d.id)}
                      data-testid={`destination-option-${d.id}`}
                      className={`relative overflow-hidden rounded-xl border-2 text-left transition-all duration-150 hover:border-primary/50 ${
                        selectedDestinationId === d.id
                          ? "border-primary shadow-md"
                          : "border-border"
                      }`}
                    >
                      <div className="relative h-28">
                        <img
                          src={d.imageUrl}
                          alt={d.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        {selectedDestinationId === d.id && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{d.flag}</span>
                            <span>{d.name}</span>
                          </div>
                          <div className="text-xs text-white/80">
                            {d.clinicCount} clinics · Avg. {d.averageSavings}% savings
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <Button size="lg" variant="outline" onClick={() => setStep(1)} data-testid="step2-back">← Back</Button>
                <Button
                  size="lg"
                  onClick={() => setStep(3)}
                  disabled={!selectedDestinationId}
                  data-testid="step2-next"
                >
                  Next: Set Budget →
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Budget & Dates */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card border rounded-2xl p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold mb-2">Set your budget and travel dates</h2>
              <p className="text-muted-foreground mb-8">We'll show you every clinic that fits within your budget, sorted by price.</p>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-semibold text-sm">Total Budget (full package)</label>
                  <span className="text-2xl font-bold text-primary">£{budget.toLocaleString()}</span>
                </div>
                <Slider
                  min={1000}
                  max={20000}
                  step={100}
                  value={[budget]}
                  onValueChange={(v) => setBudget(v[0])}
                  data-testid="budget-slider"
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>£1,000</span>
                  <span>£20,000</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="font-semibold text-sm block mb-3">Preferred travel month</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {MONTHS.map((month) => (
                    <button
                      key={month}
                      onClick={() => setTravelMonth(month)}
                      data-testid={`month-${month}`}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        travelMonth === month
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl p-4 mb-8 text-sm">
                <div className="font-semibold mb-2">Your selection summary</div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Procedure:</span><span className="text-foreground font-medium">{selectedTreatment?.name}</span>
                  <span>Destination:</span><span className="text-foreground font-medium">{selectedDestination?.flag} {selectedDestination?.name}</span>
                  <span>Max budget:</span><span className="text-foreground font-medium">£{budget.toLocaleString()}</span>
                  <span>Travel month:</span><span className="text-foreground font-medium">{travelMonth}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <Button size="lg" variant="outline" onClick={() => setStep(2)} data-testid="step3-back">← Back</Button>
                <Button
                  size="lg"
                  onClick={handleOptimize}
                  disabled={optimizeMutation.isPending}
                  data-testid="optimize-button"
                >
                  {optimizeMutation.isPending ? "Finding clinics..." : "Show Available Clinics →"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Clinic List Results */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {clinicOptions.length} clinic{clinicOptions.length !== 1 ? "s" : ""} within your budget
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedTreatment?.name} · {selectedDestination?.flag} {selectedDestination?.name} · up to £{budget.toLocaleString()} · {travelMonth}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-muted-foreground">Sorted by</div>
                  <div className="text-sm font-semibold text-primary">Lowest price first</div>
                </div>
              </div>

              {clinicOptions.length > 0 ? (
                <div className="space-y-4">
                  {clinicOptions.map((pkg, i) => (
                    <ClinicCard
                      key={pkg.clinicId}
                      pkg={pkg}
                      rank={i}
                      onReserve={setBookingPkg}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-card border rounded-2xl p-12 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold mb-2">No clinics found within this budget</h3>
                  <p className="text-muted-foreground mb-6">Try increasing your budget or selecting a different treatment.</p>
                  <Button onClick={() => setStep(3)} data-testid="adjust-budget">
                    Adjust Budget
                  </Button>
                </div>
              )}

              <div className="text-center mt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStep(1); optimizeMutation.reset(); }}
                  data-testid="start-over"
                >
                  ← Start over
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
