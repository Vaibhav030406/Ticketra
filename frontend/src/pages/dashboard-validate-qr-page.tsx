import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  TicketValidationMethod,
  TicketValidationStatus,
} from "@/domain/domain";
import {
  AlertCircle,
  Check,
  CloudOff,
  CloudLightning,
  Trash2,
  X,
  RotateCw,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "react-oidc-context";
import { format } from "date-fns";
import {
  QueuedScan,
  enqueueScan,
  getQueue,
  getPendingCount,
  syncQueue,
  clearAllScans,
} from "@/lib/offline-queue";
import { cn } from "@/lib/utils";

const DashboardValidateQrPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [isManual, setIsManual] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  // Connection state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Queue & sync state
  const [queue, setQueue] = useState<QueuedScan[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [latestScanResult, setLatestScanResult] = useState<
    QueuedScan | undefined
  >();

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial load of the local queue
    refreshLocalQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync queue automatically on login / startup if online
  useEffect(() => {
    if (user?.access_token && isOnline) {
      triggerSync();
    }
  }, [user?.access_token, isOnline]);

  const refreshLocalQueue = () => {
    const currentQueue = getQueue();
    setQueue(currentQueue.reverse()); // Show newest first in history
    setPendingCount(getPendingCount());
  };

  const triggerSync = async () => {
    if (!user?.access_token || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncQueue(user.access_token, (updatedScan) => {
        // Callback per synced scan to animate UI updates
        if (latestScanResult?.clientId === updatedScan.clientId) {
          setLatestScanResult(updatedScan);
        }
      });
    } catch (err) {
      console.error("Failed to sync queue", err);
    } finally {
      setIsSyncing(false);
      refreshLocalQueue();
    }
  };

  const handleReset = () => {
    setIsManual(false);
    setData(undefined);
    setError(undefined);
    setLatestScanResult(undefined);
  };

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === "string") {
      setError(err);
    } else {
      setError("An unknown error occurred");
    }
  };

  const handleValidate = async (id: string, method: TicketValidationMethod) => {
    if (!user?.access_token) return;

    setError(undefined);

    // Sanitize the ID: strip out "Ticket ID " prefix and trim spaces
    let cleanId = id.trim();
    const prefix = "ticket id ";
    if (cleanId.toLowerCase().startsWith(prefix)) {
      cleanId = cleanId.substring(prefix.length).trim();
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanId)) {
      setError("Invalid ID format. Must be a valid 36-character UUID.");
      return;
    }

    // 1. Enqueue the scan locally (Offline first)
    const newScan = enqueueScan(cleanId, method);
    setLatestScanResult(newScan);
    refreshLocalQueue();

    // 2. If online, trigger background synchronization immediately
    if (isOnline) {
      await triggerSync();
    }
  };

  const handleClearHistory = () => {
    clearAllScans();
    refreshLocalQueue();
    setLatestScanResult(undefined);
  };

  if (isLoading || !user?.access_token) {
    return (
      <div className="h-full flex justify-center items-center text-zinc-400">
        <p className="animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full min-h-[calc(100vh-4rem)]">
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-6 transition-all duration-200">
        {/* Header / Network Status */}
        <div className="flex justify-between items-center pb-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Staff Scanner
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Offline-Tolerant Check-in
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isOnline ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <CloudOff className="w-3.5 h-3.5" />
                Offline
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-[10px] text-amber-500 font-medium">
                {pendingCount} unsynced
              </span>
            )}
          </div>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="bg-red-500/10 border-red-500/30 text-red-400 rounded-xl"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scanner Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Scanner Viewport */}
        <div className="rounded-xl overflow-hidden mx-auto relative border border-white/[0.1] shadow-[0_0_15px_rgba(255,255,255,0.05)] aspect-square w-full bg-zinc-950 transition-all duration-200">
          <Scanner
            key={`scanner-${data}-${latestScanResult?.synced}-${latestScanResult?.result?.status}`}
            onScan={(result) => {
              if (result && result[0]) {
                const qrCodeId = result[0].rawValue;
                setData(qrCodeId);
                handleValidate(qrCodeId, TicketValidationMethod.QR_SCAN);
              }
            }}
            onError={handleError}
          />

          {latestScanResult && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center backdrop-blur-md transition-all duration-300",
                !latestScanResult.synced
                  ? "bg-amber-500/10 border-4 border-amber-500/30"
                  : latestScanResult.result?.status ===
                      TicketValidationStatus.VALID
                    ? "bg-emerald-500/10 border-4 border-emerald-500/30 shadow-[inset_0_0_30px_rgba(16,185,129,0.3)]"
                    : latestScanResult.result?.status ===
                        TicketValidationStatus.EXPIRED
                      ? "bg-yellow-500/10 border-4 border-yellow-500/30"
                      : "bg-red-500/10 border-4 border-red-500/30 shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]",
              )}
            >
              {!latestScanResult.synced ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-amber-500 text-zinc-950 rounded-full p-5 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
                    <CloudLightning className="w-12 h-12" />
                  </div>
                  <span className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                    Queued Locally
                  </span>
                </div>
              ) : latestScanResult.result?.status ===
                TicketValidationStatus.VALID ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-emerald-500 text-zinc-950 rounded-full p-5 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce">
                    <Check className="w-12 h-12" />
                  </div>
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    Valid Check-in
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div
                    className={cn(
                      "text-zinc-950 rounded-full p-5 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
                      latestScanResult.result?.status ===
                        TicketValidationStatus.EXPIRED
                        ? "bg-yellow-500"
                        : "bg-red-500",
                    )}
                  >
                    <X className="w-12 h-12" />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      latestScanResult.result?.status ===
                        TicketValidationStatus.EXPIRED
                        ? "text-yellow-400"
                        : "text-red-400",
                    )}
                  >
                    {latestScanResult.result?.status ===
                    TicketValidationStatus.EXPIRED
                      ? "Expired Ticket"
                      : "Duplicate Scan"}
                  </span>
                  {latestScanResult.result?.originalValidatedByName && (
                    <p className="text-xs text-zinc-300 max-w-[240px] mt-2 bg-black/40 p-2 rounded-lg backdrop-blur-xl">
                      Checked in by{" "}
                      <strong className="text-white">
                        {latestScanResult.result.originalValidatedByName}
                      </strong>
                      <br />
                      on{" "}
                      {format(
                        new Date(latestScanResult.result.originalValidationAt!),
                        "Pp",
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sync Actions Bar */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-5 rounded-xl cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 border border-white/[0.06] transition-all duration-200"
            onClick={triggerSync}
            disabled={!isOnline || pendingCount === 0 || isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <RotateCw className="w-4 h-4 text-amber-500" />
            )}
            Sync Queue {pendingCount > 0 ? `(${pendingCount})` : ""}
          </Button>
          <Button
            className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/[0.06] text-zinc-400 hover:text-red-400 p-4 rounded-xl cursor-pointer transition-all duration-200"
            onClick={handleClearHistory}
            title="Clear Synced History"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Manual Input Toggle */}
        <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
          {isManual ? (
            <div className="space-y-3">
              <Input
                className="w-full text-zinc-100 bg-zinc-900/50 border-white/[0.08] rounded-lg focus-visible:ring-amber-500/50"
                placeholder="Enter Ticket ID"
                onChange={(e) => setData(e.target.value)}
              />
              <Button
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 w-full py-5 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-200"
                onClick={() =>
                  handleValidate(data || "", TicketValidationMethod.MANUAL)
                }
              >
                Submit ID Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-white/[0.06] border bg-zinc-900/50 py-3 rounded-lg font-mono text-xs text-center text-zinc-500 truncate px-2">
                {data || "Ready to Scan"}
              </div>
              <Button
                variant="ghost"
                className="w-full py-5 text-sm font-medium rounded-lg cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-all duration-200"
                onClick={() => setIsManual(true)}
              >
                Switch to Manual Entry
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full py-5 text-sm font-medium rounded-xl cursor-pointer text-zinc-300 border-white/[0.06] bg-transparent hover:bg-white/[0.06] transition-all duration-200"
          onClick={handleReset}
        >
          Reset Scanner
        </Button>

        {/* Scan History Log */}
        {queue.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-zinc-500">
                Session Log
              </h3>
              <span className="text-[10px] text-zinc-600">Newest first</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {queue.map((scan) => (
                <div
                  key={scan.clientId}
                  className="bg-zinc-900/40 border border-white/[0.04] rounded-lg p-3 flex justify-between items-center text-xs gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="truncate space-y-1">
                    <p className="font-mono text-zinc-300 truncate">
                      {scan.id}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {format(new Date(scan.scannedAt), "Pp")} &bull;{" "}
                      {scan.method}
                    </p>
                  </div>
                  <div>
                    {!scan.synced ? (
                      <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Queued
                      </span>
                    ) : scan.result?.status === TicketValidationStatus.VALID ? (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Valid
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-help",
                          scan.result?.status === TicketValidationStatus.EXPIRED
                            ? "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20"
                            : "text-red-400 bg-red-500/10 border border-red-500/20",
                        )}
                        title={
                          scan.result?.originalValidatedByName
                            ? `Scanned by ${scan.result.originalValidatedByName}`
                            : "Invalid"
                        }
                      >
                        {scan.result?.status === TicketValidationStatus.EXPIRED
                          ? "Expired"
                          : "Duplicate"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardValidateQrPage;
