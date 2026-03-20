import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  X,
  Users,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";

interface CheckInScannerDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ScanStatus = "idle" | "valid" | "already_checked_in" | "invalid" | "confirmed" | "error";

interface ScanResult {
  status: ScanStatus;
  guest?: {
    id: string;
    name: string | null;
    email: string;
    organization?: string | null;
    registration_status?: string;
  };
  checked_in_at?: string;
  error?: string;
}

interface RecentScan {
  name: string | null;
  email: string;
  status: "confirmed" | "already" | "invalid";
  time: string;
}

interface ManualGuest {
  id: string;
  name: string | null;
  email: string;
  checked_in: boolean;
  check_in_token: string | null;
}

const CheckInScannerDialog = ({ eventId, open, onOpenChange }: CheckInScannerDialogProps) => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ManualGuest[]>([]);
  const [searching, setSearching] = useState(false);
  const processingRef = useRef(false);
  const lastTokenRef = useRef<string>("");

  const fetchStats = useCallback(async () => {
    const { data } = await supabase
      .from("event_guests")
      .select("id, checked_in")
      .eq("event_id", eventId)
      .in("status", ["registered", "invited"]);

    if (data) {
      setStats({
        total: data.length,
        checkedIn: data.filter((g) => g.checked_in).length,
      });
    }
  }, [eventId]);

  useEffect(() => {
    if (open) {
      fetchStats();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setScanning(false);
    };
  }, [open, fetchStats]);

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("checkin-qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {} // ignore not-found errors
      );

      setScanning(true);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      toast.error("Failed to start camera: " + err.message);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const extractToken = (text: string): string => {
    // Handle URL format: https://kulmid.lovable.app/check-in/{token}
    const checkInMatch = text.match(/\/check-in\/([a-f0-9-]+)/i);
    if (checkInMatch) return checkInMatch[1];
    // Handle query param: ?token=...
    if (text.includes("token=")) {
      try {
        const url = new URL(text);
        return url.searchParams.get("token") || text;
      } catch { return text; }
    }
    return text;
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      if (scannerRef.current) {
        scannerRef.current.pause(true);
      }

      const token = extractToken(decodedText);
      lastTokenRef.current = token;

      const { data, error } = await supabase.functions.invoke("verify-check-in", {
        body: { token, eventId, action: "verify" },
      });

      if (error) throw error;

      setScanResult(data as ScanResult);

      if (data.status === "already_checked_in") {
        addRecentScan(data.guest?.name, data.guest?.email, "already");
      }
    } catch (err: any) {
      setScanResult({ status: "error", error: err.message || "Scan failed" });
      addRecentScan(null, "", "invalid");
    } finally {
      processingRef.current = false;
      // Resume scanner after a short delay
      setTimeout(() => {
        if (scannerRef.current) {
          try { scannerRef.current.resume(); } catch {}
        }
      }, 1500);
    }
  };

  const handleConfirmCheckIn = async (token?: string, guestId?: string) => {
    if (!scanResult && !token) return;
    setConfirming(true);

    try {
      // For manual check-in, use the token directly
      const checkInToken = token || "";
      
      if (guestId && !token) {
        // Manual check-in via direct DB update (for search results without token)
        const { error } = await supabase
          .from("event_guests")
          .update({
            checked_in: true,
            checked_in_at: new Date().toISOString(),
            checked_in_by: user?.id || null,
          })
          .eq("id", guestId);

        if (error) throw error;

        toast.success("Guest checked in!");
        fetchStats();
        setSearchResults((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, checked_in: true } : g))
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke("verify-check-in", {
        body: { token: checkInToken, eventId, organizerId: user?.id, action: "confirm" },
      });

      if (error) throw error;

      if (data.status === "confirmed") {
        setScanResult({ ...data, status: "confirmed" });
        addRecentScan(data.guest?.name, data.guest?.email, "confirmed");
        toast.success(`${data.guest?.name || "Guest"} checked in!`);
        fetchStats();
      } else {
        toast.error(data.error || "Check-in failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm check-in");
    } finally {
      setConfirming(false);
    }
  };

  const addRecentScan = (name: string | null, email: string, status: RecentScan["status"]) => {
    setRecentScans((prev) => [
      { name, email, status, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  };

  const clearResult = () => {
    setScanResult(null);
  };

  // Manual search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    const { data } = await supabase
      .from("event_guests")
      .select("id, name, email, checked_in, check_in_token")
      .eq("event_id", eventId)
      .in("status", ["registered", "invited"])
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const handleManualCheckIn = async (guest: ManualGuest) => {
    if (guest.check_in_token) {
      await handleConfirmCheckIn(guest.check_in_token);
      // Refresh search results
      setSearchResults((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, checked_in: true } : g))
      );
      fetchStats();
    } else {
      await handleConfirmCheckIn(undefined, guest.id);
    }
  };

  const progressPercent = stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopScanning(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl w-full max-h-[95vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Event Check-In</h2>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{stats.checkedIn}</span>
              <span className="text-muted-foreground">/ {stats.total} checked in</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {stats.total - stats.checkedIn} remaining
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="p-4 space-y-4">
          {/* Scanner area */}
          <div className="rounded-xl overflow-hidden bg-muted border border-border">
            <div
              id="checkin-qr-reader"
              className="w-full"
              style={{ minHeight: scanning ? "280px" : "0px", display: scanning ? "block" : "none" }}
            />
            {!scanning && (
              <div className="p-8 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Ready to scan QR codes</p>
                <Button onClick={startScanning} size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Scanner
                </Button>
              </div>
            )}
          </div>

          {scanning && (
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Stop Scanner
            </Button>
          )}

          {/* Scan result panel */}
          {scanResult && (
            <div className={`rounded-xl border-2 p-4 relative ${
              scanResult.status === "valid"
                ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                : scanResult.status === "confirmed"
                ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                : scanResult.status === "already_checked_in"
                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            }`}>
              <button
                onClick={clearResult}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3">
                {scanResult.status === "valid" && (
                  <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                {scanResult.status === "confirmed" && (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {scanResult.status === "already_checked_in" && (
                  <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                {(scanResult.status === "invalid" || scanResult.status === "error") && (
                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  {/* Valid — show guest + confirm button */}
                  {scanResult.status === "valid" && scanResult.guest && (
                    <>
                      <p className="font-semibold text-blue-900 dark:text-blue-200">
                        {scanResult.guest.name || "Guest"}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{scanResult.guest.email}</p>
                      {scanResult.guest.organization && (
                        <p className="text-xs text-muted-foreground mt-0.5">{scanResult.guest.organization}</p>
                      )}
                      <Badge variant="secondary" className="mt-2">
                        {scanResult.guest.registration_status}
                      </Badge>
                      <Button
                        onClick={() => {
                          handleConfirmCheckIn(lastTokenRef.current);
                        }}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={confirming}
                      >
                        {confirming ? "Confirming..." : "Confirm Check-In"}
                      </Button>
                    </>
                  )}

                  {/* Confirmed */}
                  {scanResult.status === "confirmed" && scanResult.guest && (
                    <>
                      <p className="font-semibold text-green-900 dark:text-green-200">
                        ✓ {scanResult.guest.name || "Guest"} checked in
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">{scanResult.guest.email}</p>
                    </>
                  )}

                  {/* Already checked in */}
                  {scanResult.status === "already_checked_in" && scanResult.guest && (
                    <>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        Already checked in
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {scanResult.guest.name} — {scanResult.guest.email}
                      </p>
                      {scanResult.checked_in_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Checked in at {new Date(scanResult.checked_in_at).toLocaleTimeString()}
                        </p>
                      )}
                    </>
                  )}

                  {/* Invalid / Error */}
                  {(scanResult.status === "invalid" || scanResult.status === "error") && (
                    <>
                      <p className="font-semibold text-red-900 dark:text-red-200">
                        {scanResult.status === "invalid" ? "Invalid QR Code" : "Error"}
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {scanResult.error || "Invalid or unknown QR code"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual search */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Manual search</p>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{guest.name || guest.email}</p>
                      {guest.name && (
                        <p className="text-xs text-muted-foreground truncate">{guest.email}</p>
                      )}
                    </div>
                    {guest.checked_in ? (
                      <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs flex-shrink-0">
                        Checked in
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => handleManualCheckIn(guest)}
                      >
                        Check In
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent scans */}
          {recentScans.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent scans</p>
              <div className="space-y-1">
                {recentScans.map((scan, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="truncate">{scan.name || scan.email || "Unknown"}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{scan.time}</span>
                      {scan.status === "confirmed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {scan.status === "already" && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      {scan.status === "invalid" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInScannerDialog;
