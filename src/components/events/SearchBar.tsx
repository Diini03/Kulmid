import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchValues {
  location?: string;
  date?: Date;
  category?: string;
}

interface Props {
  onSearch?: (values: SearchValues) => void;
  compact?: boolean;
}

export const SearchBar = ({ onSearch, compact }: Props) => {
  const [location, setLocation] = React.useState<string | undefined>();
  const [date, setDate] = React.useState<Date | undefined>();
  const [category, setCategory] = React.useState<string | undefined>();

  const submit = () => onSearch?.({ location, date, category });

  return (
    <div className={cn("w-full grid gap-3", compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-4")}> 
      <Select value={location} onValueChange={setLocation}>
        <SelectTrigger 
          aria-label="Location"
          className="hover-lift transition-all"
        >
          <MapPin className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent className="z-50">
          <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
          <SelectItem value="Austin, TX">Austin, TX</SelectItem>
          <SelectItem value="New York, NY">New York, NY</SelectItem>
          <SelectItem value="Berlin, DE">Berlin, DE</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="justify-start hover-lift transition-all"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger 
          aria-label="Category"
          className="hover-lift transition-all"
        >
          <Tag className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="z-50">
          <SelectItem value="Seminar">Seminar</SelectItem>
          <SelectItem value="Workshop">Workshop</SelectItem>
          <SelectItem value="Conference">Conference</SelectItem>
          <SelectItem value="Festival">Festival</SelectItem>
          <SelectItem value="Webinar">Webinar</SelectItem>
          <SelectItem value="Meetup">Meetup</SelectItem>
        </SelectContent>
      </Select>

      <Button 
        onClick={submit} 
        className={cn(
          "hover-lift transition-all",
          compact ? "w-full" : ""
        )}
      >
        Search Events
      </Button>
    </div>
  );
};
