import { useAuth } from "react-oidc-context";
import { useRoles } from "@/hooks/use-roles";
import { Link, useLocation } from "react-router";
import {
  CalendarDays,
  Ticket,
  ScanLine,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  visible: boolean;
}

const DashboardLayout: React.FC<SidebarProps> = ({ children }) => {
  const { user, signoutRedirect } = useAuth();
  const { isOrganizer, isStaff } = useRoles();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      label: "Events",
      icon: <CalendarDays className="w-5 h-5" />,
      href: "/dashboard/events",
      visible: isOrganizer,
    },
    {
      label: "My Tickets",
      icon: <Ticket className="w-5 h-5" />,
      href: "/dashboard/tickets",
      visible: !isOrganizer && !isStaff,
    },
    {
      label: "Scanner",
      icon: <ScanLine className="w-5 h-5" />,
      href: "/dashboard/validate-qr",
      visible: isStaff,
    },
  ];

  const visibleItems = navItems.filter((item) => item.visible);
  const username = user?.profile?.preferred_username || "User";
  const email = user?.profile?.email || "";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 z-20",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-950 font-bold text-sm">T</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-zinc-100 whitespace-nowrap">
                Ticketra
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all duration-200 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        {/* User section */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {username}
                </p>
                <p className="text-xs text-zinc-500 truncate">{email}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => signoutRedirect()}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 mt-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
