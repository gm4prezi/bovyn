import { useState, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { useCalendar } from "../hooks/useCalendar";
import { cn } from "../lib/cn";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Flag,
} from "lucide-react";

// ── Types ──
interface EconEvent {
  id: string;
  time: string;
  title: string;
  country: "US" | "EU" | "UK" | "JP" | "CN" | "CA" | "AU";
  impact: "high" | "medium" | "low";
  previous?: string;
  forecast?: string;
  actual?: string;
  instruments: string[];
}

interface DayEvents {
  date: string;
  dayLabel: string;
  isToday: boolean;
  events: EconEvent[];
}

// ── Mock data ──
const WEEK_DATA: DayEvents[] = [
  {
    date: "2026-04-06",
    dayLabel: "Monday, Apr 6",
    isToday: true,
    events: [
      { id: "e1", time: "08:30", title: "ISM Services PMI", country: "US", impact: "high", previous: "53.5", forecast: "54.0", instruments: ["NQ", "ES"] },
      { id: "e2", time: "10:00", title: "Factory Orders m/m", country: "US", impact: "medium", previous: "1.7%", forecast: "0.5%", instruments: ["ES"] },
      { id: "e3", time: "13:00", title: "3-Year Note Auction", country: "US", impact: "low", instruments: [] },
      { id: "e4", time: "14:00", title: "Fed Waller Speaks", country: "US", impact: "high", instruments: ["NQ", "ES", "GC"] },
    ],
  },
  {
    date: "2026-04-07",
    dayLabel: "Tuesday, Apr 7",
    isToday: false,
    events: [
      { id: "e5", time: "06:00", title: "Trade Balance", country: "US", impact: "medium", previous: "-$68.3B", forecast: "-$67.0B", instruments: ["ES"] },
      { id: "e6", time: "08:30", title: "JOLTS Job Openings", country: "US", impact: "high", previous: "8.76M", forecast: "8.80M", instruments: ["NQ", "ES"] },
      { id: "e7", time: "13:00", title: "10-Year Note Auction", country: "US", impact: "medium", instruments: ["GC"] },
    ],
  },
  {
    date: "2026-04-08",
    dayLabel: "Wednesday, Apr 8",
    isToday: false,
    events: [
      { id: "e8", time: "07:00", title: "MBA Mortgage Applications", country: "US", impact: "low", instruments: [] },
      { id: "e9", time: "10:30", title: "Crude Oil Inventories", country: "US", impact: "high", previous: "-3.3M", forecast: "-1.5M", instruments: ["CL"] },
      { id: "e10", time: "14:00", title: "FOMC Meeting Minutes", country: "US", impact: "high", instruments: ["NQ", "ES", "GC", "SI"] },
    ],
  },
  {
    date: "2026-04-09",
    dayLabel: "Thursday, Apr 9",
    isToday: false,
    events: [
      { id: "e11", time: "08:30", title: "Initial Jobless Claims", country: "US", impact: "high", previous: "228K", forecast: "225K", instruments: ["NQ", "ES"] },
      { id: "e12", time: "08:30", title: "Continuing Claims", country: "US", impact: "medium", previous: "1.88M", forecast: "1.86M", instruments: ["ES"] },
      { id: "e13", time: "10:00", title: "Wholesale Inventories m/m", country: "US", impact: "low", instruments: [] },
    ],
  },
  {
    date: "2026-04-10",
    dayLabel: "Friday, Apr 10",
    isToday: false,
    events: [
      { id: "e14", time: "08:30", title: "CPI m/m", country: "US", impact: "high", previous: "0.2%", forecast: "0.3%", instruments: ["NQ", "ES", "GC", "SI"] },
      { id: "e15", time: "08:30", title: "Core CPI m/m", country: "US", impact: "high", previous: "0.3%", forecast: "0.3%", instruments: ["NQ", "ES", "GC"] },
      { id: "e16", time: "10:00", title: "U of Michigan Consumer Sentiment", country: "US", impact: "medium", previous: "57.0", forecast: "56.5", instruments: ["ES"] },
    ],
  },
];

const IMPACT_STYLES = {
  high: { bg: "bg-bear/[0.08]", border: "border-bear/20", text: "text-bear", dot: "bg-bear" },
  medium: { bg: "bg-amber/[0.06]", border: "border-amber/20", text: "text-amber", dot: "bg-amber" },
  low: { bg: "bg-white/[0.03]", border: "border-white/[0.06]", text: "text-fog", dot: "bg-fog/40" },
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", EU: "🇪🇺", UK: "🇬🇧", JP: "🇯🇵", CN: "🇨🇳", CA: "🇨🇦", AU: "🇦🇺",
};

type ImpactFilter = "all" | "high" | "medium";

export function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");
  const { events: apiEvents } = useCalendar();

  // Merge API events into week structure, fall back to mock
  const weekData = useMemo<DayEvents[]>(() => {
    if (!apiEvents || apiEvents.length === 0) return WEEK_DATA;
    const byDate: Record<string, EconEvent[]> = {};
    for (const evt of apiEvents) {
      const d = evt.date;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({
        id: evt.id,
        time: evt.time,
        title: evt.title,
        country: (evt.country ?? "US") as EconEvent["country"],
        impact: evt.impact as EconEvent["impact"],
        previous: evt.previous ?? undefined,
        forecast: evt.forecast ?? undefined,
        actual: evt.actual ?? undefined,
        instruments: evt.instruments ?? [],
      });
    }
    const dates = Object.keys(byDate).sort();
    if (dates.length === 0) return WEEK_DATA;
    const today = new Date().toISOString().slice(0, 10);
    return dates.map((date) => {
      const d = new Date(date + "T12:00:00Z");
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      return { date, dayLabel, isToday: date === today, events: byDate[date] };
    });
  }, [apiEvents]);

  const day = weekData[selectedDay];
  const filtered = day.events.filter((e) =>
    impactFilter === "all" ? true : e.impact === impactFilter || (impactFilter === "high" && e.impact === "high")
  );

  const highCount = day.events.filter((e) => e.impact === "high").length;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div>
        <div className="label mb-1">Market Intelligence</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Economic Calendar
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Week of Apr 6 – Apr 10, 2026
        </p>
      </div>

      {/* Day selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
          className="p-1.5 rounded-lg border border-white/[0.06] text-fog hover:text-cream transition-colors"
          disabled={selectedDay === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
          {weekData.map((d, i) => {
            const shortDay = d.dayLabel.split(",")[0].slice(0, 3);
            const dateNum = d.date.split("-")[2];
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDay(i)}
                className={cn(
                  "flex-1 min-w-[52px] flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border transition-all",
                  i === selectedDay
                    ? "bg-amber/[0.10] border-amber/30 text-amber"
                    : d.isToday
                    ? "bg-white/[0.04] border-white/[0.08] text-cream"
                    : "border-transparent text-fog hover:text-cream"
                )}
              >
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase">{shortDay}</span>
                <span className="text-sm font-mono font-bold">{dateNum}</span>
                {d.events.some((e) => e.impact === "high") && (
                  <span className="h-1.5 w-1.5 rounded-full bg-bear" />
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setSelectedDay(Math.min(weekData.length - 1, selectedDay + 1))}
          className="p-1.5 rounded-lg border border-white/[0.06] text-fog hover:text-cream transition-colors"
          disabled={selectedDay === weekData.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day summary bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-fog" />
          <span className="text-sm font-medium text-cream">{day.dayLabel}</span>
          {day.isToday && (
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber/[0.12] text-amber">
              TODAY
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {highCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-bear">
              <AlertTriangle className="h-3 w-3" />
              {highCount} HIGH
            </span>
          )}
        </div>
      </div>

      {/* Impact filter */}
      <div className="flex gap-1.5">
        {(["all", "high", "medium"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setImpactFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border",
              impactFilter === f
                ? "bg-amber/[0.10] text-amber border-amber/30"
                : "text-fog border-white/[0.06] hover:text-cream"
            )}
          >
            {f === "all" ? "All Events" : f === "high" ? "High Impact" : "Medium+"}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-sm text-fog text-center py-6">No events match the current filter.</p>
          </Card>
        ) : (
          filtered.map((evt) => <EventCard key={evt.id} event={evt} />)
        )}
      </div>

      {/* Week ahead summary */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Flag className="h-4 w-4 text-amber" />
          <h3 className="font-display text-xl font-medium text-cream tracking-tight">
            Week at a Glance
          </h3>
        </div>
        <div className="space-y-2">
          {weekData.map((d) => {
            const high = d.events.filter((e) => e.impact === "high").length;
            const med = d.events.filter((e) => e.impact === "medium").length;
            const shortDay = d.dayLabel.split(",")[0];
            return (
              <div
                key={d.date}
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.04]"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-mono font-bold", d.isToday ? "text-amber" : "text-cream/70")}>
                    {shortDay}
                  </span>
                  {d.isToday && <span className="h-1.5 w-1.5 rounded-full bg-amber" />}
                </div>
                <div className="flex items-center gap-3">
                  {high > 0 && (
                    <span className="text-[10px] font-mono font-bold text-bear">{high} HIGH</span>
                  )}
                  {med > 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber">{med} MED</span>
                  )}
                  <span className="text-[10px] font-mono text-fog">{d.events.length} total</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function EventCard({ event }: { event: EconEvent }) {
  const style = IMPACT_STYLES[event.impact];
  const flag = COUNTRY_FLAGS[event.country] || "";

  return (
    <div className={cn("rounded-xl border p-3.5", style.bg, style.border)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-fog/50" />
          <span className="text-[11px] font-mono text-fog">{event.time} ET</span>
          <span className="text-xs">{flag}</span>
          <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border", {
            "bg-bear/[0.12] text-bear border-bear/20": event.impact === "high",
            "bg-amber/[0.10] text-amber border-amber/20": event.impact === "medium",
            "bg-white/[0.04] text-fog border-white/[0.08]": event.impact === "low",
          })}>
            {event.impact}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-medium text-cream mb-2">{event.title}</h4>

      {/* Data row */}
      {(event.previous || event.forecast) && (
        <div className="flex items-center gap-4 mb-2">
          {event.previous && (
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-mono text-fog uppercase tracking-wider">Prev</span>
              <span className="text-xs font-mono font-bold text-cream/70">{event.previous}</span>
            </div>
          )}
          {event.forecast && (
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-mono text-fog uppercase tracking-wider">Fcst</span>
              <span className="text-xs font-mono font-bold text-amber">{event.forecast}</span>
            </div>
          )}
          {event.actual && (
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-mono text-fog uppercase tracking-wider">Act</span>
              <span className="text-xs font-mono font-bold text-bull">{event.actual}</span>
            </div>
          )}
        </div>
      )}

      {/* Affected instruments */}
      {event.instruments.length > 0 && (
        <div className="flex items-center gap-1.5">
          {event.instruments.map((inst) => (
            <span
              key={inst}
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.05] text-cream/60 border border-white/[0.06]"
            >
              {inst}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
