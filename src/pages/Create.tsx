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
import { Loader2, Calendar, MapPin, Globe, Users, Upload, Image as ImageIcon } from "lucide-react";

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

const Create = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
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
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      
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

      // Admin events get 'approved' status, user events get 'pending'
      const eventStatus = isAdmin ? 'approved' : 'pending';

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
        status: eventStatus,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;
      
      // Different messages for admin vs regular user
      if (isAdmin) {
        toast({
          title: "Event published!",
          description: "Your event is now live and visible to all users.",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Event submitted!",
          description: "Your event has been submitted for review. You'll be notified once it's approved.",
        });
        navigate("/my-events");
      }
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
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <Seo title="Create Event" description="Create and publish your event" canonical="/create" />
      
      <div className="container max-w-6xl py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Create an event that will be published immediately" 
              : "Submit your event for review and approval"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left Side - Image Upload */}
              <div className="lg:col-span-2">
                <div className="sticky top-20">
                  <FormLabel className="text-base mb-3 block">Event Cover Image</FormLabel>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`block rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                        imagePreview ? 'border-primary' : 'border-muted-foreground/25 hover:border-primary/50'
                      }`}
                    >
                      {imagePreview ? (
                        <div className="relative group">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full aspect-[4/3] object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center text-white">
                              <Upload className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm font-medium">Change Image</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] flex flex-col items-center justify-center p-6 bg-muted/30">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-sm font-medium text-foreground mb-1">
                            Click to upload cover image
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a high-quality image that represents your event
                  </p>
                </div>
              </div>

              {/* Right Side - Form Fields */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
                  {/* Event Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
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
                            placeholder="Tell attendees what makes your event special..."
                            className="min-h-[120px] text-base resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value.length}/2000 characters
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
                        <FormLabel>Event Format</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-3"
                          >
                            <div>
                              <RadioGroupItem
                                value="in-person"
                                id="in-person"
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor="in-person"
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:border-accent-foreground/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                              >
                                <MapPin className="mb-2 h-5 w-5" />
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
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:border-accent-foreground/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                              >
                                <Globe className="mb-2 h-5 w-5" />
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
                                className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:border-accent-foreground/20 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                              >
                                <Users className="mb-2 h-5 w-5" />
                                <span className="text-sm font-medium">Hybrid</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location & Meeting Link */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {(eventType === "in-person" || eventType === "hybrid") && (
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem className={eventType === "in-person" ? "md:col-span-2" : ""}>
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
                          <FormItem className={eventType === "online" ? "md:col-span-2" : ""}>
                            <FormLabel>Meeting Link</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://zoom.us/j/..."
                                type="url"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Category & Price */}
                  <div className="grid gap-4 md:grid-cols-2">
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
                          <FormLabel>Ticket Price ($)</FormLabel>
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
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={uploading}
                    className="sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading} size="lg" className="sm:order-2">
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAdmin ? "Publish Event" : "Submit for Review"}
                  </Button>
                </div>

                {!isAdmin && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Your event will be reviewed before going live.
                      Track your submission in <a href="/my-events" className="text-primary hover:underline font-medium">My Events</a>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default Create;
