import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CreateEventRequest,
  CreateTicketTypeRequest,
  EventDetails,
  EventStatusEnum,
  UpdateEventRequest,
  UpdateTicketTypeRequest,
  StaffUserResponse,
} from "@/domain/domain";
import {
  createEvent,
  getEvent,
  updateEvent,
  addEventStaff,
  removeEventStaff,
  listEventStaff,
} from "@/lib/api";
import { format } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  Edit,
  Plus,
  Ticket,
  Trash,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams, Link } from "react-router";
import PageHeader from "@/components/page-header";
import { cn } from "@/lib/utils";

interface DateTimeSelectProperties {
  date: Date | undefined;
  setDate: (date: Date) => void;
  time: string | undefined;
  setTime: (time: string) => void;
  enabled: boolean;
  setEnabled: (isEnabled: boolean) => void;
}

const DateTimeSelect: React.FC<DateTimeSelectProperties> = ({
  date,
  setDate,
  time,
  setTime,
  enabled,
  setEnabled,
}) => {
  return (
    <div className="flex gap-4 items-center w-full">
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        className="data-[state=checked]:bg-amber-500"
      />

      {enabled && (
        <div className="flex-1 flex gap-2">
          {/* Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button className="flex-1 justify-start text-left font-normal bg-zinc-900/50 border-white/[0.08] hover:bg-white/[0.06] text-zinc-300">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-zinc-950 border-white/[0.08]"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  if (!selectedDate) {
                    return;
                  }
                  const displayedYear = selectedDate.getFullYear();
                  const displayedMonth = selectedDate.getMonth();
                  const displayedDay = selectedDate.getDate();

                  const correctedDate = new Date(
                    Date.UTC(displayedYear, displayedMonth, displayedDay),
                  );

                  setDate(correctedDate);
                }}
                className="rounded-md border-0"
              />
            </PopoverContent>
          </Popover>
          {/* Time */}
          <Input
            type="time"
            className="w-[120px] bg-zinc-900/50 text-zinc-300 border-white/[0.08] focus-visible:ring-amber-500/50 [&::-webkit-calendar-picker-indicator]:invert"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

const generateTempId = () => `temp_${crypto.randomUUID()}`;
const isTempId = (id: string | undefined) => id && id.startsWith("temp_");

interface TicketTypeData {
  id: string | undefined;
  name: string;
  price: number;
  totalAvailable?: number;
  description: string;
}

interface EventData {
  id: string | undefined;
  name: string;
  startDate: Date | undefined;
  startTime: string | undefined;
  endDate: Date | undefined;
  endTime: string | undefined;
  venueDetails: string;
  salesStartDate: Date | undefined;
  salesStartTime: string | undefined;
  salesEndDate: Date | undefined;
  salesEndTime: string | undefined;
  ticketTypes: TicketTypeData[];
  status: EventStatusEnum;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

const DashboardManageEventPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [eventData, setEventData] = useState<EventData>({
    id: undefined,
    name: "",
    startDate: undefined,
    startTime: undefined,
    endDate: undefined,
    endTime: undefined,
    venueDetails: "",
    salesStartDate: undefined,
    salesStartTime: undefined,
    salesEndDate: undefined,
    salesEndTime: undefined,
    ticketTypes: [],
    status: EventStatusEnum.DRAFT,
    createdAt: undefined,
    updatedAt: undefined,
  });

  const [currentTicketType, setCurrentTicketType] = useState<
    TicketTypeData | undefined
  >();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [eventDateEnabled, setEventDateEnabled] = useState(false);
  const [eventSalesDateEnabled, setEventSalesDateEnabled] = useState(false);

  const [error, setError] = useState<string | undefined>();
  const [staffList, setStaffList] = useState<StaffUserResponse[]>([]);
  const [staffEmailInput, setStaffEmailInput] = useState("");
  const [staffError, setStaffError] = useState<string | undefined>();

  const updateField = (field: keyof EventData, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isEditMode && !isLoading && user?.access_token && id) {
      const fetchEvent = async () => {
        const event: EventDetails = await getEvent(user.access_token, id);
        setEventData({
          id: event.id,
          name: event.name,
          startDate: event.start,
          startTime: event.start
            ? formatTimeFromDate(new Date(event.start))
            : undefined,
          endDate: event.end,
          endTime: event.end
            ? formatTimeFromDate(new Date(event.end))
            : undefined,
          venueDetails: event.venue,
          salesStartDate: event.salesStart,
          salesStartTime: event.salesStart
            ? formatTimeFromDate(new Date(event.salesStart))
            : undefined,
          salesEndDate: event.salesEnd,
          salesEndTime: event.salesEnd
            ? formatTimeFromDate(new Date(event.salesEnd))
            : undefined,
          status: event.status,
          ticketTypes: event.ticketTypes.map((ticket) => ({
            id: ticket.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            totalAvailable: ticket.totalAvailable,
          })),
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        });
        setEventDateEnabled(!!(event.start || event.end));
        setEventSalesDateEnabled(!!(event.salesStart || event.salesEnd));

        try {
          const staff = await listEventStaff(user.access_token, id);
          setStaffList(staff);
        } catch (e) {
          console.error("Failed to load staff list", e);
        }
      };
      fetchEvent();
    }
  }, [id, user, isEditMode, isLoading]);

  const handleAddStaff = async () => {
    if (!id || !user?.access_token || !staffEmailInput.trim()) return;
    try {
      setStaffError(undefined);
      const newStaff = await addEventStaff(user.access_token, id, staffEmailInput.trim());
      setStaffList((prev) => [...prev.filter((s) => s.id !== newStaff.id), newStaff]);
      setStaffEmailInput("");
    } catch (err: any) {
      setStaffError(err.message || "Failed to add staff member");
    }
  };

  const handleRemoveStaff = async (staffUserId: string) => {
    if (!id || !user?.access_token) return;
    try {
      setStaffError(undefined);
      await removeEventStaff(user.access_token, id, staffUserId);
      setStaffList((prev) => prev.filter((s) => s.id !== staffUserId));
    } catch (err: any) {
      setStaffError(err.message || "Failed to remove staff member");
    }
  };

  const formatTimeFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const combineDateTime = (date: Date, time: string): Date => {
    const [hours, minutes] = time
      .split(":")
      .map((num) => Number.parseInt(num, 10));

    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(hours);
    combinedDateTime.setMinutes(minutes);
    combinedDateTime.setSeconds(0);

    const utcResult = new Date(
      Date.UTC(
        combinedDateTime.getFullYear(),
        combinedDateTime.getMonth(),
        combinedDateTime.getDate(),
        hours,
        minutes,
        0,
        0,
      ),
    );

    return utcResult;
  };

  const handleEventUpdateSubmit = async (accessToken: string, id: string) => {
    const ticketTypes: UpdateTicketTypeRequest[] = eventData.ticketTypes.map(
      (ticketType) => {
        return {
          id: isTempId(ticketType.id) ? undefined : ticketType.id,
          name: ticketType.name,
          price: ticketType.price,
          description: ticketType.description,
          totalAvailable: ticketType.totalAvailable,
        };
      },
    );

    const request: UpdateEventRequest = {
      id: id,
      name: eventData.name,
      start:
        eventData.startDate && eventData.startTime
          ? combineDateTime(eventData.startDate, eventData.startTime)
          : undefined,
      end:
        eventData.endDate && eventData.endTime
          ? combineDateTime(eventData.endDate, eventData.endTime)
          : undefined,
      venue: eventData.venueDetails,
      salesStart:
        eventData.salesStartDate && eventData.salesStartTime
          ? combineDateTime(eventData.salesStartDate, eventData.salesStartTime)
          : undefined,
      salesEnd:
        eventData.salesEndDate && eventData.salesEndTime
          ? combineDateTime(eventData.salesEndDate, eventData.salesEndTime)
          : undefined,
      status: eventData.status,
      ticketTypes: ticketTypes,
    };

    try {
      await updateEvent(accessToken, id, request);
      navigate("/dashboard/events");
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

  const handleEventCreateSubmit = async (accessToken: string) => {
    const ticketTypes: CreateTicketTypeRequest[] = eventData.ticketTypes.map(
      (ticketType) => {
        return {
          name: ticketType.name,
          price: ticketType.price,
          description: ticketType.description,
          totalAvailable: ticketType.totalAvailable,
        };
      },
    );

    const request: CreateEventRequest = {
      name: eventData.name,
      start:
        eventData.startDate && eventData.startTime
          ? combineDateTime(eventData.startDate, eventData.startTime)
          : undefined,
      end:
        eventData.endDate && eventData.endTime
          ? combineDateTime(eventData.endDate, eventData.endTime)
          : undefined,
      venue: eventData.venueDetails,
      salesStart:
        eventData.salesStartDate && eventData.salesStartTime
          ? combineDateTime(eventData.salesStartDate, eventData.salesStartTime)
          : undefined,
      salesEnd:
        eventData.salesEndDate && eventData.salesEndTime
          ? combineDateTime(eventData.salesEndDate, eventData.salesEndTime)
          : undefined,
      status: eventData.status,
      ticketTypes: ticketTypes,
    };

    try {
      await createEvent(accessToken, request);
      navigate("/dashboard/events");
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (isLoading || !user || !user.access_token) {
      console.error("User not found!");
      return;
    }

    if (isEditMode) {
      if (!eventData.id) {
        setError("Event does not have an ID");
        return;
      }
      await handleEventUpdateSubmit(user.access_token, eventData.id);
    } else {
      await handleEventCreateSubmit(user.access_token);
    }
  };

  const handleAddTicketType = () => {
    setCurrentTicketType({
      id: undefined,
      name: "",
      price: 0,
      totalAvailable: 0,
      description: "",
    });
    setDialogOpen(true);
  };

  const handleSaveTicketType = () => {
    if (!currentTicketType) {
      return;
    }

    const newTicketTypes = [...eventData.ticketTypes];

    if (currentTicketType.id) {
      const index = newTicketTypes.findIndex(
        (t) => t.id === currentTicketType.id,
      );
      if (index !== -1) {
        newTicketTypes[index] = currentTicketType;
      }
    } else {
      newTicketTypes.push({
        ...currentTicketType,
        id: generateTempId(),
      });
    }

    updateField("ticketTypes", newTicketTypes);
    setDialogOpen(false);
  };

  const handleEditTicketType = (ticketType: TicketTypeData) => {
    setCurrentTicketType(ticketType);
    setDialogOpen(true);
  };

  const handleDeleteTicketType = (id: string | undefined) => {
    if (!id) {
      return;
    }
    updateField(
      "ticketTypes",
      eventData.ticketTypes.filter((t) => t.id !== id),
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-3xl">
      <Link
        to="/dashboard/events"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      <PageHeader
        title={isEditMode ? "Edit Event" : "Create Event"}
        description={
          isEditMode
            ? "Update the details of your event"
            : "Fill out the form below to create your new event"
        }
      />

      {isEditMode && (
        <div className="flex gap-4 text-xs text-zinc-500 font-mono">
          {eventData.id && <p>ID: {eventData.id}</p>}
          {eventData.createdAt && (
            <p>Created: {format(eventData.createdAt, "PPP")}</p>
          )}
          {eventData.updatedAt && (
            <p>Updated: {format(eventData.updatedAt, "PPP")}</p>
          )}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="space-y-6 pt-4 border-t border-white/[0.06]">
          <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">
            Basic Information
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="event-name" className="text-zinc-300">
              Event Name
            </Label>
            <Input
              id="event-name"
              className="bg-zinc-900/50 border-white/[0.08] text-zinc-100 focus-visible:ring-amber-500/50"
              placeholder="e.g. Summer Music Festival 2024"
              value={eventData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            <p className="text-zinc-500 text-xs">
              This is the public name of your event.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venue-details" className="text-zinc-300">
              Venue Details
            </Label>
            <Textarea
              id="venue-details"
              className="bg-zinc-900/50 border-white/[0.08] text-zinc-100 min-h-[100px] focus-visible:ring-amber-500/50"
              placeholder="e.g. Central Park, New York, NY"
              value={eventData.venueDetails}
              onChange={(e) => updateField("venueDetails", e.target.value)}
            />
            <p className="text-zinc-500 text-xs">
              Details about the venue, please include as much detail as
              possible.
            </p>
          </div>
        </div>

        {/* Section 2: Date & Time */}
        <div className="space-y-6 pt-6 border-t border-white/[0.06]">
          <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">
            Date & Time
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Event Start</Label>
              <DateTimeSelect
                date={eventData.startDate}
                setDate={(date) => updateField("startDate", date)}
                time={eventData.startTime}
                setTime={(time) => updateField("startTime", time)}
                enabled={eventDateEnabled}
                setEnabled={setEventDateEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Event End</Label>
              <DateTimeSelect
                date={eventData.endDate}
                setDate={(date) => updateField("endDate", date)}
                time={eventData.endTime}
                setTime={(time) => updateField("endTime", time)}
                enabled={eventDateEnabled}
                setEnabled={setEventDateEnabled}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Sales Period */}
        <div className="space-y-6 pt-6 border-t border-white/[0.06]">
          <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">
            Sales Period
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Sales Start</Label>
              <DateTimeSelect
                date={eventData.salesStartDate}
                setDate={(date) => updateField("salesStartDate", date)}
                time={eventData.salesStartTime}
                setTime={(time) => updateField("salesStartTime", time)}
                enabled={eventSalesDateEnabled}
                setEnabled={setEventSalesDateEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Sales End</Label>
              <DateTimeSelect
                date={eventData.salesEndDate}
                setDate={(date) => updateField("salesEndDate", date)}
                time={eventData.salesEndTime}
                setTime={(time) => updateField("salesEndTime", time)}
                enabled={eventSalesDateEnabled}
                setEnabled={setEventSalesDateEnabled}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Ticket Types */}
        <div className="space-y-6 pt-6 border-t border-white/[0.06]">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Ticket Types
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddTicketType()}
              className="border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Ticket
            </Button>
          </div>

          <div className="space-y-3">
            {eventData.ticketTypes.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/[0.1] rounded-xl text-zinc-500 text-sm">
                No ticket types added yet.
              </div>
            ) : (
              eventData.ticketTypes.map((ticketType) => (
                <div
                  key={ticketType.id}
                  className="backdrop-blur-xl bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] flex justify-between items-center hover:bg-white/[0.04] transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-zinc-100">
                        {ticketType.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 text-amber-500 bg-amber-500/10 font-medium"
                      >
                        ${ticketType.price}
                      </Badge>
                    </div>
                    {ticketType.totalAvailable && (
                      <p className="text-zinc-400 text-sm">
                        {ticketType.totalAvailable} capacity
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
                      onClick={() => handleEditTicketType(ticketType)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDeleteTicketType(ticketType.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 5: Status */}
        <div className="space-y-6 pt-6 border-t border-white/[0.06]">
          <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">
            Publishing
          </h2>

          <div className="space-y-1.5 max-w-[200px]">
            <Label className="text-zinc-300">Status</Label>
            <Select
              value={eventData.status}
              onValueChange={(value) => updateField("status", value)}
            >
              <SelectTrigger className="bg-zinc-900/50 border-white/[0.08] text-zinc-100 focus:ring-amber-500/50">
                <SelectValue placeholder="Select Event Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/[0.08] text-zinc-100">
                <SelectItem value={EventStatusEnum.DRAFT}>Draft</SelectItem>
                <SelectItem value={EventStatusEnum.PUBLISHED}>
                  Published
                </SelectItem>
                <SelectItem value={EventStatusEnum.CANCELLED}>
                  Cancelled
                </SelectItem>
                <SelectItem value={EventStatusEnum.COMPLETED}>
                  Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section 6: Gate Staff Management */}
        {isEditMode && (
          <div className="space-y-6 pt-6 border-t border-white/[0.06]">
            <div>
              <h2 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">
                Gate Staff Management
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Assign staff members by email who are allowed to scan tickets for this event.
              </p>
            </div>

            <div className="flex gap-3 max-w-md">
              <Input
                placeholder="Enter staff email (e.g. staff@example.com)"
                value={staffEmailInput}
                onChange={(e) => setStaffEmailInput(e.target.value)}
                className="bg-zinc-900/50 border-white/[0.08] focus-visible:ring-amber-500/50 text-zinc-100"
              />
              <Button
                type="button"
                onClick={handleAddStaff}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium cursor-pointer"
              >
                Add Staff
              </Button>
            </div>

            {staffError && (
              <p className="text-xs text-red-400 font-medium">{staffError}</p>
            )}

            <div className="space-y-2 max-w-md">
              {staffList.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">
                  No explicit staff members assigned yet. (All staff accounts can scan by default until specific staff are added).
                </p>
              ) : (
                staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/[0.06]"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{staff.name}</p>
                      <p className="text-xs text-zinc-500">{staff.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStaff(staff.id)}
                      className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <Alert
            variant="destructive"
            className="bg-red-500/10 border-red-500/30 text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error saving event</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="pt-6">
          <Button
            onClick={handleFormSubmit}
            className="w-full sm:w-auto px-8 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium transition-all duration-200"
          >
            {isEditMode ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </form>

      {/* Ticket Type Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-950 border-white/[0.08] text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {currentTicketType?.id ? "Edit Ticket Type" : "Add Ticket Type"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Set the price and capacity for this ticket type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-type-name" className="text-zinc-300">
                Name
              </Label>
              <Input
                id="ticket-type-name"
                className="bg-zinc-900/50 border-white/[0.08] focus-visible:ring-amber-500/50"
                value={currentTicketType?.name}
                onChange={(e) =>
                  setCurrentTicketType(
                    currentTicketType
                      ? { ...currentTicketType, name: e.target.value }
                      : undefined,
                  )
                }
                placeholder="e.g General Admission, VIP"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-type-price" className="text-zinc-300">
                  Price ($)
                </Label>
                <Input
                  id="ticket-type-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentTicketType?.price}
                  onChange={(e) =>
                    setCurrentTicketType(
                      currentTicketType
                        ? {
                            ...currentTicketType,
                            price: Number.parseFloat(e.target.value),
                          }
                        : undefined,
                    )
                  }
                  className="bg-zinc-900/50 border-white/[0.08] focus-visible:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="ticket-type-total-available"
                  className="text-zinc-300"
                >
                  Capacity
                </Label>
                <Input
                  id="ticket-type-total-available"
                  type="number"
                  min="0"
                  value={currentTicketType?.totalAvailable}
                  onChange={(e) =>
                    setCurrentTicketType(
                      currentTicketType
                        ? {
                            ...currentTicketType,
                            totalAvailable: Number.parseFloat(e.target.value),
                          }
                        : undefined,
                    )
                  }
                  className="bg-zinc-900/50 border-white/[0.08] focus-visible:ring-amber-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="ticket-type-description"
                className="text-zinc-300"
              >
                Description
              </Label>
              <Textarea
                id="ticket-type-description"
                className="bg-zinc-900/50 border-white/[0.08] focus-visible:ring-amber-500/50 min-h-[80px]"
                value={currentTicketType?.description}
                onChange={(e) =>
                  setCurrentTicketType(
                    currentTicketType
                      ? {
                          ...currentTicketType,
                          description: e.target.value,
                        }
                      : undefined,
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium"
              onClick={handleSaveTicketType}
            >
              Save Ticket Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardManageEventPage;
