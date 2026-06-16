import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return <div className="container py-12 px-4 mx-auto min-h-[60vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-10 px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your medical journey and recovery.</p>
          </div>
          <Button asChild>
            <Link href="/packages">Build New Package</Link>
          </Button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Saved</div>
            <div className="text-3xl font-bold text-green-600">£{summary?.totalSavings.toLocaleString() || "0"}</div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Upcoming Treatments</div>
            <div className="text-3xl font-bold">{summary?.upcomingTreatments?.length || 0}</div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Unread Messages</div>
            <div className="text-3xl font-bold text-primary">{summary?.messageCount || 0}</div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Recovery Progress</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold">{summary?.recoveryProgress || 0}%</div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${summary?.recoveryProgress || 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Treatments */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-muted/20">
                <h2 className="text-xl font-bold">Upcoming Bookings</h2>
              </div>
              <div className="divide-y">
                {summary?.upcomingTreatments?.length ? (
                  summary.upcomingTreatments.map((booking) => (
                    <div key={booking.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold">{booking.procedure}</h3>
                        <p className="text-muted-foreground">{booking.clinic} • {booking.city}</p>
                      </div>
                      <div className="text-right sm:text-right flex items-center sm:block gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Package Total</div>
                          <div className="font-bold">£{booking.packageTotal.toLocaleString()}</div>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 hidden sm:inline-flex">View Details</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No upcoming treatments. Let's build your journey.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Next flight */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-bold mb-4">Travel Itinerary</h3>
              {summary?.nextFlightDate ? (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Next Flight</div>
                  <div className="font-medium mb-1">{new Date(summary.nextFlightDate).toLocaleDateString()}</div>
                  <div className="text-sm text-primary font-medium hover:underline cursor-pointer">View boarding pass</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming flights.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-left">Message Concierge</Button>
                <Button variant="outline" className="w-full justify-start text-left">Upload Medical Records</Button>
                <Button variant="outline" className="w-full justify-start text-left">Telemedicine Consultation</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
