import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FeedbackData {
  event: { id: string; title: string; date: string; location: string; slug: string | null };
  guest: { name: string | null; email: string };
  existing: { rating: number; comment: string | null } | null;
}

const EventFeedback = () => {
  const { token } = useParams();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: res, error: fnError } = await supabase.functions.invoke("event-feedback", {
        body: { token, action: "lookup" },
      });
      if (fnError || res?.error) {
        setError(res?.error || "We couldn't open this feedback link.");
      } else {
        setData(res as FeedbackData);
        if (res.existing) setDone(true);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const submit = async () => {
    if (rating < 1) {
      toast({ title: "Choose a rating", description: "Tap a star from 1 to 5.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: res, error: fnError } = await supabase.functions.invoke("event-feedback", {
      body: { token, action: "submit", rating, comment, would_recommend: recommend },
    });
    setSubmitting(false);

    if (fnError || res?.error) {
      toast({ title: "Couldn't send feedback", description: res?.error || "Please try again.", variant: "destructive" });
      return;
    }
    setDone(true);
  };

  return (
    <div className="light min-h-screen bg-background text-foreground">
      <Seo title="Share your feedback" description="Tell the organizer how the event went." canonical="/feedback" />
      <div className="max-w-xl mx-auto px-4 py-12">
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle>Link not valid</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/discover">Browse events</Link>
              </Button>
            </CardContent>
          </Card>
        ) : done ? (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle>Thank you</CardTitle>
              <CardDescription>
                Your feedback was sent to the organizer of {data?.event.title}.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild variant="outline">
                <Link to="/discover">Find your next event</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>How was {data?.event.title}?</CardTitle>
              <CardDescription>
                Your answer is shared with the organizer only. It takes 20 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-2">Overall rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Rate ${n} out of 5`}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          n <= (hovered || rating) ? "fill-primary text-primary" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Would you recommend it?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={recommend === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecommend(true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />Yes
                  </Button>
                  <Button
                    type="button"
                    variant={recommend === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecommend(false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />Not really
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Anything the organizer should know? (optional)</p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="What worked well, what could be better..."
                />
              </div>

              <Button onClick={submit} disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Send feedback"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventFeedback;
