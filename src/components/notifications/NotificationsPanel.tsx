import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, Trash2, UserPlus, Mail, Calendar, Sparkles, Trophy,
  CheckCircle, XCircle, Ticket, ScanLine, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useMemo } from "react";

interface NotificationsPanelProps {
  onClose: () => void;
}

interface GroupedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  event_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  read: boolean;
  created_at: string;
  count: number;
  ids: string[];
}

const GROUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export const NotificationsPanel = ({ onClose }: NotificationsPanelProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const groupedNotifications = useMemo(() => {
    const groups: GroupedNotification[] = [];

    for (const notif of notifications) {
      const lastGroup = groups[groups.length - 1];
      if (
        lastGroup &&
        lastGroup.type === notif.type &&
        lastGroup.event_id === notif.event_id &&
        Math.abs(new Date(lastGroup.created_at).getTime() - new Date(notif.created_at).getTime()) < GROUP_WINDOW_MS
      ) {
        lastGroup.count++;
        lastGroup.ids.push(notif.id);
        if (!notif.read) lastGroup.read = false;
      } else {
        groups.push({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          event_id: notif.event_id,
          actor_name: notif.actor_name,
          actor_email: notif.actor_email,
          read: notif.read,
          created_at: notif.created_at,
          count: 1,
          ids: [notif.id],
        });
      }
    }

    return groups;
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "invitation":
        return <Mail className="h-4 w-4 text-primary" />;
      case "welcome":
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case "milestone":
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case "event_approved":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "event_rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "registration_confirmed":
        return <Ticket className="h-4 w-4 text-emerald-500" />;
      case "registration_rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "check_in":
        return <ScanLine className="h-4 w-4 text-teal-500" />;
      case "admin_new_event":
        return <ShieldCheck className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDisplayTitle = (group: GroupedNotification) => {
    if (group.count > 1 && group.type === "registration") {
      return `${group.count} new registrations for your event`;
    }
    if (group.count > 1 && group.type === "check_in") {
      return `${group.count} guests checked in at your event`;
    }
    return group.title;
  };

  const handleNotificationClick = (group: GroupedNotification) => {
    // Mark all in group as read
    group.ids.forEach((id) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.read) markAsRead(id);
    });

    if (group.event_id) {
      onClose();
      // Admin notifications go to admin overview, others go to event view
      if (group.type === "admin_new_event") {
        navigate("/admin");
      } else {
        navigate(`/events/${group.event_id}`);
      }
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No notifications yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          You'll see updates about your events here
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={markAllAsRead}
          >
            <Check className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[350px]">
        <div className="divide-y">
          {groupedNotifications.map((group) => (
            <div
              key={group.id}
              className={`flex gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/50 ${
                !group.read ? "bg-primary/5" : ""
              }`}
              onClick={() => handleNotificationClick(group)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(group)}
            >
              {/* Avatar */}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {group.actor_name?.charAt(0).toUpperCase() || "K"}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {getNotificationIcon(group.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {getDisplayTitle(group)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {group.count > 1
                        ? `Latest: ${group.message}`
                        : group.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                  </span>
                  {!group.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                  {group.count > 1 && (
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {group.count} items
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {!group.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Mark as read"
                    onClick={() => group.ids.forEach((id) => markAsRead(id))}
                  >
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Delete"
                  onClick={() => group.ids.forEach((id) => deleteNotification(id))}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            onClose();
          }}
        >
          <Calendar className="h-3.5 w-3.5 mr-2" />
          Close
        </Button>
      </div>
    </div>
  );
};
