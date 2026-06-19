import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ADMIN_TOKEN_KEY = "mb_admin_token";

export async function verifyAdminToken(): Promise<boolean> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return false;
  try {
    const res = await fetch("/api/admin-auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        toast({
          title: "Welcome, Administrator",
          description: "You have successfully signed in.",
        });
        setLocation("/admin");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl purple-gradient flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Portal</h1>
          <p className="text-gray-500 text-sm">MediBridge Global — Authorized personnel only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg">🔐</div>
            <div>
              <h2 className="font-semibold text-gray-900">Secure Login</h2>
              <p className="text-xs text-gray-400">Password-protected admin access</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@medibridge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-purple-100 bg-purple-50/30 focus:border-purple-400 h-11"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-gray-700 font-medium">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-purple-100 bg-purple-50/30 focus:border-purple-400 h-11"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in to Admin"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <a
              href="/"
              className="text-sm text-purple-600 font-medium hover:text-purple-800 transition-colors"
            >
              ← Back to MediBridge
            </a>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          This portal is restricted to authorized MediBridge administrators.
          All access attempts are logged.
        </p>
      </motion.div>
    </div>
  );
}
