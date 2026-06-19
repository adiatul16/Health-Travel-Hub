import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

const CLINIC_EMAIL = "clinic@medibridge.com";
const CLINIC_PASSWORD = "clinic2025";

export default function ClinicLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === CLINIC_EMAIL && password === CLINIC_PASSWORD) {
      sessionStorage.setItem("mb_clinic", "1");
      setLocation("/clinic-dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-purple-100 p-8"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl purple-gradient flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
            🏥
          </div>
          <h2 className="text-xl font-bold text-gray-900">Clinic Portal</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your listings and appointments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="clinic@medibridge.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-purple-100 bg-purple-50/30 px-4 py-2.5 text-sm text-gray-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="Enter password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-purple-600 text-white font-semibold py-2.5 hover:bg-purple-700 transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          MediBridge Global Clinic Portal
        </p>
      </motion.div>
    </div>
  );
}
