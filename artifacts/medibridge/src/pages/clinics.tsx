import { useListClinics } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Clinics() {
  const { data: clinics, isLoading } = useListClinics();

  return (
    <div className="container py-12 px-4 mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Verified Partner Clinics</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Discover world-class, internationally accredited healthcare facilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-950 px-2 py-1 text-xs font-bold rounded shadow-sm">
                    JCI Accredited
                  </div>
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
                    <div className="font-medium text-green-600">{clinic.availableSlots} this month</div>
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
