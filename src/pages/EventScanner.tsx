import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Camera, CheckCircle2, XCircle, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface CheckInResult {
  success: boolean;
  alreadyCheckedIn: boolean;
  message: string;
  guest: {
    name: string;
    email: string;
    phone_number?: string;
    organization?: string;
  };
  event: {
    title: string;
    date: string;
    location: string;
  };
}

interface EventDetails {
  title: string;
  date: string;
  location: string;
}

interface CheckInStats {
  total: number;
  checkedIn: number;
}

export default function EventScanner() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [stats, setStats] = useState<CheckInStats>({ total: 0, checkedIn: 0 });
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);

  useEffect(() => {
    if (!eventId || !user) return;

    // Fetch event details and verify ownership
    const fetchEventDetails = async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select("title, date, location, created_by")
        .eq("id", eventId)
        .single();

      if (error || !event) {
        toast.error("Event not found");
        navigate("/events");
        return;
      }

      if (event.created_by !== user.id) {
        toast.error("You don't have permission to scan for this event");
        navigate("/events");
        return;
      }

      setEventDetails({
        title: event.title,
        date: new Date(event.date).toLocaleString(),
        location: event.location,
      });
    };

    fetchEventDetails();
    fetchStats();
    fetchRecentCheckIns();

    // Cleanup scanner on unmount
    return () => {
      if (scanner) {
        scanner.stop().catch(console.error);
      }
    };
  }, [eventId, user, navigate]);

  const fetchStats = async () => {
    if (!eventId) return;

    const { data: guests } = await supabase
      .from("event_guests")
      .select("id, checked_in")
      .eq("event_id", eventId)
      .in("status", ["registered", "invited"]);

    if (guests) {
      setStats({
        total: guests.length,
        checkedIn: guests.filter((g) => g.checked_in).length,
      });
    }
  };

  const fetchRecentCheckIns = async () => {
    if (!eventId) return;

    const { data } = await supabase
      .from("event_guests")
      .select("name, email, checked_in_at")
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .order("checked_in_at", { ascending: false })
      .limit(5);

    if (data) {
      setRecentCheckIns(data);
    }
  };

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        handleScanError
      );

      setScanning(true);
      toast.success("Scanner started");
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      toast.error("Failed to start camera: " + err.message);
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        setScanning(false);
        toast.info("Scanner stopped");
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!user) return;

    try {
      // Stop scanning temporarily to prevent multiple scans
      if (scanner) {
        await scanner.pause(true);
      }

      // Extract token from URL if it's a full URL
      let token = decodedText;
      if (decodedText.includes("token=")) {
        const url = new URL(decodedText);
        token = url.searchParams.get("token") || decodedText;
      }

      console.log("Verifying token:", token);

      // Call verification edge function
      const { data, error } = await supabase.functions.invoke("verify-check-in", {
        body: { token, organizerId: user.id },
      });

      if (error) throw error;

      const result: CheckInResult = data;
      setLastResult(result);

      if (result.success) {
        if (result.alreadyCheckedIn) {
          toast.info(result.message);
        } else {
          toast.success(result.message);
          fetchStats();
          fetchRecentCheckIns();
        }
      } else {
        toast.error(result.message || "Check-in failed");
      }

      // Resume scanning after 3 seconds
      setTimeout(() => {
        if (scanner) {
          scanner.resume();
        }
      }, 3000);
    } catch (err: any) {
      console.error("Check-in error:", err);
      toast.error(err.message || "Failed to verify check-in");
      
      // Resume scanning after error
      setTimeout(() => {
        if (scanner) {
          scanner.resume();
        }
      }, 2000);
    }
  };

  const handleScanError = (errorMessage: string) => {
    // Ignore common scanning errors
    if (!errorMessage.includes("NotFoundException")) {
      console.warn("Scan error:", errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/events")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Event Check-In Scanner</h1>
            {eventDetails && (
              <p className="text-muted-foreground">{eventDetails.title}</p>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Guests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Checked In</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.checkedIn} <span className="text-sm text-muted-foreground">/ {stats.total}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              id="qr-reader" 
              className="w-full rounded-lg overflow-hidden bg-muted"
              style={{ minHeight: scanning ? "300px" : "0px" }}
            />
            
            {!scanning ? (
              <Button onClick={startScanning} className="w-full" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Start Scanner
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="w-full" size="lg">
                Stop Scanner
              </Button>
            )}

            {lastResult && (
              <div className={`p-4 rounded-lg border-2 ${
                lastResult.success 
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                  : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
              }`}>
                <div className="flex items-start gap-3">
                  {lastResult.success ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{lastResult.message}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Guest:</strong> {lastResult.guest.name}</p>
                      <p><strong>Email:</strong> {lastResult.guest.email}</p>
                      {lastResult.guest.organization && (
                        <p><strong>Organization:</strong> {lastResult.guest.organization}</p>
                      )}
                    </div>
                    {lastResult.alreadyCheckedIn && (
                      <Badge variant="secondary" className="mt-2">Already Checked In</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        {recentCheckIns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Check-Ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCheckIns.map((checkIn, index) => (
                  <div key={index}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{checkIn.name}</p>
                        <p className="text-sm text-muted-foreground">{checkIn.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
