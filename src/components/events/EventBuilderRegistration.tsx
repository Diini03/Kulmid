import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  Check,
  Loader2,
  Eye,
  Type,
  ListChecks,
  Mail,
  Phone,
  Link as LinkIcon,
} from "lucide-react";

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

type QuestionDraft = {
  question_text: string;
  question_type: string;
  is_required: boolean;
  options: string[];
};

const QUESTION_TYPES = [
  { value: "text", label: "Text", description: "Short answer", icon: Type },
  { value: "textarea", label: "Textarea", description: "Long answer", icon: Type },
  { value: "multiple_choice", label: "Multiple choice", description: "Choose one", icon: ListChecks },
  { value: "checkbox", label: "Checkbox", description: "Choose many", icon: ListChecks },
  { value: "dropdown", label: "Dropdown", description: "Select one", icon: ListChecks },
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

const createBlankQuestion = (): QuestionDraft => ({
  question_text: "",
  question_type: "text",
  is_required: false,
  options: ["", ""],
});

const getQuestionType = (type: string) => LEGACY_TYPE_MAP[type] || type;
const getQuestionTypeMeta = (type: string) => QUESTION_TYPES.find((t) => t.value === getQuestionType(type)) || QUESTION_TYPES[0];
const needsOptions = (type: string) => CHOICE_TYPES.includes(type) || CHOICE_TYPES.includes(getQuestionType(type));

const EventBuilderRegistration = ({ eventId }: EventBuilderRegistrationProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState<QuestionDraft>(createBlankQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<QuestionDraft>(createBlankQuestion);

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

  const validateQuestion = (draft: QuestionDraft) => {
    if (!draft.question_text.trim()) {
      toast({ title: "Question text is required", variant: "destructive" });
      return null;
    }

    const payload: any = {
      question_text: draft.question_text.trim().slice(0, 180),
      question_type: draft.question_type,
      is_required: draft.is_required,
      options: null,
    };

    if (needsOptions(draft.question_type)) {
      const validOptions = draft.options.map((o) => o.trim()).filter(Boolean).slice(0, 12);
      if (validOptions.length < 2) {
        toast({ title: "Add at least 2 options", variant: "destructive" });
        return null;
      }
      payload.options = validOptions;
    }

    return payload;
  };

  const addQuestion = async () => {
    const payload = validateQuestion(newQuestion);
    if (!payload) return;

    setSaving(true);
    const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from("event_registration_questions")
      .insert({ event_id: eventId, ...payload, sort_order: maxOrder, is_active: true })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add question", variant: "destructive" });
    } else if (data) {
      setQuestions((prev) => [...prev, { ...data, options: data.options as string[] | null } as CustomQuestion]);
      setNewQuestion(createBlankQuestion());
      setShowAddDialog(false);
      toast({ title: "Question added" });
    }
    setSaving(false);
  };

  const deleteQuestion = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("event_registration_questions").update({ is_active: false }).eq("id", id);

    if (!error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
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

  const startEdit = (q: CustomQuestion) => {
    setEditingId(q.id);
    setEditData({
      question_text: q.question_text,
      question_type: getQuestionType(q.question_type),
      is_required: q.is_required,
      options: q.options?.length ? q.options : ["", ""],
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const payload = validateQuestion(editData);
    if (!payload) return;

    setSaving(true);
    const { error } = await supabase.from("event_registration_questions").update(payload).eq("id", editingId);

    if (!error) {
      setQuestions((prev) => prev.map((q) => (q.id === editingId ? { ...q, ...payload } : q)));
      setEditingId(null);
      toast({ title: "Question updated" });
    } else {
      toast({ title: "Error", description: "Failed to update question", variant: "destructive" });
    }
    setSaving(false);
  };

  const enabledFields = fields.filter((f) => f.is_enabled);
  const previewFields = enabledFields.length > 0 ? enabledFields : [
    { field_key: "name", label: "Name", is_required: true },
    { field_key: "email", label: "Email", is_required: true },
    { field_key: "phone_number", label: "Phone Number", is_required: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 min-w-0">
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Registration Fields</h3>
            <p className="text-sm text-muted-foreground">Choose the basic attendee details you want to collect.</p>
          </div>

          <div className="space-y-3">
            {fields.map((field) => {
              const isLocked = LOCKED_FIELDS.includes(field.field_key);
              return (
                <Card key={field.id} className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{field.label}</span>
                      {isLocked && <Badge variant="secondary" className="ml-2 text-xs">Always on</Badge>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${field.id}`} className="text-xs text-muted-foreground">Enabled</Label>
                      <Switch id={`enabled-${field.id}`} checked={field.is_enabled} onCheckedChange={(checked) => updateField(field.id, { is_enabled: checked })} disabled={isLocked || saving} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`required-${field.id}`} className="text-xs text-muted-foreground">Required</Label>
                      <Switch id={`required-${field.id}`} checked={field.is_required} onCheckedChange={(checked) => updateField(field.id, { is_required: checked })} disabled={isLocked || !field.is_enabled || saving} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Custom form builder</h3>
              <p className="text-sm text-muted-foreground">Add simple questions for the information you need from attendees.</p>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1.5 self-start sm:self-auto">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card key={q.id} className="p-4">
                {editingId === q.id ? (
                  <QuestionEditor draft={editData} setDraft={setEditData} onSave={saveEdit} onCancel={() => setEditingId(null)} saving={saving} />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex flex-col gap-1 pt-0.5">
                        <button type="button" onClick={() => moveQuestion(q.id, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move question up">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveQuestion(q.id, "down")} disabled={idx === questions.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move question down">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">{q.question_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{getQuestionTypeMeta(q.question_type).label}</Badge>
                          {q.is_required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                        </div>
                        {needsOptions(q.question_type) && q.options && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {q.options.map((opt, i) => <Badge key={i} variant="outline" className="text-xs font-normal">{opt}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(q)} aria-label="Edit question">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteQuestion(q.id)} aria-label="Delete question">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {questions.length === 0 && (
              <Card className="p-6 border-dashed text-center">
                <p className="text-sm font-medium">No custom questions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start with one question like organization, expectations, or social profile.</p>
              </Card>
            )}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Live preview</h3>
              <p className="text-xs text-muted-foreground">Attendee form view</p>
            </div>
          </div>
          <div className="space-y-4">
            {previewFields.map((field: any) => <PreviewField key={field.field_key} label={field.label} required={field.is_required} fieldKey={field.field_key} />)}
            {questions.map((q) => <PreviewQuestion key={q.id} question={q} />)}
          </div>
        </Card>
      </aside>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add question</DialogTitle>
            <DialogDescription>Create one clear question for your attendee registration form.</DialogDescription>
          </DialogHeader>
          <QuestionEditor draft={newQuestion} setDraft={setNewQuestion} onSave={addQuestion} onCancel={() => setShowAddDialog(false)} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const QuestionEditor = ({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
}: {
  draft: QuestionDraft;
  setDraft: React.Dispatch<React.SetStateAction<QuestionDraft>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) => {
  const selectedType = getQuestionType(draft.question_type);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question-text">Question</Label>
        <Input id="question-text" value={draft.question_text} onChange={(e) => setDraft((prev) => ({ ...prev, question_text: e.target.value }))} placeholder="Example: What do you hope to learn?" maxLength={180} autoFocus />
      </div>

      <div className="space-y-2">
        <Label>Question type</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUESTION_TYPES.map((type) => {
            const Icon = type.icon;
            const active = selectedType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, question_type: type.value, options: needsOptions(type.value) ? (prev.options.length >= 2 ? prev.options : ["", ""]) : prev.options }))}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}
              >
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span>
                  <span className="block text-sm font-medium">{type.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{type.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {needsOptions(draft.question_type) && <OptionsEditor options={draft.options} onChange={(opts) => setDraft((prev) => ({ ...prev, options: opts }))} />}

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <Label htmlFor="question-required">Required question</Label>
          <p className="text-xs text-muted-foreground mt-1">Attendees must answer before submitting.</p>
        </div>
        <Switch id="question-required" checked={draft.is_required} onCheckedChange={(v) => setDraft((prev) => ({ ...prev, is_required: v }))} />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save question
        </Button>
      </DialogFooter>
    </div>
  );
};

const OptionsEditor = ({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) => {
  const safeOptions = options.length ? options : [""];
  const addOption = () => onChange([...safeOptions, ""]);
  const removeOption = (idx: number) => onChange(safeOptions.filter((_, i) => i !== idx));
  const updateOption = (idx: number, value: string) => {
    const updated = [...safeOptions];
    updated[idx] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Options</Label>
      {safeOptions.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="h-10" maxLength={80} />
          {safeOptions.length > 1 && (
            <Button size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0" onClick={() => removeOption(idx)} aria-label="Remove option">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addOption} className="gap-1" disabled={safeOptions.length >= 12}>
        <Plus className="h-3 w-3" /> Add option
      </Button>
    </div>
  );
};

const PreviewField = ({ label, required, fieldKey }: { label: string; required: boolean; fieldKey: string }) => {
  const placeholder = fieldKey === "email" ? "you@email.com" : fieldKey === "phone_number" ? "+252 7 1123456" : `Enter ${label.toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input disabled placeholder={placeholder} className="h-10 bg-muted/50" />
    </div>
  );
};

const PreviewQuestion = ({ question }: { question: CustomQuestion }) => {
  const type = getQuestionType(question.question_type);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{question.question_text} {question.is_required && <span className="text-destructive">*</span>}</Label>
      {type === "textarea" && <Textarea disabled placeholder="Your answer" rows={3} className="resize-none bg-muted/50" />}
      {["text", "email", "phone", "social_link"].includes(type) && <Input disabled placeholder={type === "social_link" ? "https://..." : "Your answer"} className="h-10 bg-muted/50" />}
      {type === "dropdown" && <Select disabled><SelectTrigger className="h-10 bg-muted/50"><SelectValue placeholder="Select an option" /></SelectTrigger></Select>}
      {type === "multiple_choice" && (
        <RadioGroup disabled className="gap-2 pt-1">
          {(question.options || ["Option 1", "Option 2"]).slice(0, 3).map((opt) => <div key={opt} className="flex items-center gap-2 text-sm text-muted-foreground"><RadioGroupItem value={opt} />{opt}</div>)}
        </RadioGroup>
      )}
      {type === "checkbox" && (
        <div className="space-y-2 pt-1">
          {(question.options || ["Option 1", "Option 2"]).slice(0, 3).map((opt) => <div key={opt} className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox disabled />{opt}</div>)}
        </div>
      )}
    </div>
  );
};

export default EventBuilderRegistration;
