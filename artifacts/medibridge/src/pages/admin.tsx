import { useGetAdminMetrics } from "@workspace/api-client-react";
import { motion } from "framer-motion";

function KPICard({
  label,
  value,
  icon,
  trend,
  trendUp,
  gradient,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 22 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50 relative overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div className={`absolute top-0 right-0 w-28 h-28 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-full`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center text-xl shadow-sm`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function RevenueBar({ label, value, max, color, delay = 0 }: { label: string; value: number; max: number; color: string; delay?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">£{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 1.0, ease: "easeOut" }}
          className={`h-2.5 rounded-full ${color}`}
        />
      </div>
      <div className="text-xs text-gray-400">{pct}% of total</div>
    </div>
  );
}

export default function Admin() {
  const { data: metrics, isLoading } = useGetAdminMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-purple-700 font-medium">Loading admin console...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = (metrics?.treatmentRevenue || 0) + (metrics?.hotelRevenue || 0) + (metrics?.insuranceRevenue || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Header */}
      <div className="purple-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-white/5 rounded-full translate-y-1/3" />
        </div>
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">⚙️</div>
            <div>
              <motion.p
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-purple-200 text-xs font-semibold uppercase tracking-wider"
              >
                Platform Management
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="text-3xl font-bold text-white"
              >
                Admin Console
              </motion.h1>
            </div>
          </div>

          {/* Revenue total banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-5 inline-flex items-center gap-6"
          >
            <div>
              <p className="text-purple-200 text-sm">Total Platform Revenue</p>
              <p className="text-4xl font-bold text-white mt-1">£{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-px h-14 bg-white/20" />
            <div>
              <p className="text-purple-200 text-sm">Conversion Rate</p>
              <p className="text-4xl font-bold text-white mt-1">{metrics?.conversionRate}%</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KPICard
            label="Total Patients"
            value={(metrics?.totalPatients || 0).toLocaleString()}
            icon="👥"
            trend="12%"
            trendUp={true}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            delay={0}
          />
          <KPICard
            label="Treatment Revenue"
            value={`£${(metrics?.treatmentRevenue || 0).toLocaleString()}`}
            icon="💊"
            trend="8%"
            trendUp={true}
            gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
            delay={0.08}
          />
          <KPICard
            label="Conversion Rate"
            value={`${metrics?.conversionRate || 0}%`}
            icon="📈"
            trend="2.4%"
            trendUp={true}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            delay={0.16}
          />
          <KPICard
            label="Inventory Utilisation"
            value={`${metrics?.inventoryUtilization || 0}%`}
            icon="📦"
            trend="5%"
            trendUp={false}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={0.24}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">💹</div>
              <div>
                <h3 className="font-bold text-gray-900">Revenue Distribution</h3>
                <p className="text-xs text-gray-400">Across all verticals</p>
              </div>
            </div>
            <div className="space-y-6">
              <RevenueBar
                label="Treatment Fees"
                value={metrics?.treatmentRevenue || 0}
                max={totalRevenue}
                color="bg-gradient-to-r from-purple-500 to-violet-600"
                delay={0.5}
              />
              <RevenueBar
                label="Hotel & Travel Affiliate"
                value={metrics?.hotelRevenue || 0}
                max={totalRevenue}
                color="bg-gradient-to-r from-blue-500 to-indigo-500"
                delay={0.65}
              />
              <RevenueBar
                label="Insurance Premiums"
                value={metrics?.insuranceRevenue || 0}
                max={totalRevenue}
                color="bg-gradient-to-r from-emerald-500 to-teal-500"
                delay={0.8}
              />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-purple-700 text-lg">£{totalRevenue.toLocaleString()}</span>
            </div>
          </motion.div>

          {/* Popular Treatments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">🏆</div>
              <div>
                <h3 className="font-bold text-gray-900">Top Treatments</h3>
                <p className="text-xs text-gray-400">By revenue generated</p>
              </div>
            </div>
            <div className="space-y-3">
              {metrics?.popularTreatments.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-400" :
                    i === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                    i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                    "bg-gradient-to-br from-purple-400 to-violet-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.bookings} bookings</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-purple-700 text-sm">£{t.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">revenue</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { title: "Active Clinics", value: "48", icon: "🏥", desc: "JCI-accredited partners", color: "from-purple-500 to-violet-600" },
            { title: "Destinations", value: "2", icon: "🌍", desc: "Turkey & China networks", color: "from-blue-500 to-indigo-500" },
            { title: "Avg Patient Saving", value: "65%", icon: "💎", desc: "vs UK private healthcare", color: "from-emerald-500 to-teal-500" },
          ].map(({ title, value, icon, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="bg-white rounded-2xl shadow-sm border border-purple-50 p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
