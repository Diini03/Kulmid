import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  X,
  Users,
  ScanLine,
  VideoOff,
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

const SCANNER_ELEMENT_ID = "checkin-qr-reader";

const CheckInScannerDialog = ({ eventId, open, onOpenChange }: CheckInScannerDialogProps) => {
  const { user } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [startingScanner, setStartingScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ManualGuest[]>([]);
  const [searching, setSearching] = useState(false);
  const processingRef = useRef(false);
  const lastTokenRef = useRef<string>("");
  const closingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase
      .from("event_guests")
      .select("id, checked_in")
      .eq("event_id", eventId)
      .in("status", ["registered", "invited"]);

    if (data && mountedRef.current) {
      setStats({
        total: data.length,
        checkedIn: data.filter((g) => g.checked_in).length,
      });
    }
  }, [eventId]);

  // Track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch stats when dialog opens
  useEffect(() => {
    if (open) {
      closingRef.current = false;
      fetchStats();
    }
  }, [open, fetchStats]);

  // Cleanup scanner on unmount (safety net)
  useEffect(() => {
    return () => {
      destroyScanner();
    };
  }, []);

  const destroyScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
    } catch {
      // Scanner may already be stopped or in bad state
    }

    try {
      scanner.clear();
    } catch {
      // Container may already be cleared
    }

    scannerRef.current = null;
  };

  const startScanning = async () => {
    if (scanning || startingScanner) return;

    setCameraError(null);
    setStartingScanner(true);
    setScanning(true);

    // Ensure any previous instance is fully cleaned
    await destroyScanner();

    // Wait for React to render scanner container before initializing camera
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const container = document.getElementById(SCANNER_ELEMENT_ID);
    if (!container) {
      setCameraError("Scanner container not found. Please reopen the scanner.");
      return;
    }

    // Clear any leftover children from previous scanner
    container.innerHTML = "";

    try {
      const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = html5QrCode;

      const scanConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

      const patchVideoForIOS = () => {
        const video = container.querySelector("video") as HTMLVideoElement | null;
        if (video) {
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("autoplay", "true");
          video.setAttribute("muted", "true");
          video.playsInline = true;
          video.muted = true;
          video.style.width = "100%";
          video.style.height = "100%";
          video.style.objectFit = "cover";
        }
      };

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          scanConfig,
          handleScanSuccess,
          () => {}
        );
        patchVideoForIOS();
      } catch {
        // Fallback: try front camera if back camera fails (common on iOS)
        await html5QrCode.start(
          { facingMode: "user" },
          scanConfig,
          handleScanSuccess,
          () => {}
        );
        patchVideoForIOS();
      }
      if (mountedRef.current && !closingRef.current) {
        setScanning(true);
      } else {
        // Component unmounted or dialog closing during start
        await destroyScanner();
      }
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      const message = err?.message || String(err);

      if (message.includes("NotAllowedError") || message.includes("Permission")) {
        setCameraError("Camera permission denied. Please allow camera access and try again.");
      } else if (message.includes("NotFoundError") || message.includes("no camera")) {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Failed to start camera: " + message);
      }

      if (mountedRef.current) {
        setScanning(false);
      }
      scannerRef.current = null;
    } finally {
      if (mountedRef.current) {
        setStartingScanner(false);
      }
    }
  };

  const stopScanning = async () => {
    setStartingScanner(false);
    setScanning(false);
    await destroyScanner();
  };

  const handleClose = async () => {
    closingRef.current = true;
    setStartingScanner(false);
    setScanning(false);
    setScanResult(null);
    setCameraError(null);
    setSearchQuery("");
    setSearchResults([]);

    await destroyScanner();

    onOpenChange(false);
  };

  const extractToken = (text: string): string => {
    const checkInMatch = text.match(/\/check-in\/([a-f0-9-]+)/i);
    if (checkInMatch) return checkInMatch[1];
    if (text.includes("token=")) {
      try {
        const url = new URL(text);
        return url.searchParams.get("token") || text;
      } catch {
        return text;
      }
    }
    return text;
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            scanner.pause(true);
          }
        } catch {}
      }

      const token = extractToken(decodedText);
      lastTokenRef.current = token;

      const { data, error } = await supabase.functions.invoke("verify-check-in", {
        body: { token, eventId, action: "verify" },
      });

      if (error) throw error;

      if (mountedRef.current) {
        setScanResult(data as ScanResult);

        if (data.status === "already_checked_in") {
          addRecentScan(data.guest?.name, data.guest?.email, "already");
        }
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setScanResult({ status: "error", error: err.message || "Scan failed" });
        addRecentScan(null, "", "invalid");
      }
    } finally {
      processingRef.current = false;
      // Resume scanner after delay
      setTimeout(() => {
        const scanner = scannerRef.current;
        if (scanner) {
          try {
            const state = scanner.getState();
            if (state === Html5QrcodeScannerState.PAUSED) {
              scanner.resume();
            }
          } catch {}
        }
      }, 1500);
    }
  };

  const handleConfirmCheckIn = async (token?: string, guestId?: string) => {
    if (!scanResult && !token) return;
    setConfirming(true);

    try {
      if (guestId && !token) {
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

      const checkInToken = token || "";
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
      setSearchResults((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, checked_in: true } : g))
      );
      fetchStats();
    } else {
      await handleConfirmCheckIn(undefined, guest.id);
    }
  };

  const progressPercent = stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in-0 duration-200"
        onClick={handleClose}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-background border border-border rounded-lg shadow-lg mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <ScanLine className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Event Check-In</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
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
          {/* Scanner area — container is always in DOM when dialog open */}
          <div className="rounded-xl overflow-hidden bg-black border border-border">
            <div
              id={SCANNER_ELEMENT_ID}
              className="w-full"
              style={{
                minHeight: scanning || startingScanner ? "300px" : "0px",
                height: scanning || startingScanner ? "300px" : "0px",
                display: scanning || startingScanner ? "block" : "none",
              }}
            />

            {startingScanner && (
              <div className="p-8 text-center text-muted-foreground">
                Initializing camera preview...
              </div>
            )}

            {/* Camera error state */}
            {cameraError && !scanning && !startingScanner && (
              <div className="p-8 text-center">
                <VideoOff className="h-12 w-12 text-destructive mx-auto mb-3" />
                <p className="text-destructive font-medium mb-2">Camera unavailable</p>
                <p className="text-sm text-muted-foreground mb-4">{cameraError}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={startScanning} variant="outline">
                    Try Again
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  You can use manual search below as a fallback.
                </p>
              </div>
            )}

            {/* Idle state */}
            {!scanning && !startingScanner && !cameraError && (
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

          {scanning && !startingScanner && (
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Stop Scanner
            </Button>
          )}

          {/* Scan result panel */}
          {scanResult && (
            <div
              className={`rounded-xl border-2 p-4 relative ${
                scanResult.status === "valid"
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                  : scanResult.status === "confirmed"
                  ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                  : scanResult.status === "already_checked_in"
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
              }`}
            >
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
                        onClick={() => handleConfirmCheckIn(lastTokenRef.current)}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={confirming}
                      >
                        {confirming ? "Confirming..." : "Confirm Check-In"}
                      </Button>
                    </>
                  )}

                  {scanResult.status === "confirmed" && scanResult.guest && (
                    <>
                      <p className="font-semibold text-green-900 dark:text-green-200">
                        ✓ {scanResult.guest.name || "Guest"} checked in
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">{scanResult.guest.email}</p>
                    </>
                  )}

                  {scanResult.status === "already_checked_in" && scanResult.guest && (
                    <>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">Already checked in</p>
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
                      <Button size="sm" className="flex-shrink-0" onClick={() => handleManualCheckIn(guest)}>
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
                      {scan.status === "confirmed" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {scan.status === "already" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {scan.status === "invalid" && <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInScannerDialog;
