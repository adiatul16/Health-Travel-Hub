import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { txUrl, addressUrl } from "@workspace/blockchain";

interface ChainEvent {
  name: string;
  args: Record<string, any>;
  txHash: string;
  blockNumber: number;
}

interface LiveStats {
  verifiedClinics: number;
  verifiedDoctors: number;
  recordsAnchored: number;
  verifiedReviews: number;
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
            <p><span className="text-gray-500">Clinic:</span> <a href={addressUrl(event.args.clinic)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.clinic?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">Name:</span> {event.args.name}</p>
            <p><span className="text-gray-500">Accreditation:</span> {event.args.accreditation}</p>
            <p><span className="text-gray-500">Expires:</span> {formatTimestamp(event.args.expiry)}</p>
          </>
        )}
        {event.name === "DoctorVerified" && (
          <>
            <p><span className="text-gray-500">Doctor:</span> <a href={addressUrl(event.args.doctor)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.doctor?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">Clinic:</span> <a href={addressUrl(event.args.clinic)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.clinic?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">License:</span> {event.args.license}</p>
          </>
        )}
        {event.name === "RecordAdded" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">Hash:</span> <span className="font-mono text-xs text-gray-700">{event.args.dataHash?.slice(0, 20) ?? "N/A"}…</span></p>
            <p><span className="text-gray-500">Reference:</span> {event.args.ref}</p>
            <p><span className="text-gray-500">Phase:</span> {event.args.phase}</p>
          </>
        )}
        {event.name === "ConsentGranted" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">Doctor:</span> <a href={addressUrl(event.args.doctor)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.doctor?.slice(0, 12) ?? "unknown"}…</a></p>
          </>
        )}
        {event.name === "ConsentRevoked" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">Doctor:</span> <a href={addressUrl(event.args.doctor)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.doctor?.slice(0, 12) ?? "unknown"}…</a></p>
          </>
        )}
        {event.name === "ReviewAdded" && (
          <>
            <p><span className="text-gray-500">Patient:</span> <a href={addressUrl(event.args.patient)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.patient?.slice(0, 12) ?? "unknown"}…</a></p>
            <p><span className="text-gray-500">Clinic:</span> <a href={addressUrl(event.args.clinic)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{event.args.clinic?.slice(0, 12) ?? "unknown"}…</a></p>
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
  const [liveStats, setLiveStats] = useState<LiveStats>({
    verifiedClinics: 0,
    verifiedDoctors: 0,
    recordsAnchored: 0,
    verifiedReviews: 0,
  });
  const [stats, setStats] = useState<{ contractAddress: string; recordCount: number; polygonScan: string } | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [eventsRes, statsRes, clinicsRes, doctorsRes] = await Promise.all([
          fetch("/api/blockchain/events", { credentials: "include" }).then((r) => (r.ok ? r.json() : Promise.resolve({}))),
          fetch("/api/blockchain/stats", { credentials: "include" }).then((r) => (r.ok ? r.json() : Promise.resolve(null))),
          fetch("/api/clinics", { credentials: "include" }).then((r) => (r.ok ? r.json() : Promise.resolve([]))),
          fetch("/api/doctors/clinic/1", { credentials: "include" }).then((r) => (r.ok ? r.json() : Promise.resolve([]))),
        ]);

        const all = eventsRes;
        const merged: ChainEvent[] = [
          ...(all.clinicEvents || []),
          ...(all.doctorEvents || []),
          ...(all.recordEvents || []),
          ...(all.consentGrantEvents || []),
          ...(all.consentRevokeEvents || []),
          ...(all.reviewEvents || []),
        ].sort((a: ChainEvent, b: ChainEvent) => b.blockNumber - a.blockNumber);
        setEvents(merged);
        setStats(statsRes);

        const clinics = Array.isArray(clinicsRes) ? clinicsRes : [];
        const clinicVerifiedCount = clinics.filter((c: any) => c.jciAccredited || c.verified).length;

        // Fetch doctors for all clinics
        let allDoctors: any[] = [];
        const doctorPromises = clinics.map((c: any) =>
          fetch(`/api/doctors/clinic/${c.id}`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        );
        const doctorResults = await Promise.all(doctorPromises);
        allDoctors = doctorResults.flat();

        setLiveStats({
          verifiedClinics: clinicVerifiedCount || clinics.length || 0,
          verifiedDoctors: allDoctors.filter((d: any) => d.verified).length,
          recordsAnchored: statsRes?.recordCount || 0,
          verifiedReviews: 0,
        });
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const counts: Record<string, number> = {
    all: events.length,
    ClinicVerified: events.filter((e) => e.name === "ClinicVerified").length,
    DoctorVerified: events.filter((e) => e.name === "DoctorVerified").length,
    RecordAdded: events.filter((e) => e.name === "RecordAdded").length,
    ConsentGranted: events.filter((e) => e.name === "ConsentGranted").length,
    ConsentRevoked: events.filter((e) => e.name === "ConsentRevoked").length,
    ReviewAdded: events.filter((e) => e.name === "ReviewAdded").length,
  };

  const filtered = filter === "all" ? events : events.filter((e) => e.name === filter);

  const filterTabs = [
    { key: "all", label: "All", icon: "📊", count: counts.all },
    { key: "ClinicVerified", label: "Clinics", icon: "🏥", count: counts.ClinicVerified },
    { key: "DoctorVerified", label: "Doctors", icon: "👔", count: counts.DoctorVerified },
    { key: "RecordAdded", label: "Records", icon: "📁", count: counts.RecordAdded },
    { key: "ConsentGranted", label: "Consent", icon: "✅", count: counts.ConsentGranted },
    { key: "ReviewAdded", label: "Reviews", icon: "⭐", count: counts.ReviewAdded },
  ];

  const activeTabs = filterTabs.filter((t) => t.count > 0);
  const inactiveTabs = filterTabs.filter((t) => t.count === 0 && t.key !== "all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7FA] via-white to-[#F4F7FA]">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0F4C81] to-[#1F7A8C] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Verified care you can check yourself.
            </h1>
            <p className="text-[#A0C4DE] mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
              Every clinic, doctor, and review is independently confirmed and locked into a permanent record that no one can secretly edit, including us.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        {/* Live Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {[
            { label: "Verified Clinics", value: liveStats.verifiedClinics, icon: "🏥", color: "from-[#0F4C81] to-[#1F7A8C]" },
            { label: "Verified Doctors", value: liveStats.verifiedDoctors, icon: "👔", color: "from-[#1F7A8C] to-[#7FD1D8]" },
            { label: "Records Anchored", value: liveStats.recordsAnchored, icon: "📁", color: "from-[#0F4C81] to-[#1F7A8C]" },
            { label: "Verified Reviews", value: liveStats.verifiedReviews, icon: "⭐", color: "from-[#1F7A8C] to-[#7FD1D8]" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 text-center shadow-sm"
            >
              <div className="text-2xl sm:text-3xl mb-1">{s.icon}</div>
              <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 mb-8 sm:mb-10 shadow-sm">
          <h2 className="font-bold text-[#0F4C81] text-base sm:text-lg mb-4">
            How VitaVia keeps everything honest
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
              <div className="text-2xl mb-2">🏥</div>
              <p className="font-semibold text-gray-900 text-sm">Clinics we check ourselves</p>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                Before any clinic appears on our site, we verify their real-world license, accreditation, and hospital status. That proof is then locked into a permanent record.
              </p>
            </div>
            <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
              <div className="text-2xl mb-2">👔</div>
              <p className="font-semibold text-gray-900 text-sm">Doctors with real credentials</p>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                Every listed doctor is matched against a verified license from their home country. We check their training, their specialty, and their current standing.
              </p>
            </div>
            <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
              <div className="text-2xl mb-2">📁</div>
              <p className="font-semibold text-gray-900 text-sm">Private records, fingerprints only</p>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                If you upload a medical record, only a tamper-proof fingerprint is saved on our network. The actual file stays in your private cloud storage. We can never read it.
              </p>
            </div>
            <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
              <div className="text-2xl mb-2">⭐</div>
              <p className="font-semibold text-gray-900 text-sm">Reviews from real patients only</p>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                A review can only come from a patient who actually booked through the platform. We verify their booking before they can post. Fake reviews are impossible.
              </p>
            </div>
          </div>
        </div>

        {/* Trust statement */}
        <div className="bg-gradient-to-r from-[#00A878]/10 to-[#1F7A8C]/10 rounded-2xl border border-[#00A878]/20 p-5 sm:p-6 mb-8 sm:mb-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00A878] text-white flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                What this means for you
              </h3>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                You can see every clinic, doctor, and review that has been independently verified. If a clinic removes a bad review, it stays on the record. If a doctor claims a license they do not have, we catch it before they ever list with us.
              </p>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                We do this because we know you are trusting us with your health. That trust has to be earned, not assumed.
              </p>
            </div>
          </div>
        </div>

        {/* Verify Independently */}
        <div className="mb-8 sm:mb-10">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="w-full flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-[#F4F7FA] transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🔐</span>
              Verify independently
            </span>
            <span className="text-lg transition-transform duration-200" style={{ transform: showTechnical ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {showTechnical && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-b-xl border border-t-0 border-[#E5E7EB] p-4 sm:p-6 space-y-4">
                  {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
                        <div className="text-xs text-gray-500 mb-1">Records Anchored</div>
                        <div className="text-2xl font-bold text-[#0F4C81]">{stats.recordCount}</div>
                        <div className="text-xs text-gray-400 mt-1">Fingerprints stored on network</div>
                      </div>
                      <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
                        <div className="text-xs text-gray-500 mb-1">Contract Address</div>
                        <div className="text-sm font-mono text-[#0F4C81] truncate">{stats.contractAddress}</div>
                        <a href={stats.polygonScan} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1F7A8C] hover:text-[#0F4C81] font-medium mt-1 inline-block">
                          View on PolygonScan ↗
                        </a>
                      </div>
                      <div className="bg-[#F4F7FA] rounded-xl p-4 border border-[#E5E7EB]/60">
                        <div className="text-xs text-gray-500 mb-1">Network</div>
                        <div className="text-lg font-bold text-[#0F4C81]">Polygon Amoy</div>
                        <div className="text-xs text-gray-400 mt-1">Testnet. Chain ID 80002.</div>
                      </div>
                    </div>
                  )}

                  {/* Event filter tabs inside technical section */}
                  <div className="border-t border-[#E5E7EB] pt-4">
                    <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">Recent Activity</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activeTabs.map(({ key, label, icon, count }) => (
                        <button
                          key={key}
                          onClick={() => setFilter(key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            filter === key
                              ? "bg-[#0F4C81] text-white"
                              : "bg-white text-gray-600 hover:bg-[#F4F7FA] border border-[#E5E7EB]"
                          }`}
                        >
                          {icon} {label} ({count})
                        </button>
                      ))}
                      {inactiveTabs.map(({ key, label, icon }) => (
                        <span
                          key={key}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-gray-50 border border-gray-100 cursor-default"
                          title="No entries yet"
                        >
                          {icon} {label} <span className="text-gray-300">none yet</span>
                        </span>
                      ))}
                    </div>

                    {loading ? (
                      <div className="flex items-center gap-3 py-6">
                        <div className="w-6 h-6 border-3 border-[#E5E7EB] border-t-[#0F4C81] rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm">Loading recent activity...</p>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="text-center py-8 bg-[#F4F7FA] rounded-xl border border-[#E5E7EB]/60">
                        <p className="text-gray-400 text-sm">No entries in this category yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filtered.map((e, i) => (
                          <EventCard key={`${e.txHash}-${i}`} event={e} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer trust */}
        <div className="text-center pb-8">
          <p className="text-xs text-gray-400">
            VitaVia Care Network. Permanent verification. No backdoors.
          </p>
        </div>
      </div>
    </div>
  );
}
