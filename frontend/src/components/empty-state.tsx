import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/[0.06] flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-zinc-500" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <Button className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium cursor-pointer transition-all duration-200">
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button
          onClick={onAction}
          className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-medium cursor-pointer transition-all duration-200"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
