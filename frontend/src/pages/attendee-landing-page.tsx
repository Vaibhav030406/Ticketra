import { useAuth } from "react-oidc-context";
import { Button } from "../components/ui/button";
import { useNavigate, Link } from "react-router";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PublishedEventSummary, SpringBootPagination } from "@/domain/domain";
import { listPublishedEvents, searchPublishedEvents } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PublishedEventCard from "@/components/published-event-card";
import { SimplePagination } from "@/components/simple-pagination";

const AttendeeLandingPage: React.FC = () => {
  const { isAuthenticated, isLoading, signinRedirect, signoutRedirect } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [publishedEvents, setPublishedEvents] = useState<
    SpringBootPagination<PublishedEventSummary> | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [query, setQuery] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query && query.length > 0) {
      queryPublishedEvents();
    } else {
      refreshPublishedEvents();
    }
  }, [page]);

  const refreshPublishedEvents = async () => {
    setIsSearching(true);
    try {
      setPublishedEvents(await listPublishedEvents(page));
      setError(undefined);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error has occurred");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const queryPublishedEvents = async () => {
    if (!query) {
      await refreshPublishedEvents();
      return;
    }

    setIsSearching(true);
    try {
      setPublishedEvents(await searchPublishedEvents(query, page));
      setError(undefined);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error has occurred");
      }
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-400 relative overflow-hidden font-normal">
      {/* Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

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

      <div className="pt-16 pb-20 relative z-10">
        {/* Error State */}
        {error && (
          <div className="max-w-6xl mx-auto px-6 mt-8">
            <Alert variant="destructive" className="backdrop-blur-xl bg-red-500/10 border-red-500/20 text-red-500">
              <AlertCircle className="h-4 w-4 stroke-red-500" />
              <AlertTitle className="font-semibold text-red-500">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text text-zinc-100 leading-tight">
            Discover Extraordinary Events
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Find and book tickets for the best events, concerts, and experiences happening around you.
          </p>
          
          <div className="max-w-2xl mx-auto flex items-center gap-2 p-2 rounded-xl backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] shadow-2xl transition-all duration-200 focus-within:border-amber-500/40">
            <Search className="w-5 h-5 text-zinc-500 ml-3" />
            <Input
              className="bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-lg shadow-none"
              placeholder="Search for events..."
              value={query || ""}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && queryPublishedEvents()}
            />
            <Button 
              onClick={queryPublishedEvents} 
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 h-12 px-6 rounded-lg font-medium transition-all duration-200 cursor-pointer"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Events Section */}
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-8">Upcoming Events</h2>
          
          {isSearching ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {publishedEvents?.content?.map((publishedEvent) => (
                  <PublishedEventCard
                    publishedEvent={publishedEvent}
                    key={publishedEvent.id}
                  />
                ))}
              </div>
              
              {!publishedEvents?.content?.length && !error && (
                <div className="text-center py-20 backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <p className="text-zinc-500 text-lg">No events found matching your search.</p>
                </div>
              )}

              {publishedEvents && publishedEvents.content.length > 0 && (
                <div className="w-full flex justify-center py-12">
                  <SimplePagination
                    pagination={publishedEvents}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-zinc-950 relative z-10 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-zinc-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-500 font-bold text-xs">T</span>
            </div>
            <span className="font-semibold text-zinc-300">Ticketra</span>
          </div>
          <p>© {new Date().getFullYear()} Ticketra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AttendeeLandingPage;
