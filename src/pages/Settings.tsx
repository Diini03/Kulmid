import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Seo } from "@/components/Seo";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="container py-12">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "profile": return <ProfileSettings />;
      case "account": return <AccountSettings />;
      case "notifications": return <NotificationSettings />;
      case "privacy": return <PrivacySettings />;
      case "preferences": return <PreferencesSettings />;
      case "appearance": return <AppearanceSettings />;
      case "security": return <SecuritySettings />;
      default: return <ProfileSettings />;
    }
  };

  return (
    <>
      <Seo title="Settings" description="Manage your account settings" canonical="/settings" />
      <div className="container max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden">
          <SettingsSidebar active={activeSection} onChange={setActiveSection} />
        </div>

        <div className="flex gap-8 mt-4">
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <SettingsSidebar active={activeSection} onChange={setActiveSection} />
          </div>
          <div className="flex-1 min-w-0">
            {renderSection()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
