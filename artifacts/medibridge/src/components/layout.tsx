import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Button } from "./ui/button";
import { LocationModal } from "./location-modal";
import { ChatbotWidget } from "./chatbot-widget";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/treatments", label: "Treatments" },
    { href: "/clinics", label: "Clinics" },
    { href: "/destinations", label: "Destinations" },
    { href: "/packages", label: "Packages" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <LocationModal />

      <header className="sticky top-0 z-50 w-full border-b border-purple-100/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl purple-gradient flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
              M
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">
              MediBridge
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === item.href
                    ? "text-purple-700 bg-purple-50"
                    : "text-gray-600 hover:text-purple-700 hover:bg-purple-50/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <Button variant="ghost" className="hidden sm:inline-flex text-gray-600 hover:text-purple-700" asChild>
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button asChild className="purple-gradient border-0 shadow-sm hover:opacity-90 transition-opacity rounded-xl">
                <Link href="/packages">Build Package</Link>
              </Button>
            </Show>

            <Show when="signed-in">
              <span className="hidden sm:block text-sm text-gray-500">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <Button variant="ghost" className="hidden sm:inline-flex text-gray-600 hover:text-purple-700 rounded-xl" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-gray-500 hover:text-gray-700 rounded-xl"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                Sign out
              </Button>
              <Button asChild className="purple-gradient border-0 shadow-sm hover:opacity-90 transition-opacity rounded-xl">
                <Link href="/packages">Build Package</Link>
              </Button>
            </Show>

            <button
              className="md:hidden w-9 h-9 flex items-center justify-center text-gray-600 rounded-lg hover:bg-purple-50"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-purple-100 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location === item.href
                    ? "text-purple-700 bg-purple-50"
                    : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-purple-100 bg-gradient-to-b from-white to-purple-50/40 py-14">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl purple-gradient flex items-center justify-center text-white font-bold text-sm">M</div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">MediBridge</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Your entire medical journey. One trusted platform. Compare verified hospitals, reserve treatment slots and book travel in one place.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Platform</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {[
                { href: "/treatments", label: "Treatments" },
                { href: "/clinics", label: "Clinics" },
                { href: "/destinations", label: "Destinations" },
                { href: "/packages", label: "Smart Packages" },
              ].map(({ href, label }) => (
                <li key={label}><Link href={href} className="hover:text-purple-700 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Company</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {["About Us", "Contact", "Careers", "Trust and Safety"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-purple-700 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Legal</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {["Privacy Policy", "Terms of Service", "GDPR", "Cookie Policy"].map((item) => (
                <li key={item}><Link href="#" className="hover:text-purple-700 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-10 pt-6 border-t border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} MediBridge Global. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">Helping UK patients access world-class healthcare abroad</p>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}
