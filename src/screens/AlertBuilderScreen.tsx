import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { useAlerts } from "../hooks/useAlerts";
import { gates } from "../lib/tierGates";
import { cn } from "../lib/cn";
import {
  Bell,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Zap,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Alert {
  id: string;
  instrument: string;
  condition: "above" | "below" | "crosses";
  price: number;
  label: string;
  active: boolean;
  triggered: boolean;
  createdAt: string;
  notifyPush: boolean;
  notifyTelegram: boolean;
}

const ALERTS: Alert[] = [
  { id: "a1", instrument: "NQ", condition: "above", price: 24400, label: "BSL Target", active: true, triggered: false, createdAt: "2h ago", notifyPush: true, notifyTelegram: true },
  { id: "a2", instrument: "NQ", condition: "below", price: 24200, label: "SSL Zone", active: true, triggered: false, createdAt: "2h ago", notifyPush: true, notifyTelegram: false },
  { id: "a3", instrument: "GC", condition: "below", price: 3000, label: "Mean Reversion Target", active: true, triggered: false, createdAt: "1h ago", notifyPush: true, notifyTelegram: true },
  { id: "a4", instrument: "CL", condition: "above", price: 68.00, label: "Breakout Level", active: false, triggered: true, createdAt: "1d ago", notifyPush: true, notifyTelegram: false },
  { id: "a5", instrument: "ES", condition: "crosses", price: 5900, label: "Round Number", active: true, triggered: false, createdAt: "3h ago", notifyPush: true, notifyTelegram: true },
];

export function AlertBuilderScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.fullSignalDetail(tier);
  const { alerts: apiAlerts, create: apiCreate, update: apiUpdate, remove: apiRemove } = useAlerts();
  const [alerts, setAlerts] = useState(ALERTS);
  const [showCreate, setShowCreate] = useState(false);
  const [newInstrument, setNewInstrument] = useState("NQ");
  const [newCondition, setNewCondition] = useState<Alert["condition"]>("above");
  const [newPrice, setNewPrice] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Sync from API when available
  useEffect(() => {
    if (apiAlerts.length > 0) {
      setAlerts(apiAlerts.map((a) => ({
        id: a.id,
        instrument: a.instrument,
        condition: a.condition as Alert["condition"],
        price: a.price,
        label: a.label ?? "",
        active: a.active === 1,
        triggered: a.triggered === 1,
        createdAt: a.created_at,
        notifyPush: true,
        notifyTelegram: false,
      })));
    }
  }, [apiAlerts]);

  const activeCount = alerts.filter((a) => a.active).length;
  const triggeredCount = alerts.filter((a) => a.triggered).length;

  const toggleAlert = (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      apiUpdate(id, { active: alert.active ? 0 : 1 }).catch(() => {});
    }
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));
  };

  const handleDeleteAlert = (id: string) => {
    apiRemove(id).catch(() => {});
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateAlert = () => {
    if (!newPrice || !newInstrument) return;
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;
    apiCreate({ instrument: newInstrument, condition: newCondition, price, label: newLabel, active: 1, triggered: 0 }).catch(() => {});
    setNewPrice("");
    setNewLabel("");
    setShowCreate(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="label mb-1">Notifications</div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
            Alert Builder
          </h1>
          <p className="text-xs text-fog mt-1.5 font-light">
            Custom price alerts across all instruments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono font-bold bg-amber text-bg hover:brightness-[1.08] transition shadow-amber-glow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> New Alert
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-white/[0.07] bg-surface p-3 text-center">
          <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase">Total</div>
          <div className="font-mono font-bold text-lg text-cream tabular-nums">{alerts.length}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-surface p-3 text-center">
          <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase">Active</div>
          <div className="font-mono font-bold text-lg text-bull tabular-nums">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.07] bg-surface p-3 text-center">
          <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase">Triggered</div>
          <div className="font-mono font-bold text-lg text-amber tabular-nums">{triggeredCount}</div>
        </div>
      </div>

      {/* Create alert form (simplified) */}
      {showCreate && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-amber" />
            <h3 className="font-display text-lg font-medium text-cream tracking-tight">New Alert</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Instrument</div>
              <div className="grid grid-cols-7 gap-1.5">
                {["NQ", "ES", "YM", "RTY", "CL", "GC", "SI"].map((s) => (
                  <button key={s} onClick={() => setNewInstrument(s)} className={cn("px-2 py-2 rounded-lg font-mono font-bold text-[11px] border transition-all", newInstrument === s ? "bg-amber/[0.12] border-amber/30 text-amber" : "bg-white/[0.04] border-white/[0.08] text-cream/80 hover:border-amber/30")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Condition</div>
                <div className="flex gap-1.5">
                  {(["above", "below", "crosses"] as const).map((c) => (
                    <button key={c} onClick={() => setNewCondition(c)} className={cn("flex-1 px-2 py-2 rounded-lg text-[10px] font-mono font-bold border transition-all", newCondition === c ? "bg-amber/[0.12] border-amber/30 text-amber" : "bg-white/[0.04] border-white/[0.08] text-cream/80 hover:border-amber/30")}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Price</div>
                <input
                  type="number"
                  placeholder="24400"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono text-cream outline-none focus:border-amber/50 transition-all"
                />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Label</div>
              <input
                type="text"
                placeholder="BSL Target, Support Zone..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-cream outline-none focus:border-amber/50 transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateAlert} disabled={!newPrice} className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber text-bg hover:brightness-[1.08] transition shadow-amber-glow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Create Alert
              </button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2.5 rounded-xl text-xs font-bold text-fog border border-white/[0.08] hover:text-cream transition">
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts list */}
      <div className="relative">
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onToggle={() => toggleAlert(alert.id)}
              onDelete={() => handleDeleteAlert(alert.id)}
            />
          ))}
        </div>

        {!canUse && (
          <LockOverlay
            requiredTier="Operator"
            title="Alert Builder Locked"
            description="Operator unlocks custom price alerts with push and Telegram notifications."
            onUpgrade={() => setTier("operator")}
          />
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert, onToggle, onDelete }: { alert: Alert; onToggle: () => void; onDelete: () => void }) {
  const CondIcon = alert.condition === "above" ? TrendingUp : alert.condition === "below" ? TrendingDown : Zap;
  const condColor = alert.condition === "above" ? "text-bull" : alert.condition === "below" ? "text-bear" : "text-amber";

  return (
    <div className={cn(
      "rounded-xl border px-4 py-3 transition-all",
      alert.triggered ? "border-amber/25 bg-amber/[0.04]" : alert.active ? "border-white/[0.06]" : "border-white/[0.04] opacity-50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CondIcon className={cn("h-4 w-4 flex-shrink-0", condColor)} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-cream">{alert.instrument}</span>
              <span className={cn("text-[10px] font-mono font-bold uppercase", condColor)}>{alert.condition}</span>
              <span className="text-xs font-mono font-bold text-cream tabular-nums">{alert.price}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-fog font-mono">{alert.label}</span>
              <span className="text-[10px] text-fog/50 font-mono">{alert.createdAt}</span>
              {alert.triggered && (
                <span className="text-[9px] font-mono font-bold text-amber bg-amber/[0.10] px-1.5 py-0.5 rounded">TRIGGERED</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="text-fog hover:text-cream transition-colors">
            {alert.active ? <ToggleRight className="h-5 w-5 text-bull" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
          <button onClick={onDelete} className="text-fog hover:text-bear transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
