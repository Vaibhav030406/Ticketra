import RandomEventImage from "@/components/random-event-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  PublishedEventDetails,
  PublishedEventTicketTypeDetails,
} from "@/domain/domain";
import { getPublishedEvent } from "@/lib/api";
import { AlertCircle, MapPin, Calendar, Ticket, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate, useParams } from "react-router";
import { format } from "date-fns";

const PublishedEventsPage: React.FC = () => {
  const { isAuthenticated, isLoading, signinRedirect, signoutRedirect } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState<string | undefined>();
  const [publishedEvent, setPublishedEvent] = useState<
    PublishedEventDetails | undefined
  >();
  const [selectedTicketType, setSelectedTicketType] = useState<
    PublishedEventTicketTypeDetails | undefined
  >();

  useEffect(() => {
    if (!id) {
      setError("ID must be provided!");
      return;
    }

    const doUseEffect = async () => {
      try {
        const eventData = await getPublishedEvent(id);
        setPublishedEvent(eventData);
        if (eventData.ticketTypes.length > 0) {
          setSelectedTicketType(eventData.ticketTypes[0]);
        }
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
    doUseEffect();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md backdrop-blur-xl bg-red-500/10 border-red-500/20 text-red-500">
          <AlertCircle className="h-4 w-4 stroke-red-500" />
          <AlertTitle className="font-semibold text-red-500">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !publishedEvent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-400 font-normal relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <span className="text-zinc-950 font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-semibold text-zinc-100">Ticketra</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200">Browse Events</Link>
            <Link to="/organizers" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200">For Organizers</Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button onClick={() => navigate("/dashboard")} variant="ghost" className="text-sm text-zinc-300 hover:text-zinc-100 cursor-pointer transition-all duration-200 hover:bg-white/[0.06]">Dashboard</Button>
                <Button onClick={() => signoutRedirect()} variant="outline" className="text-sm border-white/[0.1] text-zinc-300 hover:bg-white/[0.05] cursor-pointer transition-all duration-200">Log out</Button>
              </div>
            ) : (
              <Button onClick={() => signinRedirect()} className="bg-amber-500 text-zinc-950 hover:bg-amber-400 text-sm font-medium cursor-pointer transition-all duration-200">Sign In</Button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16 pb-20">
        {/* Hero Banner */}
        <div className="border-b border-white/[0.06] bg-zinc-900/30">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 leading-tight">
                {publishedEvent.name}
              </h1>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-zinc-300 text-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="text-amber-500 w-5 h-5" />
                  <span>{publishedEvent.venue}</span>
                </div>
                {(publishedEvent as any).start && (publishedEvent as any).end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="text-amber-500 w-5 h-5" />
                    <span>
                      {format(new Date((publishedEvent as any).start), "PP")} - {format(new Date((publishedEvent as any).end), "PP")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/3 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl">
              <RandomEventImage />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Left Column - Details */}
            <div className="lg:col-span-3 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-100 mb-6">Event Details</h2>
                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
                      <MapPin className="text-amber-500 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-zinc-100 font-semibold mb-1">Location</h3>
                      <p className="text-zinc-400">{publishedEvent.venue}</p>
                    </div>
                  </div>
                  
                  {/* Event info / desc placeholder if available, otherwise just venue */}
                  <div className="pt-6 border-t border-white/[0.06]">
                    <h3 className="text-zinc-100 font-semibold mb-3">About this event</h3>
                    <p className="text-zinc-400 leading-relaxed">
                      Join us for an unforgettable experience at {publishedEvent.name}. 
                      Secure your tickets now before they sell out!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Tickets */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 backdrop-blur-xl bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <Ticket className="w-6 h-6 text-amber-500" />
                  <h2 className="text-xl font-semibold text-zinc-100">Select Tickets</h2>
                </div>
                
                <div className="space-y-3 mb-8">
                  {publishedEvent.ticketTypes?.map((ticketType) => {
                    const isSelected = selectedTicketType?.id === ticketType.id;
                    return (
                      <div
                        key={ticketType.id}
                        onClick={() => setSelectedTicketType(ticketType)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 hover:scale-[1.01] ${
                          isSelected 
                            ? 'border-amber-500/40 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-semibold ${isSelected ? 'text-zinc-100' : 'text-zinc-200'}`}>
                            {ticketType.name}
                          </h3>
                          <span className={`font-bold text-lg ${isSelected ? 'text-amber-500' : 'text-zinc-100'}`}>
                            ${ticketType.price}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">{ticketType.description}</p>
                      </div>
                    );
                  })}
                </div>

                {selectedTicketType && (
                  <Link to={`/events/${publishedEvent.id}/purchase/${selectedTicketType.id}`} className="block">
                    <Button className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 h-12 text-lg font-semibold cursor-pointer transition-all duration-200">
                      Get Tickets - ${selectedTicketType.price}
                    </Button>
                  </Link>
                )}
                
                {!selectedTicketType && publishedEvent.ticketTypes.length > 0 && (
                  <Button disabled className="w-full bg-zinc-800 text-zinc-500 h-12 text-lg font-semibold">
                    Select a ticket type
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublishedEventsPage;
