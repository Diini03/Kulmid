import { Seo } from "@/components/Seo";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

const CalendarView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <>
      <Seo title="Event Calendar" canonical="/calendar" />
      <section className="container max-w-5xl px-4 py-16">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-3 text-primary mb-2">
            <CalendarIcon className="h-7 w-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Event Calendar</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View all events in calendar format and never miss an important date
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendar */}
          <div className="flex-shrink-0 lg:w-auto w-full">
            <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)] hover-lift transition-all w-full lg:w-auto flex justify-center">
              <Calendar 
                mode="single" 
                selected={date}
                onSelect={setDate}
                className="p-3 pointer-events-auto" 
              />
            </div>
          </div>

          {/* Events for selected date */}
          <div className="flex-1">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Events on {date?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <EmptyState
                icon={CalendarIcon}
                title="No events on this date"
                description="Try selecting a different date or browse all upcoming events."
                actionLabel="Browse All Events"
                actionLink="/events"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CalendarView;