import { useLocation } from "wouter";

const options = [
  { label: "Patient Login", icon: "👥", desc: "Book treatments & manage trips", href: "/sign-in" },
  { label: "Clinic Portal", icon: "🏥", desc: "Manage listings & appointments", href: "/clinic-login" },
  { label: "Admin Console", icon: "⚙️", desc: "Platform analytics & approvals", href: "/admin-login" },
];

export function LoginDropdown({ compact = false }: { compact?: boolean }) {
  const [, setLocation] = useLocation();

  return (
    <div className={`relative inline-block z-[60] group/dropdown ${compact ? "" : "mb-10 sm:mb-14"}`}>
      <button className={`flex items-center gap-2 rounded-2xl purple-gradient-animated border-0 shadow-lg hover:shadow-xl transition-all font-bold text-white hover:scale-[1.03] active:scale-[0.97] ${compact ? "h-9 px-3 text-sm" : "h-12 sm:h-14 px-6 sm:px-10 text-base"}`}>
        <span>Log In</span>
        <svg className={`transition-transform group-hover/dropdown:rotate-180 ${compact ? "w-3 h-3" : "w-4 h-4"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Bridge gap so hover isn't lost crossing from button to menu */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-40 h-3 bg-transparent z-[70] opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible" />
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden z-[70] opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setLocation(opt.href)}
            className="flex items-center gap-3 w-full px-5 py-4 hover:bg-purple-50 transition-colors text-left"
          >
            <span className="text-2xl">{opt.icon}</span>
            <div>
              <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
