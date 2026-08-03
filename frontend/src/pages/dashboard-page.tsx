import { useRoles } from "@/hooks/use-roles";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const DashboardPage: React.FC = () => {
  const { isLoading, isOrganizer, isStaff } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (isOrganizer) {
      navigate("/dashboard/events", { replace: true });
    } else if (isStaff) {
      navigate("/dashboard/validate-qr", { replace: true });
    } else {
      navigate("/dashboard/tickets", { replace: true });
    }
  }, [isLoading, isOrganizer, isStaff, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardPage;
