import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationField {
  id: string;
  field_key: string;
  label: string;
  is_enabled: boolean;
  is_required: boolean;
  sort_order: number;
}

interface CustomQuestion {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
}

interface SimpleRegistrationFormProps {
  eventId: string;
  onSubmit: (formData: any, customAnswers: { question_id: string; answer_text?: string; answer_boolean?: boolean; answer_option?: string }[]) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const inputClass = "h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200";

export const SimpleRegistrationForm = ({
  eventId,
  onSubmit,
  loading,
  onCancel,
}: SimpleRegistrationFormProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone_number: "",
    organization: "",
  });
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      const [fieldsRes, questionsRes] = await Promise.all([
        supabase
          .from("event_registration_fields")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order"),
        supabase
          .from("event_registration_questions")
          .select("*")
          .eq("event_id", eventId)
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (fieldsRes.data) setFields(fieldsRes.data as RegistrationField[]);
      if (questionsRes.data) {
        setQuestions(
          (questionsRes.data as any[]).map((q) => ({
            ...q,
            options: q.options as string[] | null,
          }))
        );
      }
      setConfigLoading(false);
    };
    fetchConfig();
  }, [eventId]);

  const enabledFields = fields.filter((f) => f.is_enabled);
  // Fallback: if no field config exists (old events), show defaults
  const hasFieldConfig = fields.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCustomChange = (questionId: string, value: string | boolean) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[`q_${questionId}`]) setErrors((prev) => ({ ...prev, [`q_${questionId}`]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate built-in fields
    const fieldsToValidate = hasFieldConfig ? enabledFields : [
      { field_key: "name", is_required: true, label: "Name" },
      { field_key: "email", is_required: true, label: "Email" },
      { field_key: "phone_number", is_required: true, label: "Phone Number" },
    ];

    for (const field of fieldsToValidate) {
      const val = formData[field.field_key]?.trim();
      if (field.is_required && !val) {
        newErrors[field.field_key] = `${field.label} is required`;
      }
      if (field.field_key === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors.email = "Invalid email address";
      }
    }

    // Validate custom questions
    for (const q of questions) {
      if (q.is_required) {
        const answer = customAnswers[q.id];
        if (answer === undefined || answer === "") {
          newErrors[`q_${q.id}`] = "This question is required";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const answers = questions
      .filter((q) => customAnswers[q.id] !== undefined && customAnswers[q.id] !== "")
      .map((q) => {
        const val = customAnswers[q.id];
        return {
          question_id: q.id,
          answer_text: q.question_type === "short_text" || q.question_type === "long_text" ? String(val) : undefined,
          answer_boolean: q.question_type === "boolean" ? Boolean(val) : undefined,
          answer_option: q.question_type === "single_select" ? String(val) : undefined,
        };
      });

    await onSubmit(formData, answers);
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderField = (fieldKey: string, label: string, required: boolean) => {
    const type = fieldKey === "email" ? "email" : fieldKey === "phone_number" ? "tel" : "text";
    const placeholder =
      fieldKey === "name" ? "Your Name"
      : fieldKey === "email" ? "you@email.com"
      : fieldKey === "phone_number" ? "+252 7 1123456"
      : "Your organization";

    return (
      <div key={fieldKey} className="space-y-1.5">
        <Label htmlFor={fieldKey} className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id={fieldKey}
          name={fieldKey}
          type={type}
          placeholder={placeholder}
          value={formData[fieldKey] || ""}
          onChange={handleChange}
          disabled={loading}
          className={inputClass}
        />
        {errors[fieldKey] && <p className="text-sm text-destructive">{errors[fieldKey]}</p>}
      </div>
    );
  };

  const renderCustomQuestion = (q: CustomQuestion) => {
    const errKey = `q_${q.id}`;
    return (
      <div key={q.id} className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          {q.question_text} {q.is_required && <span className="text-destructive">*</span>}
        </Label>

        {q.question_type === "short_text" && (
          <Input
            value={(customAnswers[q.id] as string) || ""}
            onChange={(e) => handleCustomChange(q.id, e.target.value)}
            disabled={loading}
            placeholder="Your answer"
            className={inputClass}
          />
        )}

        {q.question_type === "long_text" && (
          <Textarea
            value={(customAnswers[q.id] as string) || ""}
            onChange={(e) => handleCustomChange(q.id, e.target.value)}
            disabled={loading}
            placeholder="Your answer"
            rows={3}
            className="bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
          />
        )}

        {q.question_type === "single_select" && q.options && (
          <Select
            value={(customAnswers[q.id] as string) || ""}
            onValueChange={(v) => handleCustomChange(q.id, v)}
          >
            <SelectTrigger disabled={loading} className={inputClass}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(q.options as string[]).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {q.question_type === "boolean" && (
          <div className="flex items-center gap-3 py-2">
            <Switch
              checked={Boolean(customAnswers[q.id])}
              onCheckedChange={(v) => handleCustomChange(q.id, v)}
              disabled={loading}
            />
            <span className="text-sm text-muted-foreground">
              {customAnswers[q.id] ? "Yes" : "No"}
            </span>
          </div>
        )}

        {errors[errKey] && <p className="text-sm text-destructive">{errors[errKey]}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Built-in fields */}
      {hasFieldConfig
        ? enabledFields.map((f) => renderField(f.field_key, f.label, f.is_required))
        : (
          <>
            {renderField("name", "Name", true)}
            {renderField("email", "Email", true)}
            {renderField("phone_number", "Phone Number", true)}
            {renderField("organization", "Organization", false)}
          </>
        )
      }

      {/* Custom questions */}
      {questions.length > 0 && (
        <div className="space-y-6 pt-2 border-t border-border/60">
          {questions.map(renderCustomQuestion)}
        </div>
      )}

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
