import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";

const OrganizerDashboard = () => {
  return (
    <Layout>
      <Seo title="Organizer" canonical="/organizer" />
      <section className="container py-12 space-y-6">
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Active Events</div>
            <div className="text-3xl font-semibold">3</div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Registrations</div>
            <div className="text-3xl font-semibold">284</div>
          </div>
          <div className="rounded-xl border p-6">
            <div className="text-sm text-muted-foreground">Satisfaction</div>
            <div className="text-3xl font-semibold">94%</div>
          </div>
        </div>
        <Button variant="hero" className="w-fit">Create Event</Button>
      </section>
    </Layout>
  );
};

export default OrganizerDashboard;
