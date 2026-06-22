import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  isClinicVerified,
  isDoctorVerified,
  getAllEvents,
  txUrl,
  addressUrl,
  ensureAmoyNetwork,
  getConnectedAddress,
  AMOY_RPC,
} from "@workspace/blockchain";

interface ChainEvent {
  name: string;
  args: Record<string, any>;
  txHash: string;
  blockNumber: number;
}

function formatTimestamp(ts: number | bigint) {
  const n = typeof ts === "bigint" ? Number(ts) : ts;
  return new Date(n * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EventCard({ event, index }: { event: ChainEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {event.name === "ClinicVerified" && "🏥"}
            {event.name === "DoctorVerified" && "🩺"}
            {event.name === "RecordAdded" && "📁"}
            {event.name === "ConsentGranted" && "✅"}
            {event.name === "ConsentRevoked" && "❌"}
            {event.name === "ReviewAdded" && "⭐"}
          </span>
          <span className="font-semibold text-gray-900 text-sm">{event.name}</span>
        </div>
        <span className="text-xs text-gray-400">Block #{event.blockNumber}</span>
      </div>

      <div className="space-y-1 text-sm mb-2">
        {event.name === "ClinicVerified" && (
          <>
            <p><span className="text-gray-500">Clinic:</span> <a href={addressUrl(event.args.clinic)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.clinic.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Name:</span> {event.args.name}</p>
            <p><span className="text-gray-500">Accreditation:</span> {event.args.accreditation}</p>
            <p><span className="text-gray-500">Expires:</span> {formatTimestamp(event.args.expiry)}</p>
          </>
        )}
        {event.name === "DoctorVerified" && (
          <>
            <p><span className="text-gray-500">Doctor:</span> <a href={addressUrl(event.args.doctor)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.doctor.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Clinic:</span> <a href={addressUrl(event.args.clinic)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.clinic.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">License:</span> {event.args.license}</p>
          </>
        )}
        {event.name === "RecordAdded" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Hash:</span> <span className="font-mono text-xs text-gray-700">{event.args.dataHash?.slice(0, 20)}…</span></p>
            <p><span className="text-gray-500">Reference:</span> {event.args.ref}</p>
            <p><span className="text-gray-500">Phase:</span> {event.args.phase}</p>
          </>
        )}
        {event.name === "ConsentGranted" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Doctor:</span> <a href={addressUrl(event.args.doctor)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.doctor.slice(0, 12)}…</a></p>
          </>
        )}
        {event.name === "ConsentRevoked" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Doctor:</span> <a href={addressUrl(event.args.doctor)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.doctor.slice(0, 12)}…</a></p>
          </>
        )}
        {event.name === "ReviewAdded" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Clinic:</span> <a href={addressUrl(event.args.clinic)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.clinic.slice(0, 12)}…</a></p>
            <p><span className="text-gray-500">Rating:</span> {"⭐".repeat(Number(event.args.rating))}</p>
            <p><span className="text-gray-500">Comment:</span> {event.args.comment}</p>
          </>
        )}
      </div>

      <a
        href={txUrl(event.txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        View on PolygonScan ↗
      </a>
    </motion.div>
  );
}

export default function VerifyPage() {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const all = await getAllEvents();
        const merged: ChainEvent[] = [
          ...all.clinicEvents.map((e: any) => ({ name: "ClinicVerified", args: e.args, txHash: e.transactionHash, blockNumber: e.blockNumber })),
          ...all.doctorEvents.map((e: any) => ({ name: "DoctorVerified", args: e.args, txHash: e.transactionHash, blockNumber: e.blockNumber })),
          ...all.recordEvents.map((e: any) => ({ name: "RecordAdded", args: e.args, txHash: e.transactionHash, blockNumber: e.blockNumber })),
          ...all.consentGrantEvents.map((e: any) => ({ name: "ConsentGranted", args: e.args, txHash: e.transactionHash, blockNumber: e.blockNumber })),
          ...all.consentRevokeEvents.map((e: any) => ({ name: "ConsentRevoked", args: e.args, txHash: e.transactionHash, blockNumber: e.blockNumber })),
          ...all.reviewEvents.map((e: any) => ({ name: "ReviewAdded", args: e.args, txHash: e.transactionHash, blockNumber: e.blockNumber })),
        ].sort((a, b) => b.blockNumber - a.blockNumber);
        setEvents(merged);
      } catch (err: any) {
        setError(err.message || "Failed to load blockchain data");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function connectWallet() {
    try {
      await ensureAmoyNetwork();
      const addr = await getConnectedAddress();
      setWallet(addr);
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filtered = filter === "all" ? events : events.filter((e) => e.name === filter);
  const counts: Record<string, number> = {
    all: events.length,
    ClinicVerified: events.filter((e) => e.name === "ClinicVerified").length,
    DoctorVerified: events.filter((e) => e.name === "DoctorVerified").length,
    RecordAdded: events.filter((e) => e.name === "RecordAdded").length,
    ConsentGranted: events.filter((e) => e.name === "ConsentGranted").length,
    ConsentRevoked: events.filter((e) => e.name === "ConsentRevoked").length,
    ReviewAdded: events.filter((e) => e.name === "ReviewAdded").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold"
              >
                ⛓️ VitaVia Blockchain Ledger
              </motion.h1>
              <p className="text-slate-300 mt-2 max-w-xl">
                Every verification, record, and review is stored permanently on the Polygon Amoy blockchain.
                No raw health data on-chain — only SHA-256 hashes and metadata.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {wallet ? (
                <div className="px-4 py-2 rounded-xl bg-white/10 text-sm font-mono">
                  {wallet.slice(0, 8)}…{wallet.slice(-6)}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  Connect MetaMask
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-blue-900 text-lg mb-3">How VitaVia uses blockchain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-800">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">🏥</div>
              <p className="font-semibold">Clinic Verification</p>
              <p className="text-blue-600 mt-1">Admin verifies clinics on-chain. Anyone can check accreditation status.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">🩺</div>
              <p className="font-semibold">Doctor Licensing</p>
              <p className="text-blue-600 mt-1">Verified clinics register doctors. License numbers and expiry stored on-chain.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">📁</div>
              <p className="font-semibold">Record Hashes</p>
              <p className="text-blue-600 mt-1">Patients store SHA-256 hashes of medical records — not the files themselves.</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-2xl mb-2">⭐</div>
              <p className="font-semibold">Verified Reviews</p>
              <p className="text-blue-600 mt-1">Only patients with on-chain interactions can leave reviews — no fake reviews.</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "all", label: `All (${counts.all})`, icon: "📊" },
            { key: "ClinicVerified", label: `Clinics (${counts.ClinicVerified})`, icon: "🏥" },
            { key: "DoctorVerified", label: `Doctors (${counts.DoctorVerified})`, icon: "🩺" },
            { key: "RecordAdded", label: `Records (${counts.RecordAdded})`, icon: "📁" },
            { key: "ConsentGranted", label: `Consent (${counts.ConsentGranted})`, icon: "✅" },
            { key: "ReviewAdded", label: `Reviews (${counts.ReviewAdded})`, icon: "⭐" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === key
                  ? "bg-slate-800 text-white"
                  : "bg-white text-gray-600 hover:bg-slate-50 border border-gray-200"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Events list */}
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Reading from Polygon Amoy...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-semibold mb-2">Unable to load blockchain data</p>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-3">
              Make sure the contract is deployed and the RPC endpoint is reachable.
              <br />RPC: {AMOY_RPC}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⛓️</div>
            <p className="text-gray-500 font-medium">No events on-chain yet</p>
            <p className="text-gray-400 text-sm mt-1">Deploy the contract and run the seed script to populate data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((e, i) => (
              <EventCard key={`${e.txHash}-${i}`} event={e} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
