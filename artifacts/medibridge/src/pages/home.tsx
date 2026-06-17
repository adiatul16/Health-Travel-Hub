import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetPopularTreatments } from "@workspace/api-client-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, type: "spring", stiffness: 280, damping: 26 },
  }),
};

const LOCATIONS = [
  {
    id: "uk",
    flag: "🇬🇧",
    label: "United Kingdom",
    headline: "Tired of NHS waiting lists?",
    subtext: "UK patients wait an average of 18 months for common procedures. With MediBridge, you can be treated abroad in just 2–4 weeks — at a fraction of the cost.",
    stat: "18 months → 2–4 weeks",
    statSub: "Treatment wait time",
    cta: "Find UK-Friendly Treatments",
    href: "/treatments",
  },
  {
    id: "europe",
    flag: "🇪🇺",
    label: "Europe",
    headline: "Save 40–70% on European prices.",
    subtext: "Even compared to European private clinics, MediBridge partner clinics in Turkey and China deliver the same JCI-accredited quality at dramatically lower cost.",
    stat: "40–70%",
    statSub: "Saving vs European private care",
    cta: "Compare European vs Abroad",
    href: "/packages",
  },
  {
    id: "worldwide",
    flag: "🌍",
    label: "Worldwide",
    headline: "World-class care, wherever you are.",
    subtext: "MediBridge connects patients globally to 48+ verified, JCI-accredited clinics across Istanbul, Antalya, Shanghai and Shenzhen.",
    stat: "48+",
    statSub: "Verified clinics worldwide",
    cta: "Browse Global Clinics",
    href: "/clinics",
  },
] as const;

type LocationId = (typeof LOCATIONS)[number]["id"];

export default function Home() {
  const { data: popularTreatments, isLoading: isLoadingPopular } = useGetPopularTreatments();
  const [selectedLocation, setSelectedLocation] = useState<LocationId | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("mb_user_location") as LocationId | null;
    if (stored && LOCATIONS.some((l) => l.id === stored)) {
      setSelectedLocation(stored);
    }
  }, []);

  const handleSelectLocation = (id: LocationId) => {
    setSelectedLocation(id);
    sessionStorage.setItem("mb_user_location", id);
    sessionStorage.setItem("mb_location_set", id);
  };

  const locContent = LOCATIONS.find((l) => l.id === selectedLocation);

  return (
    <div className="w-full flex flex-col">
      {/* ── Hero ── */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50/60 to-white" />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-300 rounded-full blur-[120px] opacity-40"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.38, 0.2] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-400 rounded-full blur-[100px] opacity-25"
          />
        </div>

        <div className="container px-4 md:px-6 z-10 flex flex-col items-center text-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-8 border border-purple-200"
          >
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            The Healthcare Travel Operating System
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 24 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 max-w-4xl leading-tight"
          >
            Your Entire Medical Journey.{" "}
            <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              One Trusted Platform.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-500 max-w-3xl leading-relaxed"
          >
            Compare verified hospitals, reserve treatment slots, book flights and accommodation, arrange transfers, secure insurance and manage your recovery — all in one platform.
          </motion.p>

          {/* ── Location picker ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 w-full max-w-xl"
          >
            <p className="text-sm text-gray-400 mb-3 font-medium">
              📍 Where are you travelling from? <span className="text-purple-500">Get personalised results</span>
            </p>
            <div className="inline-flex gap-2 bg-white/90 backdrop-blur rounded-2xl p-2 border border-purple-100 shadow-lg w-full justify-center">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
                    selectedLocation === loc.id
                      ? "purple-gradient text-white shadow-md"
                      : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  <span className="text-base">{loc.flag}</span>
                  <span className="hidden sm:inline">{loc.label}</span>
                  <span className="sm:hidden">{loc.id === "uk" ? "UK" : loc.id === "europe" ? "EU" : "World"}</span>
                </button>
              ))}
            </div>

            {/* Personalised insight card */}
            <AnimatePresence mode="wait">
              {locContent && (
                <motion.div
                  key={locContent.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="mt-3 bg-white rounded-2xl p-4 border border-purple-100 shadow-md text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-3xl mt-0.5">{locContent.flag}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{locContent.headline}</p>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{locContent.subtext}</p>
                    </div>
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <div className="text-lg font-black bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">{locContent.stat}</div>
                      <div className="text-xs text-gray-400 max-w-[100px] leading-tight">{locContent.statSub}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="mt-6 flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="h-14 px-10 text-lg rounded-2xl purple-gradient border-0 shadow-lg hover:opacity-90 transition-opacity font-semibold"
              asChild
            >
              <Link href={locContent ? locContent.href : "/treatments"}>
                {locContent ? locContent.cta : "Find My Treatment"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold" asChild>
              <Link href="/destinations">Explore Destinations</Link>
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { num: "48+", label: "Verified clinics", icon: "🏥" },
              { num: "2", label: "Destinations", icon: "🌍" },
              { num: "65%", label: "Average savings", icon: "💰" },
              { num: "4.9★", label: "Patient rating", icon: "⭐" },
            ].map(({ num, label, icon }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="text-2xl font-bold text-purple-800">{num}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1">{icon} {label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Floating cards */}
        <div className="absolute bottom-8 left-8 hidden xl:block">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card rounded-2xl p-4 shadow-lg max-w-[220px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-lg">💰</div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Save up to £4,200</p>
                <p className="text-xs text-gray-500">on dental implants vs UK</p>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute top-32 right-8 hidden xl:block">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="glass-card rounded-2xl p-4 shadow-lg max-w-[200px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-lg">✅</div>
              <div>
                <p className="font-bold text-gray-800 text-sm">JCI Accredited</p>
                <p className="text-xs text-gray-500">All partner clinics verified</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Popular Treatments ── */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <p className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-2">Most Booked</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Popular Treatments</h2>
              <p className="text-gray-500 mt-2">Discover our most booked procedures with huge UK savings</p>
            </div>
            <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl" asChild>
              <Link href="/treatments">View all →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingPopular ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-purple-50 animate-pulse" />
              ))
            ) : (
              popularTreatments?.slice(0, 4).map((treatment, i) => (
                <motion.div
                  key={treatment.id}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                >
                  <Link href="/packages" className="group block rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all bg-white">
                    <div className="relative h-48 overflow-hidden bg-purple-50">
                      {treatment.imageUrl && (
                        <img
                          src={treatment.imageUrl}
                          alt={treatment.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent" />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 text-xs font-bold rounded-full shadow-sm text-emerald-700">
                        Save up to {Math.round(treatment.averageSavings)}%
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 text-base group-hover:text-purple-700 transition-colors">{treatment.name}</h3>
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                        {treatment.bookingsThisMonth} bookings this month
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-gradient-to-b from-purple-50/60 to-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-100 rounded-full blur-[80px] opacity-40" />
        </div>
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How MediBridge Works</h2>
            <p className="text-gray-500 mt-4">We handle every detail of your medical journey so you can focus on your recovery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 hidden lg:block" />
            {[
              { step: "01", title: "Choose Treatment", desc: "Compare procedures, verified clinics and transparent pricing from our global network.", icon: "🔍" },
              { step: "02", title: "Reserve Your Slot", desc: "Lock in your exclusive treatment date at your chosen clinic with instant confirmation.", icon: "📅" },
              { step: "03", title: "Book Travel", desc: "We arrange flights, accommodation and transfers in one seamless click.", icon: "✈️" },
              { step: "04", title: "Travel and Recover", desc: "Fly out for treatment and enjoy a fully managed, seamless recovery experience.", icon: "🌟" },
            ].map((step, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative p-6 rounded-2xl bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
              >
                <div className="absolute -top-4 left-6">
                  <div className="w-8 h-8 rounded-full purple-gradient flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {i + 1}
                  </div>
                </div>
                <div className="text-3xl mb-4 mt-2">{step.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why MediBridge ── */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-wider mb-3">Why Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Everything You Need in One Place</h2>
            <p className="text-gray-500 mt-4">A safe, affordable and well-managed medical journey abroad, from consultation to recovery.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: "🏥", text: "Verified hospitals and clinics" },
              { icon: "📅", text: "Reserved treatment slots" },
              { icon: "💎", text: "Transparent pricing" },
              { icon: "✈️", text: "Flight and hotel integration" },
              { icon: "🛡️", text: "Insurance integration" },
              { icon: "🛍️", text: "Recovery commerce" },
              { icon: "❤️", text: "Post-treatment care" },
              { icon: "💻", text: "Telemedicine follow-up" },
              { icon: "🤝", text: "Patient advocacy" },
              { icon: "🚗", text: "Airport transfers" },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl px-4 py-3.5 border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all"
              >
                <span className="text-xl flex-shrink-0">{feature.icon}</span>
                <span className="text-sm font-medium text-gray-800">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-violet-50 border-y border-purple-100">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "£12,000+", label: "Average patient saving", icon: "💷" },
              { value: "48", label: "JCI-accredited clinics", icon: "🏆" },
              { value: "4.9★", label: "Average patient rating", icon: "⭐" },
              { value: "2,400+", label: "Treatments completed", icon: "✅" },
            ].map(({ value, label, icon }, i) => (
              <motion.div
                key={label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-3xl mb-1">{icon}</div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 purple-gradient" />
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-[80px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 12, repeat: Infinity, delay: 3 }}
            className="absolute bottom-0 right-1/4 w-80 h-80 bg-white rounded-full blur-[80px]"
          />
        </div>
        <div className="container px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-4 py-1.5 text-sm font-semibold mb-6 border border-white/30"
          >
            ✨ Start your journey today
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-5 max-w-2xl mx-auto leading-tight"
          >
            Ready to start your medical journey?
          </motion.h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Build your personalised treatment package in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-10 text-lg rounded-2xl bg-white text-purple-700 hover:bg-purple-50 font-bold shadow-xl" asChild>
              <Link href="/packages">Build My Package</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl text-white border-white/40 hover:bg-white/10 font-semibold" asChild>
              <Link href="/clinics">Browse Clinics</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
