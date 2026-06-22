import { useGetAdminMetrics, useListClinics } from "@workspace/api-client-react";
import { useState, useEffect, useCallback } from "react";
import {
  ensureAmoyNetwork,
  getConnectedAddress,
  verifyClinic,
  txUrl,
  addressUrl,
} from "@workspace/blockchain";

function KPICard({
  label,
  value,
  icon,
  trend,
  trendUp,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-300"
    >
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${accent} opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-full`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-xl shadow-sm`}>
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function RevenueBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">£{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-400">{pct}% of total</div>
    </div>
  );
}

interface AdminCredential {
  id: number;
  clinicId: number;
  clinicName: string | null;
  credentialType: string;
  issuingBody: string;
  issueDate: string;
  documentName: string | null;
  documentHash: string | null;
  onChainTxHash: string | null;
  onChainTimestamp: string | null;
  status: string;
  adminNotes: string | null;
  submittedAt: string;
  anchoredAt: string | null;
  polygonScanUrl: string | null;
  blockchainConfigured: boolean;
}

const CREDENTIAL_TYPES = [
  "JCI Accreditation",
  "Board Certification",
  "Procedure Outcomes Report",
  "ISO Certification",
  "Medical Council Registration",
  "Hospital Accreditation",
  "Quality Management Certificate",
  "Other",
];

function CredentialQueueSection() {
  const { data: clinics } = useListClinics();
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "add" | "anchored">("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id: number; type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    clinicId: "",
    credentialType: CREDENTIAL_TYPES[0],
    issuingBody: "",
    issueDate: "",
    documentName: "",
    documentHash: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/credentials");
      if (res.ok) setCredentials(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchCredentials(); }, [fetchCredentials]);

  const approve = async (id: number) => {
    setActionLoading(id);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/credentials/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg({ id, type: "err", text: data.error ?? "Failed to anchor" });
      } else {
        setActionMsg({ id, type: "ok", text: `Anchored! TX: ${(data.onChainTxHash as string).slice(0, 10)}…` });
        await fetchCredentials();
      }
    } catch {
      setActionMsg({ id, type: "err", text: "Network error" });
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: number) => {
    setActionLoading(id);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/credentials/${id}/reject`, { method: "POST" });
      if (res.ok) await fetchCredentials();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const remove = async (id: number) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/credentials/${id}`, { method: "DELETE" });
      await fetchCredentials();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const submit = async () => {
    if (!form.clinicId || !form.issuingBody || !form.issueDate) {
      setFormMsg({ type: "err", text: "Clinic, issuing body, and issue date are required." });
      return;
    }
    setFormLoading(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: parseInt(form.clinicId),
          credentialType: form.credentialType,
          issuingBody: form.issuingBody,
          issueDate: form.issueDate,
          documentName: form.documentName || undefined,
          documentHash: form.documentHash || undefined,
        }),
      });
      if (res.ok) {
        setFormMsg({ type: "ok", text: "Credential added and queued for approval." });
        setForm({ clinicId: "", credentialType: CREDENTIAL_TYPES[0], issuingBody: "", issueDate: "", documentName: "", documentHash: "" });
        await fetchCredentials();
        setTab("pending");
      } else {
        const d = await res.json();
        setFormMsg({ type: "err", text: d.error ?? "Failed to create" });
      }
    } catch {
      setFormMsg({ type: "err", text: "Network error" });
    } finally {
      setFormLoading(false);
    }
  };

  const pending = credentials.filter((c) => c.status === "pending");
  const anchored = credentials.filter((c) => c.status === "anchored");
  const rejected = credentials.filter((c) => c.status === "rejected");
  const blockchainReady = credentials[0]?.blockchainConfigured ?? false;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">⛓️</div>
          <div>
            <h3 className="font-bold text-gray-900">Credential Approvals</h3>
            <p className="text-xs text-gray-400">Review and anchor clinic credentials on-chain</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.length} pending
            </span>
          )}
          {blockchainReady ? (
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Polygon connected
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
              Blockchain not configured
            </span>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-100">
        {(["pending", "add", "anchored"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? "border-slate-700 text-slate-700"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {t === "pending" ? `Pending (${pending.length})` : t === "add" ? "Add Credential" : `Anchored (${anchored.length})`}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "pending" && (
          <div>
            {!blockchainReady && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Blockchain not configured</p>
                <p className="text-xs">
                  To anchor credentials on Polygon Amoy, add these to Replit Secrets:
                  <br />
                  <code className="font-mono">POLYGON_PRIVATE_KEY</code> — your wallet's private key
                  <br />
                  <code className="font-mono">CREDENTIAL_CONTRACT_ADDRESS</code> — address after running the deploy script
                </p>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-50 animate-pulse" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-gray-500 text-sm">No pending credentials. Use "Add Credential" to queue one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((c) => (
                  <div key={c.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{c.credentialType}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {c.clinicName ?? `Clinic #${c.clinicId}`} · {c.issuingBody} · Issued {c.issueDate}
                        </div>
                        {c.documentHash && (
                          <div className="text-xs font-mono text-gray-400 mt-1 truncate max-w-xs">
                            Hash: {c.documentHash.slice(0, 18)}…
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Pending
                      </span>
                    </div>

                    {actionMsg?.id === c.id && (
                      <div className={`mb-3 text-xs px-3 py-2 rounded-lg ${
                        actionMsg.type === "ok"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {actionMsg.text}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(c.id)}
                        disabled={actionLoading === c.id || !c.documentHash}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        title={!c.documentHash ? "No document hash to anchor" : ""}
                      >
                        {actionLoading === c.id ? "Anchoring…" : "⛓️ Approve & Anchor"}
                      </button>
                      <button
                        onClick={() => reject(c.id)}
                        disabled={actionLoading === c.id}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        disabled={actionLoading === c.id}
                        className="px-3 py-2 rounded-lg border border-red-100 text-red-400 text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rejected.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rejected ({rejected.length})</p>
                <div className="space-y-2">
                  {rejected.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-4 border border-red-100 rounded-lg px-4 py-2.5">
                      <div>
                        <div className="text-sm font-medium text-gray-700">{c.credentialType}</div>
                        <div className="text-xs text-gray-400">{c.clinicName} · {c.issuingBody}</div>
                      </div>
                      <button onClick={() => remove(c.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <div className="max-w-lg space-y-4">
            <p className="text-sm text-gray-500">Add a credential for a clinic. It will sit in "Pending" until you approve and anchor it on-chain.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Clinic *</label>
                <select
                  value={form.clinicId}
                  onChange={(e) => setForm((f) => ({ ...f, clinicId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="">Select a clinic…</option>
                  {clinics?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Credential Type *</label>
                <select
                  value={form.credentialType}
                  onChange={(e) => setForm((f) => ({ ...f, credentialType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {CREDENTIAL_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Issuing Body *</label>
                <input
                  type="text"
                  value={form.issuingBody}
                  onChange={(e) => setForm((f) => ({ ...f, issuingBody: e.target.value }))}
                  placeholder="e.g. Joint Commission International"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date *</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Document Name</label>
                <input
                  type="text"
                  value={form.documentName}
                  onChange={(e) => setForm((f) => ({ ...f, documentName: e.target.value }))}
                  placeholder="e.g. JCI_Certificate_2024.pdf"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Document Hash (SHA-256)</label>
                <input
                  type="text"
                  value={form.documentHash}
                  onChange={(e) => setForm((f) => ({ ...f, documentHash: e.target.value }))}
                  placeholder="0x…64-character hex hash of the document"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Compute with: <code className="font-mono">sha256sum document.pdf</code> on Linux/Mac, or use an online SHA-256 tool.
                  Only the hash is stored on-chain — never the document.
                </p>
              </div>
            </div>
            {formMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg ${
                formMsg.type === "ok"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {formMsg.text}
              </div>
            )}
            <button
              onClick={submit}
              disabled={formLoading}
              className="w-full py-2.5 rounded-xl bg-slate-700 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {formLoading ? "Adding…" : "Add to Queue"}
            </button>
          </div>
        )}

        {tab === "anchored" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-50 animate-pulse" />)}
              </div>
            ) : anchored.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">⛓️</div>
                <p className="text-gray-500 text-sm">No credentials anchored yet. Approve a pending item to anchor it on Polygon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {anchored.map((c) => (
                  <div key={c.id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{c.credentialType}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{c.clinicName ?? `Clinic #${c.clinicId}`} · {c.issuingBody}</div>
                        {c.documentHash && (
                          <div className="text-xs font-mono text-gray-400 mt-1 truncate max-w-xs">{c.documentHash.slice(0, 20)}…</div>
                        )}
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">⛓️ Anchored</span>
                    </div>
                    {c.polygonScanUrl && (
                      <a href={c.polygonScanUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:underline">
                        View on PolygonScan ↗
                      </a>
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

export default function Admin() {
  const { data: metrics, isLoading } = useGetAdminMetrics();
  const [adminWallet, setAdminWallet] = useState<string | null>(null);
  const [bcLoading, setBcLoading] = useState(false);
  const [bcMsg, setBcMsg] = useState<string | null>(null);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function connectAdminWallet() {
    try {
      await ensureAmoyNetwork();
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0] ?? (await getConnectedAddress());
      if (addr) {
        setAdminWallet(addr);
        setBcMsg(`Connected: ${addr.slice(0, 8)}…${addr.slice(-6)}`);
      }
    } catch (err: any) {
      setBcMsg(`Error: ${err.message}`);
    }
  }

  async function verifyClinicOnChain() {
    setBcLoading(true);
    setBcMsg(null);
    try {
      await ensureAmoyNetwork();
      const clinicAddr = prompt("Clinic wallet address (0x...)")?.trim();
      const name = prompt("Clinic name")?.trim();
      const accreditation = prompt("Accreditation (e.g., JCI)")?.trim();
      if (!clinicAddr || !name || !accreditation) { setBcLoading(false); return; }
      const tx = await verifyClinic(clinicAddr, name, accreditation, 365);
      setBcMsg(`Verified! TX: ${tx.slice(0, 10)}…`);
    } catch (err: any) {
      setBcMsg(`Failed: ${err.message}`);
    } finally {
      setBcLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading admin console...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = (metrics?.treatmentRevenue || 0) + (metrics?.hotelRevenue || 0) + (metrics?.insuranceRevenue || 0);

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Revenue banner */}
        <div
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
        >
          <div>
            <p className="text-slate-300 text-sm">Total Platform Revenue</p>
            <p className="text-3xl font-bold text-white mt-1">£{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-px h-12 bg-white/20 hidden sm:block" />
          <div>
            <p className="text-slate-300 text-sm">Conversion Rate</p>
            <p className="text-3xl font-bold text-white mt-1">{metrics?.conversionRate}%</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard label="Total Patients" value={(metrics?.totalPatients || 0).toLocaleString()} icon="👥" trend="12%" trendUp={true} accent="from-[#0F4C81] to-[#1F7A8C]" />
          <KPICard label="Treatment Revenue" value={`£${(metrics?.treatmentRevenue || 0).toLocaleString()}`} icon="💊" trend="8%" trendUp={true} accent="from-blue-500 to-indigo-600" />
          <KPICard label="Conversion Rate" value={`${metrics?.conversionRate || 0}%`} icon="📈" trend="2.4%" trendUp={true} accent="from-emerald-500 to-teal-600" />
          <KPICard label="Inventory Utilisation" value={`${metrics?.inventoryUtilization || 0}%`} icon="📦" trend="5%" trendUp={false} accent="from-amber-500 to-orange-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Distribution */}
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">💹</div>
              <div>
                <h3 className="font-bold text-gray-900">Revenue Distribution</h3>
                <p className="text-xs text-gray-400">Across all verticals</p>
              </div>
            </div>
            <div className="space-y-6">
              <RevenueBar label="Treatment Fees" value={metrics?.treatmentRevenue || 0} max={totalRevenue} color="bg-gradient-to-r from-slate-600 to-slate-700" />
              <RevenueBar label="Hotel & Travel Affiliate" value={metrics?.hotelRevenue || 0} max={totalRevenue} color="bg-gradient-to-r from-blue-500 to-indigo-500" />
              <RevenueBar label="Insurance Premiums" value={metrics?.insuranceRevenue || 0} max={totalRevenue} color="bg-gradient-to-r from-emerald-500 to-teal-500" />
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-slate-700 text-lg">£{totalRevenue.toLocaleString()}</span>
            </div>
          </div>

          {/* Popular Treatments */}
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">🏆</div>
              <div>
                <h3 className="font-bold text-gray-900">Top Treatments</h3>
                <p className="text-xs text-gray-400">By revenue generated</p>
              </div>
            </div>
            <div className="space-y-3">
              {metrics?.popularTreatments.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-400" :
                    i === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                    i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                    "bg-gradient-to-br from-slate-400 to-slate-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.bookings} bookings</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-700 text-sm">£{t.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { title: "Active Clinics", value: "48", icon: "🏥", desc: "JCI-accredited partners", color: "from-slate-500 to-slate-600" },
            { title: "Destinations", value: "2", icon: "🌍", desc: "Turkey & China networks", color: "from-blue-500 to-indigo-500" },
            { title: "Avg Patient Saving", value: "65%", icon: "💎", desc: "vs UK private healthcare", color: "from-emerald-500 to-teal-500" },
          ].map(({ title, value, icon, desc, color }, i) => (
            <div
              key={title}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain Admin Panel */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">⛓️</div>
            <div>
              <h3 className="font-bold text-gray-900">Blockchain Admin</h3>
              <p className="text-xs text-gray-400">Polygon Amoy testnet</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <button
              onClick={connectAdminWallet}
              className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              🔗 {adminWallet ? `${adminWallet.slice(0, 6)}…${adminWallet.slice(-4)}` : "Connect Wallet"}
            </button>
            <button
              onClick={verifyClinicOnChain}
              disabled={bcLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {bcLoading ? "Verifying…" : "🏥 Verify Clinic"}
            </button>
            <button
              onClick={() => { window.location.href = `${basePath}/verify`; }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              📜 View Ledger
            </button>
          </div>
          {bcMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg ${
              bcMsg.startsWith("Verified") || bcMsg.startsWith("Connected")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {bcMsg}
            </div>
          )}
        </div>

        {/* Credential Approvals */}
        <CredentialQueueSection />
      </div>
    </div>
  );
}
