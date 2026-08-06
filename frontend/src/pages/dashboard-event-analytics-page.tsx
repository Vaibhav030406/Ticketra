import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EventAnalytics, TicketTypeSales } from "@/domain/domain";
import { getEventAnalytics } from "@/lib/api";
import { useRoles } from "@/hooks/use-roles";
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  DollarSign,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate, useParams } from "react-router";
import PageHeader from "@/components/page-header";

// ------------- Skeleton card used during loading state ----------------------
const SkeletonCard: React.FC = () => (
  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 animate-pulse space-y-4">
    <div className="h-4 bg-white/[0.06] rounded w-1/3" />
    <div className="h-8 bg-white/[0.06] rounded w-1/2" />
    <div className="h-2 bg-white/[0.06] rounded-full w-full" />
    <div className="flex gap-4">
      <div className="h-4 bg-white/[0.06] rounded w-1/4" />
      <div className="h-4 bg-white/[0.06] rounded w-1/4" />
    </div>
  </div>
);

// ------------- Per-ticket-type breakdown card --------------------------------
const TicketTypeCard: React.FC<{ data: TicketTypeSales }> = ({ data }) => {
  const soldPct =
    data.totalAvailable > 0
      ? Math.min(100, Math.round((data.soldCount / data.totalAvailable) * 100))
      : 0;

  const barColor =
    soldPct >= 90
      ? "bg-red-500"
      : soldPct >= 60
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.05] transition-all duration-200 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-amber-500/80 uppercase tracking-wider mb-0.5">
            Ticket Type
          </p>
          <h3 className="text-lg font-semibold text-zinc-100">{data.ticketTypeName}</h3>
          <p className="text-sm text-zinc-500 mt-0.5">?{data.price.toLocaleString()} / ticket</p>
        </div>
        <span className="text-2xl font-bold text-zinc-100 tabular-nums">
          {soldPct}%
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${soldPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-1.5">
          <span>{data.soldCount} sold</span>
          <span>{data.remainingCapacity} remaining / {data.totalAvailable} total</span>
        </div>
      </div>

      {/* Revenue */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-sm">
        <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-zinc-400">Revenue from this type:</span>
        <span className="text-emerald-400 font-semibold ml-auto">
          ?{data.revenue.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ------------- Stat summary card ----------------------------------------
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, accent }) => (
  <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 flex items-start gap-4">
    <div className={`p-3 rounded-xl ${accent} shrink-0`}>{icon}</div>
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-zinc-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ------------- Main page ----------------------------------------------------
const DashboardEventAnalyticsPage: React.FC = () => {
  const { id } = useParams();
  const { isLoading: authLoading, user } = useAuth();
  const { isOrganizer, isLoading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<EventAnalytics | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || rolesLoading) return;

    // Redirect non-organisers away immediately.
    if (!isOrganizer) {
      navigate("/dashboard/events", { replace: true });
      return;
    }

    if (!user?.access_token || !id) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getEventAnalytics(user.access_token, id);
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user, authLoading, rolesLoading, isOrganizer, navigate]);

  // ---- render loading ----
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8 max-w-5xl">
        <div className="h-6 bg-white/[0.06] rounded w-40 animate-pulse" />
        <div className="h-8 bg-white/[0.06] rounded w-64 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ---- render error ----
  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-5xl">
        <Link
          to="/dashboard/events"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
        <div className="backdrop-blur-xl bg-white/[0.03] border border-red-500/40 rounded-xl overflow-hidden">
          <Alert variant="destructive" className="bg-transparent border-none">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load analytics</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const fillPct =
    analytics.totalCapacity > 0
      ? Math.round((analytics.totalSold / analytics.totalCapacity) * 100)
      : 0;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">
      {/* Back link */}
      <Link
        to="/dashboard/events"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Page header */}
      <PageHeader
        title={`Analytics: ${analytics.eventName}`}
        description="Ticket sales, revenue, and remaining capacity breakdown"
      />

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Revenue"
          value={`?${analytics.totalRevenue.toLocaleString()}`}
          sub="Across all ticket types"
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Tickets Sold"
          value={`${analytics.totalSold.toLocaleString()}`}
          sub={`of ${analytics.totalCapacity.toLocaleString()} total capacity`}
          icon={<Ticket className="h-5 w-5 text-amber-400" />}
          accent="bg-amber-500/10"
        />
        <StatCard
          label="Fill Rate"
          value={`${fillPct}%`}
          sub={`${analytics.totalCapacity - analytics.totalSold} seats remaining`}
          icon={<Users className="h-5 w-5 text-sky-400" />}
          accent="bg-sky-500/10"
        />
      </div>

      {/* Overall fill bar */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">
            Overall Capacity Fill
          </h2>
        </div>
        <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{analytics.totalSold} sold</span>
          <span>{fillPct}% filled</span>
          <span>{analytics.totalCapacity - analytics.totalSold} remaining</span>
        </div>
      </div>

      {/* Per-ticket-type breakdown */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          Ticket Type Breakdown
        </h2>

        {analytics.ticketTypeBreakdown.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/[0.1] rounded-xl text-zinc-500 text-sm">
            No ticket types found for this event.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {analytics.ticketTypeBreakdown.map((tt) => (
              <TicketTypeCard key={tt.ticketTypeId} data={tt} />
            ))}
          </div>
        )}
      </div>

      {/* Revenue breakdown table */}
      {analytics.ticketTypeBreakdown.length > 1 && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue Summary
            </h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {analytics.ticketTypeBreakdown.map((tt) => (
              <div
                key={tt.ticketTypeId}
                className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-200">{tt.ticketTypeName}</span>
                  <span className="text-xs text-zinc-500">
                    {tt.soldCount} × ?{tt.price.toLocaleString()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-emerald-400">
                  ?{tt.revenue.toLocaleString()}
                </span>
              </div>
            ))}
            {/* Total row */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03]">
              <span className="text-sm font-bold text-zinc-100">Total Revenue</span>
              <span className="text-base font-bold text-emerald-400">
                ?{analytics.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Back button at bottom for convenience */}
      <div className="pt-4">
        <Button
          variant="ghost"
          asChild
          className="text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-all duration-200"
        >
          <Link to="/dashboard/events">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardEventAnalyticsPage;
