import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const categoryOptions = ["Seminar", "Workshop", "Conference", "Festival", "Webinar", "Meetup"];
const topicOptions = ["Technology", "Business", "Personal Development", "Health & Wellness", "Arts & Culture"];
const formatOptions = ["Online", "In-Person", "Hybrid"];

export const PreferencesSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [eventMode, setEventMode] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setCategories(data.event_categories || []);
        setTopics(data.topics || []);
        setEventMode(data.event_mode || "");
      }
    };
    load();
  }, [user]);

  const toggle = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_preferences").upsert(
      { user_id: user.id, event_categories: categories, topics, event_mode: eventMode },
      { onConflict: "user_id" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferences saved" });
    }
    setSaving(false);
  };

  return (
    <Card className="border bg-card">
      <CardHeader>
        <CardTitle>Event Preferences</CardTitle>
        <CardDescription>Customize your event recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Preferred Categories</p>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <Badge
                key={c}
                variant={categories.includes(c) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggle(categories, c, setCategories)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Topics of Interest</p>
          <div className="flex flex-wrap gap-2">
            {topicOptions.map((t) => (
              <Badge
                key={t}
                variant={topics.includes(t) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => toggle(topics, t, setTopics)}
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Event Format</p>
          <div className="flex flex-wrap gap-2">
            {formatOptions.map((f) => (
              <Badge
                key={f}
                variant={eventMode === f ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setEventMode(eventMode === f ? "" : f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="rounded-xl">
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};
