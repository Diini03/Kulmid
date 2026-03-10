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
import { useState, useEffect } from "react";
import { Loader2, MapPin, Globe, Users, Building2, Upload, Check, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { coverImages } from "@/constants/coverImages";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { StripeConnectDialog } from "@/components/events/StripeConnectDialog";

const SOMALI_PHONE_REGEX = /^\+252(61|62|63|65|66|68|69|70|71|73|74|76|77|78|79|90)\d{7}$/;

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.string().min(1, "Date is required"),
  event_type: z.enum(["in-person", "online", "hybrid"]),
  location: z.string().optional(),
  meeting_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.enum(["Seminar", "Workshop", "Conference", "Festival", "Webinar", "Meetup"]),
  price: z.number().min(0, "Price must be positive"),
  payout_phone: z.string()
    .regex(SOMALI_PHONE_REGEX, "Enter a valid Somali phone number (e.g. +252611234567)")
    .optional()
    .or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),
  host_name: z.string().min(2, "Host name must be at least 2 characters").max(100, "Host name must be less than 100 characters"),
  host_description: z.string().max(500, "Host description must be less than 500 characters").optional().or(z.literal("")),
  host_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  host_phone: z.string().max(20, "Phone number must be less than 20 characters").optional().or(z.literal("")),
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
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(
    event?.image_url || coverImages[Math.floor(Math.random() * coverImages.length)].src
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [showHostDetails, setShowHostDetails] = useState(!!event?.host_name);
  const [isPaid, setIsPaid] = useState(event ? event.price > 0 : false);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
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
      payout_phone: event.payout_phone || "",
      description: event.description || "",
      host_name: event.host_name || "",
      host_description: event.host_description || "",
      host_email: event.host_email || "",
      host_phone: event.host_phone || "",
    } : {
      title: "",
      date: "",
      event_type: "in-person",
      location: "",
      meeting_link: "",
      category: "Seminar",
      price: 0,
      payout_phone: "",
      description: "",
      host_name: "",
      host_description: "",
      host_email: "",
      host_phone: "",
    }
  });

  const eventType = form.watch("event_type");
  const selectedCategory = form.watch("category");

  // Auto-set Webinar to online format
  useEffect(() => {
    if (selectedCategory === "Webinar") {
      form.setValue('event_type', 'online');
      form.setValue('location', '');
    }
  }, [selectedCategory]);

  // Auto-fill host info from current user when not customizing
  useEffect(() => {
    if (showHostDetails || event) return;
    const fillHostInfo = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      form.setValue('host_name', profile?.full_name || currentUser.email?.split('@')[0] || '');
      form.setValue('host_email', currentUser.email || '');
    };
    fillHostInfo();
  }, [showHostDetails, event]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
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
      setSelectedCoverUrl(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    // Validate image is selected for new events
    if (!event && !imageFile && !selectedCoverUrl) {
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
      // Get current user for created_by
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error("User must be authenticated");
      }

      let imageUrl = selectedCoverUrl || event?.image_url;

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
        payout_phone: data.payout_phone || null,
        description: data.description,
        image_url: imageUrl,
        status: event ? undefined : 'approved', // Admin events are auto-approved
        created_by: currentUser.id,
        host_name: data.host_name,
        host_description: data.host_description || null,
        host_email: data.host_email || null,
        host_phone: data.host_phone || null,
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
        const { generateEventId } = await import('@/lib/utils');
        const id = generateEventId();
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
                  <SelectItem value="Webinar">Webinar</SelectItem>
                  <SelectItem value="Meetup">Meetup</SelectItem>
                </SelectContent>
              </Select>
              {selectedCategory === "Webinar" && (
                <p className="text-xs text-muted-foreground">Webinars are automatically set as online events</p>
              )}
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
              {selectedCategory === "Webinar" && (
                <p className="text-xs text-muted-foreground">Format is locked to Online for Webinars</p>
              )}
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={selectedCategory === "Webinar"}
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
                    <p className="text-xs text-muted-foreground">We'll send your earnings to this number</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Host Information Section */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Host Information</h3>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="admin-host-toggle" className="text-sm text-muted-foreground">
                Customize
              </Label>
              <Switch
                id="admin-host-toggle"
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
            <div className="space-y-4">
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
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Max 500 characters</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-3">
          <FormLabel>
            Event Cover Image {!event && <span className="text-destructive">*</span>}
          </FormLabel>

          {/* Clickable Preview */}
          <button
            type="button"
            onClick={() => setCoverDialogOpen(true)}
            className="w-full rounded-lg border-2 border-muted overflow-hidden cursor-pointer hover:border-primary/50 transition-all group relative"
          >
            <img
              src={imagePreview || selectedCoverUrl || ""}
              alt="Selected cover"
              className="w-full aspect-[16/9] object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-center text-white">
                <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs font-medium">Change Image</p>
              </div>
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

              <label
                htmlFor="admin-image-upload"
                className="block rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-all bg-muted/20 p-8"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Drag & drop or click here to upload.</p>
                  <p className="text-xs text-muted-foreground mt-1">Or choose an image below. Max 5MB.</p>
                </div>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleImageChange(e);
                  if (e.target.files?.[0]) {
                    setCoverDialogOpen(false);
                  }
                }}
                className="hidden"
                id="admin-image-upload"
              />

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
                    <img src={cover.src} alt={cover.label} className="w-full h-full object-cover" loading="lazy" />
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

      <StripeConnectDialog isOpen={stripeDialogOpen} onClose={() => setStripeDialogOpen(false)} />
    </Form>
  );
};