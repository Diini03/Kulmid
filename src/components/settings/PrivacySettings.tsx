import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const privacyFields = [
  { key: "is_public", label: "Public profile", desc: "Allow anyone to view your profile" },
  { key: "show_hosted_events", label: "Show hosted events", desc: "Display events you host on your profile" },
  { key: "show_attended_events", label: "Show attended events", desc: "Display events you attended" },
  { key: "allow_invitations", label: "Allow invitations", desc: "Let organizers invite you to events" },
  { key: "allow_discovery", label: "Profile discovery", desc: "Let others find your profile" },
] as const;

type PrivacyKey = typeof privacyFields[number]["key"];

export const PrivacySettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<PrivacyKey, boolean>>({
    is_public: true,
    show_hosted_events: true,
    show_attended_events: true,
    allow_invitations: true,
    allow_discovery: true,
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const d = data as any;
        setSettings({
          is_public: d.is_public ?? true,
          show_hosted_events: d.show_hosted_events ?? true,
          show_attended_events: d.show_attended_events ?? true,
          allow_invitations: d.allow_invitations ?? true,
          allow_discovery: d.allow_discovery ?? true,
        });
      }
    };
    load();
  }, [user]);

  const handleToggle = async (key: PrivacyKey, value: boolean) => {
    if (!user) return;
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));

    const { error } = await supabase
      .from("profiles")
      .update({ [key]: value } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSettings((s) => ({ ...s, [key]: prev }));
    }
  };

  return (
    <Card className="border bg-card">
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>Control who can see your information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {privacyFields.map((field) => (
          <div key={field.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{field.label}</Label>
              <p className="text-xs text-muted-foreground">{field.desc}</p>
            </div>
            <Switch
              checked={settings[field.key]}
              onCheckedChange={(val) => handleToggle(field.key, val)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
