import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Packages() {
  const [step, setStep] = useState(1);

  return (
    <div className="container py-12 px-4 mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Smart Package Optimizer</h1>
        <p className="text-muted-foreground mt-2">
          Build your entire medical journey in seconds. We handle the procedure, flights, hotel, and transfers.
        </p>
      </div>

      <div className="bg-card border rounded-2xl p-8 shadow-sm">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-semibold mb-6">What treatment are you looking for?</h2>
            {/* Form components would go here */}
            <div className="h-40 bg-muted/50 rounded-lg mb-8 flex items-center justify-center text-muted-foreground border-2 border-dashed">
              Form Selection Area
            </div>
            <div className="flex justify-end">
              <Button size="lg" onClick={() => setStep(2)}>Next Step</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-semibold mb-6">Select Destination</h2>
            <div className="h-40 bg-muted/50 rounded-lg mb-8 flex items-center justify-center text-muted-foreground border-2 border-dashed">
              Form Selection Area
            </div>
            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" onClick={() => setStep(3)}>Next Step</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-semibold mb-6">Review Package Options</h2>
            <div className="h-64 bg-muted/50 rounded-lg mb-8 flex items-center justify-center text-muted-foreground border-2 border-dashed">
              Results Area
            </div>
            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button size="lg">Confirm & Book</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
