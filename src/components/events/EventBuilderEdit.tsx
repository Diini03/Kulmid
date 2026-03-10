import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/constants/categories";
import { Save, Sparkles } from "lucide-react";
import AIDescriptionDialog from "@/components/events/AIDescriptionDialog";
import { StripeConnectDialog } from "@/components/events/StripeConnectDialog";

const SOMALI_PHONE_REGEX = /^\+252(61|62|63|65|66|68|69|70|71|73|74|76|77|78|79|90)\d{7}$/;

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  event_type: z.enum(["in-person", "online", "hybrid"]),
  location: z.string().optional(),
  meeting_link: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0).default(0),
  payout_phone: z.string()
    .regex(SOMALI_PHONE_REGEX, "Enter a valid Somali phone number (e.g. +252611234567)")
    .optional()
    .or(z.literal("")),
  host_name: z.string().optional(),
  host_description: z.string().optional(),
  host_email: z.string().email().optional().or(z.literal("")),
  host_phone: z.string().optional(),
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

interface EventBuilderEditProps {
  event: any;
  onUpdate: () => void;
}

const EventBuilderEdit = ({ event, onUpdate }: EventBuilderEditProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(event.image_url || "");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(event.price > 0);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toISOString().slice(0, 16),
      event_type: event.event_type || "in-person",
      location: event.location || "",
      meeting_link: event.meeting_link || "",
      category: event.category,
      price: event.price,
      payout_phone: event.payout_phone || "",
      host_name: event.host_name || "",
      host_description: event.host_description || "",
      host_email: event.host_email || "",
      host_phone: event.host_phone || "",
    },
  });

  const eventType = watch("event_type");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return event.image_url;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("event-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: EventFormData) => {
    setSaving(true);

    try {
      const imageUrl = await uploadImage();

      const { error } = await supabase
        .from("events")
        .update({
          ...data,
          image_url: imageUrl,
          date: new Date(data.date).toISOString(),
        })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description">Description</Label>
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
            <Textarea id="description" {...register("description")} rows={5} />
          </div>

          <AIDescriptionDialog
            open={aiDialogOpen}
            onOpenChange={setAiDialogOpen}
            eventContext={{
              title: watch("title") || event.title,
              category: watch("category"),
              date: watch("date"),
              event_type: watch("event_type"),
              location: watch("location"),
            }}
            onAccept={(description) => {
              setValue("description", description);
            }}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" type="datetime-local" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch("category")}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={eventType}
                onValueChange={(value: any) => setValue("event_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Ticket Pricing</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaid(false);
                    setValue("price", 0);
                    setValue("payout_phone", "");
                  }}
                  className={`rounded-lg border-2 py-2 px-3 text-sm font-medium transition-all ${
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
                  className={`rounded-lg border-2 py-2 px-3 text-sm font-medium transition-all ${
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
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <Label htmlFor="payout_phone">Payout Phone Number</Label>
                  <Input
                    id="payout_phone"
                    type="tel"
                    placeholder="+252611234567"
                    {...register("payout_phone")}
                  />
                  <p className="text-xs text-muted-foreground mt-1">We'll send your earnings to this number</p>
                  {errors.payout_phone && <p className="text-sm text-destructive mt-1">{errors.payout_phone.message}</p>}
                </div>
              </div>
            )}
            </div>
          </div>

          {(eventType === "in-person" || eventType === "hybrid") && (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} placeholder="Event venue address" />
            </div>
          )}

          {(eventType === "online" || eventType === "hybrid") && (
            <div>
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input id="meeting_link" {...register("meeting_link")} placeholder="https://..." />
            </div>
          )}

          <div>
            <Label htmlFor="image">Event Image</Label>
            <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 w-full h-48 object-cover rounded" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Host Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="host_name">Host Name</Label>
              <Input id="host_name" {...register("host_name")} />
            </div>

            <div>
              <Label htmlFor="host_email">Host Email</Label>
              <Input id="host_email" type="email" {...register("host_email")} />
            </div>
          </div>

          <div>
            <Label htmlFor="host_description">Host Bio</Label>
            <Textarea id="host_description" {...register("host_description")} rows={3} />
          </div>

          <div>
            <Label htmlFor="host_phone">Host Phone</Label>
            <Input id="host_phone" {...register("host_phone")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default EventBuilderEdit;
