import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useListTreatments, useGetPopularTreatments } from "@workspace/api-client-react";

export default function Home() {
  const { data: popularTreatments, isLoading: isLoadingPopular } = useGetPopularTreatments();

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="container px-4 md:px-6 z-10 flex flex-col items-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl"
          >
            Your Entire Medical Journey. <br />
            <span className="text-primary">One Trusted Platform.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl"
          >
            Compare verified hospitals, reserve treatment slots, book flights and accommodation, arrange transfers, secure insurance, and manage recovery — all in one platform.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
              <Link href="/treatments">Find Treatment</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full" asChild>
              <Link href="/destinations">Explore Destinations</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Treatments */}
      <section className="py-20">
        <div className="container px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Popular Treatments</h2>
              <p className="text-muted-foreground mt-2">Discover our most booked procedures</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/treatments">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingPopular ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))
            ) : (
              popularTreatments?.slice(0, 4).map((treatment, i) => (
                <motion.div
                  key={treatment.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/treatments/${treatment.id}`} className="group block">
                    <div className="relative h-48 rounded-t-xl overflow-hidden bg-muted">
                      {treatment.imageUrl && (
                        <img 
                          src={treatment.imageUrl} 
                          alt={treatment.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 text-sm font-semibold rounded-full shadow-sm">
                        Save {treatment.averageSavings}%
                      </div>
                    </div>
                    <div className="border border-t-0 rounded-b-xl p-5 bg-card">
                      <h3 className="font-semibold text-lg">{treatment.name}</h3>
                      <div className="mt-2 flex items-center text-sm text-muted-foreground">
                        <span>{treatment.successRate}% Success Rate</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How MediBridge Works</h2>
            <p className="text-muted-foreground mt-4">We handle every detail of your medical journey, so you can focus on your recovery.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Choose Treatment", desc: "Compare procedures, verified clinics, and transparent pricing." },
              { step: "02", title: "Reserve Slot", desc: "Lock in your exclusive treatment date at your chosen facility." },
              { step: "03", title: "Book Travel", desc: "We arrange flights, accommodation, and transfers in one click." },
              { step: "04", title: "Travel & Recover", desc: "Fly out for treatment and enjoy a seamless recovery experience." }
            ].map((step, i) => (
              <div key={i} className="relative p-6 rounded-2xl bg-background border shadow-sm">
                <div className="text-4xl font-bold text-primary/20 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
