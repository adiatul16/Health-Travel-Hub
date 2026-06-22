import { useState, useMemo } from "react";
import { useListClinics } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Highest Rated" },
  { value: "slots", label: "Most Availability" },
  { value: "price", label: "Lowest Price" },
  { value: "name", label: "Name (A-Z)" },
  { value: "established", label: "Most Experienced" },
];

export default function Clinics() {
  const [filters, setFilters] = useState<{
    country: string;
    specialty: string;
    minRating: string;
    jci: string;
    minSlots: string;
    sortBy: "featured" | "rating" | "slots" | "price" | "name" | "established";
    sortDir: "asc" | "desc";
  }>({
    country: "",
    specialty: "",
    minRating: "",
    jci: "",
    minSlots: "",
    sortBy: "featured",
    sortDir: "asc",
  });
  const { data: clinics, isLoading } = useListClinics(
    {
      country: filters.country || undefined,
      specialty: filters.specialty || undefined,
      minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
      jci: filters.jci === "true" ? true : undefined,
      minSlots: filters.minSlots ? parseInt(filters.minSlots) : undefined,
      sortBy: (filters.sortBy as "featured" | "rating" | "slots" | "price" | "name" | "established") || undefined,
      sortDir: (filters.sortDir as "asc" | "desc") || undefined,
    },
    {
      query: {
        queryKey: ["clinics", filters],
        enabled: true,
      },
    }
  );

  const allCountries = useMemo(() => {
    const set = new Set(clinics?.map((c) => c.country) ?? []);
    return Array.from(set).sort();
  }, [clinics]);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    clinics?.forEach((c) => c.specialties.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [clinics]);

  const activeFilterCount = Object.values({ country: filters.country, specialty: filters.specialty, minRating: filters.minRating, jci: filters.jci, minSlots: filters.minSlots }).filter(Boolean).length;

  const clearFilters = () => setFilters({
    country: "",
    specialty: "",
    minRating: "",
    jci: "",
    minSlots: "",
    sortBy: "featured",
    sortDir: "asc",
  });

  return (
    <div className="container py-12 px-4 mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Verified Partner Clinics</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Discover world-class, internationally accredited healthcare facilities.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[140px]">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Country</label>
            <Select value={filters.country || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === "__all__" ? "" : v }))}>
              <SelectTrigger className="w-[140px] text-sm">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All countries</SelectItem>
                {allCountries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Specialty</label>
            <Select value={filters.specialty || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, specialty: v === "__all__" ? "" : v }))}>
              <SelectTrigger className="w-[160px] text-sm">
                <SelectValue placeholder="All specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All specialties</SelectItem>
                {allSpecialties.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[120px]">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Min Rating</label>
            <Select value={filters.minRating || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, minRating: v === "__all__" ? "" : v }))}>
              <SelectTrigger className="w-[120px] text-sm">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
                <SelectItem value="4.0">4.0+</SelectItem>
                <SelectItem value="3.5">3.5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[120px]">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Accreditation</label>
            <Select value={filters.jci || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, jci: v === "__all__" ? "" : v }))}>
              <SelectTrigger className="w-[120px] text-sm">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any</SelectItem>
                <SelectItem value="true">JCI only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[120px]">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Availability</label>
            <Select value={filters.minSlots || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, minSlots: v === "__all__" ? "" : v }))}>
              <SelectTrigger className="w-[120px] text-sm">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Any</SelectItem>
                <SelectItem value="5">5+ slots</SelectItem>
                <SelectItem value="10">10+ slots</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px] ml-auto">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sort by</label>
            <Select value={filters.sortBy} onValueChange={(v) => setFilters((f) => ({ ...f, sortBy: v as typeof f.sortBy }))}>
              <SelectTrigger className="w-[150px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {filters.country && (
              <Badge variant="secondary" className="gap-1">
                {filters.country}
                <button onClick={() => setFilters((f) => ({ ...f, country: "" }))}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {filters.specialty && (
              <Badge variant="secondary" className="gap-1">
                {filters.specialty}
                <button onClick={() => setFilters((f) => ({ ...f, specialty: "" }))}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {filters.minRating && (
              <Badge variant="secondary" className="gap-1">
                {filters.minRating}+ stars
                <button onClick={() => setFilters((f) => ({ ...f, minRating: "" }))}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {filters.jci && (
              <Badge variant="secondary" className="gap-1">
                JCI Accredited
                <button onClick={() => setFilters((f) => ({ ...f, jci: "" }))}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {filters.minSlots && (
              <Badge variant="secondary" className="gap-1">
                {filters.minSlots}+ slots
                <button onClick={() => setFilters((f) => ({ ...f, minSlots: "" }))}><X className="h-3 w-3" /></button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))
        ) : (
          clinics?.map((clinic) => (
            <div key={clinic.id} className="flex flex-col sm:flex-row overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="sm:w-2/5 h-48 sm:h-auto relative bg-muted shrink-0">
                {clinic.imageUrl ? (
                  <img src={clinic.imageUrl} alt={clinic.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="font-semibold text-lg">{clinic.city}</span>
                  </div>
                )}
                {clinic.jciAccredited && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert("Joint Commission International (JCI) accreditation is the gold standard for healthcare quality. This clinic has been independently audited and meets international patient safety standards.");
                    }}
                    className="absolute top-3 left-3 bg-yellow-400 text-yellow-950 px-2 py-1 text-xs font-bold rounded shadow-sm hover:bg-yellow-300 transition-colors cursor-help"
                    title="Click to learn about JCI accreditation"
                  >
                    JCI Accredited ✓
                  </button>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{clinic.name}</h3>
                  <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm font-medium">
                    <span className="text-yellow-500">★</span> {clinic.rating.toFixed(1)} ({clinic.reviewCount})
                  </div>
                </div>
                <div className="text-muted-foreground text-sm mb-4">
                  {clinic.city}, {clinic.country}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {clinic.specialties.slice(0, 3).map(specialty => (
                    <span key={specialty} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                      {specialty}
                    </span>
                  ))}
                  {clinic.specialties.length > 3 && (
                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-medium">
                      +{clinic.specialties.length - 3} more
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Available slots</div>
                    <div className={`font-medium ${clinic.availableSlots <= 3 ? "text-red-500" : clinic.availableSlots <= 7 ? "text-amber-500" : "text-green-600"}`}>
                      {clinic.availableSlots} this month
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/clinics/${clinic.id}`}>View Clinic</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
