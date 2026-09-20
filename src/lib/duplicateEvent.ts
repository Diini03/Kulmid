import { supabase } from "@/integrations/supabase/client";
import { generateEventId } from "@/lib/utils";

/** Columns that must never be carried over to a copy. */
const SKIP_COLUMNS = new Set([
  "id",
  "slug",
  "created_at",
  "updated_at",
  "status",
  "rejection_reason",
  "registration_override",
]);

/**
 * Creates a draft copy of an event, including its registration fields and
 * questions. Guests, check-ins and feedback are never copied.
 * Returns the new event id.
 */
export async function duplicateEvent(eventId: string, userId: string): Promise<string> {
  const { data: source, error: loadError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!source) throw new Error("Event not found");

  const newId = generateEventId();
  const copy: Record<string, any> = { id: newId };

  for (const [key, value] of Object.entries(source)) {
    if (SKIP_COLUMNS.has(key)) continue;
    copy[key] = value;
  }

  copy.title = `${source.title} (Copy)`;
  copy.created_by = userId;
  copy.status = "draft";

  const { error: insertError } = await supabase.from("events").insert([copy as any]);
  if (insertError) throw insertError;

  // A trigger seeds default registration fields on insert — replace them with
  // the source event's configuration so the copy matches exactly.
  const [{ data: fields }, { data: questions }] = await Promise.all([
    supabase
      .from("event_registration_fields")
      .select("field_key, label, is_enabled, is_required, sort_order")
      .eq("event_id", eventId),
    supabase
      .from("event_registration_questions")
      .select("question_text, question_type, is_required, options, sort_order, is_active")
      .eq("event_id", eventId)
      .eq("is_active", true),
  ]);

  if (fields?.length) {
    await supabase.from("event_registration_fields").delete().eq("event_id", newId);
    await supabase
      .from("event_registration_fields")
      .insert(fields.map((f) => ({ ...f, event_id: newId })));
  }

  if (questions?.length) {
    await supabase
      .from("event_registration_questions")
      .insert(questions.map((q) => ({ ...q, event_id: newId })));
  }

  return newId;
}
