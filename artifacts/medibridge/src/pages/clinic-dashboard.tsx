import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ClinicSlot {
  id: number;
  treatmentName: string;
  city: string;
  slotsRemaining: number;
  price: number;
  originalPrice: number;
  availability: "high" | "limited" | "critical";
  nextAvailableDate: string;
}

interface ClinicCredential {
  id: number;
  credentialType: string;
  issuingBody: string;
  issueDate: string;
  status: string;
  onChainTxHash?: string;
}

export default function ClinicDashboard() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<ClinicSlot[]>([]);
  const [credentials, setCredentials] = useState<ClinicCredential[]>([]);
  const [bookings, setBookings] = useState([
    { id: 1, patient: "James Wilson", treatment: "Hair Transplant (FUE)", date: "2026-07-15", status: "confirmed" },
    { id: 2, patient: "Sarah Chen", treatment: "Dental Implants", date: "2026-07-18", status: "pending" },
    { id: 3, patient: "Ahmed Hassan", treatment: "Knee Replacement", date: "2026-07-22", status: "confirmed" },
    { id: 4, patient: "Emma Thompson", treatment: "IVF Treatment", date: "2026-07-25", status: "pending" },
  ]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "slots" | "bookings" | "credentials">("overview");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/slots").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/credentials/clinic/1").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([slotData, credData]) => {
      setSlots(slotData as ClinicSlot[]);
      setCredentials(credData as ClinicCredential[]);
      setLoading(false);
    });
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => {
    const slot = slots.find((s) => s.treatmentName === b.treatment);
    return sum + (slot?.price ?? 0);
  }, 0);

  const availabilityBadge = (a: string) => {
    const map: Record<string, string> = {
      high: "bg-green-100 text-green-700",
      limited: "bg-amber-100 text-amber-700",
      critical: "bg-red-100 text-red-700",
    };
    return map[a] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Header */}
      <div className="purple-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        </div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">🏥</div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-purple-200 text-xs font-semibold uppercase tracking-wider"
                >
                  Partner Clinic
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-2xl sm:text-3xl font-bold text-white"
                >
                  Clinic Dashboard
                </motion.h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                Active
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => {
                  sessionStorage.removeItem("mb_clinic");
                  window.location.href = "/";
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur transition-colors"
              >
                Sign Out
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["overview", "slots", "bookings", "credentials"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 hover:bg-purple-50 border border-purple-100"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "slots" && "Treatment Slots"}
              {tab === "bookings" && "Patient Bookings"}
              {tab === "credentials" && "Credentials"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Active Slots", value: slots.length.toString(), icon: "📅", color: "from-purple-500 to-violet-600" },
                { label: "Pending Bookings", value: bookings.filter((b) => b.status === "pending").length.toString(), icon: "📋", color: "from-amber-500 to-orange-600" },
                { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length.toString(), icon: "✅", color: "from-emerald-500 to-teal-600" },
                { label: "Revenue", value: `£${totalRevenue.toLocaleString()}`, icon: "💎", color: "from-blue-500 to-indigo-600" },
              ].map(({ label, value, icon, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6 flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">👥</div>
                  <h3 className="font-bold text-gray-900">Recent Patients</h3>
                </div>
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-purple-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                        {b.patient[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{b.patient}</p>
                        <p className="text-xs text-gray-400">{b.treatment}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">📋</div>
                  <h3 className="font-bold text-gray-900">Credential Status</h3>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center gap-3 text-gray-400 py-4">
                      <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : credentials.length === 0 ? (
                    <p className="text-gray-400 text-sm py-2">No credentials on file.</p>
                  ) : (
                    credentials.slice(0, 3).map((c: ClinicCredential) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">🔒</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{c.credentialType}</p>
                          <p className="text-xs text-gray-400">{c.issuingBody}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.status === "anchored" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === "slots" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">📅</div>
              <h3 className="font-bold text-gray-900">Treatment Slots</h3>
            </div>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-400 py-8">
                <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                Loading slots...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-gray-400 text-sm py-8">No treatment slots available.</p>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-purple-50/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{slot.treatmentName}</p>
                      <p className="text-xs text-gray-400">{slot.city} · Next: {slot.nextAvailableDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-700">£{slot.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 line-through">£{slot.originalPrice.toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${availabilityBadge(slot.availability)}`}>
                      {slot.slotsRemaining} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">👥</div>
              <h3 className="font-bold text-gray-900">Patient Bookings</h3>
            </div>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-purple-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {b.patient[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{b.patient}</p>
                    <p className="text-xs text-gray-400">{b.treatment} · {b.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.status}
                  </span>
                  <Button size="sm" variant="outline" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-xs">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">🔒</div>
              <h3 className="font-bold text-gray-900">Verified Credentials</h3>
            </div>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-400 py-8">
                <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                Loading credentials...
              </div>
            ) : credentials.length === 0 ? (
              <p className="text-gray-400 text-sm py-8">No credentials on file.</p>
            ) : (
              <div className="space-y-3">
                {credentials.map((c: ClinicCredential) => (
                  <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-purple-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">🔒</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{c.credentialType}</p>
                      <p className="text-xs text-gray-400">{c.issuingBody} · {c.issueDate}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      c.status === "anchored" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status}
                    </span>
                    {c.onChainTxHash && (
                      <span className="text-xs text-gray-400 font-mono">TX: {c.onChainTxHash.slice(0, 8)}…</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
