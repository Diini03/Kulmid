import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, Building2, Briefcase, GraduationCap } from "lucide-react";

interface Props {
  guestId: string | null;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Guest {
  id: string;
  name: string | null;
  email: string;
  phone_number: string | null;
  organization: string | null;
  job_title: string | null;
  degree: string | null;
  about: string | null;
  why_interested: string | null;
  what_to_gain: string | null;
  heard_from: string | null;
  dietary_restrictions: string | null;
  special_requirements: string | null;
  questions: string | null;
  status: string;
  checked_in: boolean | null;
  created_at: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  sort_order: number;
}

interface Answer {
  question_id: string;
  answer_text: string | null;
  answer_boolean: boolean | null;
  answer_option: string | null;
}

const formatAnswer = (a: Answer): string | string[] => {
  if (a.answer_option) return a.answer_option;
  if (a.answer_boolean !== null && a.answer_boolean !== undefined) {
    return a.answer_boolean ? "Yes" : "No";
  }
  if (a.answer_text) {
    try {
      const parsed = JSON.parse(a.answer_text);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not json
    }
    return a.answer_text;
  }
  return "";
};

const RegistrationResponseDialog = ({ guestId, eventId, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    if (!open || !guestId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [guestRes, questionsRes, answersRes] = await Promise.all([
        supabase.from("event_guests").select("*").eq("id", guestId).single(),
        supabase
          .from("event_registration_questions")
          .select("id,question_text,question_type,sort_order")
          .eq("event_id", eventId)
          .order("sort_order"),
        supabase
          .from("event_registration_answers")
          .select("question_id,answer_text,answer_boolean,answer_option")
          .eq("registration_id", guestId),
      ]);

      if (cancelled) return;
      if (guestRes.data) setGuest(guestRes.data as Guest);
      if (questionsRes.data) setQuestions(questionsRes.data as Question[]);
      if (answersRes.data) setAnswers(answersRes.data as Answer[]);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, guestId, eventId]);

  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a]));

  const statusBadge = (status: string) => {
    if (status === "registered") return <Badge variant="success">Approved</Badge>;
    if (status === "pending") return <Badge variant="warning">Pending</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Full response</DialogTitle>
          <DialogDescription>
            All information submitted by this attendee.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : guest ? (
          <div className="space-y-6">
            {/* Identity */}
            <div className="space-y-2 border-b border-border pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold break-words">{guest.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registered {new Date(guest.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusBadge(guest.status)}
                  {guest.checked_in && <Badge variant="primary">Checked In</Badge>}
                </div>
              </div>
              <div className="grid gap-1.5 text-sm text-muted-foreground pt-1">
                <span className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="break-all">{guest.email}</span>
                </span>
                {guest.phone_number && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    {guest.phone_number}
                  </span>
                )}
                {guest.organization && (
                  <span className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    {guest.organization}
                  </span>
                )}
                {guest.job_title && (
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    {guest.job_title}
                  </span>
                )}
                {guest.degree && (
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {guest.degree}
                  </span>
                )}
              </div>
            </div>

            {/* Custom answers */}
            {questions.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Custom answers</h4>
                {questions.map((q) => {
                  const a = answerByQuestion.get(q.id);
                  const formatted = a ? formatAnswer(a) : "";
                  const isEmpty = !formatted || (Array.isArray(formatted) && formatted.length === 0);

                  return (
                    <div key={q.id} className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">{q.question_text}</p>
                      {isEmpty ? (
                        <p className="text-sm text-muted-foreground italic">No answer</p>
                      ) : Array.isArray(formatted) ? (
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">
                          {formatted.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {formatted}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legacy guest fields with content */}
            {(guest.about || guest.why_interested || guest.what_to_gain || guest.heard_from || guest.dietary_restrictions || guest.special_requirements || guest.questions) && (
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground">Additional details</h4>
                {[
                  { label: "About", value: guest.about },
                  { label: "Why interested", value: guest.why_interested },
                  { label: "What they hope to gain", value: guest.what_to_gain },
                  { label: "How they heard about it", value: guest.heard_from },
                  { label: "Dietary restrictions", value: guest.dietary_restrictions },
                  { label: "Special requirements", value: guest.special_requirements },
                  { label: "Questions", value: guest.questions },
                ]
                  .filter((f) => f.value)
                  .map((f) => (
                    <div key={f.label} className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{f.label}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {f.value}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">No data available</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationResponseDialog;