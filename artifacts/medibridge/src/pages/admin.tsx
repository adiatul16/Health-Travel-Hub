import { useGetAdminMetrics } from "@workspace/api-client-react";

export default function Admin() {
  const { data: metrics, isLoading } = useGetAdminMetrics();

  if (isLoading) {
    return <div className="container py-12 px-4 mx-auto min-h-[60vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="container py-10 px-4 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground mt-1">Platform metrics and financial performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Patients</div>
            <div className="text-3xl font-bold">{metrics?.totalPatients.toLocaleString()}</div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Treatment Revenue</div>
            <div className="text-3xl font-bold text-primary">£{(metrics?.treatmentRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Conversion Rate</div>
            <div className="text-3xl font-bold">{metrics?.conversionRate}%</div>
          </div>
          <div className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-2">Inventory Util.</div>
            <div className="text-3xl font-bold text-green-600">{metrics?.inventoryUtilization}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="font-bold mb-6">Revenue Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Treatment</div>
                <div className="font-bold">£{metrics?.treatmentRevenue.toLocaleString()}</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm font-medium">Hotel/Travel Affiliate</div>
                <div className="font-bold">£{metrics?.hotelRevenue.toLocaleString()}</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm font-medium">Insurance</div>
                <div className="font-bold">£{metrics?.insuranceRevenue.toLocaleString()}</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="font-bold mb-6">Popular Treatments</h3>
            <div className="space-y-6">
              {metrics?.popularTreatments.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.bookings} bookings</div>
                  </div>
                  <div className="font-bold">£{t.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
