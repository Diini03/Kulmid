import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, MapPin, Globe, Users } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.string().min(1, "Date is required"),
  event_type: z.enum(["in-person", "online", "hybrid"]),
  location: z.string().optional(),
  meeting_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.enum(["Seminar", "Workshop", "Conference", "Festival", "Sports"]),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().min(10, "Description must be at least 10 characters"),
}).refine((data) => {
  if (data.event_type === "in-person" || data.event_type === "hybrid") {
    return !!data.location && data.location.length >= 3;
  }
  return true;
}, {
  message: "Location is required for in-person and hybrid events",
  path: ["location"],
}).refine((data) => {
  if (data.event_type === "online" || data.event_type === "hybrid") {
    return !!data.meeting_link;
  }
  return true;
}, {
  message: "Meeting link is required for online and hybrid events",
  path: ["meeting_link"],
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EventForm = ({ event, onSuccess, onCancel }: EventFormProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      title: event.title,
      date: new Date(event.date).toISOString().slice(0, 16),
      event_type: event.event_type || "in-person",
      location: event.location || "",
      meeting_link: event.meeting_link || "",
      category: event.category,
      price: event.price,
      description: event.description || "",
    } : {
      title: "",
      date: "",
      event_type: "in-person",
      location: "",
      meeting_link: "",
      category: "Seminar",
      price: 0,
      description: "",
    }
  });

  const eventType = form.watch("event_type");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("User must be authenticated to upload images");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${currentUser.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: EventFormData) => {
    setUploading(true);
    try {
      // Get current user for created_by
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error("User must be authenticated");
      }

      let imageUrl = event?.image_url;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const eventData = {
        title: data.title,
        date: new Date(data.date).toISOString(),
        event_type: data.event_type,
        location: data.location || null,
        meeting_link: data.meeting_link || null,
        category: data.category,
        price: data.price,
        description: data.description,
        image_url: imageUrl,
        status: event ? undefined : 'approved', // Admin events are auto-approved
        created_by: currentUser.id,
      };

      if (event) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        
        toast({
          title: "Event updated",
          description: "The event has been updated successfully.",
        });
      } else {
        // Generate unique ID for new event
        const id = `ev-${Date.now()}`;
        const { error } = await supabase
          .from('events')
          .insert([{ ...eventData, id }]);

        if (error) throw error;
        
        toast({
          title: "Event created",
          description: "The event has been created successfully.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tech Summit 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the event..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date & Time</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  min={new Date().toISOString().slice(0, 16)}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="event_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Event Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="in-person" id="form-in-person" className="peer sr-only" />
                    <Label
                      htmlFor="form-in-person"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <MapPin className="mb-1 h-5 w-5" />
                      <span className="text-xs font-medium">In-Person</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="online" id="form-online" className="peer sr-only" />
                    <Label
                      htmlFor="form-online"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Globe className="mb-1 h-5 w-5" />
                      <span className="text-xs font-medium">Online</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="hybrid" id="form-hybrid" className="peer sr-only" />
                    <Label
                      htmlFor="form-hybrid"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <Users className="mb-1 h-5 w-5" />
                      <span className="text-xs font-medium">Hybrid</span>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {(eventType === "in-person" || eventType === "hybrid") && (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className={eventType === "in-person" ? "col-span-2" : ""}>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York, NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(eventType === "online" || eventType === "hybrid") && (
            <FormField
              control={form.control}
              name="meeting_link"
              render={({ field }) => (
                <FormItem className={eventType === "online" ? "col-span-2" : ""}>
                  <FormLabel>Meeting Link</FormLabel>
                  <FormControl>
                    <Input placeholder="https://zoom.us/j/..." type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Seminar">Seminar</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Festival">Festival</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Event Image</FormLabel>
          <Input 
            type="file" 
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2"
          />
          {event?.image_url && !imageFile && (
            <p className="text-sm text-muted-foreground mt-1">Current image will be kept if no new image is uploaded</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
};