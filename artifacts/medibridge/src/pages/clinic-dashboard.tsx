import { useState, useEffect, useCallback } from "react";
import { Show, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface DoctorProfile {
  id: number;
  name: string;
  clinicId: number;
  walletAddress: string;
}

interface RecordGrantRow {
  id: number;
  status: string;
  recordId: number;
  fileName: string;
  phase: string;
  patientEmail: string;
}

/** Doctor-facing records portal — gated by a real Clerk sign-in, separate from the
 *  clinic-wide shared-password gate, since granting/viewing patient records needs a
 *  real per-doctor identity. */
function DoctorRecordsSection() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">📁</div>
        <h3 className="font-bold text-gray-900">Patient Records</h3>
      </div>
      <Show when="signed-in">
        <DoctorRecordsPortal />
      </Show>
      <Show when="signed-out">
        <DoctorSignIn />
      </Show>
    </div>
  );
}

function DoctorSignIn() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="max-w-sm py-6 text-center mx-auto">
      <p className="text-sm text-gray-500 mb-4">
        Sign in with your VitaVia account to request and view patient records securely.
      </p>
      <Button asChild className="rounded-xl bg-teal-600 hover:bg-teal-700 w-full">
        <a href={`${basePath}/sign-in?redirect_url=${encodeURIComponent(`${basePath}/clinic-dashboard#patient-records`)}`}>
          Sign in
        </a>
      </Button>
    </div>
  );
}

function DoctorRecordsPortal() {
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [grants, setGrants] = useState<RecordGrantRow[]>([]);
  const [requestForm, setRequestForm] = useState({ patientEmail: "", note: "" });
  const [requestLoading, setRequestLoading] = useState(false);
  const [denialBanner, setDenialBanner] = useState<{ fileName: string; message: string } | null>(null);

  const refreshGrants = useCallback(async () => {
    const res = await fetch("/api/record-grants", { credentials: "include" });
    if (res.ok) setGrants(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/doctors/profile", { method: "POST", credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLinkError(data.message || "No doctor profile found for your email.");
          return;
        }
        setDoctor(data);
        void refreshGrants();
      })
      .catch(() => setLinkError("Failed to load your doctor profile."));
  }, [refreshGrants]);

  async function requestAccess() {
    if (!requestForm.patientEmail) {
      toast({ title: "Patient email required", variant: "destructive" });
      return;
    }
    setRequestLoading(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Request failed");
      toast({ title: "Access requested", description: "The patient will see your request in their dashboard." });
      setRequestForm({ patientEmail: "", note: "" });
    } catch (err: any) {
      toast({ title: "Failed to request access", description: err.message, variant: "destructive" });
    } finally {
      setRequestLoading(false);
    }
  }

  async function viewRecord(grant: RecordGrantRow) {
    setDenialBanner(null);
    try {
      const res = await fetch(`/api/records/${grant.recordId}/content`, { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDenialBanner({
          fileName: grant.fileName,
          message: data.message || "Access to this record has been denied.",
        });
        void refreshGrants();
        return;
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (err: any) {
      setDenialBanner({ fileName: grant.fileName, message: "Couldn't load this record. Please try again." });
    }
  }

  if (linkError) {
    return (
      <div className="py-8 text-center max-w-md mx-auto">
        <div className="text-3xl mb-3">🔒</div>
        <p className="text-sm text-gray-600">{linkError}</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center gap-3 text-gray-400 py-8">
        <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
        Loading your doctor profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {denialBanner && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3">
          <span className="text-xl">🚫</span>
          <div>
            <p className="text-sm font-semibold text-red-800">Access denied — {denialBanner.fileName}</p>
            <p className="text-xs text-red-600 mt-0.5">{denialBanner.message}</p>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-3">
        <p className="text-sm font-semibold text-gray-900">Request access to a patient's records</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email"
            placeholder="patient@email.com"
            value={requestForm.patientEmail}
            onChange={(e) => setRequestForm((f) => ({ ...f, patientEmail: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={requestForm.note}
            onChange={(e) => setRequestForm((f) => ({ ...f, note: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
        </div>
        <button
          onClick={requestAccess}
          disabled={requestLoading}
          className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {requestLoading ? "Sending..." : "Request access"}
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Records granted to you</p>
        {grants.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">No records have been granted to you yet.</p>
        ) : (
          <div className="space-y-2">
            {grants.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{g.fileName}</p>
                  <p className="text-xs text-gray-400">{g.patientEmail} · {g.phase}</p>
                </div>
                <button onClick={() => viewRecord(g)} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ClinicSlot {
  id: number;
  treatmentName: string;
  city: string;
  slotsRemaining: number;
  price: number;
  originalPrice: number;
  availability: "high" | "limited" | "critical";
  nextAvailableDate: string;
}

interface ClinicCredential {
  id: number;
  credentialType: string;
  issuingBody: string;
  issueDate: string;
  status: string;
  onChainTxHash?: string;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  license: string;
  verified: boolean;
  onChainTxHash?: string;
}

export default function ClinicDashboard() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<ClinicSlot[]>([]);
  const [credentials, setCredentials] = useState<ClinicCredential[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings] = useState([
    { id: 1, patient: "James Wilson", treatment: "Hair Transplant (FUE)", date: "2026-07-15", status: "confirmed" },
    { id: 2, patient: "Sarah Chen", treatment: "Dental Implants", date: "2026-07-18", status: "pending" },
    { id: 3, patient: "Ahmed Hassan", treatment: "Knee Replacement", date: "2026-07-22", status: "confirmed" },
    { id: 4, patient: "Emma Thompson", treatment: "IVF Treatment", date: "2026-07-25", status: "pending" },
  ]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "slots" | "bookings" | "doctors" | "credentials" | "profile">("overview");
  const [bcLoading, setBcLoading] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: "", specialty: "", license: "", email: "" });

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function apiPost(path: string, body: Record<string, any>) {
    const res = await fetch(`/api${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function addDoctor() {
    if (!doctorForm.name || !doctorForm.license || !doctorForm.email) {
      toast({ title: "Missing info", description: "Name, license, and email are required.", variant: "destructive" });
      return;
    }
    setBcLoading(true);
    try {
      const data = await apiPost("/doctors", {
        clinicId: 1,
        name: doctorForm.name,
        specialty: doctorForm.specialty,
        licenseNumber: doctorForm.license,
        email: doctorForm.email,
        expiryDays: 365,
      });
      const newDoctor: Doctor = {
        id: data.id,
        name: data.name,
        specialty: data.specialty,
        license: data.licenseNumber,
        verified: data.verified,
        onChainTxHash: data.onChainTxHash,
      };
      setDoctors((d) => [...d, newDoctor]);
      setDoctorForm({ name: "", specialty: "", license: "", email: "" });
      setShowAddDoctor(false);
      toast({ title: "Doctor added", description: `${doctorForm.name} has been added and verified. They can now sign in with ${doctorForm.email} to manage patient records.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setBcLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/slots").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/credentials/clinic/1").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([slotData, credData]) => {
      setSlots(slotData as ClinicSlot[]);
      setCredentials(credData as ClinicCredential[]);
      setLoading(false);
    });
  }, []);

  const totalRevenue = bookings.reduce((sum, b) => {
    const slot = slots.find((s) => s.treatmentName === b.treatment);
    return sum + (slot?.price ?? 0);
  }, 0);

  const availabilityBadge = (a: string) => {
    const map: Record<string, string> = {
      high: "bg-green-100 text-green-700",
      limited: "bg-amber-100 text-amber-700",
      critical: "bg-red-100 text-red-700",
    };
    return map[a] ?? "bg-gray-100 text-gray-600";
  };

  const activeSection = typeof window !== "undefined" ? window.location.hash.replace("#", "") || "overview" : "overview";

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Overview Tab */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { label: "Active Slots", value: slots.length.toString(), icon: "📅", color: "from-teal-500 to-teal-600" },
                { label: "Pending Bookings", value: bookings.filter((b) => b.status === "pending").length.toString(), icon: "📋", color: "from-amber-500 to-orange-600" },
                { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length.toString(), icon: "✅", color: "from-emerald-500 to-teal-600" },
                { label: "Revenue", value: `£${totalRevenue.toLocaleString()}`, icon: "💎", color: "from-blue-500 to-indigo-600" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6 flex items-center gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">👥</div>
                  <h3 className="font-bold text-gray-900">Recent Patients</h3>
                </div>
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-teal-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {b.patient[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{b.patient}</p>
                        <p className="text-xs text-gray-400 truncate">{b.treatment}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">📄</div>
                  <h3 className="font-bold text-gray-900">Credential Status</h3>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center gap-3 text-gray-400 py-4">
                      <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : credentials.length === 0 ? (
                    <p className="text-gray-400 text-sm py-2">No credentials on file.</p>
                  ) : (
                    credentials.slice(0, 3).map((c: ClinicCredential) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">🔒</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{c.credentialType}</p>
                          <p className="text-xs text-gray-400 truncate">{c.issuingBody}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          c.status === "anchored" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6 lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">👔</div>
                  <h3 className="font-bold text-gray-900">Verification Actions</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    VCN Active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button onClick={() => setActiveTab("doctors")} disabled={bcLoading} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left disabled:opacity-50 border border-gray-100">
                    <span className="text-lg">👔</span> Add Doctor
                  </button>
                  <button onClick={() => { window.location.hash = "patient-records"; }} disabled={bcLoading} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left disabled:opacity-50 border border-gray-100">
                    <span className="text-lg">📁</span> Patient Records
                  </button>
                  <button onClick={() => { window.location.href = `${basePath}/verify`; }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left border border-gray-100">
                    <span className="text-lg">📜</span> View VCN Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {activeSection === "slots" && (
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">📅</div>
              <h3 className="font-bold text-gray-900">Treatment Slots</h3>
            </div>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-400 py-8">
                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
                Loading slots...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-gray-400 text-sm py-8">No treatment slots available.</p>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-gray-100 hover:bg-teal-50/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{slot.treatmentName}</p>
                      <p className="text-xs text-gray-400">{slot.city} · Next: {slot.nextAvailableDate}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-teal-700">£{slot.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 line-through">£{slot.originalPrice.toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${availabilityBadge(slot.availability)}`}>
                      {slot.slotsRemaining} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeSection === "bookings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">👥</div>
              <h3 className="font-bold text-gray-900">Patient Bookings</h3>
            </div>
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-teal-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {b.patient[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{b.patient}</p>
                    <p className="text-xs text-gray-400">{b.treatment} · {b.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.status}
                  </span>
                  <Button size="sm" variant="outline" className="rounded-xl border-teal-200 text-teal-700 hover:bg-teal-50 text-xs flex-shrink-0">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeSection === "doctors" && (
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">👔</div>
                <h3 className="font-bold text-gray-900">Doctor Management</h3>
              </div>
              <button
                onClick={() => setShowAddDoctor(!showAddDoctor)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                {showAddDoctor ? "Cancel" : "+ Add Doctor"}
              </button>
            </div>

            {showAddDoctor && (
              <div className="mb-6 p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor Name *</label>
                    <input
                      type="text"
                      value={doctorForm.name}
                      onChange={(e) => setDoctorForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Dr. Mehmet Yilmaz"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Specialty</label>
                    <input
                      type="text"
                      value={doctorForm.specialty}
                      onChange={(e) => setDoctorForm((f) => ({ ...f, specialty: e.target.value }))}
                      placeholder="e.g., Hair Transplant"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">License Number *</label>
                    <input
                      type="text"
                      value={doctorForm.license}
                      onChange={(e) => setDoctorForm((f) => ({ ...f, license: e.target.value }))}
                      placeholder="e.g., TR-MED-45231"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="doctor@clinic.com"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Used to sign them in to the Patient Records portal.</p>
                  </div>
                </div>
                <button
                  onClick={addDoctor}
                  disabled={bcLoading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {bcLoading ? "Verifying..." : "Add Doctor & Verify on VCN"}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {doctors.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">👔</div>
                  <p className="text-gray-500 text-sm">No doctors added yet. Add your first doctor to manage their credentials.</p>
                </div>
              ) : (
                doctors.map((d) => (
                  <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-teal-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {d.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.specialty} · License: {d.license}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                      ✓ VCN Verified
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Patient Records Tab */}
        {activeSection === "patient-records" && <DoctorRecordsSection />}

        {/* Credentials Tab */}
        {activeSection === "credentials" && (
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">🔒</div>
              <h3 className="font-bold text-gray-900">Verified Credentials</h3>
            </div>
            {loading ? (
              <div className="flex items-center gap-3 text-gray-400 py-8">
                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
                Loading credentials...
              </div>
            ) : credentials.length === 0 ? (
              <p className="text-gray-400 text-sm py-8">No credentials on file.</p>
            ) : (
              <div className="space-y-3">
                {credentials.map((c: ClinicCredential) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-gray-100 hover:bg-teal-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg flex-shrink-0">🔒</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{c.credentialType}</p>
                      <p className="text-xs text-gray-400">{c.issuingBody} · {c.issueDate}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
                      c.status === "anchored" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {c.status}
                    </span>
                    {c.onChainTxHash && (
                      <span className="text-xs text-gray-400 font-mono">VCN: {c.onChainTxHash.slice(0, 8)}…</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeSection === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">🏥</div>
              <h3 className="font-bold text-gray-900">Clinic Profile</h3>
            </div>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Clinic Name</label>
                <input type="text" defaultValue="Istanbul Aesthetic Center" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <input type="text" defaultValue="Istanbul" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Specialties</label>
                <input type="text" defaultValue="Hair Transplant, Dental, Cosmetic Surgery" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email</label>
                <input type="email" defaultValue="contact@istanbul-aesthetic.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <button onClick={() => toast({ title: "Profile updated", description: "Your clinic profile has been saved." })} className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">
                Save Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
