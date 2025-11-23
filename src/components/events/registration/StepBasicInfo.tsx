import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepBasicInfoProps {
  formData: {
    name: string;
    email: string;
    phone_number: string;
  };
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StepBasicInfo = ({ formData, errors, onChange }: StepBasicInfoProps) => {
  return (
    <div className="space-y-6 animate-enter">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Let's start with the basics</h3>
        <p className="text-sm text-muted-foreground mt-1">We'll need your contact information</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="John Doe"
          className="h-11"
          autoFocus
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          placeholder="john@example.com"
          className="h-11"
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number *</Label>
        <Input
          id="phone_number"
          name="phone_number"
          value={formData.phone_number}
          onChange={onChange}
          placeholder="+252 61 234 5678"
          className="h-11"
        />
        {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number}</p>}
      </div>
    </div>
  );
};