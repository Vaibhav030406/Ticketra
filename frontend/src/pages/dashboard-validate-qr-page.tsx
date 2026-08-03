import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  TicketValidationMethod,
  TicketValidationStatus,
} from "@/domain/domain";
import { AlertCircle, Check, CloudOff, CloudLightning, Trash2, X, RotateCw, RefreshCw } from "lucide-react";
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
  const [latestScanResult, setLatestScanResult] = useState<QueuedScan | undefined>();

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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="border border-neutral-800 max-w-md w-full p-6 bg-neutral-950 rounded-2xl shadow-2xl space-y-6">
        
        {/* Header / Network Status */}
        <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Staff Ticket Validator</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Offline-Tolerant Gate Check-in</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isOnline ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <CloudOff className="w-3.5 h-3.5" />
                Offline Mode
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-[10px] text-amber-500 font-medium">
                {pendingCount} unsynced scans
              </span>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-400 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scanner Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Scanner Viewport */}
        <div className="rounded-xl overflow-hidden mx-auto relative border border-neutral-800 aspect-square w-full bg-black">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-xs">
              {!latestScanResult.synced ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-amber-500 text-white rounded-full p-5 animate-pulse">
                    <CloudLightning className="w-12 h-12" />
                  </div>
                  <span className="text-sm font-semibold text-amber-400">Scanned Locally (Queued)</span>
                </div>
              ) : latestScanResult.result?.status === TicketValidationStatus.VALID ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-green-500 text-white rounded-full p-5 animate-bounce">
                    <Check className="w-12 h-12" />
                  </div>
                  <span className="text-sm font-semibold text-green-400">VALID CHECK-IN</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div className="bg-red-500 text-white rounded-full p-5">
                    <X className="w-12 h-12" />
                  </div>
                  <span className="text-sm font-semibold text-red-400 uppercase">
                    {latestScanResult.result?.status === TicketValidationStatus.EXPIRED ? 'Expired Ticket' : 'Duplicate Scan'}
                  </span>
                  {latestScanResult.result?.originalValidatedByName && (
                    <p className="text-xs text-neutral-400 max-w-[240px]">
                      Checked in previously by <strong className="text-neutral-200">{latestScanResult.result.originalValidatedByName}</strong> on {format(new Date(latestScanResult.result.originalValidationAt!), "Pp")}
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
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 rounded-xl cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            onClick={triggerSync}
            disabled={!isOnline || pendingCount === 0 || isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
            Sync Queue {pendingCount > 0 ? `(${pendingCount})` : ''}
          </Button>
          <Button
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 p-4 rounded-xl cursor-pointer"
            onClick={handleClearHistory}
            title="Clear Synced History"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Manual Input Toggle */}
        {isManual ? (
          <div className="space-y-3">
            <Input
              className="w-full text-white text-lg bg-neutral-900 border-neutral-800 rounded-xl"
              placeholder="Enter Ticket ID Manual"
              onChange={(e) => setData(e.target.value)}
            />
            <Button
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 w-full py-5 text-sm font-semibold rounded-xl cursor-pointer"
              onClick={() =>
                handleValidate(data || "", TicketValidationMethod.MANUAL)
              }
            >
              Submit ID Manually
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-neutral-800 border bg-neutral-900/50 py-3.5 rounded-xl font-mono text-xs text-center text-neutral-400 truncate px-2">
              {data || "Ready to Scan"}
            </div>
            <Button
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 w-full py-5 text-sm font-semibold rounded-xl cursor-pointer"
              onClick={() => setIsManual(true)}
            >
              Switch to Manual Entry
            </Button>
          </div>
        )}

        <Button
          className="bg-neutral-900 hover:bg-neutral-800 w-full py-5 text-sm font-semibold rounded-xl cursor-pointer text-neutral-300 border border-neutral-900"
          onClick={handleReset}
        >
          Reset Scanner
        </Button>

        {/* Scan History Log */}
        {queue.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-neutral-500">Scan Session Log</h3>
              <span className="text-[10px] text-neutral-500">Showing newest first</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {queue.map((scan) => (
                <div
                  key={scan.clientId}
                  className="bg-neutral-900/40 border border-neutral-900 rounded-xl p-3 flex justify-between items-center text-xs gap-3"
                >
                  <div className="truncate space-y-1">
                    <p className="font-mono text-neutral-300 truncate">{scan.id}</p>
                    <p className="text-[10px] text-neutral-500">
                      {format(new Date(scan.scannedAt), "Pp")} &bull; {scan.method}
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
                        className="flex items-center gap-1 text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-help"
                        title={scan.result?.originalValidatedByName ? `Scanned by ${scan.result.originalValidatedByName}` : 'Invalid'}
                      >
                        {scan.result?.status === TicketValidationStatus.EXPIRED ? 'Expired' : 'Duplicate'}
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
