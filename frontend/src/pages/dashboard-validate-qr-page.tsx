import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  TicketValidationMethod,
  TicketValidationStatus,
  TicketValidationResponse,
} from "@/domain/domain";
import { AlertCircle, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateTicket } from "@/lib/api";
import { useAuth } from "react-oidc-context";
import { format } from "date-fns";

const DashboardValidateQrPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [isManual, setIsManual] = useState(false);
  const [data, setData] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [validationResponse, setValidationResponse] = useState<
    TicketValidationResponse | undefined
  >();

  const handleReset = () => {
    setIsManual(false);
    setData(undefined);
    setError(undefined);
    setValidationResponse(undefined);
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
    if (!user?.access_token) {
      return;
    }
    try {
      setError(undefined);
      const response = await validateTicket(user.access_token, {
        id,
        method,
      });
      setValidationResponse(response);
    } catch (err) {
      handleError(err);
    }
  };

  if (isLoading || !user?.access_token) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
      <div className="border border-neutral-800 max-w-sm w-full p-6 bg-neutral-950 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">Staff Ticket Validator</h1>
          <p className="text-xs text-neutral-500 mt-1">Scan QRs or enter Ticket IDs manually</p>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-400 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Scanner Viewport */}
        <div className="rounded-xl overflow-hidden mx-auto relative border border-neutral-800 aspect-square w-full">
          <Scanner
            key={`scanner-${data}-${validationResponse?.status}`}
            onScan={(result) => {
              if (result && result[0]) {
                const qrCodeId = result[0].rawValue;
                setData(qrCodeId);
                handleValidate(qrCodeId, TicketValidationMethod.QR_SCAN);
              }
            }}
            onError={handleError}
          />

          {validationResponse && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
              {validationResponse.status === TicketValidationStatus.VALID ? (
                <div className="bg-green-500 text-white rounded-full p-5 animate-pulse">
                  <Check className="w-16 h-16" />
                </div>
              ) : (
                <div className="bg-red-500 text-white rounded-full p-5 animate-bounce">
                  <X className="w-16 h-16" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Details */}
        {validationResponse && (
          <div className="p-4 rounded-xl border bg-neutral-900/50 border-neutral-800 space-y-3">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-neutral-500">Scan Status</h3>
            <div className="flex items-center gap-2">
              {validationResponse.status === TicketValidationStatus.VALID ? (
                <>
                  <div className="bg-green-500/20 text-green-400 p-1.5 rounded-lg">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-green-400">VALID CHECK-IN</span>
                </>
              ) : (
                <>
                  <div className="bg-red-500/20 text-red-400 p-1.5 rounded-lg">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-red-400">
                    {validationResponse.status === TicketValidationStatus.EXPIRED ? 'EXPIRED TICKET' : 'INVALID (DUPLICATE SCAN)'}
                  </span>
                </>
              )}
            </div>

            {validationResponse.originalValidatedByName && validationResponse.originalValidationAt && (
              <div className="mt-2 text-xs text-neutral-400 bg-neutral-950 border border-neutral-800/80 rounded-lg p-3 space-y-1">
                <p className="text-red-400 font-semibold mb-1">⚠️ Already scanned:</p>
                <p>Checked in by: <strong className="text-neutral-200">{validationResponse.originalValidatedByName}</strong></p>
                <p>Check-in time: <strong className="text-neutral-200">{format(new Date(validationResponse.originalValidationAt), "Pp")}</strong></p>
              </div>
            )}
          </div>
        )}

        {isManual ? (
          <div className="space-y-4">
            <Input
              className="w-full text-white text-lg bg-neutral-900 border-neutral-800 rounded-xl"
              placeholder="Enter Ticket UUID"
              onChange={(e) => setData(e.target.value)}
            />
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 w-full py-6 text-sm font-semibold rounded-xl cursor-pointer"
              onClick={() =>
                handleValidate(data || "", TicketValidationMethod.MANUAL)
              }
            >
              Submit ID Manually
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-neutral-800 border bg-neutral-900/50 py-3 rounded-xl font-mono text-xs text-center text-neutral-400 truncate px-2">
              {data || "Ready to Scan"}
            </div>
            <Button
              className="bg-neutral-900 hover:bg-neutral-800 border-neutral-800 border w-full py-6 text-sm font-semibold rounded-xl cursor-pointer"
              onClick={() => setIsManual(true)}
            >
              Switch to Manual Entry
            </Button>
          </div>
        )}

        <Button
          className="bg-neutral-850 hover:bg-neutral-800 w-full py-6 text-sm font-semibold rounded-xl cursor-pointer text-neutral-300"
          onClick={handleReset}
        >
          Reset Scanner
        </Button>
      </div>
    </div>
  );
};

export default DashboardValidateQrPage;
