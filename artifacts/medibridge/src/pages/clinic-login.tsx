import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const CLINIC_EMAIL = "clinic@vitavia.com";
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
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-[#E5E7EB] p-8"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-3">
            <img src={`${basePath}/logo-vitavia.png`} alt="VitaVia" className="w-full h-full object-contain" />
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
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F4F7FA]/30 px-4 py-2.5 text-sm text-gray-900 focus:border-[#1F7A8C] focus:outline-none focus:ring-2 focus:ring-[#B0C4DE]"
              placeholder="clinic@vitavia.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F4F7FA]/30 px-4 py-2.5 text-sm text-gray-900 focus:border-[#1F7A8C] focus:outline-none focus:ring-2 focus:ring-[#B0C4DE]"
              placeholder="Enter password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#0F4C81] text-white font-semibold py-2.5 hover:bg-[#1F7A8C] transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          VitaVia Clinic Portal
        </p>
      </motion.div>
    </div>
  );
}
