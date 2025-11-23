import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface StepPreferencesProps {
  formData: {
    dietary_restrictions: string;
    special_requirements: string;
    questions: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian", icon: "🥗" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "halal", label: "Halal", icon: "🕌" },
  { id: "kosher", label: "Kosher", icon: "✡️" },
  { id: "nut-allergy", label: "Nut Allergy", icon: "🥜" },
  { id: "shellfish-allergy", label: "Shellfish Allergy", icon: "🦞" },
  { id: "gluten-free", label: "Gluten-Free", icon: "🌾" },
  { id: "lactose-free", label: "Lactose Intolerant", icon: "🥛" },
];

export const StepPreferences = ({ formData, onChange, onSelectChange }: StepPreferencesProps) => {
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [otherDietary, setOtherDietary] = useState("");

  const handleDietaryToggle = (dietaryId: string) => {
    const newDietary = selectedDietary.includes(dietaryId)
      ? selectedDietary.filter(d => d !== dietaryId)
      : [...selectedDietary, dietaryId];
    setSelectedDietary(newDietary);
    
    const dietaryLabels = newDietary.map(id => dietaryOptions.find(opt => opt.id === id)?.label).filter(Boolean);
    if (otherDietary) dietaryLabels.push(otherDietary);
    onSelectChange("dietary_restrictions", dietaryLabels.join(", "));
  };

  const handleOtherDietaryChange = (value: string) => {
    setOtherDietary(value);
    const dietaryLabels = selectedDietary.map(id => dietaryOptions.find(opt => opt.id === id)?.label).filter(Boolean);
    if (value) dietaryLabels.push(value);
    onSelectChange("dietary_restrictions", dietaryLabels.join(", "));
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Preferences & Requirements</h3>
        <p className="text-sm text-muted-foreground mt-1">Help us make your experience comfortable</p>
      </div>

      <div className="space-y-3">
        <Label>Dietary Restrictions (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {dietaryOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 p-3 rounded-lg border-2 border-border bg-card cursor-pointer transition-all hover:border-primary/50 data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
              data-checked={selectedDietary.includes(option.id)}
            >
              <Checkbox
                checked={selectedDietary.includes(option.id)}
                onCheckedChange={() => handleDietaryToggle(option.id)}
              />
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
        <Input
          placeholder="Other dietary restrictions... (optional)"
          value={otherDietary}
          onChange={(e) => handleOtherDietaryChange(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="special_requirements">Accessibility / Special Requirements (Optional)</Label>
        <Textarea
          id="special_requirements"
          name="special_requirements"
          value={formData.special_requirements}
          onChange={onChange}
          placeholder="Let us know if you need any special accommodations..."
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="questions">Questions for the Organizer (Optional)</Label>
        <Textarea
          id="questions"
          name="questions"
          value={formData.questions}
          onChange={onChange}
          placeholder="Any questions or special requests..."
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          ✅ Almost done! Review and submit on the next step.
        </p>
      </div>
    </div>
  );
};