import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar, MapPin, Globe, Users } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  date: z.string().min(1, "Date is required"),
  event_type: z.enum(["in-person", "online", "hybrid"]),
  location: z.string().optional(),
  meeting_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.enum(["Seminar", "Workshop", "Conference", "Festival", "Sports"]),
  price: z.number().min(0, "Price must be 0 or higher"),
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

const CreateEvent = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      event_type: "in-person",
      location: "",
      meeting_link: "",
      category: "Seminar",
      price: 0,
    }
  });

  const eventType = form.watch("event_type");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) {
      throw new Error("User must be authenticated to upload images");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create an event.",
        variant: "destructive",
      });
      navigate("/signin");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const eventData = {
        id: `ev-${Date.now()}`,
        title: data.title,
        description: data.description,
        date: new Date(data.date).toISOString(),
        event_type: data.event_type,
        location: data.location || null,
        meeting_link: data.meeting_link || null,
        category: data.category,
        price: data.price,
        image_url: imageUrl,
        status: 'pending',
        created_by: user.id,
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;
      
      toast({
        title: "Event submitted!",
        description: "Your event has been submitted for review. You'll be notified once it's approved.",
      });

      navigate("/my-events");
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

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate("/signin");
    return null;
  }

  return (
    <Layout>
      <Seo title="Create Event" description="Submit your event for review" canonical="/create-event" />
      
      <div className="container max-w-3xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Your Event</h1>
          <p className="text-muted-foreground">
            Fill in the details below to submit your event for approval
          </p>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Event Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Summer Tech Conference 2025" 
                        className="text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What's your event about? What can attendees expect?"
                        className="min-h-[120px] text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Be descriptive - tell attendees what makes your event special
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date & Time */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        min={new Date().toISOString().slice(0, 16)}
                        className="text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Type */}
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
                          <RadioGroupItem
                            value="in-person"
                            id="in-person"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="in-person"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <MapPin className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">In-Person</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="online"
                            id="online"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="online"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Globe className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Online</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="hybrid"
                            id="hybrid"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="hybrid"
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Users className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Hybrid</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Location - show for in-person and hybrid */}
                {(eventType === "in-person" || eventType === "hybrid") && (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. New York, NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Meeting Link - show for online and hybrid */}
                {(eventType === "online" || eventType === "hybrid") && (
                  <FormField
                    control={form.control}
                    name="meeting_link"
                    render={({ field }) => (
                      <FormItem className={eventType === "online" ? "md:col-span-2" : ""}>
                        <FormLabel>Meeting Link</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://zoom.us/j/..." 
                            type="url"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Zoom, Google Meet, or other video conferencing link
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Category */}
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

                {/* Price */}
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
                          min="0"
                          step="0.01"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Use 0 for free events</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <FormLabel>Cover Image</FormLabel>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-4 rounded-lg overflow-hidden border">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Choose a high-quality image that represents your event
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/events")}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading} size="lg">
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Review
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Your event will be reviewed by our team before going live. 
            You'll receive a notification once it's approved. Check your submissions in{" "}
            <a href="/my-events" className="text-primary hover:underline">My Events</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEvent;
