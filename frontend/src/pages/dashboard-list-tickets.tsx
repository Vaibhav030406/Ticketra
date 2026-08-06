import { SimplePagination } from "@/components/simple-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SpringBootPagination,
  TicketSummary,
  TicketStatus,
} from "@/domain/domain";
import { listTickets } from "@/lib/api";
import { AlertCircle, DollarSign, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import EmptyState from "@/components/empty-state";
import { Ticket as TicketIcon } from "lucide-react";

const DashboardListTickets: React.FC = () => {
  const { isLoading, user } = useAuth();

  const [tickets, setTickets] = useState<
    SpringBootPagination<TicketSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (isLoading || !user?.access_token) {
      return;
    }

    const doUseEffect = async () => {
      try {
        setTickets(await listTickets(user.access_token, page));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "string") {
          setError(err);
        } else {
          setError("An unknown error occurred");
        }
      }
    };

    doUseEffect();
  }, [isLoading, user?.access_token, page]);

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

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-red-500/40 rounded-xl overflow-hidden m-4">
        <Alert variant="destructive" className="bg-transparent border-none">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="My Tickets"
        description="Your purchased event tickets"
      />

      {tickets?.content.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="Browse events to get started"
          actionLabel="Browse events"
          actionHref="/"
          icon={<TicketIcon className="w-7 h-7 text-zinc-500" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
          {tickets?.content.map((ticketItem) => (
            <Link
              key={ticketItem.id}
              to={`/dashboard/tickets/${ticketItem.id}`}
            >
              <div className="group relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] border-l-2 border-l-amber-500 rounded-xl hover:bg-white/[0.06] hover:scale-[1.02] transition-all duration-200 overflow-hidden h-full flex flex-col p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-100 group-hover:text-amber-500 transition-colors">
                      {ticketItem.eventName || "Event Name Missing"}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                      {ticketItem.ticketType.name}
                    </p>
                  </div>
                  <StatusBadge variant={getStatusVariant(ticketItem.status)}>
                    {ticketItem.status}
                  </StatusBadge>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <DollarSign className="h-5 w-5" />
                    <span className="font-semibold text-lg">
                      {ticketItem.ticketType.price}
                    </span>
                  </div>

                  <QrCode className="h-6 w-6 text-zinc-600 group-hover:text-amber-500/40 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tickets && tickets.content.length > 0 && (
        <div className="flex justify-center py-8">
          <SimplePagination pagination={tickets} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default DashboardListTickets;
