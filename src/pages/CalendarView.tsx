import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Calendar } from "@/components/ui/calendar";

const CalendarView = () => {
  return (
    <Layout>
      <Seo title="Calendar" canonical="/calendar" />
      <section className="container py-12">
        <h1 className="text-2xl font-bold mb-6">Calendar</h1>
        <div className="rounded-xl border p-4 w-fit">
          <Calendar mode="single" className="p-3 pointer-events-auto" />
        </div>
      </section>
    </Layout>
  );
};

export default CalendarView;
