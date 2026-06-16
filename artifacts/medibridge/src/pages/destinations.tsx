import { useListDestinations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Destinations() {
  const { data: destinations, isLoading } = useListDestinations();

  return (
    <div className="container py-12 px-4 mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Explore Destinations</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Combine world-class healthcare with beautiful travel destinations. Discover the best cities for medical tourism.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : (
          destinations?.map((destination) => (
            <div key={destination.id} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
              <img 
                src={destination.imageUrl} 
                alt={destination.name}
                className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{destination.flag}</span>
                  <span className="text-white/80 font-medium">{destination.country}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{destination.name}</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                    <div className="text-white/70 text-xs mb-1">Clinics</div>
                    <div className="text-white font-bold">{destination.clinicCount}+</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                    <div className="text-white/70 text-xs mb-1">Avg. Savings</div>
                    <div className="text-green-400 font-bold">{destination.averageSavings}%</div>
                  </div>
                </div>
                
                <Button className="w-full bg-white text-black hover:bg-white/90" asChild>
                  <Link href={`/clinics?destination=${destination.name}`}>Explore Clinics</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
