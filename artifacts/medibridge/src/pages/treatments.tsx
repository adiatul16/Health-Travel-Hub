import { useListTreatments } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Treatments() {
  const { data: treatments, isLoading } = useListTreatments();

  return (
    <div className="container py-12 px-4 mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Treatments & Procedures</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Browse our extensive catalog of medical procedures, compare prices, and see potential savings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
          ))
        ) : (
          treatments?.map((treatment) => (
            <div key={treatment.id} className="group relative flex flex-col rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 relative overflow-hidden bg-muted">
                {treatment.imageUrl ? (
                  <img src={treatment.imageUrl} alt={treatment.name} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="font-semibold text-lg">{treatment.category}</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 text-sm font-semibold rounded-full shadow-sm">
                  Save £{treatment.savings.toLocaleString()}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="text-xs font-medium text-primary mb-2 uppercase tracking-wider">{treatment.category}</div>
                <h3 className="text-xl font-bold mb-2">{treatment.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                  {treatment.description}
                </p>
                
                <div className="mt-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                    <div>
                      <div className="text-muted-foreground">UK Price</div>
                      <div className="font-medium line-through decoration-muted-foreground/50">£{treatment.ukPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Turkey Price</div>
                      <div className="font-bold text-primary">£{treatment.turkeyPrice.toLocaleString()}</div>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/packages?treatment=${treatment.id}`}>Build Package</Link>
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
