import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Ticket, UserPlus, Share2, Settings, Plus, Globe, Twitter, Linkedin, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface ProfileHeaderProps {
  profile: {
    full_name: string;
    username?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    website?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
    created_at: string;
  };
  stats: {
    hostedEvents: number;
    attendedEvents: number;
    totalGuests: number;
  };
  isOwner: boolean;
}

export const ProfileHeader = ({ profile, stats, isOwner }: ProfileHeaderProps) => {
  const handleShare = () => {
    const url = profile.username
      ? `${window.location.origin}/u/${profile.username}`
      : window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${profile.full_name} on Kulmid`, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const joinDate = format(new Date(profile.created_at), "MMMM yyyy");

  return (
    <div className="relative">
      {/* Gradient background */}
      <div className="h-32 bg-gradient-to-r from-primary/8 via-primary/5 to-transparent rounded-2xl" />

      <div className="px-6 pb-6 -mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
          {/* Avatar */}
          <UserAvatar
            src={profile.avatar_url}
            name={profile.full_name}
            className="h-28 w-28 border-4 border-background shadow-lg"
            fallbackClassName="text-3xl"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
                {profile.username && (
                  <p className="text-muted-foreground text-sm">@{profile.username}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Joined {joinDate}</p>
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <Button variant="outline" size="sm" asChild className="rounded-xl">
                      <Link to="/settings"><Settings className="h-4 w-4 mr-1.5" />Edit Profile</Link>
                    </Button>
                    <Button size="sm" asChild className="rounded-xl">
                      <Link to="/create"><Plus className="h-4 w-4 mr-1.5" />Create Event</Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-1.5" />Share
                  </Button>
                )}
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-3 max-w-xl">{profile.bio}</p>
            )}

            {/* Social links */}
            {(profile.website || profile.twitter || profile.linkedin || profile.instagram) && (
              <div className="flex items-center gap-2 mt-3">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {profile.linkedin && (
                  <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Hosted", value: stats.hostedEvents, icon: Calendar },
            { label: "Attended", value: stats.attendedEvents, icon: Ticket },
            { label: "Guests Hosted", value: stats.totalGuests, icon: Users },
            { label: "Followers", value: 0, icon: UserPlus },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 text-center border bg-card">
              <stat.icon className="h-4 w-4 mx-auto mb-1.5 text-primary" />
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
