import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const LOCATIONS = [
  { id: "uk", label: "United Kingdom", flag: "🇬🇧", desc: "NHS waiting lists? Explore affordable alternatives." },
  { id: "europe", label: "Europe", flag: "🇪🇺", desc: "Quality care at a fraction of European prices." },
  { id: "worldwide", label: "Worldwide", flag: "🌍", desc: "Global access to verified clinics and treatments." },
];

export function LocationModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [pathname] = useLocation();

  useEffect(() => {
    // Don't show on homepage — the hero already has an inline location picker
    if (pathname === "/" || pathname === "") return;
    const seen = sessionStorage.getItem("mb_location_set");
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 1800);
      return () => clearTimeout(timer);
    }
    return;
  }, [pathname]);

  const handleConfirm = () => {
    if (selected) {
      sessionStorage.setItem("mb_location_set", selected);
      sessionStorage.setItem("mb_user_location", selected);
      setOpen(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("mb_location_set", "skipped");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="purple-gradient px-6 py-5 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10">
                  <div className="text-2xl mb-1">👋</div>
                  <h2 className="text-xl font-bold">Where are you based?</h2>
                  <p className="text-[#E5E7EB] text-sm mt-1">
                    We personalise treatment options and savings based on your location.
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setSelected(loc.id)}
                    data-testid={`location-${loc.id}`}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                      selected === loc.id
                        ? "border-[#0F4C81] bg-[#F4F7FA]"
                        : "border-gray-200 hover:border-[#B0C4DE] hover:bg-[#F4F7FA]/40"
                    }`}
                  >
                    <span className="text-3xl">{loc.flag}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{loc.label}</div>
                      <div className="text-sm text-gray-500">{loc.desc}</div>
                    </div>
                    {selected === loc.id && (
                      <div className="w-5 h-5 rounded-full purple-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="px-5 pb-5 space-y-2">
                <Button
                  className="w-full purple-gradient border-0 font-semibold rounded-xl"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={!selected}
                  data-testid="location-confirm"
                >
                  Personalise My Results
                </Button>
                <button
                  onClick={handleSkip}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
                  data-testid="location-skip"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
