import { Link, useLocation } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Button } from "./ui/button";
import { LocationModal } from "./location-modal";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

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

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              MediBridge
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <Button variant="outline" className="hidden sm:inline-flex" asChild>
                <Link href="/sign-in">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/packages">Build Package</Link>
              </Button>
            </Show>

            <Show when="signed-in">
              <span className="hidden sm:block text-sm text-muted-foreground">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <Button variant="outline" className="hidden sm:inline-flex" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-muted-foreground"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                Sign out
              </Button>
              <Button asChild>
                <Link href="/packages">Build Package</Link>
              </Button>
            </Show>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/40 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                M
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                MediBridge
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your entire medical journey. One trusted platform. Compare verified hospitals, reserve treatment slots and book travel in one place.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/treatments" className="hover:text-primary">Treatments</Link></li>
              <li><Link href="/clinics" className="hover:text-primary">Clinics</Link></li>
              <li><Link href="/destinations" className="hover:text-primary">Destinations</Link></li>
              <li><Link href="/packages" className="hover:text-primary">Smart Packages</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary">Contact</Link></li>
              <li><Link href="#" className="hover:text-primary">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary">Trust and Safety</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary">GDPR</Link></li>
              <li><Link href="#" className="hover:text-primary">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MediBridge Global. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
