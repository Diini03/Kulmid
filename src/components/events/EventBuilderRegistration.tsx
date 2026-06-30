import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDownSquare,
  Mail,
  Phone,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationField {
  id: string;
  event_id: string;
  field_key: string;
  label: string;
  is_enabled: boolean;
  is_required: boolean;
  sort_order: number;
}

interface CustomQuestion {
  id: string;
  event_id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
}

const QUESTION_TYPES = [
  { value: "text", label: "Text", description: "Short answer", icon: Type },
  { value: "textarea", label: "Paragraph", description: "Long answer", icon: AlignLeft },
  { value: "multiple_choice", label: "Multiple choice", description: "Choose one", icon: CircleDot },
  { value: "checkbox", label: "Checkboxes", description: "Choose many", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", description: "Select one", icon: ChevronDownSquare },
  { value: "phone", label: "Phone", description: "Phone number", icon: Phone },
  { value: "email", label: "Email", description: "Email address", icon: Mail },
  { value: "social_link", label: "Social link", description: "URL or profile", icon: LinkIcon },
];

const LEGACY_TYPE_MAP: Record<string, string> = {
  short_text: "text",
  long_text: "textarea",
  single_select: "dropdown",
  boolean: "checkbox",
};

const LOCKED_FIELDS = ["name", "email"];
const CHOICE_TYPES = ["multiple_choice", "checkbox", "dropdown", "single_select"];

interface EventBuilderRegistrationProps {
  eventId: string;
}

const getQuestionType = (type: string) => LEGACY_TYPE_MAP[type] || type;
const getQuestionTypeMeta = (type: string) => QUESTION_TYPES.find((t) => t.value === getQuestionType(type)) || QUESTION_TYPES[0];
const needsOptions = (type: string) => CHOICE_TYPES.includes(type) || CHOICE_TYPES.includes(getQuestionType(type));

const EventBuilderRegistration = ({ eventId }: EventBuilderRegistrationProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    const [fieldsRes, questionsRes] = await Promise.all([
      supabase.from("event_registration_fields").select("*").eq("event_id", eventId).order("sort_order"),
      supabase.from("event_registration_questions").select("*").eq("event_id", eventId).eq("is_active", true).order("sort_order"),
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
    setLoading(false);
  };

  const updateField = async (id: string, updates: Partial<RegistrationField>) => {
    setSaving(true);
    const { error } = await supabase.from("event_registration_fields").update(updates).eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update field", variant: "destructive" });
    } else {
      setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    }
    setSaving(false);
  };

  const addQuestion = async () => {
    setSaving(true);
    const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from("event_registration_questions")
      .insert({
        event_id: eventId,
        question_text: "Untitled question",
        question_type: "text",
        is_required: false,
        options: null,
        sort_order: maxOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add question", variant: "destructive" });
    } else if (data) {
      const newQ = { ...data, options: data.options as string[] | null } as CustomQuestion;
      setQuestions((prev) => [...prev, newQ]);
      setSelectedId(newQ.id);
    }
    setSaving(false);
  };

  const duplicateQuestion = async (q: CustomQuestion) => {
    setSaving(true);
    const maxOrder = questions.length > 0 ? Math.max(...questions.map((x) => x.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from("event_registration_questions")
      .insert({
        event_id: eventId,
        question_text: q.question_text,
        question_type: q.question_type,
        is_required: q.is_required,
        options: q.options as any,
        sort_order: maxOrder,
        is_active: true,
      })
      .select()
      .single();
    if (!error && data) {
      const newQ = { ...data, options: data.options as string[] | null } as CustomQuestion;
      setQuestions((prev) => [...prev, newQ]);
      setSelectedId(newQ.id);
    }
    setSaving(false);
  };

  const patchQuestion = (id: string, patch: Partial<CustomQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const saveQuestion = async (id: string, patch: Partial<CustomQuestion>) => {
    const update: any = { ...patch };
    if (update.options) {
      update.options = (update.options as string[]).map((o) => o.trim()).filter(Boolean).slice(0, 12);
      if (needsOptions(update.question_type ?? questions.find((q) => q.id === id)?.question_type ?? "text") && update.options.length === 0) {
        update.options = ["Option 1"];
      }
    }
    const { error } = await supabase.from("event_registration_questions").update(update).eq("id", id);
    if (error) toast({ title: "Save failed", variant: "destructive" });
  };

  const deleteQuestion = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("event_registration_questions").update({ is_active: false }).eq("id", id);

    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast({ title: "Question removed" });
    }
    setSaving(false);
  };

  const moveQuestion = async (id: string, direction: "up" | "down") => {
    const idx = questions.findIndex((q) => q.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === questions.length - 1)) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...questions];
    const temp = updated[idx].sort_order;
    updated[idx].sort_order = updated[swapIdx].sort_order;
    updated[swapIdx].sort_order = temp;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];

    setQuestions(updated);
    await Promise.all([
      supabase.from("event_registration_questions").update({ sort_order: updated[idx].sort_order }).eq("id", updated[idx].id),
      supabase.from("event_registration_questions").update({ sort_order: updated[swapIdx].sort_order }).eq("id", updated[swapIdx].id),
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Registration form</h2>
        <p className="text-sm text-muted-foreground">Click a question to edit it. Changes save automatically.</p>
      </div>

      {/* Required basics — built-in fields */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
        <div className="border-l-4 border-l-primary p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium">Required basics</h3>
            <Badge variant="secondary" className="text-xs">Built-in</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Standard attendee details. Toggle off ones you don't need.</p>
          <div className="space-y-2">
            {fields.map((field) => {
              const isLocked = LOCKED_FIELDS.includes(field.field_key);
              return (
                <div key={field.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{field.label}</span>
                    {isLocked && <Badge variant="outline" className="text-[10px] h-5">Always on</Badge>}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <span className="hidden sm:inline">On</span>
                      <Switch checked={field.is_enabled} onCheckedChange={(c) => updateField(field.id, { is_enabled: c })} disabled={isLocked || saving} />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <span>Required</span>
                      <Switch checked={field.is_required} onCheckedChange={(c) => updateField(field.id, { is_required: c })} disabled={isLocked || !field.is_enabled || saving} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom questions — stacked cards */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            selected={selectedId === q.id}
            isFirst={idx === 0}
            isLast={idx === questions.length - 1}
            onSelect={() => setSelectedId(q.id)}
            onPatch={(p) => patchQuestion(q.id, p)}
            onSave={(p) => saveQuestion(q.id, p)}
            onDelete={() => deleteQuestion(q.id)}
            onDuplicate={() => duplicateQuestion(q)}
            onMove={(dir) => moveQuestion(q.id, dir)}
          />
        ))}

        {questions.length === 0 && (
          <button
            type="button"
            onClick={addQuestion}
            disabled={saving}
            className="w-full rounded-xl border-2 border-dashed border-border p-10 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Plus className="h-5 w-5" />
            </div>
            <p className="font-medium">Add your first question</p>
            <p className="text-sm text-muted-foreground mt-1">Short answer, multiple choice, dropdown, and more.</p>
          </button>
        )}
      </div>

      {/* Floating add button */}
      {questions.length > 0 && (
        <button
          type="button"
          onClick={addQuestion}
          disabled={saving}
          className="fixed bottom-6 right-6 z-30 h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          <span className="font-medium">Add question</span>
        </button>
      )}
    </div>
  );
};

/* ============================================================
 * QuestionCard — Google-Forms style click-to-edit card.
 * Collapsed: shows the question with a preview of the answer UI.
 * Selected: shows inline editor (text, type picker, options, toggles).
 * ============================================================ */
const QuestionCard = ({
  question,
  selected,
  isFirst,
  isLast,
  onSelect,
  onPatch,
  onSave,
  onDelete,
  onDuplicate,
  onMove,
}: {
  question: CustomQuestion;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onPatch: (p: Partial<CustomQuestion>) => void;
  onSave: (p: Partial<CustomQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: "up" | "down") => void;
}) => {
  const type = getQuestionType(question.question_type);
  const meta = getQuestionTypeMeta(question.question_type);
  const TypeIcon = meta.icon;

  const handleTextBlur = () => onSave({ question_text: question.question_text || "Untitled question" });
  const handleTypeChange = (newType: string) => {
    const needs = needsOptions(newType);
    const options = needs ? (question.options?.length ? question.options : ["Option 1"]) : null;
    onPatch({ question_type: newType, options });
    onSave({ question_type: newType, options });
  };
  const updateOption = (idx: number, value: string) => {
    const next = [...(question.options || [])];
    next[idx] = value;
    onPatch({ options: next });
  };
  const addOption = () => {
    const next = [...(question.options || []), ""];
    onPatch({ options: next });
    onSave({ options: next });
  };
  const removeOption = (idx: number) => {
    const next = (question.options || []).filter((_, i) => i !== idx);
    onPatch({ options: next });
    onSave({ options: next });
  };

  return (
    <div
      onClick={() => !selected && onSelect()}
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all cursor-pointer",
        selected ? "border-l-4 border-l-primary border-border shadow-md" : "border-border hover:shadow-sm"
      )}
    >
      <div className="p-5">
        {selected ? (
          // ===== Selected: editor =====
          <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={question.question_text}
                onChange={(e) => onPatch({ question_text: e.target.value })}
                onBlur={handleTextBlur}
                placeholder="Question"
                maxLength={180}
                className="flex-1 h-11 text-base font-medium"
                autoFocus
              />
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[200px] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {t.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Answer preview / options editor */}
            {needsOptions(type) ? (
              <div className="space-y-2 pt-1">
                {(question.options || []).map((opt, idx) => {
                  const Marker = type === "checkbox" ? CheckSquare : type === "multiple_choice" ? CircleDot : ChevronDownSquare;
                  return (
                    <div key={idx} className="flex items-center gap-2 group">
                      <Marker className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        onBlur={() => onSave({ options: question.options || [] })}
                        placeholder={`Option ${idx + 1}`}
                        className="h-9 border-0 border-b border-transparent rounded-none px-1 focus-visible:border-primary focus-visible:ring-0 shadow-none"
                        maxLength={80}
                      />
                      {(question.options || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove option"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addOption}
                  disabled={(question.options || []).length >= 12}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground pl-6"
                >
                  <Plus className="h-4 w-4" /> Add option
                </button>
              </div>
            ) : (
              <AnswerPreview type={type} />
            )}

            {/* Footer toolbar */}
            <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onDuplicate} aria-label="Duplicate">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => onMove("up")} disabled={isFirst} aria-label="Move up">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => onMove("down")} disabled={isLast} aria-label="Move down">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <span className="text-muted-foreground">Required</span>
                <Switch
                  checked={question.is_required}
                  onCheckedChange={(v) => {
                    onPatch({ is_required: v });
                    onSave({ is_required: v });
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          // ===== Collapsed: preview =====
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground break-words">
                  {question.question_text || "Untitled question"}
                  {question.is_required && <span className="text-destructive ml-1">*</span>}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <TypeIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </div>
              </div>
            </div>
            <div className="pointer-events-none opacity-70">
              {needsOptions(type) ? (
                <OptionsPreview type={type} options={question.options || ["Option 1"]} />
              ) : (
                <AnswerPreview type={type} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnswerPreview = ({ type }: { type: string }) => {
  if (type === "textarea") return <Textarea disabled placeholder="Long answer text" rows={2} className="resize-none bg-muted/30" />;
  if (type === "social_link") return <Input disabled placeholder="https://..." className="h-10 bg-muted/30" />;
  if (type === "email") return <Input disabled placeholder="you@email.com" className="h-10 bg-muted/30" />;
  if (type === "phone") return <Input disabled placeholder="+252 7 1123456" className="h-10 bg-muted/30" />;
  return <Input disabled placeholder="Short answer text" className="h-10 bg-muted/30" />;
};

const OptionsPreview = ({ type, options }: { type: string; options: string[] }) => {
  if (type === "dropdown") {
    return (
      <Select disabled>
        <SelectTrigger className="h-10 bg-muted/30">
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
      </Select>
    );
  }
  if (type === "checkbox") {
    return (
      <div className="space-y-1.5">
        {options.slice(0, 4).map((opt, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Checkbox disabled /> <span className="text-muted-foreground">{opt}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <RadioGroup disabled className="gap-1.5">
      {options.slice(0, 4).map((opt, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={opt} /> <span className="text-muted-foreground">{opt}</span>
        </div>
      ))}
    </RadioGroup>
  );
};

export default EventBuilderRegistration;
