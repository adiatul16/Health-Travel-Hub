import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";

/* ─── Shared Types ─── */
interface PortalShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  userName: string;
  userRole: string;
  avatar: string;
  logoEmoji: string;
  signOutKey: string;
  signOutRedirect: string;
  accent: string;
  bgMain: string;
  bgSidebar: string;
  sidebarText: string;
  sidebarTextMuted: string;
  activeBg: string;
  activeText: string;
  hoverBg: string;
  headerGradient: string;
  iconBg: string;
  items: { label: string; icon: string; href: string; section: string }[];
  sections: { label: string; icon: string; id: string }[];
}

/* ─── Generic Sidebar Nav ─── */
function SidebarNav({
  items,
  sections,
  activeSection,
  setSection,
  bgSidebar,
  sidebarText,
  sidebarTextMuted,
  activeBg,
  activeText,
  hoverBg,
  logoEmoji,
  title,
  collapsed,
  setCollapsed,
}: {
  items: PortalShellProps["items"];
  sections: PortalShellProps["sections"];
  activeSection: string;
  setSection: (s: string) => void;
  bgSidebar: string;
  sidebarText: string;
  sidebarTextMuted: string;
  activeBg: string;
  activeText: string;
  hoverBg: string;
  logoEmoji: string;
  title: string;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside
      className={`${bgSidebar} ${sidebarText} h-[100dvh] flex flex-col transition-all duration-300 ease-in-out z-40 fixed lg:relative ${
        collapsed ? "w-0 lg:w-20 overflow-hidden" : "w-64"
      }`}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 flex-shrink-0">
        <span className="text-2xl flex-shrink-0">{logoEmoji}</span>
        {!collapsed && <span className="font-bold text-sm tracking-tight">{title}</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = item.section === activeSection;
          return (
            <button
              key={item.section}
              onClick={() => {
                setSection(item.section);
                window.location.hash = item.section;
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                isActive ? `${activeBg} ${activeText}` : `${sidebarTextMuted} ${hoverBg}`
              }`}
            >
              <span className="text-lg flex-shrink-0 w-6 text-center">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Sections divider */}
        {sections.length > 0 && !collapsed && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">
              Sections
            </p>
            {sections.map((sec) => {
              const isActive = sec.id === activeSection;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSection(sec.id);
                    window.location.hash = sec.id;
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive ? `${activeBg} ${activeText}` : `${sidebarTextMuted} ${hoverBg}`
                  }`}
                >
                  <span className="text-lg flex-shrink-0 w-6 text-center">{sec.icon}</span>
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom: Collapse toggle */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${sidebarTextMuted} ${hoverBg}`}
        >
          <span className="text-base">{collapsed ? "→" : "←"}</span>
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

/* ─── Generic Portal Shell ─── */
function PortalShellInternal(props: PortalShellProps) {
  const { children, userName, userRole, avatar, subtitle, accent, bgMain, headerGradient, iconBg, signOutKey, signOutRedirect } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    return hash || (props.items[0]?.section ?? "overview");
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveSection(hash);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <div className={`flex h-[100dvh] overflow-hidden ${bgMain}`}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <SidebarNav
          {...props}
          activeSection={activeSection}
          setSection={setActiveSection}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarNav
              {...props}
              activeSection={activeSection}
              setSection={(s) => {
                setActiveSection(s);
                setMobileOpen(false);
              }}
              collapsed={false}
              setCollapsed={() => {}}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className={`h-16 flex-shrink-0 ${headerGradient} flex items-center justify-between px-4 lg:px-6 border-b`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white/60">{userRole}</p>
              <p className="text-sm font-semibold text-white">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-white">
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center text-sm font-bold`}>
                {avatar}
              </div>
              <span className="text-sm font-medium">{userName}</span>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem(signOutKey);
                window.location.href = signOutRedirect;
              }}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain">
          {children}
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PATIENT PORTAL — Warm, caring, navy
   ════════════════════════════════════════════════════════════════ */
export function PatientPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellInternal
      children={children}
      title="VitaVia"
      subtitle="Your Medical Journey"
      userName="Patient"
      userRole="Patient Portal"
      avatar="P"
      logoEmoji="🩺"
      signOutKey=""
      signOutRedirect="/"
      accent="navy"
      bgMain="bg-[#F4F7FA]"
      bgSidebar="bg-gradient-to-b from-[#1E293B] to-[#0F4C81]"
      sidebarText="text-white"
      sidebarTextMuted="text-[#B0C4DE]/70 hover:text-white"
      activeBg="bg-[#0F4C81]"
      activeText="text-white"
      hoverBg="hover:bg-white/10"
      headerGradient="bg-gradient-to-r from-[#0F4C81] to-[#1E293B]"
      iconBg="bg-white/20"
      items={[
        { label: "Journey", icon: "🏥", href: "#overview", section: "overview" },
        { label: "Bookings", icon: "📋", href: "#bookings", section: "bookings" },
        { label: "Travel", icon: "✈️", href: "#travel", section: "travel" },
        { label: "Recovery", icon: "❤️", href: "#recovery", section: "recovery" },
        { label: "Messages", icon: "💬", href: "#messages", section: "messages" },
        { label: "Settings", icon: "⚙️", href: "#settings", section: "settings" },
      ]}
      sections={[
        { label: "Overview", icon: "📊", id: "overview" },
        { label: "Bookings", icon: "📋", id: "bookings" },
        { label: "Travel", icon: "✈️", id: "travel" },
        { label: "Recovery", icon: "❤️", id: "recovery" },
        { label: "Messages", icon: "💬", id: "messages" },
        { label: "Settings", icon: "⚙️", id: "settings" },
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   CLINIC PORTAL — Professional, teal, medical
   ════════════════════════════════════════════════════════════════ */
export function ClinicPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellInternal
      children={children}
      title="VitaVia Clinic"
      subtitle="Partner Dashboard"
      userName="Clinic Partner"
      userRole="Clinic Portal"
      avatar="C"
      logoEmoji="🏥"
      signOutKey="mb_clinic"
      signOutRedirect="/"
      accent="teal"
      bgMain="bg-teal-50"
      bgSidebar="bg-gradient-to-b from-teal-700 to-teal-900"
      sidebarText="text-white"
      sidebarTextMuted="text-teal-200/70 hover:text-white"
      activeBg="bg-teal-600"
      activeText="text-white"
      hoverBg="hover:bg-white/10"
      headerGradient="bg-gradient-to-r from-teal-700 to-teal-800"
      iconBg="bg-white/20"
      items={[
        { label: "Overview", icon: "📊", href: "#overview", section: "overview" },
        { label: "Slots", icon: "📅", href: "#slots", section: "slots" },
        { label: "Bookings", icon: "👥", href: "#bookings", section: "bookings" },
        { label: "Credentials", icon: "🔒", href: "#credentials", section: "credentials" },
        { label: "Profile", icon: "🏥", href: "#profile", section: "profile" },
      ]}
      sections={[
        { label: "Overview", icon: "📊", id: "overview" },
        { label: "Slots", icon: "📅", id: "slots" },
        { label: "Bookings", icon: "👥", id: "bookings" },
        { label: "Credentials", icon: "🔒", id: "credentials" },
        { label: "Profile", icon: "🏥", id: "profile" },
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN PORTAL — Dark, serious, slate
   ════════════════════════════════════════════════════════════════ */
export function AdminPortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellInternal
      children={children}
      title="VitaVia Admin"
      subtitle="Admin Console"
      userName="Administrator"
      userRole="Admin Portal"
      avatar="A"
      logoEmoji="🛡️"
      signOutKey="mb_admin"
      signOutRedirect="/"
      accent="slate"
      bgMain="bg-slate-50"
      bgSidebar="bg-gradient-to-b from-slate-900 to-slate-950"
      sidebarText="text-slate-100"
      sidebarTextMuted="text-slate-400 hover:text-slate-100"
      activeBg="bg-slate-700"
      activeText="text-white"
      hoverBg="hover:bg-white/5"
      headerGradient="bg-gradient-to-r from-slate-800 to-slate-900"
      iconBg="bg-white/10"
      items={[
        { label: "Overview", icon: "📊", href: "#overview", section: "overview" },
        { label: "Bookings", icon: "📋", href: "#bookings", section: "bookings" },
        { label: "Credentials", icon: "⛓️", href: "#credentials", section: "credentials" },
        { label: "Clinics", icon: "🏥", href: "#clinics", section: "clinics" },
        { label: "Affiliates", icon: "🔗", href: "#affiliates", section: "affiliates" },
        { label: "Settings", icon: "⚙️", href: "#settings", section: "settings" },
      ]}
      sections={[
        { label: "Overview", icon: "📊", id: "overview" },
        { label: "Bookings", icon: "📋", id: "bookings" },
        { label: "Credentials", icon: "⛓️", id: "credentials" },
        { label: "Clinics", icon: "🏥", id: "clinics" },
        { label: "Affiliates", icon: "🔗", id: "affiliates" },
        { label: "Settings", icon: "⚙️", id: "settings" },
      ]}
    />
  );
}
