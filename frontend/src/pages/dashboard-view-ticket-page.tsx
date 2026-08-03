import { TicketDetails, TicketStatus } from "@/domain/domain";
import { getTicket, getTicketQr } from "@/lib/api";
import { format } from "date-fns";
import { Calendar, DollarSign, MapPin, Tag, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useParams, Link } from "react-router";
import StatusBadge from "@/components/status-badge";
import { cn } from "@/lib/utils";

const DashboardViewTicketPage: React.FC = () => {
  const [ticket, setTicket] = useState<TicketDetails | undefined>();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>();
  const [isQrLoading, setIsQrCodeLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const { id } = useParams();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading || !user?.access_token || !id) {
      return;
    }

    const doUseEffect = async (accessToken: string, id: string) => {
      try {
        setIsQrCodeLoading(true);
        setError(undefined);

        setTicket(await getTicket(accessToken, id));
        setQrCodeUrl(URL.createObjectURL(await getTicketQr(accessToken, id)));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("An unknown error has occurred");
        }
      } finally {
        setIsQrCodeLoading(false);
      }
    };

    doUseEffect(user?.access_token, id);

    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [user?.access_token, isLoading, id]);

  const getStatusVariant = (status: TicketStatus | string) => {
    switch (status) {
      case TicketStatus.PURCHASED:
        return "success";
      case TicketStatus.CANCELLED:
        return "danger";
      default:
        return "neutral";
    }
  };

  if (!ticket && !error) {
    return (
      <div className="flex items-center justify-center p-8 h-full">
        <div className="w-full max-w-md animate-pulse">
          <div className="h-96 bg-white/[0.03] rounded-xl border border-white/[0.06]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full min-h-[calc(100vh-4rem)]">
      {error ? (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-red-500/40 rounded-xl overflow-hidden max-w-md w-full p-4 text-red-400">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold">Error Loading Ticket</span>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        ticket && (
          <div className="w-full max-w-md relative">
            {/* Ticket Card */}
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl shadow-2xl relative overflow-hidden flex flex-col transition-all duration-200">
              {/* Top Accent Strip */}
              <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-orange-500"></div>

              {/* Status Badge - Absolute Top Right */}
              <div className="absolute top-6 right-6">
                <StatusBadge variant={getStatusVariant(ticket.status)}>
                  {ticket.status}
                </StatusBadge>
              </div>

              {/* Event Info */}
              <div className="p-8 pb-0">
                <h1 className="text-2xl font-bold text-zinc-100 pr-24 mb-4">
                  {ticket.eventName}
                </h1>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-zinc-400">
                    <MapPin className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                    <span>{ticket.eventVenue}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Calendar className="w-5 h-5 text-zinc-500 shrink-0" />
                    <div>
                      {format(ticket.eventStart, "PP")} &bull;{" "}
                      {format(ticket.eventStart, "p")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Perforation Line */}
              <div className="relative flex items-center my-8">
                <div
                  className="absolute -left-3 h-6 w-6 rounded-full bg-zinc-950 border border-white/[0.06] z-10"
                  style={{
                    borderLeftColor: "transparent",
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    transform: "rotate(45deg)",
                  }}
                ></div>
                <div className="w-full border-t-2 border-dashed border-white/[0.08]"></div>
                <div
                  className="absolute -right-3 h-6 w-6 rounded-full bg-zinc-950 border border-white/[0.06] z-10"
                  style={{
                    borderRightColor: "transparent",
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    transform: "rotate(-45deg)",
                  }}
                ></div>
              </div>

              {/* QR Code Section */}
              <div className="px-8 flex flex-col items-center">
                <div className="bg-white p-3 rounded-xl shadow-inner mb-4 w-44 h-44 flex items-center justify-center">
                  {isQrLoading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                  )}
                  {qrCodeUrl && !isQrLoading && (
                    <img
                      src={qrCodeUrl}
                      alt="Ticket QR Code"
                      className="w-full h-full object-contain rounded-md"
                    />
                  )}
                </div>
                <p className="text-zinc-500 text-sm">
                  Present this QR code at the entrance
                </p>
              </div>

              {/* Lower Perforation */}
              <div className="relative flex items-center my-8">
                <div
                  className="absolute -left-3 h-6 w-6 rounded-full bg-zinc-950 border border-white/[0.06] z-10"
                  style={{
                    borderLeftColor: "transparent",
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    transform: "rotate(45deg)",
                  }}
                ></div>
                <div className="w-full border-t-2 border-dashed border-white/[0.08]"></div>
                <div
                  className="absolute -right-3 h-6 w-6 rounded-full bg-zinc-950 border border-white/[0.06] z-10"
                  style={{
                    borderRightColor: "transparent",
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    transform: "rotate(-45deg)",
                  }}
                ></div>
              </div>

              {/* Footer Info */}
              <div className="p-8 pt-0 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Tag className="w-4 h-4 text-zinc-500" />
                    <span className="font-medium text-sm">
                      {ticket.description}
                    </span>
                  </div>
                  <p className="text-zinc-600 font-mono text-xs">{ticket.id}</p>
                </div>
                <div className="flex items-center text-amber-500 font-semibold text-xl">
                  <DollarSign className="w-5 h-5 -mr-1" />
                  <span>{ticket.price}</span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <div className="mt-8">
        <Link
          to="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
      </div>
    </div>
  );
};

export default DashboardViewTicketPage;
