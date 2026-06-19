import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Button } from "./ui/button";
import { LocationModal } from "./location-modal";
import { ChatbotWidget } from "./chatbot-widget";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isAdmin = user?.publicMetadata?.role === "admin" || user?.unsafeMetadata?.role === "admin";

  const navItems = [
    { href: "/treatments", label: "Treatments" },
    { href: "/clinics", label: "Clinics" },
    { href: "/destinations", label: "Destinations" },
    { href: "/packages", label: "Packages" },
    { href: "/dashboard", label: "Dashboard" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <LocationModal />

      {/* ─── Sticky Header ─── */}
      <motion.header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-purple-100/60"
            : "bg-white/80 backdrop-blur-sm border-b border-transparent"
        }`}
        animate={{ height: scrolled ? 60 : 68 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <motion.div
              animate={{ width: scrolled ? 32 : 38, height: scrolled ? 32 : 38 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl purple-gradient flex items-center justify-center text-white font-black shadow-sm group-hover:shadow-md transition-shadow overflow-hidden"
              style={{ fontSize: scrolled ? 15 : 18 }}
            >
              M
            </motion.div>
            <motion.span
              animate={{ fontSize: scrolled ? "1.125rem" : "1.25rem" }}
              transition={{ duration: 0.3 }}
              className="font-black tracking-tight bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent"
            >
              MediBridge
            </motion.span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  location === item.href
                    ? "text-purple-700"
                    : "text-gray-500 hover:text-purple-700"
                }`}
              >
                {location === item.href && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-purple-50 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-gray-500 hover:text-purple-700 font-semibold"
                asChild
              >
                <Link href="/sign-in">Log in</Link>
              </Button>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="sm"
                  className="purple-gradient border-0 shadow-sm hover:shadow-md transition-all rounded-xl font-bold text-sm h-9 px-4"
                >
                  <Link href="/packages">Build Package</Link>
                </Button>
              </motion.div>
            </Show>

            <Show when="signed-in">
              <span className="hidden sm:block text-sm text-gray-400 font-medium max-w-[120px] truncate">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-gray-500 hover:text-purple-700 rounded-xl font-semibold"
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-gray-400 hover:text-gray-600 rounded-xl font-medium"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                Sign out
              </Button>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="sm"
                  className="purple-gradient border-0 shadow-sm hover:shadow-md transition-all rounded-xl font-bold text-sm h-9 px-4"
                >
                  <Link href="/packages">Build Package</Link>
                </Button>
              </motion.div>
            </Show>

            {/* Mobile hamburger */}
            <motion.button
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] text-gray-600 rounded-xl hover:bg-purple-50 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              whileTap={{ scale: 0.92 }}
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22 }}
                className="block w-5 h-[2px] bg-current rounded-full"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.18 }}
                className="block w-5 h-[2px] bg-current rounded-full"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22 }}
                className="block w-5 h-[2px] bg-current rounded-full"
              />
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="md:hidden border-t border-purple-100 bg-white/98 backdrop-blur-md overflow-hidden"
            >
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
                className="px-4 py-3 space-y-1"
              >
                {navItems.map((item) => (
                  <motion.div
                    key={item.href}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
                    }}
                  >
                    <Link
                      href={item.href}
                      className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        location === item.href
                          ? "text-purple-700 bg-purple-50"
                          : "text-gray-600 hover:text-purple-700 hover:bg-purple-50/70"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="flex-1">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-purple-100/60 bg-gradient-to-b from-white to-purple-50/50 pt-16 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl purple-gradient flex items-center justify-center text-white font-black text-base">M</div>
                <span className="text-lg font-black bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent tracking-tight">
                  MediBridge
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Your entire medical journey. One trusted platform. Compare verified hospitals, reserve treatment slots and book travel in one place.
              </p>
            </div>

            {[
              {
                title: "Platform",
                links: [
                  { href: "/treatments", label: "Treatments" },
                  { href: "/clinics", label: "Clinics" },
                  { href: "/destinations", label: "Destinations" },
                  { href: "/packages", label: "Smart Packages" },
                ],
              },
              {
                title: "Company",
                links: ["About Us", "Contact", "Careers", "Trust & Safety"].map((l) => ({ href: "#", label: l })),
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "GDPR", "Cookie Policy"].map((l) => ({ href: "#", label: l })),
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">{title}</h3>
                <ul className="space-y-2.5">
                  {links.map(({ href, label }) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-gray-500 hover:text-purple-700 transition-colors font-medium">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-purple-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400 font-medium">
              &copy; {new Date().getFullYear()} MediBridge Global. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">Helping patients access world-class healthcare abroad</p>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}
