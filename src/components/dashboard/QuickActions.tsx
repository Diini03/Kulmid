import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Compass, Heart, Settings, QrCode } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    label: "Create Event",
    icon: PlusCircle,
    href: "/create",
    description: "Host your own event",
  },
  {
    label: "Discover",
    icon: Compass,
    href: "/discover",
    description: "Find new events",
  },
  {
    label: "Favorites",
    icon: Heart,
    href: "/favorites",
    description: "Saved events",
  },
  {
    label: "Preferences",
    icon: Settings,
    href: "/settings",
    description: "Update profile",
  },
];

export const QuickActions = () => {
  return (
    <Card className="bg-card/50 backdrop-blur border">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-2 py-4"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
