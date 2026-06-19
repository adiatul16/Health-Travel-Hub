import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetPopularTreatments } from "@workspace/api-client-react";
import { LoginDropdown } from "./login-dropdown";


/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return { count, ref };
}

/* ─── Stagger container ─── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
};

const fadePop = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
};

/* ─── Marquee items ─── */
const MARQUEE = [
  { icon: "✈️", text: "2,400+ Treatments Completed" },
  { icon: "⭐", text: "4.9 / 5 Patient Rating" },
  { icon: "🏥", text: "48+ JCI-Accredited Clinics" },
  { icon: "💰", text: "£12,000+ Average Saving" },
  { icon: "🌍", text: "Istanbul · Antalya · Shanghai" },
  { icon: "🛡️", text: "Fully Insured Journeys" },
  { icon: "🩺", text: "Concierge Care Included" },
  { icon: "📅", text: "Treated in 2–4 Weeks" },
];

/* ─── Location data ─── */
const LOCATIONS = [
  {
    id: "uk",
    flag: "🇬🇧",
    label: "United Kingdom",
    short: "UK",
    headline: "Tired of NHS waiting lists?",
    subtext: "UK patients wait an average of 18 months. MediBridge gets you treated abroad in just 2–4 weeks — at a fraction of the NHS private cost.",
    stat: "18mo → 2wk",
    statSub: "Treatment wait time",
    cta: "Find UK Treatments",
    href: "/treatments",
  },
  {
    id: "europe",
    flag: "🇪🇺",
    label: "Europe",
    short: "EU",
    headline: "Save 40–70% vs European prices.",
    subtext: "Even compared to European private clinics, MediBridge partner clinics deliver identical JCI-accredited quality at dramatically lower cost.",
    stat: "40–70%",
    statSub: "vs European private care",
    cta: "Compare Clinics",
    href: "/packages",
  },
  {
    id: "worldwide",
    flag: "🌍",
    label: "Worldwide",
    short: "Global",
    headline: "World-class care, wherever you are.",
    subtext: "MediBridge connects global patients to 48+ verified, JCI-accredited clinics across Istanbul, Antalya, Shanghai and Shenzhen.",
    stat: "48+ Clinics",
    statSub: "Verified worldwide",
    cta: "Browse Global Clinics",
    href: "/clinics",
  },
] as const;

type LocationId = (typeof LOCATIONS)[number]["id"];

/* ─── Stat counter card ─── */
function StatCard({ value, suffix = "", prefix = "", label, duration = 2000 }: {
  value: number; suffix?: string; prefix?: string; label: string; duration?: number;
}) {
  const { count, ref } = useCountUp(value, duration);
  return (
    <div className="flex flex-col items-center">
      <span ref={ref} className="text-4xl md:text-5xl font-black tracking-tight gradient-text tabular-nums">
        {prefix}{count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm text-gray-500 mt-1.5 font-medium">{label}</span>
    </div>
  );
}

export default function Home() {
  const { data: popularTreatments, isLoading: isLoadingPopular } = useGetPopularTreatments();
  const [selectedLocation, setSelectedLocation] = useState<LocationId | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const stored = sessionStorage.getItem("mb_user_location") as LocationId | null;
    if (stored && LOCATIONS.some((l) => l.id === stored)) setSelectedLocation(stored);
  }, []);

  const handleSelectLocation = (id: LocationId) => {
    setSelectedLocation(id);
    sessionStorage.setItem("mb_user_location", id);
    sessionStorage.setItem("mb_location_set", id);
  };

  const loc = LOCATIONS.find((l) => l.id === selectedLocation);

  return (
    <div className="w-full flex flex-col overflow-x-hidden">

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section ref={heroRef} className="relative w-full min-h-[80vh] sm:min-h-screen flex items-center justify-center">

        {/* Layered background */}
        <motion.div className="absolute inset-0 -z-10" style={{ y: heroY }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_hsl(263_70%_96%)_0%,_white_70%)]" />
          {/* Animated blobs */}
          <motion.div
            className="blob-animation absolute top-1/4 left-1/4 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(263 70% 88% / 0.6) 0%, transparent 70%)" }}
          />
          <motion.div
            className="blob-animation absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(280 65% 85% / 0.5) 0%, transparent 70%)",
              animationDelay: "-4s",
            }}
          />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `
                linear-gradient(hsl(263 70% 40%) 1px, transparent 1px),
                linear-gradient(90deg, hsl(263 70% 40%) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </motion.div>

        <motion.div
          className="container px-4 md:px-8 z-10 flex flex-col items-center text-center pt-20 pb-16"
          style={{ opacity: heroOpacity }}
        >
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm text-purple-700 rounded-full px-5 py-2 text-sm font-semibold mb-10 border border-purple-200/70 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="pulse-ring animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            The Healthcare Travel Operating System
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="mb-6 overflow-hidden"
          >
            <motion.h1
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.08 }}
              className="font-display font-black tracking-tight-display text-4xl sm:text-5xl md:text-7xl lg:text-9xl text-gray-950 leading-[0.93] max-w-5xl"
            >
              Your Entire{" "}
              <span className="relative inline-block">
                <span className="shimmer-text">Medical</span>
              </span>
              <br className="hidden sm:block" />
              {" "}Journey.
            </motion.h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, type: "spring", stiffness: 200, damping: 24 }}
            className="mb-10 overflow-hidden"
          >
            <h2 className="font-display font-bold tracking-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl gradient-text">
              One Trusted Platform.
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed mb-6 sm:mb-10 font-medium"
          >
            Compare verified hospitals, reserve treatment slots, book flights and accommodation,
            arrange transfers, secure insurance — all in one seamless platform.
          </motion.p>

          {/* ─── Location picker ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-lg mb-6"
          >
            <p className="text-sm text-gray-400 mb-3 font-semibold flex items-center justify-center gap-1.5">
              <span>📍</span>
              Where are you travelling from?{" "}
              <span className="text-purple-500">Get personalised results</span>
            </p>

            <div className="flex gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-1.5 border border-purple-100/80 shadow-lg">
              {LOCATIONS.map((l) => (
                <motion.button
                  key={l.id}
                  onClick={() => handleSelectLocation(l.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all flex-1 relative ${
                    selectedLocation === l.id
                      ? "text-white shadow-md"
                      : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  {selectedLocation === l.id && (
                    <motion.div
                      layoutId="location-pill"
                      className="absolute inset-0 purple-gradient rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 text-base">{l.flag}</span>
                  <span className="relative z-10 hidden sm:inline">{l.label}</span>
                  <span className="relative z-10 sm:hidden">{l.short}</span>
                </motion.button>
              ))}
            </div>

            {/* Personalised card */}
            <AnimatePresence mode="wait">
              {loc && (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="mt-3 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 border border-purple-100 shadow-md text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl flex-shrink-0">{loc.flag}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-snug">{loc.headline}</p>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{loc.subtext}</p>
                    </div>
                    <div className="flex-shrink-0 text-right pl-2 hidden sm:block">
                      <div className="text-base font-black gradient-text leading-none">{loc.stat}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 max-w-[90px] leading-tight">{loc.statSub}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Login Dropdown + Explore */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-14"
          >
            <LoginDropdown />
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="outline"
                className="h-12 sm:h-14 px-6 sm:px-10 text-base rounded-2xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 font-bold transition-all w-full sm:w-auto"
                asChild
              >
                <Link href="/destinations">Explore Destinations</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust numbers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-12"
          >
            {[
              { val: "48+", label: "Verified clinics", icon: "🏥" },
              { val: "65%", label: "Average savings", icon: "💰" },
              { val: "4.9★", label: "Patient rating", icon: "⭐" },
              { val: "2 wks", label: "Avg. treatment wait", icon: "📅" },
            ].map(({ val, label, icon }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">{val}</span>
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">{icon} {label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating side cards — desktop */}
        <motion.div
          className="absolute bottom-16 left-6 hidden xl:block"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, type: "spring" }}
        >
          <div className="float-animation">
            <div className="glass-card rounded-2xl p-4 shadow-xl max-w-[230px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center text-white text-lg flex-shrink-0">💰</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Save up to £4,200</p>
                  <p className="text-xs text-gray-500">on dental implants vs UK</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full purple-gradient rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "76%" }}
                  transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">76% cheaper than UK average</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-24 right-6 hidden xl:block"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, type: "spring" }}
        >
          <div className="float-animation-slow">
            <div className="glass-card rounded-2xl p-4 shadow-xl max-w-[210px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl flex-shrink-0">✅</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">JCI Accredited</p>
                  <p className="text-xs text-gray-500">All partner clinics verified</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-32 right-8 hidden xl:block"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.15, type: "spring" }}
        >
          <div className="float-animation" style={{ animationDelay: "-2s" }}>
            <div className="glass-card rounded-2xl p-4 shadow-xl max-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 italic">"Changed my life. Treated in Istanbul for a fraction of UK cost."</p>
              <p className="text-[10px] text-gray-400 mt-1.5">— Sarah M., London</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════ MARQUEE STRIP ══════════════════════════════ */}
      <div className="relative w-full border-y border-purple-100/60 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/80 py-4 overflow-hidden">
        <div className="flex w-max marquee-track gap-0">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-8 text-sm font-semibold text-gray-600 flex-shrink-0 whitespace-nowrap">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
              <span className="ml-8 text-purple-300">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════ POPULAR TREATMENTS ══════════════════════════════ */}
      <section className="py-16 sm:py-28 bg-white">
        <div className="container px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6"
          >
            <div>
              <motion.p variants={fadeSlide} className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-3">
                Most Booked
              </motion.p>
              <motion.h2 variants={fadeSlide} className="font-display font-black tracking-display text-4xl md:text-5xl lg:text-6xl text-gray-950">
                Popular Treatments
              </motion.h2>
              <motion.p variants={fadeSlide} className="text-gray-500 mt-3 text-lg max-w-md">
                Our most-booked procedures — each saving UK patients thousands.
              </motion.p>
            </div>
            <motion.div variants={fadeSlide}>
              <Button variant="outline" className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 rounded-xl font-bold" asChild>
                <Link href="/treatments">View all treatments →</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {isLoadingPopular
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-3xl bg-purple-50 animate-pulse" />
                ))
              : popularTreatments?.slice(0, 4).map((treatment) => (
                  <motion.div key={treatment.id} variants={fadePop}>
                    <Link
                      href="/packages"
                      className="group block rounded-3xl overflow-hidden border border-purple-100/80 hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-white"
                    >
                      <div className="relative h-52 overflow-hidden bg-purple-50">
                        {treatment.imageUrl && (
                          <motion.img
                            src={treatment.imageUrl}
                            alt={treatment.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className="bg-white/95 backdrop-blur text-emerald-700 font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                            Save {Math.round(treatment.averageSavings)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-purple-700 transition-colors leading-snug">
                          {treatment.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                          {treatment.bookingsThisMonth} bookings this month
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ HOW IT WORKS ══════════════════════════════ */}
      <section className="py-16 sm:py-28 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(263 40% 98%) 0%, white 100%)" }}>
        {/* Giant background number */}
        <div className="absolute -right-8 top-16 text-[280px] font-black text-purple-100/60 select-none pointer-events-none leading-none tracking-tight hidden lg:block">
          How
        </div>

        <div className="container px-4 md:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <motion.p variants={fadeSlide} className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-3">
              Simple Process
            </motion.p>
            <motion.h2 variants={fadeSlide} className="font-display font-black tracking-display text-4xl md:text-5xl lg:text-6xl text-gray-950">
              How it works
            </motion.h2>
            <motion.p variants={fadeSlide} className="text-gray-500 mt-4 text-lg">
              We handle every detail so you can focus entirely on your health and recovery.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line desktop */}
            <div className="absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent hidden lg:block" />

            {[
              { num: "01", icon: "🔍", title: "Choose Treatment", desc: "Compare procedures, verified clinics and transparent pricing from our global network." },
              { num: "02", icon: "📅", title: "Reserve Your Slot", desc: "Lock in your exclusive treatment date with instant confirmation and no upfront clinic fees." },
              { num: "03", icon: "✈️", title: "Book Travel", desc: "We arrange flights, accommodation, airport transfers and medical insurance in one click." },
              { num: "04", icon: "🌟", title: "Travel & Recover", desc: "Fly out, receive world-class treatment, and enjoy a fully managed recovery experience." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 240, damping: 24 }}
                whileHover={{ y: -6 }}
                className="relative bg-white border border-purple-100 rounded-3xl p-7 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute -top-4 left-7 w-8 h-8 rounded-full purple-gradient flex items-center justify-center text-white text-xs font-black shadow-md">
                  {i + 1}
                </div>
                <div className="absolute top-4 right-5 text-4xl font-black text-purple-100 leading-none select-none">
                  {step.num}
                </div>
                <div className="text-3xl mb-5 mt-2">{step.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 leading-snug">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ ANIMATED STATS ══════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-white border-y border-purple-50">
        <div className="container px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-10"
          >
            <motion.div variants={fadePop} className="flex flex-col items-center text-center">
              <StatCard value={12000} prefix="£" suffix="+" label="Average patient saving" />
            </motion.div>
            <motion.div variants={fadePop} className="flex flex-col items-center text-center">
              <StatCard value={48} suffix="+" label="JCI-accredited clinics" duration={1200} />
            </motion.div>
            <motion.div variants={fadePop} className="flex flex-col items-center text-center">
              <StatCard value={2400} suffix="+" label="Treatments completed" />
            </motion.div>
            <motion.div variants={fadePop} className="flex flex-col items-center text-center">
              <StatCard value={65} suffix="%" label="Average cost saving" duration={1400} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ WHY MEDIBRIDGE ══════════════════════════════ */}
      <section className="py-16 sm:py-28" style={{ background: "linear-gradient(180deg, white 0%, hsl(263 40% 97%) 100%)" }}>
        <div className="container px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <motion.p variants={fadeSlide} className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-3">
              Everything Included
            </motion.p>
            <motion.h2 variants={fadeSlide} className="font-display font-black tracking-display text-4xl md:text-5xl lg:text-6xl text-gray-950">
              Why MediBridge?
            </motion.h2>
            <motion.p variants={fadeSlide} className="text-gray-500 mt-4 text-lg">
              One platform — every part of your medical journey covered.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            {[
              { icon: "🏥", title: "Verified Hospitals", desc: "JCI-accredited clinics only" },
              { icon: "📅", title: "Reserved Slots", desc: "Guaranteed treatment dates" },
              { icon: "💎", title: "Transparent Pricing", desc: "No hidden fees, ever" },
              { icon: "✈️", title: "Flight & Hotel", desc: "Fully arranged travel" },
              { icon: "🛡️", title: "Medical Insurance", desc: "Comprehensive coverage" },
              { icon: "🚗", title: "Airport Transfers", desc: "Door-to-clinic service" },
              { icon: "🩺", title: "Post-Treatment Care", desc: "Recovery concierge" },
              { icon: "💻", title: "Telemedicine", desc: "Follow-up consultations" },
              { icon: "🤝", title: "Patient Advocacy", desc: "Dedicated case manager" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadePop}
                whileHover={{ y: -4, boxShadow: "0 12px 28px hsl(263 70% 58% / 0.12)" }}
                className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 border border-purple-100 hover:border-purple-300 transition-all duration-200 cursor-default"
              >
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{f.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ CTA ══════════════════════════════ */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 purple-gradient-animated" />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }} />
        {/* Glowing orbs */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        <div className="container px-4 md:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 text-white rounded-full px-5 py-2 text-sm font-bold mb-8 border border-white/25 backdrop-blur-sm">
              ✨ Start your journey today — it takes 60 seconds
            </div>

            <h2 className="font-display font-black tracking-tight-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-[0.95]">
              Ready to start your<br />
              <span className="italic font-light">medical journey?</span>
            </h2>

            <p className="text-white/75 text-xl mb-12 max-w-xl mx-auto font-medium">
              Build your complete treatment package — procedure, flights, hotel and insurance in one go.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="h-14 sm:h-16 px-8 sm:px-12 text-lg rounded-2xl bg-white text-purple-700 hover:bg-purple-50 font-black shadow-2xl hover:shadow-white/20 transition-all w-full sm:w-auto"
                  asChild
                >
                  <Link href="/packages">Build My Package →</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 sm:h-16 px-8 sm:px-12 text-lg rounded-2xl text-white border-2 border-white/30 hover:bg-white/10 font-bold backdrop-blur-sm w-full sm:w-auto"
                  asChild
                >
                  <Link href="/clinics">Browse Clinics</Link>
                </Button>
              </motion.div>
            </div>

            <p className="text-white/50 text-sm mt-8">No credit card required · Free to compare · JCI-accredited clinics only</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
