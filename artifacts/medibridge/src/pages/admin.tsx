import { useGetAdminMetrics, useListClinics } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

function KPICard({
  label,
  value,
  icon,
  trend,
  trendUp,
  gradient,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 22 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50 relative overflow-hidden group hover:shadow-md transition-shadow"
    >
      <div className={`absolute top-0 right-0 w-28 h-28 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-full`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center text-xl shadow-sm`}>
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
    </motion.div>
  );
}

function RevenueBar({ label, value, max, color, delay = 0 }: { label: string; value: number; max: number; color: string; delay?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">£{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 1.0, ease: "easeOut" }}
          className={`h-2.5 rounded-full ${color}`}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">⛓️</div>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["pending", "add", "anchored"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {t === "pending" ? `Pending (${pending.length})` : t === "add" ? "Add Credential" : `Anchored (${anchored.length})`}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── PENDING TAB ── */}
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
                      <button
                        onClick={() => remove(c.id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ADD TAB ── */}
        {tab === "add" && (
          <div className="max-w-lg space-y-4">
            <p className="text-sm text-gray-500">
              Add a credential for a clinic. It will sit in "Pending" until you approve and anchor it on-chain.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Clinic *</label>
                <select
                  value={form.clinicId}
                  onChange={(e) => setForm((f) => ({ ...f, clinicId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">Select a clinic…</option>
                  {clinics?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Credential Type *</label>
                <select
                  value={form.credentialType}
                  onChange={(e) => setForm((f) => ({ ...f, credentialType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Issue Date *</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Document Name</label>
                <input
                  type="text"
                  value={form.documentName}
                  onChange={(e) => setForm((f) => ({ ...f, documentName: e.target.value }))}
                  placeholder="e.g. JCI_Certificate_2024.pdf"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Document Hash (SHA-256)
                </label>
                <input
                  type="text"
                  value={form.documentHash}
                  onChange={(e) => setForm((f) => ({ ...f, documentHash: e.target.value }))}
                  placeholder="0x…64-character hex hash of the document"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-300"
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
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {formLoading ? "Adding…" : "Add to Queue"}
            </button>
          </div>
        )}

        {/* ── ANCHORED TAB ── */}
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
                        <div className="text-xs text-gray-500 mt-0.5">
                          {c.clinicName ?? `Clinic #${c.clinicId}`} · {c.issuingBody}
                        </div>
                        {c.documentHash && (
                          <div className="text-xs font-mono text-gray-400 mt-1 truncate max-w-xs">
                            {c.documentHash.slice(0, 20)}…
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        ⛓️ Anchored
                      </span>
                    </div>
                    {c.polygonScanUrl && (
                      <a
                        href={c.polygonScanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:underline"
                      >
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
    </motion.div>
  );
}

export default function Admin() {
  const { data: metrics, isLoading } = useGetAdminMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
          <p className="text-purple-700 font-medium">Loading admin console...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = (metrics?.treatmentRevenue || 0) + (metrics?.hotelRevenue || 0) + (metrics?.insuranceRevenue || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Header */}
      <div className="purple-gradient relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-white/5 rounded-full translate-y-1/3" />
        </div>
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">⚙️</div>
            <div>
              <motion.p
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-purple-200 text-xs font-semibold uppercase tracking-wider"
              >
                Platform Management
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="text-3xl font-bold text-white"
              >
                Admin Console
              </motion.h1>
            </div>
          </div>

          {/* Revenue total banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-5 inline-flex items-center gap-6"
          >
            <div>
              <p className="text-purple-200 text-sm">Total Platform Revenue</p>
              <p className="text-4xl font-bold text-white mt-1">£{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-px h-14 bg-white/20" />
            <div>
              <p className="text-purple-200 text-sm">Conversion Rate</p>
              <p className="text-4xl font-bold text-white mt-1">{metrics?.conversionRate}%</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KPICard
            label="Total Patients"
            value={(metrics?.totalPatients || 0).toLocaleString()}
            icon="👥"
            trend="12%"
            trendUp={true}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            delay={0}
          />
          <KPICard
            label="Treatment Revenue"
            value={`£${(metrics?.treatmentRevenue || 0).toLocaleString()}`}
            icon="💊"
            trend="8%"
            trendUp={true}
            gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
            delay={0.08}
          />
          <KPICard
            label="Conversion Rate"
            value={`${metrics?.conversionRate || 0}%`}
            icon="📈"
            trend="2.4%"
            trendUp={true}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            delay={0.16}
          />
          <KPICard
            label="Inventory Utilisation"
            value={`${metrics?.inventoryUtilization || 0}%`}
            icon="📦"
            trend="5%"
            trendUp={false}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={0.24}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.30 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">💹</div>
              <div>
                <h3 className="font-bold text-gray-900">Revenue Distribution</h3>
                <p className="text-xs text-gray-400">Across all verticals</p>
              </div>
            </div>
            <div className="space-y-6">
              <RevenueBar
                label="Treatment Fees"
                value={metrics?.treatmentRevenue || 0}
                max={totalRevenue}
                color="bg-gradient-to-r from-purple-500 to-violet-600"
                delay={0.5}
              />
              <RevenueBar
                label="Hotel & Travel Affiliate"
                value={metrics?.hotelRevenue || 0}
                max={totalRevenue}
                color="bg-gradient-to-r from-blue-500 to-indigo-500"
                delay={0.65}
              />
              <RevenueBar
                label="Insurance Premiums"
                value={metrics?.insuranceRevenue || 0}
                max={totalRevenue}
                color="bg-gradient-to-r from-emerald-500 to-teal-500"
                delay={0.8}
              />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-purple-700 text-lg">£{totalRevenue.toLocaleString()}</span>
            </div>
          </motion.div>

          {/* Popular Treatments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg">🏆</div>
              <div>
                <h3 className="font-bold text-gray-900">Top Treatments</h3>
                <p className="text-xs text-gray-400">By revenue generated</p>
              </div>
            </div>
            <div className="space-y-3">
              {metrics?.popularTreatments.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-400" :
                    i === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                    i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700" :
                    "bg-gradient-to-br from-purple-400 to-violet-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.bookings} bookings</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-purple-700 text-sm">£{t.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">revenue</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {[
            { title: "Active Clinics", value: "48", icon: "🏥", desc: "JCI-accredited partners", color: "from-purple-500 to-violet-600" },
            { title: "Destinations", value: "2", icon: "🌍", desc: "Turkey & China networks", color: "from-blue-500 to-indigo-500" },
            { title: "Avg Patient Saving", value: "65%", icon: "💎", desc: "vs UK private healthcare", color: "from-emerald-500 to-teal-500" },
          ].map(({ title, value, icon, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="bg-white rounded-2xl shadow-sm border border-purple-50 p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-700">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Credential Approvals */}
        <CredentialQueueSection />
      </div>
    </div>
  );
}
