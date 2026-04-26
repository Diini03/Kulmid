import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  Loader2,
  Download,
  MessageSquareText,
  Eye,
  Venus,
  Mars,
  CircleUser,
} from "lucide-react";
import RegistrationResponseDialog from "./RegistrationResponseDialog";
import { exportRegistrationsToCsv } from "@/lib/exportRegistrations";

interface Question {
  id: string;
  event_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
}

interface Guest {
  id: string;
  name: string | null;
  email: string;
  phone_number: string | null;
  organization: string | null;
  status: string;
  checked_in: boolean | null;
  created_at: string;
}

interface Answer {
  id: string;
  registration_id: string;
  question_id: string;
  answer_text: string | null;
  answer_boolean: boolean | null;
  answer_option: string | null;
}

const LEGACY_TYPE_MAP: Record<string, string> = {
  short_text: "text",
  long_text: "textarea",
  single_select: "dropdown",
  boolean: "checkbox",
};
const getQuestionType = (t: string) => LEGACY_TYPE_MAP[t] || t;
const CHART_TYPES = ["multiple_choice", "dropdown", "checkbox"];
const TEXT_TYPES = ["text", "textarea", "phone", "email", "social_link"];

interface Props {
  eventId: string;
}

const EventBuilderInsights = ({ eventId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [viewerGuestId, setViewerGuestId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [eventRes, questionsRes, guestsRes] = await Promise.all([
        supabase.from("events").select("title").eq("id", eventId).maybeSingle(),
        supabase
          .from("event_registration_questions")
          .select("*")
          .eq("event_id", eventId)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("event_guests")
          .select("id,name,email,phone_number,organization,status,checked_in,created_at")
          .eq("event_id", eventId)
          .eq("registration_type", "registration")
          .order("created_at", { ascending: false }),
      ]);

      if (eventRes.data) setEventTitle(eventRes.data.title);

      const qs = (questionsRes.data || []).map((q: any) => ({
        ...q,
        options: q.options as string[] | null,
      })) as Question[];
      setQuestions(qs);

      const gs = (guestsRes.data || []) as Guest[];
      setGuests(gs);

      if (gs.length > 0) {
        const guestIds = gs.map((g) => g.id);
        // Supabase has a limit on .in(); chunk if very large
        const chunks: string[][] = [];
        for (let i = 0; i < guestIds.length; i += 200) chunks.push(guestIds.slice(i, i + 200));
        const allAnswers: Answer[] = [];
        for (const chunk of chunks) {
          const { data } = await supabase
            .from("event_registration_answers")
            .select("*")
            .in("registration_id", chunk);
          if (data) allAnswers.push(...(data as Answer[]));
        }
        setAnswers(allAnswers);
      } else {
        setAnswers([]);
      }

      setLoading(false);
    };

    load();
  }, [eventId]);

  const stats = useMemo(() => {
    return {
      total: guests.length,
      registered: guests.filter((g) => g.status === "registered").length,
      pending: guests.filter((g) => g.status === "pending").length,
      checkedIn: guests.filter((g) => g.checked_in).length,
    };
  }, [guests]);

  // Map question_id -> answers[]
  const answersByQuestion = useMemo(() => {
    const map = new Map<string, Answer[]>();
    for (const a of answers) {
      if (!map.has(a.question_id)) map.set(a.question_id, []);
      map.get(a.question_id)!.push(a);
    }
    return map;
  }, [answers]);

  // For each chart-type question, compute option counts
  const aggregations = useMemo(() => {
    const result = new Map<
      string,
      { counts: Map<string, number>; total: number }
    >();

    for (const q of questions) {
      const type = getQuestionType(q.question_type);
      if (!CHART_TYPES.includes(type)) continue;

      const qAnswers = answersByQuestion.get(q.id) || [];
      const counts = new Map<string, number>();
      // Initialize known options at 0 so they show up
      (q.options || []).forEach((opt) => counts.set(opt, 0));

      let total = 0;
      for (const a of qAnswers) {
        if (type === "checkbox") {
          // answer_text contains a JSON-stringified array
          let parsed: string[] = [];
          if (a.answer_text) {
            try {
              const json = JSON.parse(a.answer_text);
              if (Array.isArray(json)) parsed = json;
            } catch {
              parsed = [a.answer_text];
            }
          }
          if (parsed.length === 0) continue;
          total += 1; // count respondents, not selections
          for (const opt of parsed) {
            counts.set(opt, (counts.get(opt) || 0) + 1);
          }
        } else {
          // multiple_choice / dropdown -> answer_option
          const opt = a.answer_option;
          if (!opt) continue;
          total += 1;
          counts.set(opt, (counts.get(opt) || 0) + 1);
        }
      }

      result.set(q.id, { counts, total });
    }

    return result;
  }, [questions, answersByQuestion]);

  // Gender detection
  const genderQuestion = useMemo(() => {
    return questions.find(
      (q) =>
        /gender|jinsi|\bsex\b/i.test(q.question_text) &&
        CHART_TYPES.includes(getQuestionType(q.question_type))
    );
  }, [questions]);

  const genderSummary = useMemo(() => {
    if (!genderQuestion) return null;
    const agg = aggregations.get(genderQuestion.id);
    if (!agg) return null;

    let male = 0;
    let female = 0;
    let other = 0;
    agg.counts.forEach((count, label) => {
      if (/^(male|lab|man|nin)$/i.test(label.trim())) male += count;
      else if (/^(female|dumar|woman|gabar|naag)$/i.test(label.trim())) female += count;
      else other += count;
    });

    return { male, female, other, total: male + female + other };
  }, [genderQuestion, aggregations]);

  const handleExport = () => {
    exportRegistrationsToCsv(eventTitle, guests, questions, answers);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <Card className="p-12 border-dashed text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-base font-semibold">No data available yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Insights will appear here once people register for your event.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Insights</h3>
          <p className="text-sm text-muted-foreground">
            Live overview of registrations and answers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          label="Total registrations"
          value={stats.total}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          label="Approved"
          value={stats.registered}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4 text-yellow-600" />}
          label="Pending"
          value={stats.pending}
        />
        <MetricCard
          icon={<QrCode className="h-4 w-4 text-primary" />}
          label="Checked in"
          value={stats.checkedIn}
        />
      </div>

      {/* Gender summary */}
      {genderSummary && genderSummary.total > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CircleUser className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">Gender breakdown</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <GenderTile
              icon={<Mars className="h-4 w-4 text-blue-600" />}
              label="Male"
              count={genderSummary.male}
              total={genderSummary.total}
            />
            <GenderTile
              icon={<Venus className="h-4 w-4 text-pink-600" />}
              label="Female"
              count={genderSummary.female}
              total={genderSummary.total}
            />
            <GenderTile
              icon={<CircleUser className="h-4 w-4 text-muted-foreground" />}
              label="Other"
              count={genderSummary.other}
              total={genderSummary.total}
            />
          </div>
        </Card>
      )}

      {/* Per-question analytics */}
      {questions.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <p className="text-sm font-medium">No custom questions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add questions in the Registration tab to see per-question analytics.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const type = getQuestionType(q.question_type);
            if (CHART_TYPES.includes(type)) {
              const agg = aggregations.get(q.id);
              return (
                <ChartQuestionCard
                  key={q.id}
                  question={q}
                  counts={agg?.counts || new Map()}
                  total={agg?.total || 0}
                />
              );
            }
            if (TEXT_TYPES.includes(type)) {
              const qAnswers = answersByQuestion.get(q.id) || [];
              return (
                <TextQuestionCard
                  key={q.id}
                  question={q}
                  answers={qAnswers}
                  guests={guests}
                  onView={(guestId) => setViewerGuestId(guestId)}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      <RegistrationResponseDialog
        guestId={viewerGuestId}
        eventId={eventId}
        open={viewerGuestId !== null}
        onOpenChange={(open) => {
          if (!open) setViewerGuestId(null);
        }}
      />
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3">
    {icon}
    <div className="min-w-0">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
    </div>
  </div>
);

const GenderTile = ({
  icon,
  label,
  count,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold">{count}</span>
        <span className="text-xs text-muted-foreground">({pct}%)</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const ChartQuestionCard = ({
  question,
  counts,
  total,
}: {
  question: Question;
  counts: Map<string, number>;
  total: number;
}) => {
  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const type = getQuestionType(question.question_type);
  const typeLabel = type === "checkbox" ? "Checkbox" : type === "dropdown" ? "Dropdown" : "Multiple choice";

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium break-words">{question.question_text}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            <span className="text-xs text-muted-foreground">
              {total} {total === 1 ? "response" : "responses"}
            </span>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground italic">No responses yet</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map(([option, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={option} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="break-words min-w-0">{option}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {count} <span className="text-xs">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

const TextQuestionCard = ({
  question,
  answers,
  guests,
  onView,
}: {
  question: Question;
  answers: Answer[];
  guests: Guest[];
  onView: (guestId: string) => void;
}) => {
  const guestById = new Map(guests.map((g) => [g.id, g]));
  const samples = answers
    .filter((a) => a.answer_text && a.answer_text.trim() !== "")
    .slice(0, 3);

  return (
    <Card className="p-5 space-y-3">
      <div>
        <p className="text-sm font-medium break-words">{question.question_text}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <Badge variant="outline" className="text-xs">Open text</Badge>
          <span className="text-xs text-muted-foreground">
            {answers.length} {answers.length === 1 ? "response" : "responses"}
          </span>
        </div>
      </div>

      {samples.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No responses yet</p>
      ) : (
        <div className="space-y-2">
          {samples.map((a) => {
            const g = guestById.get(a.registration_id);
            return (
              <div
                key={a.id}
                className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1"
              >
                <p className="text-sm text-foreground whitespace-pre-wrap break-words line-clamp-3">
                  {a.answer_text}
                </p>
                {g && (
                  <button
                    type="button"
                    onClick={() => onView(g.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquareText className="h-3 w-3" />
                    {g.name || g.email}
                    <Eye className="h-3 w-3 ml-0.5" />
                  </button>
                )}
              </div>
            );
          })}
          {answers.length > samples.length && (
            <p className="text-xs text-muted-foreground">
              +{answers.length - samples.length} more — open Guests tab to see all.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default EventBuilderInsights;