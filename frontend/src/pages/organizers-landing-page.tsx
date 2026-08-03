import { Button } from "@/components/ui/button";
import { useAuth } from "react-oidc-context";
import { Link, useNavigate } from "react-router";
import { CalendarDays, QrCode, BarChart3, Loader2 } from "lucide-react";

const OrganizersLandingPage: React.FC = () => {
  const { isAuthenticated, isLoading, signinRedirect, signoutRedirect } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-400 font-normal">
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

      <main className="pt-16 pb-24">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight gradient-text text-zinc-100">
                Create, Manage & Sell Event Tickets
              </h1>
              <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                A complete platform for event organizers to create events, sell tickets, and validate attendees with QR Codes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  className="bg-amber-500 text-zinc-950 hover:bg-amber-400 h-12 px-8 rounded-lg font-semibold text-base cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => navigate("/dashboard/events")}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline"
                  className="border-white/[0.1] text-zinc-100 hover:bg-white/[0.05] h-12 px-8 rounded-lg font-semibold text-base cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => navigate("/")}
                >
                  Browse Events
                </Button>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="relative group">
              <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-3xl -z-10 group-hover:bg-amber-500/30 transition-all duration-500" />
              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] p-2 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white/[0.15]">
                <img
                  src="/organizers-landing-hero.png"
                  alt="A busy concert"
                  className="w-full aspect-[4/3] object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100">Everything you need to host</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] p-8 rounded-2xl transition-all duration-200 hover:bg-white/[0.06] hover:scale-[1.02]">
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                <CalendarDays className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">Easy Event Creation</h3>
              <p className="text-zinc-400 leading-relaxed">
                Create and manage events with our intuitive dashboard. Set up ticket types, pricing, and availability in minutes.
              </p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] p-8 rounded-2xl transition-all duration-200 hover:bg-white/[0.06] hover:scale-[1.02]">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <QrCode className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">Secure QR Check-in</h3>
              <p className="text-zinc-400 leading-relaxed">
                Validate tickets instantly with QR code scanning. Prevent fraud and keep the entry lines moving quickly.
              </p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] p-8 rounded-2xl transition-all duration-200 hover:bg-white/[0.06] hover:scale-[1.02]">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">Real-time Tracking</h3>
              <p className="text-zinc-400 leading-relaxed">
                Monitor ticket sales and attendance in real time. Get insights into your event's performance and revenue.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="backdrop-blur-xl bg-zinc-900/50 border border-white/[0.06] p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <h2 className="text-3xl font-bold text-zinc-100 mb-6 relative z-10">Ready to host your next event?</h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto relative z-10">
              Join thousands of organizers who trust Ticketra for their events. Setup is free and takes less than 5 minutes.
            </p>
            <Button
              className="bg-amber-500 text-zinc-950 hover:bg-amber-400 h-14 px-10 rounded-lg font-bold text-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] relative z-10"
              onClick={() => navigate("/dashboard/events")}
            >
              Start Creating Now
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-zinc-950 py-12">
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

export default OrganizersLandingPage;
