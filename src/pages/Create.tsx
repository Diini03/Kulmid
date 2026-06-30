import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar, MapPin, Globe, Users, Upload, Image as ImageIcon, Building2, Sparkles, ChevronDown, Check, X, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { coverImages } from "@/constants/coverImages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AIDescriptionDialog from "@/components/events/AIDescriptionDialog";
import { StripeConnectDialog } from "@/components/events/StripeConnectDialog";

const SOMALI_PHONE_REGEX = /^\+252(61|62|63|65|66|68|69|70|71|73|74|76|77|78|79|90)\d{7}$/;

const optionalUrl = z.string().url("Must be a valid URL").optional().or(z.literal(""));

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  event_type: z.enum(["in-person", "online", "hybrid"]),
  location: z.string().optional(),
  meeting_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().max(40, "Category must be 40 characters or fewer").optional().or(z.literal("")),
  price: z.number().min(0, "Price must be 0 or higher"),
  payout_phone: z.string()
    .regex(SOMALI_PHONE_REGEX, "Enter a valid Somali phone number (e.g. +252611234567)")
    .optional()
    .or(z.literal("")),
  capacity_type: z.enum(["unlimited", "limited"]).default("unlimited"),
  max_attendees: z.number().int().positive().nullable().optional(),
  host_name: z.string().min(2, "Host name must be at least 2 characters").max(100, "Host name must be less than 100 characters"),
  host_description: z.string().max(500, "Host description must be less than 500 characters").optional().or(z.literal("")),
  host_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  host_phone: z.string().max(20, "Phone number must be less than 20 characters").optional().or(z.literal("")),
  facebook_url: optionalUrl,
  twitter_url: optionalUrl,
  instagram_url: optionalUrl,
  linkedin_url: optionalUrl,
  website_url: optionalUrl,
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
}).refine((data) => {
  if (data.price > 0) {
    return !!data.payout_phone && data.payout_phone.length > 0;
  }
  return true;
}, {
  message: "Payout phone number is required for paid events",
  path: ["payout_phone"],
}).refine((data) => {
  if (data.capacity_type === "limited") {
    return !!data.max_attendees && data.max_attendees > 0;
  }
  return true;
}, {
  message: "Enter a capacity of at least 1",
  path: ["max_attendees"],
}).refine((data) => {
  if (data.end_date && data.date) {
    return new Date(data.end_date) > new Date(data.date);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type EventFormData = z.infer<typeof eventSchema>;

const Create = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { categories } = useCategories();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(() => {
    const random = coverImages[Math.floor(Math.random() * coverImages.length)];
    return random.src;
  });
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [showHostDetails, setShowHostDetails] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      end_date: "",
      event_type: "in-person",
      location: "",
      meeting_link: "",
      category: "Seminar",
      price: 0,
      payout_phone: "",
      capacity_type: "unlimited",
      max_attendees: null,
      host_name: "",
      host_description: "",
      host_email: "",
      host_phone: "",
      facebook_url: "",
      twitter_url: "",
      instagram_url: "",
      linkedin_url: "",
      website_url: "",
    }
  });

  const eventType = form.watch("event_type");
  const selectedCategory = form.watch("category");

  // Auto-set Webinar to online format
  useEffect(() => {
    if (selectedCategory === "Webinar") {
      form.setValue('event_type', 'online');
      form.setValue('location', 'Online');
    }
  }, [selectedCategory]);

  // Persist form data to sessionStorage on every change
  useEffect(() => {
    const subscription = form.watch((values) => {
      sessionStorage.setItem('event-draft', JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Restore form data from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('event-draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to restore form data:', e);
      }
    }
  }, []);

  // Track when initial auth check is complete
  useEffect(() => {
    if (!authLoading) {
      setInitialAuthChecked(true);
    }
  }, [authLoading]);

  // Auto-fill host info from profile
  useEffect(() => {
    if (!user || showHostDetails) return;
    const fillHostInfo = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      form.setValue('host_name', profile?.full_name || user.email?.split('@')[0] || '');
      form.setValue('host_email', user.email || '');
    };
    fillHostInfo();
  }, [user, showHostDetails]);

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
      setImageError(null);
      
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

    // Validate image is selected (either gallery or uploaded)
    if (!imageFile && !selectedCoverUrl) {
      setImageError("Event image is required");
      toast({
        title: "Image required",
        description: "Please select a cover image or upload your own",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl: string | null = selectedCoverUrl;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // All events are published instantly; admins can later feature on Discover
      const eventStatus = 'published';
      const normalizedLocation = data.event_type === "online" ? "Online" : data.location?.trim();

      const eventId = (await import('@/lib/utils')).generateEventId();
      const eventData = {
        id: eventId,
        title: data.title,
        description: data.description,
        date: new Date(data.date).toISOString(),
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        event_type: data.event_type,
        location: normalizedLocation,
        meeting_link: data.meeting_link || null,
        category: data.category && data.category.trim() ? data.category.trim() : null,
        price: data.price,
        payout_phone: data.payout_phone || null,
        max_attendees: data.capacity_type === "limited" ? data.max_attendees ?? null : null,
        image_url: imageUrl,
        status: eventStatus,
        created_by: user.id,
        host_name: data.host_name,
        host_description: data.host_description || null,
        host_email: data.host_email || null,
        host_phone: data.host_phone || null,
        facebook_url: data.facebook_url || null,
        twitter_url: data.twitter_url || null,
        instagram_url: data.instagram_url || null,
        linkedin_url: data.linkedin_url || null,
        website_url: data.website_url || null,
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;
      
      // Clear saved draft on successful submission
      sessionStorage.removeItem('event-draft');
      
      toast({
        title: "🎉 Your event is published",
        description: "Share your link to start getting registrations. Talk to Kulmid to add your event in Discover for better engagement.",
      });
      navigate(`/event/${eventId}/builder`);
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

  // Only show loading on initial auth check, not on subsequent token refreshes
  if (!initialAuthChecked && authLoading) {
    const loadingContent = (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
    return isAdmin ? <AdminLayout>{loadingContent}</AdminLayout> : loadingContent;
  }

  if (!user && initialAuthChecked) {
    navigate("/signin");
    return null;
  }

  const content = (
    <>
      <Seo title="Create Event" description="Create and publish your event" canonical="/create" />
      
      <div className="container max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            Publish instantly — share your event link the moment you save.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left Side - Image Upload */}
              <div className="lg:col-span-2">
                <div className="sticky top-20 space-y-4">
                  <FormLabel className="text-base mb-3 block">
                    Event Cover Image <span className="text-destructive">*</span>
                  </FormLabel>

                  {/* Clickable Preview - opens dialog */}
                  <button
                    type="button"
                    onClick={() => setCoverDialogOpen(true)}
                    className="w-full rounded-xl border-2 border-muted overflow-hidden cursor-pointer hover:border-primary/50 transition-all group relative"
                  >
                    <img
                      src={imagePreview || selectedCoverUrl || ""}
                      alt="Selected cover"
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent py-3 px-4 flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="h-4 w-4 text-white" />
                      <p className="text-sm font-medium text-white">Change Image</p>
                    </div>
                  </button>

                  {imageError && (
                    <p className="text-sm text-destructive">{imageError}</p>
                  )}

                  {/* Cover Image Dialog */}
                  <Dialog open={coverDialogOpen} onOpenChange={setCoverDialogOpen}>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Choose Image</DialogTitle>
                      </DialogHeader>

                      {/* Upload Area */}
                      <label
                        htmlFor="image-upload"
                        className="block rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-all bg-muted/20 p-8"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                          <p className="text-sm font-medium text-foreground">
                            Drag & drop or click here to upload.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Or choose an image below. Max 5MB.
                          </p>
                        </div>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          handleImageChange(e);
                          if (e.target.files?.[0]) {
                            setSelectedCoverUrl(null);
                            setCoverDialogOpen(false);
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                      />

                      {/* Gallery Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {coverImages.map((cover) => (
                          <button
                            key={cover.id}
                            type="button"
                            onClick={() => {
                              setSelectedCoverUrl(cover.src);
                              setImageFile(null);
                              setImagePreview(null);
                              setImageError(null);
                              setCoverDialogOpen(false);
                            }}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] group ${
                              selectedCoverUrl === cover.src && !imageFile
                                ? "border-primary ring-2 ring-primary/30"
                                : "border-transparent hover:border-muted-foreground/30"
                            }`}
                          >
                            <img
                              src={cover.src}
                              alt={cover.label}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {selectedCoverUrl === cover.src && !imageFile && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary rounded-full p-1">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[10px] text-white text-center truncate">{cover.label}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
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

                  {/* Category - Horizontal Chips */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = field.value === cat.name;
                            return (
                              <button
                                key={cat.name}
                                type="button"
                                onClick={() => field.onChange(cat.name)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                        {selectedCategory === "Webinar" && (
                          <p className="text-xs text-muted-foreground">Webinars are automatically set as online events</p>
                        )}
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
                        <div className="flex items-center justify-between mb-2">
                          <FormLabel>Description</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiDialogOpen(true)}
                            className="h-8 gap-1"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="text-xs">Suggest with AI</span>
                          </Button>
                        </div>
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

                  <AIDescriptionDialog
                    open={aiDialogOpen}
                    onOpenChange={setAiDialogOpen}
                    eventContext={{
                      title: form.watch("title") || "Your Event",
                      category: form.watch("category"),
                      date: form.watch("date"),
                      event_type: form.watch("event_type"),
                      location: form.watch("location"),
                    }}
                    onAccept={(description) => {
                      form.setValue("description", description);
                    }}
                  />

                  {/* Date & Time */}
                  <div className="space-y-3">
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date & Time
                    </FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase tracking-wide">Start</FormLabel>
                            <FormControl>
                              <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                min={new Date().toISOString().slice(0, 16)}
                                placeholder="Pick start date & time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase tracking-wide">End (Optional)</FormLabel>
                            <FormControl>
                              <DateTimePicker
                                value={field.value}
                                onChange={field.onChange}
                                min={form.watch("date") || new Date().toISOString().slice(0, 16)}
                                placeholder="Pick end date & time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Event Type */}
                  <FormField
                    control={form.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Event Format</FormLabel>
                        {selectedCategory === "Webinar" && (
                          <p className="text-xs text-muted-foreground">Format is locked to Online for Webinars</p>
                        )}
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={selectedCategory === "Webinar"}
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

                  {/* Ticket Pricing */}
                  <div className="space-y-4">
                    <FormLabel>Ticket Pricing</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaid(false);
                          form.setValue("price", 0);
                          form.setValue("payout_phone", "");
                        }}
                        className={`rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                          !isPaid
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setStripeDialogOpen(true)}
                        className={`rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                          isPaid
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        Paid
                      </button>
                    </div>

                    {isPaid && (
                      <div className="space-y-4 pt-2">
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
                                  min="0.01"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="payout_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payout Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+252611234567"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                We'll send your earnings to this number
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity Section */}
                <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Capacity</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="capacity_type"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange("unlimited");
                              form.setValue("max_attendees", null);
                            }}
                            className={`rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                              field.value === "unlimited"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                            }`}
                          >
                            Unlimited
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("limited")}
                            className={`rounded-lg border-2 py-2.5 px-4 text-sm font-medium transition-all ${
                              field.value === "limited"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                            }`}
                          >
                            Limited
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("capacity_type") === "limited" && (
                    <FormField
                      control={form.control}
                      name="max_attendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum attendees</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="e.g. 100"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                field.onChange(v === "" ? null : parseInt(v, 10));
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Attendees will see how many spots are left.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Host Information Section */}
                <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Host Information</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="host-toggle" className="text-sm text-muted-foreground">
                        Customize
                      </Label>
                      <Switch
                        id="host-toggle"
                        checked={showHostDetails}
                        onCheckedChange={setShowHostDetails}
                      />
                    </div>
                  </div>

                  {!showHostDetails && (
                    <p className="text-sm text-muted-foreground">
                      Host info will be auto-filled from your profile ({form.watch('host_name') || 'your name'}, {form.watch('host_email') || 'your email'}).
                    </p>
                  )}

                  {showHostDetails && (
                    <div className="space-y-6 pt-2">
                      <FormField
                        control={form.control}
                        name="host_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Host Name/Organization *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Tech Innovators Inc. or John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="host_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>About the Host (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Brief description about the hosting organization or individual..."
                                className="min-h-[100px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Max 500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="host_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contact@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="host_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links Section */}
                <Collapsible>
                  <div className="bg-card rounded-xl border shadow-sm p-6">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Social Links</h3>
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">Add social media or website links for attendees to follow.</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="facebook_url" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</FormLabel>
                            <FormControl><Input type="url" placeholder="https://facebook.com/..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="twitter_url" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter / X</FormLabel>
                            <FormControl><Input type="url" placeholder="https://x.com/..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="instagram_url" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</FormLabel>
                            <FormControl><Input type="url" placeholder="https://instagram.com/..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="linkedin_url" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</FormLabel>
                            <FormControl><Input type="url" placeholder="https://linkedin.com/..." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="website_url" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</FormLabel>
                          <FormControl><Input type="url" placeholder="https://yourwebsite.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CollapsibleContent>
                  </div>
                </Collapsible>

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
                      Track your submission in <a href="/events" className="text-primary hover:underline font-medium">My Events</a>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>

      <StripeConnectDialog isOpen={stripeDialogOpen} onClose={() => setStripeDialogOpen(false)} />
    </>
  );

  if (isAdmin) {
    return <AdminLayout>{content}</AdminLayout>;
  }

  return content;
};

export default Create;
