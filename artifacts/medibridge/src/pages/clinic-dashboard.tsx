import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ensureAmoyNetwork,
  getConnectedAddress,
  verifyDoctor,
  addRecord,
  sha256,
  getReviewCount,
  isClinicVerified,
} from "@workspace/blockchain";

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

export default function ClinicDashboard() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<ClinicSlot[]>([]);
  const [credentials, setCredentials] = useState<ClinicCredential[]>([]);
  const [bookings] = useState([
    { id: 1, patient: "James Wilson", treatment: "Hair Transplant (FUE)", date: "2026-07-15", status: "confirmed" },
    { id: 2, patient: "Sarah Chen", treatment: "Dental Implants", date: "2026-07-18", status: "pending" },
    { id: 3, patient: "Ahmed Hassan", treatment: "Knee Replacement", date: "2026-07-22", status: "confirmed" },
    { id: 4, patient: "Emma Thompson", treatment: "IVF Treatment", date: "2026-07-25", status: "pending" },
  ]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "slots" | "bookings" | "credentials">("overview");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [bcLoading, setBcLoading] = useState(false);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function connectWallet() {
    try {
      await ensureAmoyNetwork();
      const addr = await getConnectedAddress();
      if (addr) {
        setWalletAddress(addr);
        toast({ title: "Wallet connected", description: `${addr.slice(0, 10)}…${addr.slice(-6)}` });
      } else {
        toast({ title: "Wallet not found", description: "Please unlock MetaMask and try again.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    }
  }

  async function registerDoctor() {
    setBcLoading(true);
    try {
      await ensureAmoyNetwork();
      const doctorAddr = prompt("Doctor wallet address (0x...)")?.trim();
      const license = prompt("License number (e.g., GMC-123456)")?.trim();
      if (!doctorAddr || !license) { setBcLoading(false); return; }
      const tx = await verifyDoctor(doctorAddr, walletAddress ?? "0x0000000000000000000000000000000000000000", license, 365);
      toast({ title: "Doctor verified", description: `TX: ${tx.slice(0, 10)}…` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setBcLoading(false);
    }
  }

  async function addRecordHash() {
    setBcLoading(true);
    try {
      await ensureAmoyNetwork();
      const ref = prompt("Reference for this record (e.g., 'MRI scan result')");
      if (!ref) { setBcLoading(false); return; }
      const hash = await sha256(ref + Date.now().toString());
      const tx = await addRecord(hash, ref, "clinic");
      toast({ title: "Record anchored", description: `TX: ${tx.slice(0, 10)}…` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setBcLoading(false);
    }
  }

  async function checkStatus() {
    if (!walletAddress) { toast({ title: "No wallet", description: "Connect wallet first", variant: "destructive" }); return; }
    try {
      const verified = await isClinicVerified(walletAddress);
      const count = await getReviewCount(walletAddress);
      setIsVerified(verified);
      setReviewCount(Number(count));
      toast({ title: "Status updated", description: `Verified: ${verified ? "Yes" : "No"} · Reviews: ${count}` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
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

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["overview", "slots", "bookings", "credentials"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 hover:bg-teal-50 border border-teal-100"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "slots" && "Treatment Slots"}
              {tab === "bookings" && "Patient Bookings"}
              {tab === "credentials" && "Credentials"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { label: "Active Slots", value: slots.length.toString(), icon: "📅", color: "from-teal-500 to-teal-600" },
                { label: "Pending Bookings", value: bookings.filter((b) => b.status === "pending").length.toString(), icon: "📋", color: "from-amber-500 to-orange-600" },
                { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length.toString(), icon: "✅", color: "from-emerald-500 to-teal-600" },
                { label: "Revenue", value: `\u00a3${totalRevenue.toLocaleString()}`, icon: "💎", color: "from-blue-500 to-indigo-600" },
              ].map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl shadow-sm border border-teal-100 p-4 sm:p-6 flex items-center gap-4"
                >
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
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-lg">⛓️</div>
                  <h3 className="font-bold text-gray-900">Blockchain Actions</h3>
                  {isVerified === true && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button onClick={connectWallet} disabled={bcLoading} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left disabled:opacity-50 border border-gray-100">
                    <span className="text-lg">🔗</span>
                    {walletAddress ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}` : "Connect Wallet"}
                  </button>
                  <button onClick={registerDoctor} disabled={bcLoading} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left disabled:opacity-50 border border-gray-100">
                    <span className="text-lg">🩺</span> Register Doctor
                  </button>
                  <button onClick={addRecordHash} disabled={bcLoading} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left disabled:opacity-50 border border-gray-100">
                    <span className="text-lg">📁</span> Add Record Hash
                  </button>
                  <button onClick={checkStatus} disabled={bcLoading} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left disabled:opacity-50 border border-gray-100">
                    <span className="text-lg">🔍</span> Check Status
                  </button>
                  <button onClick={() => { window.location.href = `${basePath}/verify`; }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 transition-colors text-left border border-gray-100">
                    <span className="text-lg">📜</span> View Ledger
                  </button>
                </div>
                {reviewCount !== null && (
                  <p className="text-xs text-gray-400 mt-3">On-chain reviews: {reviewCount}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {activeTab === "slots" && (
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
        {activeTab === "bookings" && (
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

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
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
                      <span className="text-xs text-gray-400 font-mono">TX: {c.onChainTxHash.slice(0, 8)}…</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
