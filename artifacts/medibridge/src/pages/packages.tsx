import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useListTreatments,
  useListDestinations,
  useOptimizePackage,
} from "@workspace/api-client-react";
import type { PackageOption } from "@workspace/api-client-react";
import { BookingModal } from "@/components/booking-modal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STEP_LABELS = ["Procedure", "Destination", "Budget & Dates", "Your Package"];

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

function PackageCard({
  pkg,
  highlight,
  onReserve,
}: {
  pkg: PackageOption;
  highlight?: boolean;
  onReserve: (pkg: PackageOption) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg ${
        highlight ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      {highlight && (
        <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-semibold tracking-wider uppercase">
          Best Value
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">{pkg.clinicName}</h3>
            <p className="text-muted-foreground text-sm">{pkg.procedure}</p>
          </div>
          <Badge variant={pkg.type === "premium" ? "default" : pkg.type === "best_value" ? "secondary" : "outline"} className="capitalize">
            {pkg.type.replace("_", " ")}
          </Badge>
        </div>

        <div className="space-y-2.5 mb-5">
          <LineItem icon="🏥" label="Treatment" value={`£${pkg.procedurePrice.toLocaleString()}`} />
          {pkg.airline && (
            <LineItem
              icon="✈️"
              label={pkg.airline}
              value={`£${pkg.flightPrice.toLocaleString()}`}
              affiliateLabel="Skyscanner"
              affiliateUrl="https://www.skyscanner.net/flights"
            />
          )}
          <LineItem
            icon="🏨"
            label={pkg.hotelName}
            value={`£${pkg.hotelPrice.toLocaleString()}`}
            affiliateLabel="Booking.com"
            affiliateUrl="https://www.booking.com/searchresults.html"
          />
          <LineItem icon="🚗" label="Airport Transfer" value={`£${pkg.transferPrice.toLocaleString()}`} />
          {pkg.insuranceProvider && (
            <LineItem icon="🛡️" label={pkg.insuranceProvider} value={`£${pkg.insurancePrice.toLocaleString()}`} />
          )}
        </div>

        <div className="border-t pt-4 mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">Package Total</span>
            <span className="text-2xl font-bold text-primary">£{pkg.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">UK equivalent</span>
            <span className="line-through text-muted-foreground">£{pkg.ukPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-green-700 dark:text-green-400 font-medium">You save</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-400">£{pkg.savings.toLocaleString()}</div>
          </div>
          <div className="text-3xl font-black text-green-600 dark:text-green-400">{pkg.savingsPercent}%</div>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground mb-5">
          <span className="bg-muted px-2 py-1 rounded">✓ {pkg.availableSlots} slots left</span>
          <span className="bg-muted px-2 py-1 rounded">✓ JCI accredited clinic</span>
        </div>

        <Button
          className="w-full"
          variant={highlight ? "default" : "outline"}
          size="lg"
          onClick={() => onReserve(pkg)}
          data-testid={`reserve-${pkg.type}`}
        >
          Reserve This Package
        </Button>
      </div>
    </motion.div>
  );
}

function LineItem({
  icon,
  label,
  value,
  affiliateLabel,
  affiliateUrl,
}: {
  icon: string;
  label: string;
  value: string;
  affiliateLabel?: string;
  affiliateUrl?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{icon}</span>
        <span>{label}</span>
        {affiliateLabel && affiliateUrl && (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-affiliate={affiliateLabel}
            className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium hover:underline"
          >
            via {affiliateLabel}
          </a>
        )}
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function Packages() {
  const [step, setStep] = useState(1);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [budget, setBudget] = useState(5000);
  const [travelMonth, setTravelMonth] = useState(MONTHS[new Date().getMonth() + 1] || "July");
  const [activeTab, setActiveTab] = useState("best_value");
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

  const packageOptions = optimizeMutation.data?.options ?? [];
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
                  Next: Budget & Dates →
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
              <p className="text-muted-foreground mb-8">We'll optimise your package to fit your budget and preferred month.</p>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-semibold text-sm">Total Budget (package)</label>
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
                  <span>Budget:</span><span className="text-foreground font-medium">£{budget.toLocaleString()}</span>
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
                  {optimizeMutation.isPending ? "Building packages..." : "Build My Package →"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Results */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Your optimised packages</h2>
                <p className="text-muted-foreground">
                  {selectedTreatment?.name} in {selectedDestination?.flag} {selectedDestination?.name} · {travelMonth}
                </p>
              </div>

              {packageOptions.length > 0 ? (
                <>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="cheapest">Cheapest</TabsTrigger>
                      <TabsTrigger value="best_value">Best Value</TabsTrigger>
                      <TabsTrigger value="premium">Premium</TabsTrigger>
                    </TabsList>
                    {packageOptions.map((pkg) => (
                      <TabsContent key={pkg.type} value={pkg.type}>
                        <PackageCard
                          pkg={pkg}
                          highlight={pkg.type === "best_value"}
                          onReserve={setBookingPkg}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setStep(1); optimizeMutation.reset(); }}
                      data-testid="start-over"
                    >
                      Start over
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  No packages found. Try adjusting your budget.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
