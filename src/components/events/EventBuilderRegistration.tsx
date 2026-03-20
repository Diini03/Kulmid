import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

const QUESTION_TYPES = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "single_select", label: "Multiple Choice" },
  { value: "boolean", label: "Yes / No" },
];

const LOCKED_FIELDS = ["name", "email"];

interface EventBuilderRegistrationProps {
  eventId: string;
}

const EventBuilderRegistration = ({ eventId }: EventBuilderRegistrationProps) => {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New question form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "short_text",
    is_required: false,
    options: [""],
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    question_text: "",
    question_type: "short_text",
    is_required: false,
    options: [""],
  });

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const updateField = async (id: string, updates: Partial<RegistrationField>) => {
    setSaving(true);
    const { error } = await supabase
      .from("event_registration_fields")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update field", variant: "destructive" });
    } else {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    }
    setSaving(false);
  };

  const addQuestion = async () => {
    if (!newQuestion.question_text.trim()) {
      toast({ title: "Error", description: "Question text is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const maxOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 0;

    const insertData: any = {
      event_id: eventId,
      question_text: newQuestion.question_text.trim(),
      question_type: newQuestion.question_type,
      is_required: newQuestion.is_required,
      sort_order: maxOrder,
      is_active: true,
    };

    if (newQuestion.question_type === "single_select") {
      const validOptions = newQuestion.options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        toast({ title: "Error", description: "Add at least 2 options", variant: "destructive" });
        setSaving(false);
        return;
      }
      insertData.options = validOptions;
    }

    const { data, error } = await supabase
      .from("event_registration_questions")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add question", variant: "destructive" });
    } else if (data) {
      setQuestions((prev) => [...prev, { ...data, options: data.options as string[] | null } as CustomQuestion]);
      setNewQuestion({ question_text: "", question_type: "short_text", is_required: false, options: [""] });
      setShowAddForm(false);
      toast({ title: "Question added" });
    }
    setSaving(false);
  };

  const deleteQuestion = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("event_registration_questions")
      .update({ is_active: false })
      .eq("id", id);

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
      question_type: q.question_type,
      is_required: q.is_required,
      options: (q.options as string[]) || [""],
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editData.question_text.trim()) return;

    setSaving(true);
    const updatePayload: any = {
      question_text: editData.question_text.trim(),
      question_type: editData.question_type,
      is_required: editData.is_required,
    };

    if (editData.question_type === "single_select") {
      const validOptions = editData.options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        toast({ title: "Error", description: "Add at least 2 options", variant: "destructive" });
        setSaving(false);
        return;
      }
      updatePayload.options = validOptions;
    } else {
      updatePayload.options = null;
    }

    const { error } = await supabase
      .from("event_registration_questions")
      .update(updatePayload)
      .eq("id", editingId);

    if (!error) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingId ? { ...q, ...updatePayload } : q))
      );
      setEditingId(null);
      toast({ title: "Question updated" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Built-in Fields */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Registration Fields</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure which fields appear on the registration form.
        </p>

        <div className="space-y-3">
          {fields.map((field) => {
            const isLocked = LOCKED_FIELDS.includes(field.field_key);
            return (
              <Card key={field.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{field.label}</span>
                    {isLocked && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Always on
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enabled-${field.id}`} className="text-xs text-muted-foreground">
                      Enabled
                    </Label>
                    <Switch
                      id={`enabled-${field.id}`}
                      checked={field.is_enabled}
                      onCheckedChange={(checked) => updateField(field.id, { is_enabled: checked })}
                      disabled={isLocked || saving}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`required-${field.id}`} className="text-xs text-muted-foreground">
                      Required
                    </Label>
                    <Switch
                      id={`required-${field.id}`}
                      checked={field.is_required}
                      onCheckedChange={(checked) => updateField(field.id, { is_required: checked })}
                      disabled={isLocked || !field.is_enabled || saving}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Custom Questions</h3>
            <p className="text-sm text-muted-foreground">
              Add extra questions attendees must answer when registering.
            </p>
          </div>
          {!showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          )}
        </div>

        {/* Existing Questions */}
        <div className="space-y-3 mb-4">
          {questions.map((q, idx) => (
            <Card key={q.id} className="p-4">
              {editingId === q.id ? (
                <div className="space-y-3">
                  <Input
                    value={editData.question_text}
                    onChange={(e) => setEditData((prev) => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Question text"
                  />
                  <div className="flex gap-3">
                    <Select
                      value={editData.question_type}
                      onValueChange={(v) => setEditData((prev) => ({ ...prev, question_type: v }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Required</Label>
                      <Switch
                        checked={editData.is_required}
                        onCheckedChange={(v) => setEditData((prev) => ({ ...prev, is_required: v }))}
                      />
                    </div>
                  </div>
                  {editData.question_type === "single_select" && (
                    <OptionsEditor
                      options={editData.options}
                      onChange={(opts) => setEditData((prev) => ({ ...prev, options: opts }))}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving} className="gap-1">
                      <Check className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex flex-col gap-1 pt-0.5">
                      <button onClick={() => moveQuestion(q.id, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moveQuestion(q.id, "down")} disabled={idx === questions.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{q.question_text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {QUESTION_TYPES.find((t) => t.value === q.question_type)?.label}
                        </Badge>
                        {q.is_required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {q.question_type === "single_select" && q.options && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(q.options as string[]).map((opt, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(q)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}

          {questions.length === 0 && !showAddForm && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No custom questions yet. Add one to collect extra info from attendees.
            </p>
          )}
        </div>

        {/* Add Question Form */}
        {showAddForm && (
          <Card className="p-4 border-dashed space-y-3">
            <Input
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion((prev) => ({ ...prev, question_text: e.target.value }))}
              placeholder="Enter your question..."
              autoFocus
            />
            <div className="flex gap-3 flex-wrap">
              <Select
                value={newQuestion.question_type}
                onValueChange={(v) => setNewQuestion((prev) => ({ ...prev, question_type: v }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Required</Label>
                <Switch
                  checked={newQuestion.is_required}
                  onCheckedChange={(v) => setNewQuestion((prev) => ({ ...prev, is_required: v }))}
                />
              </div>
            </div>

            {newQuestion.question_type === "single_select" && (
              <OptionsEditor
                options={newQuestion.options}
                onChange={(opts) => setNewQuestion((prev) => ({ ...prev, options: opts }))}
              />
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={addQuestion} disabled={saving} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// Small sub-component for editing multiple choice options
const OptionsEditor = ({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) => {
  const addOption = () => onChange([...options, ""]);
  const removeOption = (idx: number) => onChange(options.filter((_, i) => i !== idx));
  const updateOption = (idx: number, value: string) => {
    const updated = [...options];
    updated[idx] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Options</Label>
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={opt}
            onChange={(e) => updateOption(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            className="h-9"
          />
          {options.length > 1 && (
            <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => removeOption(idx)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={addOption} className="gap-1">
        <Plus className="h-3 w-3" /> Add Option
      </Button>
    </div>
  );
};

export default EventBuilderRegistration;
