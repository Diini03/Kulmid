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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phone_number}
          onChange={handleChange}
          disabled={loading}
        />
        {errors.phone_number && (
          <p className="text-sm text-destructive">{errors.phone_number}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization">Organization / University</Label>
        <Input
          id="organization"
          name="organization"
          placeholder="Enter your organization or university"
          value={formData.organization}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address / Location</Label>
        <Input
          id="address"
          name="address"
          placeholder="Enter your address or location"
          value={formData.address}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="why_interested">
          Why are you interested in this event?{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="why_interested"
          name="why_interested"
          placeholder="Tell us why you want to attend this event"
          value={formData.why_interested}
          onChange={handleChange}
          disabled={loading}
          rows={3}
        />
        {errors.why_interested && (
          <p className="text-sm text-destructive">{errors.why_interested}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="heard_from">How did you hear about us?</Label>
        <Select value={formData.heard_from} onValueChange={handleSelectChange}>
          <SelectTrigger disabled={loading}>
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

      <div className="space-y-2">
        <Label htmlFor="questions">Additional comments or questions</Label>
        <Textarea
          id="questions"
          name="questions"
          placeholder="Any additional comments or questions?"
          value={formData.questions}
          onChange={handleChange}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </form>
  );
};
