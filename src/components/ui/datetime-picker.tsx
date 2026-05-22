import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  /** ISO-like value usable by datetime-local: "YYYY-MM-DDTHH:mm" */
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** Convert a Date to local "YYYY-MM-DDTHH:mm" string (matches <input type=datetime-local> format) */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseValue(v?: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  min,
  placeholder = "Pick date & time",
  className,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false);
  const current = parseValue(value);
  const minDate = parseValue(min);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const update = (next: Date) => {
    if (minDate && next < minDate) return;
    onChange?.(toLocalInput(next));
  };

  const handleDay = (day?: Date) => {
    if (!day) return;
    const base = current ?? new Date();
    const next = new Date(day);
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    update(next);
  };

  const handleHour = (h: number) => {
    const base = current ?? new Date();
    const next = new Date(base);
    next.setHours(h, base.getMinutes(), 0, 0);
    update(next);
  };

  const handleMinute = (m: number) => {
    const base = current ?? new Date();
    const next = new Date(base);
    next.setMinutes(m, 0, 0);
    update(next);
  };

  const display = current ? format(current, "EEE, MMM d, yyyy · h:mm a") : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11",
            !current && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {display ?? placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <Calendar
            mode="single"
            selected={current}
            onSelect={handleDay}
            disabled={minDate ? (d) => d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : undefined}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="border-t sm:border-t-0 sm:border-l p-2 flex flex-row sm:flex-col gap-2 bg-muted/30">
            <div className="flex items-center gap-1.5 px-2 pt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Clock className="h-3 w-3" /> Time
            </div>
            <div className="flex gap-1 sm:gap-0 sm:flex-row">
              <ScrollArea className="h-32 sm:h-56 w-14">
                <div className="flex flex-col p-1 gap-0.5">
                  {hours.map((h) => {
                    const active = current?.getHours() === h;
                    return (
                      <Button
                        key={h}
                        type="button"
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs justify-center"
                        onClick={() => handleHour(h)}
                      >
                        {String(h).padStart(2, "0")}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
              <ScrollArea className="h-32 sm:h-56 w-14">
                <div className="flex flex-col p-1 gap-0.5">
                  {minutes.map((m) => {
                    const active = current?.getMinutes() === m;
                    return (
                      <Button
                        key={m}
                        type="button"
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs justify-center"
                        onClick={() => handleMinute(m)}
                      >
                        {String(m).padStart(2, "0")}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const now = new Date();
              now.setSeconds(0, 0);
              update(now);
            }}
          >
            Now
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePicker;