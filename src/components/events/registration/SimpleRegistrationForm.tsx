import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export type RegistrationAnswer = {
  question_id: string;
  answer_text?: string;
  answer_boolean?: boolean;
  answer_option?: string;
};

interface SimpleRegistrationFormProps {
  eventId: string;
  onSubmit: (formData: any, customAnswers: RegistrationAnswer[]) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const inputClass = "h-12 bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200";
const LEGACY_TYPE_MAP: Record<string, string> = { short_text: "text", long_text: "textarea", single_select: "dropdown", boolean: "checkbox" };
const getQuestionType = (type: string) => LEGACY_TYPE_MAP[type] || type;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isUrlLike = (value: string) => /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/.test(value) || /^@[\w.]{2,50}$/.test(value);

export const SimpleRegistrationForm = ({ eventId, onSubmit, loading, onCancel }: SimpleRegistrationFormProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [configLoading, setConfigLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({ name: "", email: "", phone_number: "", organization: "" });
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[] | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      const [fieldsRes, questionsRes] = await Promise.all([
        supabase.from("event_registration_fields").select("*").eq("event_id", eventId).order("sort_order"),
        supabase.from("event_registration_questions").select("*").eq("event_id", eventId).eq("is_active", true).order("sort_order"),
      ]);

      if (fieldsRes.data) setFields(fieldsRes.data as RegistrationField[]);
      if (questionsRes.data) {
        setQuestions((questionsRes.data as any[]).map((q) => ({ ...q, options: q.options as string[] | null })));
      }
      setConfigLoading(false);
    };
    fetchConfig();
  }, [eventId]);

  const enabledFields = fields.filter((f) => f.is_enabled);
  const hasFieldConfig = fields.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.slice(0, 500) }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCustomChange = (questionId: string, value: string | string[] | boolean) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errors[`q_${questionId}`]) setErrors((prev) => ({ ...prev, [`q_${questionId}`]: "" }));
  };

  const toggleCheckboxAnswer = (questionId: string, option: string, checked: boolean) => {
    const current = Array.isArray(customAnswers[questionId]) ? (customAnswers[questionId] as string[]) : [];
    handleCustomChange(questionId, checked ? [...current, option] : current.filter((item) => item !== option));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = hasFieldConfig ? enabledFields : [
      { field_key: "name", is_required: true, label: "Name" },
      { field_key: "email", is_required: true, label: "Email" },
      { field_key: "phone_number", is_required: true, label: "Phone Number" },
    ];

    for (const field of fieldsToValidate) {
      const val = formData[field.field_key]?.trim();
      if (field.is_required && !val) newErrors[field.field_key] = `${field.label} is required`;
      if (field.field_key === "email" && val && !isEmail(val)) newErrors.email = "Invalid email address";
    }

    for (const q of questions) {
      const type = getQuestionType(q.question_type);
      const answer = customAnswers[q.id];
      const isEmpty = answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0);
      if (q.is_required && isEmpty) newErrors[`q_${q.id}`] = "This question is required";
      if (!isEmpty && type === "email" && !isEmail(String(answer))) newErrors[`q_${q.id}`] = "Enter a valid email address";
      if (!isEmpty && type === "social_link" && !isUrlLike(String(answer))) newErrors[`q_${q.id}`] = "Enter a valid link or @username";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const answers = questions
      .filter((q) => {
        const val = customAnswers[q.id];
        return val !== undefined && val !== "" && (!Array.isArray(val) || val.length > 0);
      })
      .map((q) => {
        const type = getQuestionType(q.question_type);
        const val = customAnswers[q.id];
        return {
          question_id: q.id,
          answer_text: ["text", "textarea", "phone", "email", "social_link", "checkbox"].includes(type) ? (Array.isArray(val) ? JSON.stringify(val) : String(val).trim()) : undefined,
          answer_boolean: typeof val === "boolean" ? val : undefined,
          answer_option: ["multiple_choice", "dropdown"].includes(type) ? String(val) : undefined,
        };
      });

    await onSubmit(formData, answers);
  };

  if (configLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const renderField = (fieldKey: string, label: string, required: boolean) => {
    const type = fieldKey === "email" ? "email" : fieldKey === "phone_number" ? "tel" : "text";
    const placeholder = fieldKey === "name" ? "Your Name" : fieldKey === "email" ? "you@email.com" : fieldKey === "phone_number" ? "+252 7 1123456" : "Your organization";

    return (
      <div key={fieldKey} className="space-y-1.5">
        <Label htmlFor={fieldKey} className="text-sm font-medium text-foreground">{label} {required && <span className="text-destructive">*</span>}</Label>
        <Input id={fieldKey} name={fieldKey} type={type} placeholder={placeholder} value={formData[fieldKey] || ""} onChange={handleChange} disabled={loading} className={inputClass} maxLength={255} />
        {errors[fieldKey] && <p className="text-sm text-destructive">{errors[fieldKey]}</p>}
      </div>
    );
  };

  const renderCustomQuestion = (q: CustomQuestion) => {
    const errKey = `q_${q.id}`;
    const type = getQuestionType(q.question_type);
    const value = customAnswers[q.id];

    return (
      <div key={q.id} className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">{q.question_text} {q.is_required && <span className="text-destructive">*</span>}</Label>

        {type === "text" && <Input value={(value as string) || ""} onChange={(e) => handleCustomChange(q.id, e.target.value.slice(0, 255))} disabled={loading} placeholder="Your answer" className={inputClass} />}
        {type === "phone" && <Input type="tel" value={(value as string) || ""} onChange={(e) => handleCustomChange(q.id, e.target.value.slice(0, 40))} disabled={loading} placeholder="+252 7 1123456" className={inputClass} />}
        {type === "email" && <Input type="email" value={(value as string) || ""} onChange={(e) => handleCustomChange(q.id, e.target.value.slice(0, 255))} disabled={loading} placeholder="you@email.com" className={inputClass} />}
        {type === "social_link" && <Input type="text" value={(value as string) || ""} onChange={(e) => handleCustomChange(q.id, e.target.value.slice(0, 255))} disabled={loading} placeholder="https://linkedin.com/in/username" className={inputClass} />}
        {type === "textarea" && <Textarea value={(value as string) || ""} onChange={(e) => handleCustomChange(q.id, e.target.value.slice(0, 1000))} disabled={loading} placeholder="Your answer" rows={3} className="bg-muted/50 border-0 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none" />}

        {type === "dropdown" && q.options && (
          <Select value={(value as string) || ""} onValueChange={(v) => handleCustomChange(q.id, v)}>
            <SelectTrigger disabled={loading} className={inputClass}><SelectValue placeholder="Select an option" /></SelectTrigger>
            <SelectContent>{q.options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
          </Select>
        )}

        {type === "multiple_choice" && q.options && (
          <RadioGroup value={(value as string) || ""} onValueChange={(v) => handleCustomChange(q.id, v)} className="gap-2 pt-1">
            {q.options.map((opt) => <div key={opt} className="flex items-center gap-2 rounded-lg border border-border p-3"><RadioGroupItem value={opt} id={`${q.id}-${opt}`} disabled={loading} /><Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label></div>)}
          </RadioGroup>
        )}

        {type === "checkbox" && q.options && (
          <div className="space-y-2 pt-1">
            {q.options.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt);
              return <div key={opt} className="flex items-center gap-2 rounded-lg border border-border p-3"><Checkbox id={`${q.id}-${opt}`} disabled={loading} checked={selected} onCheckedChange={(checked) => toggleCheckboxAnswer(q.id, opt, checked === true)} /><Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label></div>;
            })}
          </div>
        )}

        {errors[errKey] && <p className="text-sm text-destructive">{errors[errKey]}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasFieldConfig ? enabledFields.map((f) => renderField(f.field_key, f.label, f.is_required)) : <>{renderField("name", "Name", true)}{renderField("email", "Email", true)}{renderField("phone_number", "Phone Number", true)}{renderField("organization", "Organization", false)}</>}
      {questions.length > 0 && <div className="space-y-6 pt-2 border-t border-border/60">{questions.map(renderCustomQuestion)}</div>}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-12 rounded-lg transition-all duration-200">Cancel</Button>
        <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all duration-200">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : "Register"}
        </Button>
      </div>
    </form>
  );
};
