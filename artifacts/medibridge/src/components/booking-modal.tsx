import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSubmitContact } from "@workspace/api-client-react";
import type { PackageOption } from "@workspace/api-client-react";

interface BookingModalProps {
  pkg: PackageOption | null;
  onClose: () => void;
}

export function BookingModal({ pkg, onClose }: BookingModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitContact = useSubmitContact();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;
    submitContact.mutate(
      {
        data: {
          name,
          email,
          phone,
          procedure: pkg.procedure,
          destination: "Istanbul",
          budget: pkg.total,
          preferredContact: "email",
          message: `Package reservation request for ${pkg.procedure} at ${pkg.clinicName}. Total: £${pkg.total.toLocaleString()}.`,
        },
      },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {!submitted ? (
            <>
              <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-5 text-white">
                <h2 className="text-xl font-bold">Reserve Your Package</h2>
                {pkg && (
                  <p className="text-sky-100 text-sm mt-1">
                    {pkg.procedure} at {pkg.clinicName} — £{pkg.total.toLocaleString()}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    data-testid="booking-name"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="booking-email"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900000"
                    data-testid="booking-phone"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-700">
                  A VitaVia patient coordinator will contact you within 2 hours to confirm your package and answer any questions.
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitContact.isPending}
                    data-testid="booking-submit"
                  >
                    {submitContact.isPending ? "Sending..." : "Reserve Now"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl font-bold">✓</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Reservation Confirmed</h3>
              <p className="text-slate-500 text-sm mb-6">
                Your request has been received. A patient coordinator will contact you within 2 hours to finalise your booking.
              </p>
              <Button className="w-full" onClick={onClose} data-testid="booking-done">
                Close
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
