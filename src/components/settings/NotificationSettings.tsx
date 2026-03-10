import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const notifFields = [
  { key: "registration_confirmations", label: "Registration confirmations", desc: "Get notified when you register for events" },
  { key: "guest_alerts", label: "Guest registration alerts", desc: "Alerts when guests register for your events" },
  { key: "event_reminders", label: "Event reminders", desc: "Reminders before events you've registered for" },
  { key: "invitation_emails", label: "Invitation emails", desc: "Receive event invitations" },
  { key: "marketing_updates", label: "Marketing updates", desc: "Tips and product updates" },
  { key: "platform_announcements", label: "Platform announcements", desc: "Important platform news" },
] as const;

type NotifKey = typeof notifFields[number]["key"];

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<NotifKey, boolean>>({
    registration_confirmations: true,
    guest_alerts: true,
    event_reminders: true,
    invitation_emails: true,
    marketing_updates: false,
    platform_announcements: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notification_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setSettings({
          registration_confirmations: d.registration_confirmations ?? true,
          guest_alerts: d.guest_alerts ?? true,
          event_reminders: d.event_reminders ?? true,
          invitation_emails: d.invitation_emails ?? true,
          marketing_updates: d.marketing_updates ?? false,
          platform_announcements: d.platform_announcements ?? true,
        });
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleToggle = async (key: NotifKey, value: boolean) => {
    if (!user) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Upsert
    const { error } = await (supabase.from("notification_settings" as any) as any).upsert(
      { user_id: user.id, ...newSettings },
      { onConflict: "user_id" }
    );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  };

  return (
    <Card className="border bg-card">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what you get notified about</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notifFields.map((field) => (
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
