import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminBadges } from "@/contexts/AdminBadgesContext";
import {
  LayoutDashboard,
  ShieldCheck,
  Calendar,
  Users,
  ClipboardList,
  Tag,
  BarChart3,
  Flag,
  Sliders,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import kulmidLogoNav from "@/assets/kulmid-logo-nav.png";

interface AdminLayoutProps {
  children: ReactNode;
}

type BadgeKey = "pendingEvents" | "openReports" | "pendingRegistrations";

const menuItems: { icon: typeof LayoutDashboard; label: string; path: string; badgeKey?: BadgeKey }[] = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: ShieldCheck, label: "Event Moderation", path: "/admin/events/pending", badgeKey: "pendingEvents" },
  { icon: Calendar, label: "All Events", path: "/admin/events" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: ClipboardList, label: "Registrations", path: "/admin/registrations", badgeKey: "pendingRegistrations" },
  { icon: Tag, label: "Categories", path: "/admin/categories" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Flag, label: "Reports", path: "/admin/reports", badgeKey: "openReports" },
  { icon: Sliders, label: "Platform Settings", path: "/admin/settings/platform" },
  { icon: Shield, label: "Admin Settings", path: "/admin/settings/admin" },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pendingEventsCount, openReportsCount, pendingRegistrationsCount } = useAdminBadges();

  const badgeCounts: Record<BadgeKey, number> = {
    pendingEvents: pendingEventsCount,
    openReports: openReportsCount,
    pendingRegistrations: pendingRegistrationsCount,
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <img src={kulmidLogoNav} alt="Kulmid" className="h-8 w-8 flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="font-bold text-base text-foreground">Kulmid</h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {item.badge && pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className={`text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center ${
                    collapsed ? "absolute -top-1 -right-1" : "ml-auto"
                  }`}
                >
                  {pendingCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border/50">
        <div className={`flex items-center gap-3 mb-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-sm font-semibold">
              {profile?.full_name?.charAt(0) || "A"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-[11px] text-muted-foreground">Administrator</p>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className="w-full text-xs"
          onClick={handleSignOut}
          size={collapsed ? "icon" : "sm"}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-card border-r z-50 transform transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-3 right-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-card border-r transition-all duration-200 z-30 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 overflow-auto transition-all duration-200 ${
          collapsed ? "lg:ml-[68px]" : "lg:ml-60"
        }`}
      >
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-card border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-sm">Admin Console</span>
        </div>

        <div className="p-6 lg:p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
};
