import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function StatCard({
  label,
  value,
  icon,
  gradient,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 22 }}
      className="relative bg-white rounded-2xl p-6 shadow-md border border-purple-50 overflow-hidden group hover:shadow-lg transition-shadow"
    >
      <div className={`absolute inset-0 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity ${gradient}`} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center text-2xl shadow-sm`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-purple-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const recoveryPct = summary?.recoveryProgress || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Hero header */}
      <div className="purple-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3 opacity-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4 opacity-10" />
        </div>
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-purple-200 text-sm font-medium mb-1 uppercase tracking-wider"
              >
                Patient Portal
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="text-2xl sm:text-3xl font-bold text-white"
              >
                Your Medical Journey
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.10 }}
                className="text-purple-200 mt-1 text-sm"
              >
                Track treatments, travel plans and recovery all in one place.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Button asChild className="bg-white text-purple-700 hover:bg-purple-50 font-semibold rounded-xl shadow-md w-full sm:w-auto">
                <Link href="/packages">+ Build New Package</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-2">
        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Total Saved vs UK"
            value={`£${(summary?.totalSavings || 0).toLocaleString()}`}
            icon="💰"
            gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
            delay={0}
          />
          <StatCard
            label="Upcoming Treatments"
            value={String(summary?.upcomingTreatments?.length || 0)}
            icon="🏥"
            gradient="bg-gradient-to-br from-purple-500 to-violet-600"
            delay={0.08}
          />
          <StatCard
            label="Unread Messages"
            value={String(summary?.messageCount || 0)}
            icon="✉️"
            gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
            delay={0.16}
          />
          <StatCard
            label="Recovery Progress"
            value={`${recoveryPct}%`}
            icon="❤️"
            gradient="bg-gradient-to-br from-rose-400 to-pink-500"
            delay={0.24}
          />
        </div>

        {/* Recovery progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 mb-8"
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
              className="h-3 rounded-full purple-gradient"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Pre-procedure</span>
            <span>Recovery complete</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings list */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden"
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
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              booking.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-700"
                                : booking.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {booking.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(booking.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{booking.procedure}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          🏥 {booking.clinic} &middot; {booking.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Package total</p>
                          <p className="font-bold text-purple-700 text-lg">£{booking.packageTotal.toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50">
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
                    <Button asChild size="sm" className="rounded-xl mt-2 purple-gradient border-0">
                      <Link href="/packages">Build a Package</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Travel card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl shadow-sm border border-purple-50 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">✈️</span>
                <h3 className="font-bold text-gray-900">Travel Itinerary</h3>
              </div>
              {summary?.nextFlightDate ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                  <p className="text-xs text-purple-500 uppercase tracking-wider font-semibold mb-1">Next Departure</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(summary.nextFlightDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <button className="text-sm text-purple-600 font-medium hover:text-purple-800 mt-2 flex items-center gap-1">
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

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
              className="bg-white rounded-2xl shadow-sm border border-purple-50 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⚡</span>
                <h3 className="font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  { icon: "💬", label: "Message Concierge" },
                  { icon: "📁", label: "Upload Medical Records" },
                  { icon: "🩺", label: "Telemedicine Consultation" },
                  { icon: "🛡️", label: "View Insurance Policy" },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-100 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-800 transition-all text-left"
                  >
                    <span className="text-lg">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Support card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
              className="purple-gradient rounded-2xl p-5 text-white overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10">
                <p className="text-2xl mb-2">🌟</p>
                <h3 className="font-bold mb-1">24/7 Patient Support</h3>
                <p className="text-purple-100 text-sm mb-4">Our medical coordinators are always here to help.</p>
                <button className="bg-white text-purple-700 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-purple-50 transition-colors">
                  Contact Concierge
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
