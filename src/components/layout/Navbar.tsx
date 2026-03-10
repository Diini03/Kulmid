import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { AuthRequiredModal } from "@/components/auth/AuthRequiredModal";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Moon, Sun, Menu, User, LogOut, Monitor, Check, Compass, Search, Bell, Plus, Sparkles, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { usePendingActions } from "@/contexts/PendingActionsContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { Badge } from "@/components/ui/badge";
import kulmidLogoNav from "@/assets/kulmid-logo-nav.png";

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar = ({ onOpenSearch }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const { totalPendingCount } = usePendingActions();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;

  const getThemeIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Moon className="h-4 w-4" />;
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-background/80 backdrop-blur-xl border-b shadow-sm" 
        : "bg-background/50 backdrop-blur-md"
    }`}>
      <nav className="container max-w-5xl mx-auto px-4 flex items-center justify-between gap-4 h-16">
        {/* Left Side - Logo + Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (user) {
                navigate('/events');
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity p-1"
          >
            <img src={kulmidLogoNav} alt="Kulmid" className="h-9 w-9" />
          </button>

          {!isAdmin && (
            <div className="hidden md:flex items-center ml-4">
              <NavLink to="/events" className={linkCls}>
                <Calendar className="h-4 w-4" />
                Events
              </NavLink>
              <NavLink to="/discover" className={linkCls}>
                <Compass className="h-4 w-4" />
                Discover
              </NavLink>
            </div>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Time Display */}
          <div className="hidden lg:flex items-center px-3 py-1.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
            {currentTime}
          </div>

          {/* Create Event Button */}
          {user && !isAdmin && (
            <Button asChild size="sm" variant="default" className="hidden md:flex">
              <Link to="/create">Create Event</Link>
            </Button>
          )}

          {/* Search Button */}
          <Button variant="ghost" size="icon" onClick={onOpenSearch} aria-label="Search" className="rounded-xl">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          {user && !isAdmin && (
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative rounded-xl">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse-glow">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0 rounded-2xl shadow-xl" align="end">
                <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
              </PopoverContent>
            </Popover>
          )}

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex rounded-xl" aria-label="Toggle theme">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  System
                </div>
                {theme === "system" && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light
                </div>
                {theme === "light" && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center justify-between rounded-lg">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark
                </div>
                {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 relative">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">
                      {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {totalPendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {totalPendingCount > 9 ? "9+" : totalPendingCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
                <div className="px-3 py-2">
                  <div className="font-bold">{profile?.full_name || 'User'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="my-2 h-px bg-border" />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/dashboard" className="flex items-center gap-3">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/events" className="flex items-center gap-3 justify-between w-full">
                    <span className="flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      My Events
                    </span>
                    {totalPendingCount > 0 && (
                      <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] h-5 px-2">
                        {totalPendingCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/admin" className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <div className="my-2 h-px bg-border" />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/settings" className="flex items-center gap-3">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 rounded-xl text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden md:flex rounded-xl" onClick={() => openAuthModal("signin")}>
                Sign In
              </Button>
              <Button size="sm" variant="default" className="hidden md:flex" onClick={() => openAuthModal("signup")}>
                Sign Up
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu" className="rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src={kulmidLogoNav} alt="Kulmid" className="h-8 w-8" />
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Main Navigation */}
                  <div className="space-y-2">
                    <NavLink 
                      to="/events" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-secondary"
                        }`
                      }
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">Events</span>
                    </NavLink>
                    <NavLink 
                      to="/discover" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-secondary"
                        }`
                      }
                    >
                      <Compass className="h-5 w-5" />
                      <span className="font-medium">Discover</span>
                    </NavLink>
                  </div>

                  {/* User Actions */}
                  {user ? (
                    <>
                      <div className="border-t pt-4 space-y-2">
                        <NavLink 
                          to="/create" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-secondary"
                            }`
                          }
                        >
                          <Plus className="h-5 w-5" />
                          <span className="font-medium">Create Event</span>
                        </NavLink>
                        <NavLink 
                          to="/events" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => 
                            `flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-secondary"
                            }`
                          }
                        >
                          <span className="flex items-center gap-3">
                            <Calendar className="h-5 w-5" />
                            <span className="font-medium">My Events</span>
                          </span>
                          {totalPendingCount > 0 && (
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] h-5 px-2">
                              {totalPendingCount}
                            </Badge>
                          )}
                        </NavLink>
                        <NavLink 
                          to="/dashboard" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-secondary"
                            }`
                          }
                        >
                          <User className="h-5 w-5" />
                          <span className="font-medium">Dashboard</span>
                        </NavLink>
                        {isAdmin && (
                          <NavLink 
                            to="/admin" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) => 
                              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                isActive 
                                  ? "bg-primary text-primary-foreground" 
                                  : "hover:bg-secondary"
                              }`
                            }
                          >
                            <Sparkles className="h-5 w-5" />
                            <span className="font-medium">Admin</span>
                          </NavLink>
                        )}
                      </div>
                      <div className="border-t pt-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Sign Out</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openAuthModal("signin");
                        }}
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">Sign In</span>
                      </Button>
                      <Button 
                        variant="default"
                        className="w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openAuthModal("signup");
                        }}
                      >
                        <Plus className="h-5 w-5" />
                        <span className="font-medium">Sign Up</span>
                      </Button>
                    </div>
                  )}

                  {/* Theme Toggle */}
                  <div className="border-t pt-4">
                    <div className="px-4 mb-2 text-sm text-muted-foreground font-medium">Theme</div>
                    <div className="flex gap-2 px-4">
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="flex-1 rounded-xl"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="flex-1 rounded-xl"
                      >
                        <Sun className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="flex-1 rounded-xl"
                      >
                        <Moon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthRequiredModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        mode={authModalMode}
      />
    </header>
  );
};