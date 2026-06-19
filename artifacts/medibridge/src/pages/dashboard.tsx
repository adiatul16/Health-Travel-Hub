import { useState } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

function StatCard({
  label,
  value,
  icon,
  accent,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
      className={`bg-white rounded-2xl p-6 shadow-sm border border-purple-100 overflow-hidden group hover:shadow-md transition-shadow`}
    >
      <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-gradient-to-br ${accent}`} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-2xl shadow-sm`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface BookingDetails {
  id: number;
  procedure: string;
  clinic: string;
  city: string;
  date: string;
  status: string;
  packageTotal: number;
  procedurePrice: number;
  flightPrice: number;
  hotelPrice: number;
  transferPrice: number;
  insurancePrice: number;
  airline: string;
  hotelName: string;
  departureAirport: string;
  arrivalAirport: string;
  nextFlightDate: string;
  returnFlightDate: string;
  insuranceProvider: string;
  doctor: string;
  roomType: string;
  nights: number;
}

function generateMockDetails(booking: any): BookingDetails {
  return {
    ...booking,
    procedurePrice: Math.round(booking.packageTotal * 0.55),
    flightPrice: Math.round(booking.packageTotal * 0.18),
    hotelPrice: Math.round(booking.packageTotal * 0.15),
    transferPrice: Math.round(booking.packageTotal * 0.05),
    insurancePrice: Math.round(booking.packageTotal * 0.07),
    airline: "Turkish Airlines",
    hotelName: "Shangri-La Bosphorus",
    departureAirport: "London Heathrow (LHR)",
    arrivalAirport: "Istanbul Airport (IST)",
    nextFlightDate: booking.date,
    returnFlightDate: "2026-07-18",
    insuranceProvider: "Allianz Global Assistance",
    doctor: "Dr. Mehmet Yilmaz",
    roomType: "Deluxe Single Room",
    nights: 5,
  };
}

function ItineraryModal({
  booking,
  open,
  onClose,
}: {
  booking: BookingDetails;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Trip Itinerary</DialogTitle>
          <DialogDescription>
            {booking.procedure} at {booking.clinic}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="rounded-xl border border-purple-100 p-4 bg-purple-50/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✈️</span>
              <h4 className="font-semibold text-gray-900">Flights</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Airline</span><span className="font-medium">{booking.airline}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Outbound</span><span className="font-medium">{new Date(booking.nextFlightDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {booking.departureAirport} → {booking.arrivalAirport}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Return</span><span className="font-medium">{new Date(booking.returnFlightDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — {booking.arrivalAirport} → {booking.departureAirport}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-semibold">£{booking.flightPrice.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 bg-blue-50/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏨</span>
              <h4 className="font-semibold text-gray-900">Accommodation</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Hotel</span><span className="font-medium">{booking.hotelName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium">{booking.roomType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Nights</span><span className="font-medium">{booking.nights}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-semibold">£{booking.hotelPrice.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 p-4 bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏥</span>
              <h4 className="font-semibold text-gray-900">Treatment</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Procedure</span><span className="font-medium">{booking.procedure}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Clinic</span><span className="font-medium">{booking.clinic}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="font-medium">{booking.doctor}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(booking.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-semibold">£{booking.procedurePrice.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 p-4 bg-amber-50/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🛡️</span>
              <h4 className="font-semibold text-gray-900">Insurance</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Provider</span><span className="font-medium">{booking.insuranceProvider}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-semibold">£{booking.insurancePrice.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🚗</span>
              <h4 className="font-semibold text-gray-900">Transfers</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Airport ↔ Hotel</span><span className="font-medium">Included</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Hotel ↔ Clinic</span><span className="font-medium">Included</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-semibold">£{booking.transferPrice.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 p-4 bg-purple-50">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Package</span>
              <span className="text-xl font-bold text-purple-700">£{booking.packageTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Includes all taxes and MediBridge coordination fees</p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl">Close</Button>
          </DialogClose>
          <Button asChild className="rounded-xl bg-purple-600 hover:bg-purple-700">
            <Link href="/packages">Modify Package</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);

  function openChat() {
    window.dispatchEvent(new CustomEvent("medibridge-open-chat"));
    toast({ title: "Chat opened", description: "A MediBridge coordinator will assist you shortly." });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-purple-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const recoveryPct = summary?.recoveryProgress || 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Saved vs UK" value={`£${(summary?.totalSavings || 0).toLocaleString()}`} icon="💰" accent="from-emerald-400 to-teal-500" delay={0} />
          <StatCard label="Upcoming Treatments" value={String(summary?.upcomingTreatments?.length || 0)} icon="🏥" accent="from-purple-500 to-violet-600" delay={0.08} />
          <StatCard label="Unread Messages" value={String(summary?.messageCount || 0)} icon="✉️" accent="from-blue-400 to-indigo-500" delay={0.16} />
          <StatCard label="Recovery Progress" value={`${recoveryPct}%`} icon="❤️" accent="from-rose-400 to-pink-500" delay={0.24} />
        </div>

        {/* Recovery bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">Recovery Milestone</h3>
              <p className="text-sm text-gray-500 mt-0.5">Post-procedure progress tracker</p>
            </div>
            <span className="text-2xl font-bold text-purple-700">{recoveryPct}%</span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${recoveryPct}%` }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
              className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-600"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Pre-procedure</span>
            <span>Recovery complete</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Bookings</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Your scheduled procedures and appointments</p>
                </div>
                <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-lg">📋</span>
              </div>
              <div className="divide-y divide-gray-50">
                {summary?.upcomingTreatments?.length ? (
                  summary.upcomingTreatments.map((booking, i) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-purple-50/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : booking.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(booking.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{booking.procedure}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">🏥 {booking.clinic} · {booking.city}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Package total</p>
                          <p className="font-bold text-purple-700 text-lg">£{booking.packageTotal.toLocaleString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => setSelectedBooking(generateMockDetails(booking))}
                        >
                          Details
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-16 flex flex-col items-center text-center gap-3">
                    <div className="text-5xl">✈️</div>
                    <p className="font-semibold text-gray-700">No upcoming treatments</p>
                    <p className="text-sm text-gray-400">Build your first package to start your medical journey</p>
                    <Button asChild size="sm" className="rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
                      <Link href="/packages">Build a Package</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar cards */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">✈️</span>
                <h3 className="font-bold text-gray-900">Travel Itinerary</h3>
              </div>
              {summary?.nextFlightDate ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                  <p className="text-xs text-purple-500 uppercase tracking-wider font-semibold mb-1">Next Departure</p>
                  <p className="font-semibold text-gray-800">{new Date(summary.nextFlightDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
                  <button className="text-sm text-purple-600 font-medium hover:text-purple-800 mt-2 flex items-center gap-1"
                    onClick={() => toast({ title: "Boarding pass", description: "Your boarding pass will be available 24 hours before departure." })}>
                    View boarding pass →
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-3xl mb-2">🌍</p>
                  <p className="text-sm text-gray-400">No upcoming flights scheduled</p>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }} className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⚡</span>
                <h3 className="font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  { icon: "💬", label: "Message Concierge", action: openChat },
                  { icon: "📁", label: "Upload Medical Records", action: () => toast({ title: "Upload records", description: "Please use the secure upload portal on your desktop to submit medical records." }) },
                  { icon: "🩺", label: "Telemedicine Consultation", action: () => toast({ title: "Telemedicine", description: "Booking a video consultation. A coordinator will confirm your appointment within 2 hours." }) },
                  { icon: "🛡️", label: "View Insurance Policy", action: () => toast({ title: "Insurance policy", description: "Your policy documents will be emailed to you shortly." }) },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-purple-50 transition-colors text-left">
                    <span className="text-lg">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <ItineraryModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}
