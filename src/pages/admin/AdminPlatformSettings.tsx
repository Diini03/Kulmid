import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sliders, Shield, Sparkles, Globe, Eye, Users, Save, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlatformConfig {
  require_event_approval: boolean;
  allow_public_registrations: boolean;
  enable_ai_descriptions: boolean;
  enable_ai_attendance_prediction: boolean;
  default_event_visibility: string;
  enable_discover_recommendations: boolean;
  enable_featured_events: boolean;
  max_events_per_user: number;
}

const DEFAULT_CONFIG: PlatformConfig = {
  require_event_approval: true,
  allow_public_registrations: true,
  enable_ai_descriptions: true,
  enable_ai_attendance_prediction: true,
  default_event_visibility: "pending",
  enable_discover_recommendations: true,
  enable_featured_events: true,
  max_events_per_user: 50,
};

const AdminPlatformSettings = () => {
  const { isAdmin, loading, adminCheckComplete, user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedConfig, setSavedConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (isAdmin && adminCheckComplete) fetchSettings();
  }, [isAdmin, adminCheckComplete]);

  const fetchSettings = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value");

    if (data && data.length > 0) {
      const loaded = { ...DEFAULT_CONFIG };
      data.forEach((row: any) => {
        if (row.key in loaded) {
          (loaded as any)[row.key] = typeof row.value === "object" && row.value !== null && "v" in row.value
            ? (row.value as any).v
            : row.value;
        }
      });
      setConfig(loaded);
      setSavedConfig(loaded);
    }
    setDataLoading(false);
  };

  const updateConfig = (key: keyof PlatformConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setHasChanges(JSON.stringify(newConfig) !== JSON.stringify(savedConfig));
  };

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(config);
    
    for (const [key, value] of entries) {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({
          key,
          value: { v: value } as any,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        }, { onConflict: "key" });

      if (error) {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setSavedConfig({ ...config });
    setHasChanges(false);
    toast({ title: "Settings saved", description: "Platform configuration updated successfully." });
    setSaving(false);
  };

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Seo title="Platform Settings" canonical="/admin/settings/platform" />
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Platform Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure platform-wide settings and features</p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
            <CheckCircle className="h-4 w-4" />
            You have unsaved changes
          </div>
        )}

        {dataLoading ? (
          <p className="text-muted-foreground py-12 text-center">Loading settings...</p>
        ) : (
          <div className="space-y-6">
            {/* Event Moderation */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Event Moderation</CardTitle>
                </div>
                <CardDescription>Control how events are published on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Require event approval</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Events must be approved by admin before appearing in Discover</p>
                  </div>
                  <Switch
                    checked={config.require_event_approval}
                    onCheckedChange={(v) => updateConfig("require_event_approval", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Default event visibility</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Initial status when events are created</p>
                  </div>
                  <Select
                    value={config.default_event_visibility}
                    onValueChange={(v) => updateConfig("default_event_visibility", v)}
                  >
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Registration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Registration</CardTitle>
                </div>
                <CardDescription>Manage how users register for events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Allow public registrations</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Non-authenticated users can register for events</p>
                  </div>
                  <Switch
                    checked={config.allow_public_registrations}
                    onCheckedChange={(v) => updateConfig("allow_public_registrations", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">AI Features</CardTitle>
                </div>
                <CardDescription>Toggle AI-powered platform capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">AI event descriptions</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow creators to generate descriptions with AI</p>
                  </div>
                  <Switch
                    checked={config.enable_ai_descriptions}
                    onCheckedChange={(v) => updateConfig("enable_ai_descriptions", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">AI attendance prediction</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Show predicted attendance for event organizers</p>
                  </div>
                  <Switch
                    checked={config.enable_ai_attendance_prediction}
                    onCheckedChange={(v) => updateConfig("enable_ai_attendance_prediction", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discovery */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Discovery & Recommendations</CardTitle>
                </div>
                <CardDescription>Control content visibility on Discover page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable recommendations</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Show personalized event recommendations to users</p>
                  </div>
                  <Switch
                    checked={config.enable_discover_recommendations}
                    onCheckedChange={(v) => updateConfig("enable_discover_recommendations", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Featured events</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow featuring events on homepage and Discover</p>
                  </div>
                  <Switch
                    checked={config.enable_featured_events}
                    onCheckedChange={(v) => updateConfig("enable_featured_events", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPlatformSettings;
