import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioCard } from "@/components/ui/radio-card";

interface StepProfessionalProps {
  formData: {
    organization: string;
    job_title: string;
    degree: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const jobTitleOptions = [
  { value: "executive", label: "Executive / C-Level", icon: "👔" },
  { value: "manager", label: "Manager / Team Lead", icon: "👨‍💼" },
  { value: "developer", label: "Developer / Engineer", icon: "👨‍💻" },
  { value: "analyst", label: "Analyst / Researcher", icon: "📊" },
  { value: "student", label: "Student", icon: "🎓" },
  { value: "educator", label: "Teacher / Educator", icon: "👨‍🏫" },
  { value: "freelancer", label: "Freelancer / Consultant", icon: "💼" },
  { value: "other", label: "Other", icon: "✏️" },
];

export const StepProfessional = ({ formData, onChange, onSelectChange }: StepProfessionalProps) => {
  return (
    <div className="space-y-6 animate-enter">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Professional Background</h3>
        <p className="text-sm text-muted-foreground mt-1">Help us understand your professional profile</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="organization">Organization / Company (Optional)</Label>
        <Input
          id="organization"
          name="organization"
          value={formData.organization}
          onChange={onChange}
          placeholder="Your organization"
          className="h-11"
        />
      </div>

      <div className="space-y-3">
        <Label>Your Role (Optional)</Label>
        <RadioGroup
          value={formData.job_title}
          onValueChange={(value) => onSelectChange("job_title", value)}
          className="grid grid-cols-2 gap-3"
        >
          {jobTitleOptions.map((option) => (
            <RadioCard
              key={option.value}
              value={option.value}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </RadioGroup>
        {formData.job_title === "other" && (
          <Input
            name="job_title_custom"
            placeholder="Please specify your role"
            className="h-11 mt-2"
            onChange={(e) => onSelectChange("job_title", e.target.value)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="degree">Education Level (Optional)</Label>
        <Select value={formData.degree} onValueChange={(value) => onSelectChange("degree", value)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select your education level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high-school">High School</SelectItem>
            <SelectItem value="associate">Associate Degree</SelectItem>
            <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
            <SelectItem value="master">Master's Degree</SelectItem>
            <SelectItem value="phd">PhD / Doctorate</SelectItem>
            <SelectItem value="certificate">Professional Certificate</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};