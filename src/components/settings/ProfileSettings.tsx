import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/UserAvatar";
import { AvatarCropper } from "@/components/common/AvatarCropper";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Check, X, Loader2 } from "lucide-react";

export const ProfileSettings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const u = (data as any).username || "";
        setOriginalUsername(u);
        setForm({
          full_name: data.full_name || "",
          username: u,
          bio: (data as any).bio || "",
          location: (data as any).location || "",
          website: (data as any).website || "",
          twitter: (data as any).twitter || "",
          linkedin: (data as any).linkedin || "",
          instagram: (data as any).instagram || "",
          avatar_url: (data as any).avatar_url || "",
        });
      }
    };
    load();
  }, [user]);

  // Live username availability check (debounced)
  useEffect(() => {
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    const value = form.username.trim().toLowerCase();
    if (!value || value === originalUsername.toLowerCase()) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    usernameTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("username", value)
        .maybeSingle();
      if (data && data.user_id !== user?.id) setUsernameStatus("taken");
      else setUsernameStatus("available");
    }, 500);
  }, [form.username, originalUsername, user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!user) return;
    setCropperOpen(false);
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    // Append cache-buster
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setForm((prev) => ({ ...prev, avatar_url: url }));
    setUploading(false);
    toast({ title: "Photo updated", description: "Don't forget to save your profile." });
  };

  const handleSave = async () => {
    if (!user || !form.full_name.trim()) return;
    if (usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking") {
      toast({ title: "Username issue", description: "Please choose a valid, available username.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const cleanUsername = form.username.trim().toLowerCase();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        username: cleanUsername || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        website: form.website.trim() || null,
        twitter: form.twitter.trim() || null,
        linkedin: form.linkedin.trim() || null,
        instagram: form.instagram.trim() || null,
        avatar_url: form.avatar_url || null,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your profile has been saved." });
      setOriginalUsername(cleanUsername);
      // Refresh the auth context profile so navbar avatar updates immediately
      const { data: refreshed } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (refreshed) {
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: refreshed }));
      }
    }
    setSaving(false);
  };

  return (
    <>
    <AvatarCropper
      open={cropperOpen}
      imageSrc={rawImageSrc}
      onClose={() => setCropperOpen(false)}
      onCropComplete={handleCroppedUpload}
    />
    <Card className="border bg-card">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your public identity on Kulmid</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <UserAvatar
            src={form.avatar_url}
            name={form.full_name}
            email={user?.email}
            className="h-20 w-20 border-2 border-primary/20"
            fallbackClassName="text-xl"
          />
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" className="rounded-xl" asChild disabled={uploading}>
                <span><Upload className="h-4 w-4 mr-1.5" />{uploading ? "Uploading..." : "Change Photo"}</span>
              </Button>
            </Label>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Square crop. Max 5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="relative">
              <Input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                placeholder="username"
                className="pr-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {usernameStatus === "available" && <Check className="h-4 w-4 text-primary" />}
                {usernameStatus === "taken" && <X className="h-4 w-4 text-destructive" />}
                {usernameStatus === "invalid" && <X className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            {usernameStatus === "taken" && <p className="text-xs text-destructive">Username already taken</p>}
            {usernameStatus === "invalid" && <p className="text-xs text-destructive">3-20 chars, lowercase letters, numbers, underscore</p>}
            {usernameStatus === "available" && <p className="text-xs text-primary">Available! Your URL will be /u/{form.username}</p>}
            {form.username && usernameStatus === "idle" && (
              <p className="text-xs text-muted-foreground">/u/{form.username}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell people about yourself..." rows={3} className="resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Twitter / X</Label>
            <Input value={form.twitter} onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))} placeholder="handle" />
          </div>
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} placeholder="username" />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={form.instagram} onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="handle" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="rounded-xl">
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
    </>
  );
};
