import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioCard } from "@/components/ui/radio-card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface StepInterestProps {
  formData: {
    why_interested: string;
    what_to_gain: string;
    heard_from: string;
  };
  errors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const heardFromOptions = [
  { value: "search", label: "Search Engine", icon: "🔍" },
  { value: "social", label: "Social Media", icon: "📱" },
  { value: "friend", label: "Friend / Colleague", icon: "👥" },
  { value: "email", label: "Email / Newsletter", icon: "📧" },
  { value: "news", label: "News / Blog", icon: "📰" },
  { value: "university", label: "University / School", icon: "🎓" },
  { value: "website", label: "Other Website", icon: "🔗" },
  { value: "other", label: "Other", icon: "💼" },
];

const whatToGainOptions = [
  { id: "skills", label: "Learn new skills", icon: "📚" },
  { id: "network", label: "Network with professionals", icon: "🤝" },
  { id: "career", label: "Career opportunities", icon: "💼" },
  { id: "insights", label: "Industry insights", icon: "🎯" },
  { id: "certification", label: "Certifications", icon: "🏆" },
  { id: "partnerships", label: "Business partnerships", icon: "🚀" },
];

export const StepInterest = ({ formData, errors, onChange, onSelectChange }: StepInterestProps) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState("");

  const handleGoalToggle = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(g => g !== goalId)
      : [...selectedGoals, goalId];
    setSelectedGoals(newGoals);
    
    const goalLabels = newGoals.map(id => whatToGainOptions.find(opt => opt.id === id)?.label).filter(Boolean);
    if (otherGoal) goalLabels.push(otherGoal);
    onSelectChange("what_to_gain", goalLabels.join(", "));
  };

  const handleOtherGoalChange = (value: string) => {
    setOtherGoal(value);
    const goalLabels = selectedGoals.map(id => whatToGainOptions.find(opt => opt.id === id)?.label).filter(Boolean);
    if (value) goalLabels.push(value);
    onSelectChange("what_to_gain", goalLabels.join(", "));
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">About Your Interest</h3>
        <p className="text-sm text-muted-foreground mt-1">Tell us why you want to attend</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="why_interested">Why are you interested in this event? *</Label>
        <Textarea
          id="why_interested"
          name="why_interested"
          value={formData.why_interested}
          onChange={onChange}
          placeholder="Share what excites you about this event..."
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-between text-xs">
          {errors.why_interested && <span className="text-destructive">{errors.why_interested}</span>}
          <span className={formData.why_interested.length >= 10 ? "text-primary" : "text-muted-foreground"}>
            {formData.why_interested.length}/200
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Label>What do you hope to gain? (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {whatToGainOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-3 rounded-lg border-2 border-border bg-card cursor-pointer transition-all hover:border-primary/50 data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
              data-checked={selectedGoals.includes(option.id)}
            >
              <Checkbox
                checked={selectedGoals.includes(option.id)}
                onCheckedChange={() => handleGoalToggle(option.id)}
              />
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
        <Input
          placeholder="Other goals... (optional)"
          value={otherGoal}
          onChange={(e) => handleOtherGoalChange(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-3">
        <Label>How did you hear about this event? (Optional)</Label>
        <RadioGroup
          value={formData.heard_from}
          onValueChange={(value) => onSelectChange("heard_from", value)}
          className="grid grid-cols-2 gap-3"
        >
          {heardFromOptions.map((option) => (
            <RadioCard
              key={option.value}
              value={option.value}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};