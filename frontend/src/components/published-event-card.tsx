import { PublishedEventSummary } from "@/domain/domain";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router";
import RandomEventImage from "./random-event-image";

interface PublishedEventCardProperties {
  publishedEvent: PublishedEventSummary;
}

const PublishedEventCard: React.FC<PublishedEventCardProperties> = ({
  publishedEvent,
}) => {
  return (
    <Link to={`/events/${publishedEvent.id}`} className="block h-full group">
      <div className="glass-card-hover backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-200 hover:bg-white/[0.06] hover:scale-[1.02] hover:border-white/[0.1] flex flex-col h-full">
        {/* Card Image */}
        <div className="h-[160px] w-full overflow-hidden relative">
          <RandomEventImage />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-60" />
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-semibold text-zinc-100 mb-3 line-clamp-2 transition-colors duration-200 group-hover:text-amber-500">
            {publishedEvent.name}
          </h3>
          
          <div className="mt-auto space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm text-zinc-500">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" /> 
              <span className="line-clamp-1">{publishedEvent.venue}</span>
            </div>
            
            <div className="flex items-start gap-2.5 text-sm text-zinc-500">
              {publishedEvent.start && publishedEvent.end ? (
                <>
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                  <span className="line-clamp-1">
                    {format(publishedEvent.start, "PP")} - {format(publishedEvent.end, "PP")}
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                  <span>Dates TBD</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PublishedEventCard;
