import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  organization: z.string().trim().optional(),
  address: z.string().trim().optional(),
  why_interested: z.string().trim().min(10, "Please tell us why you're interested"),
  heard_from: z.string().trim().optional(),
  questions: z.string().trim().optional(),
});

interface SimpleRegistrationFormProps {
  onSubmit: (formData: any) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const HEARD_FROM_OPTIONS = [
  { value: "search", label: "Search Engine" },
  { value: "social", label: "Social Media" },
  { value: "friend", label: "Friend or Colleague" },
  { value: "email", label: "Email / Newsletter" },
  { value: "university", label: "University / School" },
  { value: "other", label: "Other" },
];

export const SimpleRegistrationForm = ({
  onSubmit,
  loading,
  onCancel,
}: SimpleRegistrationFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    organization: "",
    address: "",
    why_interested: "",
    heard_from: "",
    questions: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, heard_from: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium text-foreground">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          className="h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@email.com"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          className="h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone_number" className="text-sm font-medium text-foreground">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          placeholder="+252 7 1123456"
          value={formData.phone_number}
          onChange={handleChange}
          disabled={loading}
          className="h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        {errors.phone_number && (
          <p className="text-sm text-destructive">{errors.phone_number}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="organization" className="text-sm font-medium text-foreground">
          Organization / University
        </Label>
        <Input
          id="organization"
          name="organization"
          placeholder="Your organization or university"
          value={formData.organization}
          onChange={handleChange}
          disabled={loading}
          className="h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-sm font-medium text-foreground">
          Address
        </Label>
        <Input
          id="address"
          name="address"
          placeholder="Your address or location"
          value={formData.address}
          onChange={handleChange}
          disabled={loading}
          className="h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="why_interested" className="text-sm font-medium text-foreground">
          Why are you interested in this event? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="why_interested"
          name="why_interested"
          placeholder="Tell us why you want to attend"
          value={formData.why_interested}
          onChange={handleChange}
          disabled={loading}
          rows={3}
          className="bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
        />
        {errors.why_interested && (
          <p className="text-sm text-destructive">{errors.why_interested}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="heard_from" className="text-sm font-medium text-foreground">
          How did you hear about us?
        </Label>
        <Select value={formData.heard_from} onValueChange={handleSelectChange}>
          <SelectTrigger 
            disabled={loading}
            className="h-12 bg-muted/50 border-0 rounded-lg text-foreground focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          >
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {HEARD_FROM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="questions" className="text-sm font-medium text-foreground">
          Additional comments or questions
        </Label>
        <Textarea
          id="questions"
          name="questions"
          placeholder="Any questions or comments?"
          value={formData.questions}
          onChange={handleChange}
          disabled={loading}
          rows={3}
          className="bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-12 rounded-lg transition-all duration-200"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading} 
          className="flex-1 h-12 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Request to Join"
          )}
        </Button>
      </div>
    </form>
  );
};
