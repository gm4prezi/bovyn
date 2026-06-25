import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../lib/cn";

type Session = {
  name: string;
  startHour: number; // NY time
  endHour: number;
  tone: "amber" | "fog";
};

// NY-time session windows (simplified)
const SESSIONS: Session[] = [
  { name: "Asia", startHour: 19, endHour: 24, tone: "fog" },
  { name: "London", startHour: 2, endHour: 5, tone: "fog" },
  { name: "NY AM", startHour: 9, endHour: 12, tone: "amber" },
  { name: "NY PM", startHour: 13, endHour: 16, tone: "amber" },
];

function getNyHour(d: Date): number {
  const nyTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);
  const h = parseInt(nyTime.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(nyTime.find((p) => p.type === "minute")?.value ?? "0", 10);
  return h + m / 60;
}

function findActive(nyHour: number): { current: Session | null; next: Session; minutesUntil: number } {
  for (const s of SESSIONS) {
    if (nyHour >= s.startHour && nyHour < s.endHour) {
      const minutesLeft = Math.max(1, Math.round((s.endHour - nyHour) * 60));
      return { current: s, next: s, minutesUntil: minutesLeft };
    }
  }
  // Find next session
  const upcoming = SESSIONS
    .map((s) => {
      let delta = s.startHour - nyHour;
      if (delta <= 0) delta += 24;
      return { session: s, delta };
    })
    .sort((a, b) => a.delta - b.delta)[0];
  return {
    current: null,
    next: upcoming.session,
    minutesUntil: Math.max(1, Math.round(upcoming.delta * 60)),
  };
}

export function SessionPill() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nyHour = getNyHour(now);
  const { current, next, minutesUntil } = findActive(nyHour);
  const label = current
    ? `${current.name} · live`
    : `${next.name} opens in ${formatMinutes(minutesUntil)}`;
  const isLive = !!current;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-[10px] tracking-[0.12em] uppercase border",
        isLive
          ? "bg-amber/[0.1] text-amber border-amber/30"
          : "bg-white/[0.03] text-fog border-white/[0.08]"
      )}
    >
      {isLive ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-amber animate-ping opacity-75" />
          <span className="relative rounded-full bg-amber h-1.5 w-1.5" />
        </span>
      ) : (
        <Clock className="h-2.5 w-2.5" />
      )}
      {label}
    </div>
  );
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}
