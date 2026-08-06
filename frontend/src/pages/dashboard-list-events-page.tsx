import { SimplePagination } from "@/components/simple-pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  EventSummary,
  EventStatusEnum,
  SpringBootPagination,
} from "@/domain/domain";
import { cancelEvent, deleteEvent, listEvents } from "@/lib/api";
import {
  AlertCircle,
  BarChart2,
  Calendar,
  CalendarDays,
  Clock,
  Edit,
  MapPin,
  Tag,
  Trash,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";
import PageHeader from "@/components/page-header";
import StatusBadge from "@/components/status-badge";
import EmptyState from "@/components/empty-state";
import { useRoles } from "@/hooks/use-roles";

const DashboardListEventsPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { isOrganizer } = useRoles();
  const [events, setEvents] = useState<
    SpringBootPagination<EventSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [deleteEventError, setDeleteEventError] = useState<
    string | undefined
  >();
  const [cancelEventError, setCancelEventError] = useState<
    string | undefined
  >();

  const [page, setPage] = useState(0);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventSummary | undefined>();

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<EventSummary | undefined>();
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (isLoading || !user?.access_token) {
      return;
    }
    refreshEvents(user.access_token);
  }, [isLoading, user, page]);

  const refreshEvents = async (accessToken: string) => {
    try {
      setEvents(await listEvents(accessToken, page));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error has occurred");
      }
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) {
      return "TBD";
    }
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      return "";
    }
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---- Delete handlers ----
  const handleOpenDeleteEventDialog = (eventToDelete: EventSummary) => {
    setDeleteEventError(undefined);
    setEventToDelete(eventToDelete);
    setDeleteDialogOpen(true);
  };

  const handleCancelDeleteEventDialog = () => {
    setEventToDelete(undefined);
    setDeleteDialogOpen(false);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete || isLoading || !user?.access_token) {
      return;
    }

    try {
      setDeleteEventError(undefined);
      await deleteEvent(user.access_token, eventToDelete.id);
      setEventToDelete(undefined);
      setDeleteDialogOpen(false);
      refreshEvents(user.access_token);
    } catch (err) {
      if (err instanceof Error) {
        setDeleteEventError(err.message);
      } else if (typeof err === "string") {
        setDeleteEventError(err);
      } else {
        setDeleteEventError("An unknown error has occurred");
      }
    }
  };

  // ---- Cancel Event handlers ----
  const handleOpenCancelDialog = (event: EventSummary) => {
    setCancelEventError(undefined);
    setEventToCancel(event);
    setCancelDialogOpen(true);
  };

  const handleDismissCancelDialog = () => {
    setEventToCancel(undefined);
    setCancelDialogOpen(false);
  };

  const handleConfirmCancelEvent = async () => {
    if (!eventToCancel || isLoading || !user?.access_token) {
      return;
    }
    try {
      setCancelEventError(undefined);
      setIsCancelling(true);
      await cancelEvent(user.access_token, eventToCancel.id);
      setEventToCancel(undefined);
      setCancelDialogOpen(false);
      refreshEvents(user.access_token);
    } catch (err) {
      if (err instanceof Error) {
        setCancelEventError(err.message);
      } else if (typeof err === "string") {
        setCancelEventError(err);
      } else {
        setCancelEventError("An unknown error has occurred");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  // ---- Status helpers ----
  const getStatusVariant = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.DRAFT:
        return "warning";
      case EventStatusEnum.PUBLISHED:
        return "success";
      case EventStatusEnum.CANCELLED:
        return "danger";
      case EventStatusEnum.COMPLETED:
        return "info";
      default:
        return "neutral";
    }
  };

  const getStatusText = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.DRAFT:
        return "Draft";
      case EventStatusEnum.PUBLISHED:
        return "Published";
      case EventStatusEnum.CANCELLED:
        return "Cancelled";
      case EventStatusEnum.COMPLETED:
        return "Completed";
      default:
        return status;
    }
  };

  const isCancellable = (status: EventStatusEnum) =>
    status === EventStatusEnum.PUBLISHED || status === EventStatusEnum.DRAFT;

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
      <PageHeader title="Your Events" description="Manage your created events">
        <Link to="/dashboard/events/create">
          <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all duration-200">
            Create Event
          </Button>
        </Link>
      </PageHeader>

      {events?.content.length === 0 ? (
        <EmptyState
          title="No events found"
          description="You haven't created any events yet."
          actionLabel="Create your first event"
          actionHref="/dashboard/events/create"
          icon={<CalendarDays className="w-7 h-7 text-zinc-500" />}
        />
      ) : (
        <div className="space-y-4 max-w-3xl">
          {events?.content.map((eventItem) => (
            <div
              key={eventItem.id}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-zinc-100">
                    {eventItem.name}
                  </h3>
                  <StatusBadge variant={getStatusVariant(eventItem.status)}>
                    {getStatusText(eventItem.status)}
                  </StatusBadge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 text-sm text-zinc-400">
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-zinc-500 shrink-0" />
                    <div>
                      <p className="text-zinc-300">
                        {formatDate(eventItem.start)} -{" "}
                        {formatDate(eventItem.end)}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {formatTime(eventItem.start)} -{" "}
                        {formatTime(eventItem.end)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-zinc-500 shrink-0" />
                    <div>
                      <p className="font-medium text-zinc-300">Sales Period</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {formatDate(eventItem.salesStart)} to{" "}
                        {formatDate(eventItem.salesEnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-zinc-500 shrink-0" />
                    <p className="text-zinc-300">{eventItem.venue}</p>
                  </div>

                  {eventItem.ticketTypes.length > 0 && (
                    <div className="flex gap-3 md:col-span-2 items-start mt-2">
                      <Tag className="h-5 w-5 text-zinc-500 shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {eventItem.ticketTypes.map((ticketType) => (
                          <span
                            key={ticketType.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-white/[0.06] text-zinc-300"
                          >
                            <span>{ticketType.name}</span>
                            <span className="text-amber-500/80">
                              ${ticketType.price}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/[0.06] px-6 py-4 flex justify-end gap-2 mt-auto bg-black/20">
                {/* Analytics button — organizer only */}
                {isOrganizer && (
                  <Link to={`/dashboard/events/${eventItem.id}/analytics`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200"
                      title="View analytics"
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  </Link>
                )}

                <Link to={`/dashboard/events/update/${eventItem.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>

                {/* Cancel button — only for PUBLISHED / DRAFT events */}
                {isOrganizer && isCancellable(eventItem.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-orange-400 hover:bg-orange-400/10 transition-all duration-200"
                    onClick={() => handleOpenCancelDialog(eventItem)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Event
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                  onClick={() => handleOpenDeleteEventDialog(eventItem)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {events && events.content.length > 0 && (
        <div className="flex justify-center py-8">
          <SimplePagination pagination={events} onPageChange={setPage} />
        </div>
      )}

      {/* ---- Delete dialog ---- */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/[0.06] text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will delete your event '{eventToDelete?.name}' and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteEventError && (
            <Alert
              variant="destructive"
              className="bg-red-950/20 border-red-900/50 text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{deleteEventError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDeleteEventDialog}
              className="bg-transparent border-white/[0.1] text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all duration-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteEvent()}
              className="bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- Cancel Event dialog ---- */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/[0.06] text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-400" />
              Cancel "{eventToCancel?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 space-y-2">
              <span className="block">
                This will permanently cancel the event. The following will happen immediately:
              </span>
              <ul className="list-disc list-inside text-zinc-400 space-y-1 text-sm pl-2">
                <li>All <strong className="text-orange-300">PAID</strong> orders will be automatically refunded via Razorpay</li>
                <li>All tickets will be marked as <strong className="text-zinc-300">CANCELLED</strong></li>
                <li>Attendees will be notified (stub in Ph2, email in Ph3)</li>
              </ul>
              <span className="block pt-1 text-orange-400/80 font-medium text-sm">
                ⚠ This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancelEventError && (
            <Alert
              variant="destructive"
              className="bg-red-950/20 border-red-900/50 text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{cancelEventError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDismissCancelDialog}
              className="bg-transparent border-white/[0.1] text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all duration-200"
            >
              Keep Event
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancelEvent}
              disabled={isCancelling}
              className="bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 disabled:opacity-50"
            >
              {isCancelling ? "Cancelling…" : "Yes, Cancel Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardListEventsPage;


const DashboardListEventsPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const [events, setEvents] = useState<
    SpringBootPagination<EventSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [deleteEventError, setDeleteEventError] = useState<
    string | undefined
  >();

  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<
    EventSummary | undefined
  >();

  useEffect(() => {
    if (isLoading || !user?.access_token) {
      return;
    }
    refreshEvents(user.access_token);
  }, [isLoading, user, page]);

  const refreshEvents = async (accessToken: string) => {
    try {
      setEvents(await listEvents(accessToken, page));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error has occurred");
      }
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) {
      return "TBD";
    }
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date?: Date) => {
    if (!date) {
      return "";
    }
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenDeleteEventDialog = (eventToDelete: EventSummary) => {
    setEventToDelete(undefined);
    setEventToDelete(eventToDelete);
    setDialogOpen(true);
  };

  const handleCancelDeleteEventDialog = () => {
    setEventToDelete(undefined);
    setEventToDelete(undefined);
    setDialogOpen(false);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete || isLoading || !user?.access_token) {
      return;
    }

    try {
      setDeleteEventError(undefined);
      await deleteEvent(user.access_token, eventToDelete.id);
      setEventToDelete(undefined);
      setDialogOpen(false);
      refreshEvents(user.access_token);
    } catch (err) {
      if (err instanceof Error) {
        setDeleteEventError(err.message);
      } else if (typeof err === "string") {
        setDeleteEventError(err);
      } else {
        setDeleteEventError("An unknown error has occurred");
      }
    }
  };

  const getStatusVariant = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.DRAFT:
        return "warning";
      case EventStatusEnum.PUBLISHED:
        return "success";
      case EventStatusEnum.CANCELLED:
        return "danger";
      case EventStatusEnum.COMPLETED:
        return "info";
      default:
        return "neutral";
    }
  };

  const getStatusText = (status: EventStatusEnum) => {
    switch (status) {
      case EventStatusEnum.DRAFT:
        return "Draft";
      case EventStatusEnum.PUBLISHED:
        return "Published";
      case EventStatusEnum.CANCELLED:
        return "Cancelled";
      case EventStatusEnum.COMPLETED:
        return "Completed";
      default:
        return status;
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
      <PageHeader title="Your Events" description="Manage your created events">
        <Link to="/dashboard/events/create">
          <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all duration-200">
            Create Event
          </Button>
        </Link>
      </PageHeader>

      {events?.content.length === 0 ? (
        <EmptyState
          title="No events found"
          description="You haven't created any events yet."
          actionLabel="Create your first event"
          actionHref="/dashboard/events/create"
          icon={<CalendarDays className="w-7 h-7 text-zinc-500" />}
        />
      ) : (
        <div className="space-y-4 max-w-3xl">
          {events?.content.map((eventItem) => (
            <div
              key={eventItem.id}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-zinc-100">
                    {eventItem.name}
                  </h3>
                  <StatusBadge variant={getStatusVariant(eventItem.status)}>
                    {getStatusText(eventItem.status)}
                  </StatusBadge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 text-sm text-zinc-400">
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-zinc-500 shrink-0" />
                    <div>
                      <p className="text-zinc-300">
                        {formatDate(eventItem.start)} -{" "}
                        {formatDate(eventItem.end)}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {formatTime(eventItem.start)} -{" "}
                        {formatTime(eventItem.end)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-zinc-500 shrink-0" />
                    <div>
                      <p className="font-medium text-zinc-300">Sales Period</p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {formatDate(eventItem.salesStart)} to{" "}
                        {formatDate(eventItem.salesEnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-zinc-500 shrink-0" />
                    <p className="text-zinc-300">{eventItem.venue}</p>
                  </div>

                  {eventItem.ticketTypes.length > 0 && (
                    <div className="flex gap-3 md:col-span-2 items-start mt-2">
                      <Tag className="h-5 w-5 text-zinc-500 shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {eventItem.ticketTypes.map((ticketType) => (
                          <span
                            key={ticketType.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 border border-white/[0.06] text-zinc-300"
                          >
                            <span>{ticketType.name}</span>
                            <span className="text-amber-500/80">
                              ${ticketType.price}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/[0.06] px-6 py-4 flex justify-end gap-2 mt-auto bg-black/20">
                <Link to={`/dashboard/events/update/${eventItem.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                  onClick={() => handleOpenDeleteEventDialog(eventItem)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {events && events.content.length > 0 && (
        <div className="flex justify-center py-8">
          <SimplePagination pagination={events} onPageChange={setPage} />
        </div>
      )}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/[0.06] text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will delete your event '{eventToDelete?.name}' and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteEventError && (
            <Alert
              variant="destructive"
              className="bg-red-950/20 border-red-900/50 text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{deleteEventError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDeleteEventDialog}
              className="bg-transparent border-white/[0.1] text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-all duration-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteEvent()}
              className="bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardListEventsPage;
