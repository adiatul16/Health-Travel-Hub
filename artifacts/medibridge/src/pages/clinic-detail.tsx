import { useGetClinic } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { CredentialBadge, type CredentialData } from "@/components/credential-badge";

function useClinicCredentials(clinicId: number) {
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId || isNaN(clinicId)) return;
    setLoading(true);
    fetch(`/api/credentials/clinic/${clinicId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CredentialData[]) => setCredentials(data))
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, [clinicId]);

  return { credentials, loading };
}

export default function ClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const clinicId = parseInt(id ?? "0");
  const { data: clinic, isLoading, error } = useGetClinic(clinicId, {
    query: { enabled: !isNaN(clinicId) && clinicId > 0, queryKey: ["clinic", clinicId] },
  });
  const { credentials, loading: credsLoading } = useClinicCredentials(clinicId);

  if (isLoading) {
    return (
      <div className="container py-16 px-4 mx-auto max-w-5xl">
        <div className="h-72 rounded-2xl bg-muted animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="container py-24 px-4 mx-auto max-w-xl text-center">
        <div className="text-5xl mb-4">🏥</div>
        <h1 className="text-2xl font-bold mb-2">Clinic not found</h1>
        <p className="text-muted-foreground mb-6">This clinic may have moved or been removed from the marketplace.</p>
        <Button asChild>
          <Link href="/clinics">Browse All Clinics</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={clinic.imageUrl}
          alt={clinic.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container px-4 pb-8 mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {clinic.jciAccredited && (
              <button
                onClick={() => alert("Joint Commission International (JCI) accreditation is the gold standard for healthcare quality. This clinic has been independently audited and meets international patient safety standards.")}
                className="bg-yellow-400 text-yellow-950 px-2 py-1 text-xs font-bold rounded hover:bg-yellow-300 transition-colors"
                title="Click to learn about JCI accreditation"
              >
                JCI Accredited ✓
              </button>
            )}
            {clinic.accreditations.filter(a => a !== "JCI").map((acc) => (
              <Badge key={acc} variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                {acc}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{clinic.name}</h1>
          <p className="text-white/80 text-lg">{clinic.city}, {clinic.country}</p>
        </div>
      </div>

      <div className="container py-10 px-4 mx-auto max-w-5xl">
        {/* Key stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: "Rating", value: `${Number(clinic.rating).toFixed(1)} / 5`, sub: `${clinic.reviewCount.toLocaleString()} reviews` },
            { label: "Success Rate", value: `${Number(clinic.successRate).toFixed(1)}%`, sub: "Verified outcomes" },
            { label: "Available Slots", value: String(clinic.availableSlots), sub: "This month" },
            { label: "Est.", value: String(clinic.yearsEstablished), sub: `${new Date().getFullYear() - clinic.yearsEstablished} years' experience` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-card border rounded-xl p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {clinic.description && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h2 className="text-xl font-bold mb-3">About the clinic</h2>
                <p className="text-muted-foreground leading-relaxed">{clinic.description}</p>
              </motion.section>
            )}

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <h2 className="text-xl font-bold mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {clinic.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-sm px-3 py-1">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h2 className="text-xl font-bold mb-3">Accreditations & Certifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {clinic.accreditations.map((acc) => (
                  <div key={acc} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium">
                    <span className="text-green-500 font-bold">✓</span>
                    {acc}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ── Verified Credentials (VCN-verified) ── */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Verified Credentials</h2>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  🛡️ VCN Verified
                </span>
              </div>

              {credsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : credentials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No verified credentials yet. Credentials submitted by the clinic are reviewed by VitaVia and recorded on the Care Network.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credentials.map((cred) => (
                    <motion.div
                      key={cred.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start justify-between gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900">{cred.credentialType}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {cred.issuingBody} · Issued {cred.issueDate}
                        </div>
                        {cred.documentName && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {cred.documentName}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <CredentialBadge credential={cred} />
                      </div>
                    </motion.div>
                  ))}

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Each credential's SHA-256 hash is permanently recorded on the Care Network.
                    Click any badge to independently verify.
                  </p>
                </div>
              )}
            </motion.section>

            {/* Doctors section */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">Our Doctors</h2>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                  ⛓️ Blockchain-verified
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(clinic.doctors && clinic.doctors.length > 0 ? clinic.doctors : []).map((doctor) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {doctor.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{doctor.name}</span>
                          {doctor.verified && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                              ⛓️ Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{doctor.title} · {doctor.specialty}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {doctor.yearsExperience} years exp · {doctor.languages?.slice(0, 2).join(", ")}
                        </div>
                        {doctor.certifications && doctor.certifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doctor.certifications.map((cert) => (
                              <span key={cert} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded font-medium">
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {doctor.bio && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{doctor.bio}</p>
                    )}
                    {doctor.onChainTxHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${doctor.onChainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline mt-2 inline-block"
                      >
                        View on-chain record →
                      </a>
                    )}
                  </motion.div>
                ))}
                {(!clinic.doctors || clinic.doctors.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-gray-200 rounded-xl">
                    Doctor profiles are being verified and will be added soon.
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <h2 className="text-xl font-bold mb-3">Why choose {clinic.name}?</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Internationally accredited with verified patient outcomes</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> {new Date().getFullYear() - clinic.yearsEstablished} years of clinical excellence since {clinic.yearsEstablished}</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> English-speaking patient coordinators available 24/7</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> VitaVia-verified for safety, quality, and transparency</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Includes complimentary airport transfer and aftercare guide</li>
              </ul>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border rounded-2xl p-6 shadow-sm lg:sticky lg:top-6"
            >
              <div className="text-sm text-muted-foreground mb-1">Treatments starting from</div>
              <div className="text-3xl font-bold text-primary mb-1">£{Number(clinic.startingFrom).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mb-5">Prices include consultation, procedure, and follow-up</div>

              <div className="text-sm mb-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Availability</span>
                  <span className={`font-semibold ${clinic.availableSlots <= 3 ? "text-red-500" : clinic.availableSlots <= 7 ? "text-amber-500" : "text-green-600"}`}>
                    {clinic.availableSlots} slots this month
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Success rate</span>
                  <span className="font-semibold">{Number(clinic.successRate).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Patient rating</span>
                  <span className="font-semibold">★ {Number(clinic.rating).toFixed(1)} / 5</span>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg" data-testid="book-consultation">
                Book Free Consultation
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/packages" data-testid="build-package-link">
                  Build My Package
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                No obligation · Free consultation · Response within 2 hours
              </p>
            </motion.div>

            {/* Trust summary */}
            {credentials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⛓️</span>
                  <span className="font-semibold text-emerald-800 text-sm">
                    {credentials.length} On-Chain {credentials.length === 1 ? "Credential" : "Credentials"}
                  </span>
                </div>
                <p className="text-xs text-emerald-700">
                  This clinic's credentials are verified and permanently recorded on the Care Network — independently auditable by anyone.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
