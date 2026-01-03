import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trash2, UserPlus, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/contexts/NotificationsContext";

interface NotificationsPanelProps {
  onClose: () => void;
}

export const NotificationsPanel = ({ onClose }: NotificationsPanelProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNotificationClick = async (notification: {
    id: string;
    event_id: string | null;
    type: string;
    read: boolean;
  }) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.event_id) {
      if (notification.type === "registration") {
        navigate(`/event-builder/${notification.event_id}?tab=guests`);
      } else {
        navigate(`/events/${notification.event_id}`);
      }
    }
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "invitation":
        return <Mail className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
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
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                !notification.read ? "bg-primary/5" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Avatar */}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {notification.actor_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
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
            navigate("/events");
            onClose();
          }}
        >
          <Calendar className="h-3.5 w-3.5 mr-2" />
          View My Events
        </Button>
      </div>
    </div>
  );
};
