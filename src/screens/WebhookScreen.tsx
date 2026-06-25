import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { useWebhooks } from "../hooks/useWebhooks";
import { gates } from "../lib/tierGates";
import { cn } from "../lib/cn";
import {
  Webhook,
  Plus,
  Trash2,
  TestTube2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Key,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface WebhookConfig {
  id: string;
  url: string;
  label: string;
  active: boolean;
  events: string[];
  hmacKey: string;
  lastDelivery?: { status: "success" | "failed"; time: string; statusCode: number };
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { id: "signal.new", label: "New Signal", description: "Fired when a new signal is generated" },
  { id: "signal.resolved", label: "Signal Resolved", description: "Fired when a signal hits TP or stops" },
  { id: "brief.morning", label: "Morning Brief", description: "Sent at 8:00 AM ET daily" },
  { id: "brief.eod", label: "EOD Brief", description: "Sent at 4:30 PM ET daily" },
  { id: "alert.triggered", label: "Alert Triggered", description: "When a custom price alert fires" },
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
  {
    id: "wh1",
    url: "https://hooks.example.com/bovyn/signals",
    label: "Trading Bot",
    active: true,
    events: ["signal.new", "signal.resolved"],
    hmacKey: "whsec_a1b2c3d4e5f6g7h8i9j0",
    lastDelivery: { status: "success", time: "2m ago", statusCode: 200 },
    createdAt: "Mar 15, 2026",
  },
  {
    id: "wh2",
    url: "https://discord.com/api/webhooks/1234/abcd",
    label: "Discord Channel",
    active: true,
    events: ["signal.new", "brief.morning"],
    hmacKey: "whsec_k1l2m3n4o5p6q7r8s9t0",
    lastDelivery: { status: "failed", time: "1h ago", statusCode: 503 },
    createdAt: "Mar 20, 2026",
  },
];

export function WebhookScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.webhooks(tier);
  const { webhooks: apiWebhooks, create: apiCreate, remove: apiRemove, test: apiTest } = useWebhooks();
  const [webhooks, setWebhooks] = useState(MOCK_WEBHOOKS);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);

  const handleCreateWebhook = () => {
    if (!newUrl) return;
    apiCreate({ url: newUrl, label: newLabel, events: newEvents, active: 1 }).catch(() => {});
    setNewUrl("");
    setNewLabel("");
    setNewEvents([]);
    setShowCreate(false);
  };

  const handleDeleteWebhook = (id: string) => {
    apiRemove(id).catch(() => {});
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleTestWebhook = (id: string) => {
    apiTest(id).catch(() => {});
  };

  const toggleEvent = (evtId: string) => {
    setNewEvents((prev) => prev.includes(evtId) ? prev.filter((e) => e !== evtId) : [...prev, evtId]);
  };

  // Sync from API when available
  useEffect(() => {
    if (apiWebhooks.length > 0) {
      setWebhooks(apiWebhooks.map((w) => ({
        id: w.id,
        url: w.url,
        label: w.label ?? "",
        active: w.active === 1,
        events: w.events ?? [],
        hmacKey: w.hmac_key ?? "",
        lastDelivery: w.last_delivery_at ? {
          status: (w.last_status_code ?? 0) < 400 ? "success" as const : "failed" as const,
          time: w.last_delivery_at,
          statusCode: w.last_status_code ?? 0,
        } : undefined,
        createdAt: w.created_at,
      })));
    }
  }, [apiWebhooks]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="label mb-1">Integrations</div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
            Webhooks
          </h1>
          <p className="text-xs text-fog mt-1.5 font-light">
            Send signals and briefs to external services
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-mono font-bold bg-amber text-bg hover:brightness-[1.08] transition shadow-amber-glow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Add Webhook
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-amber" />
            <h3 className="font-display text-lg font-medium text-cream tracking-tight">New Webhook</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Endpoint URL</div>
              <input
                type="url"
                placeholder="https://your-service.com/webhook"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm font-mono text-cream outline-none focus:border-amber/50 transition-all"
              />
            </div>
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Label</div>
              <input
                type="text"
                placeholder="My Trading Bot"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-cream outline-none focus:border-amber/50 transition-all"
              />
            </div>
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1.5">Events</div>
              <div className="space-y-1.5">
                {WEBHOOK_EVENTS.map((evt) => (
                  <label key={evt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-colors">
                    <input type="checkbox" className="accent-amber" checked={newEvents.includes(evt.id)} onChange={() => toggleEvent(evt.id)} />
                    <div>
                      <div className="text-xs font-medium text-cream">{evt.label}</div>
                      <div className="text-[10px] text-fog">{evt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateWebhook} disabled={!newUrl} className="flex-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber text-bg hover:brightness-[1.08] transition shadow-amber-glow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Create Webhook
              </button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2.5 rounded-xl text-xs font-bold text-fog border border-white/[0.08] hover:text-cream transition">
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Webhooks list */}
      <div className="relative">
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <WebhookCard key={wh.id} webhook={wh} onDelete={() => handleDeleteWebhook(wh.id)} onTest={() => handleTestWebhook(wh.id)} />
          ))}
        </div>

        {!canUse && (
          <LockOverlay
            requiredTier="Operator"
            title="Webhooks Locked"
            description="Operator unlocks webhook output with HMAC signing for secure integrations."
            onUpgrade={() => setTier("operator")}
          />
        )}
      </div>

      {/* HMAC docs */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4 text-fog" />
          <h3 className="font-display text-lg font-medium text-cream tracking-tight">HMAC Signing</h3>
        </div>
        <p className="text-[12px] text-cream/60 leading-relaxed font-light mb-3">
          All webhook payloads are signed with HMAC-SHA256. Verify the <code className="font-mono text-amber/80 bg-amber/[0.06] px-1 rounded">X-Bovyn-Signature</code> header to authenticate payloads.
        </p>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 font-mono text-[11px] text-fog leading-relaxed">
          <div className="text-amber/60">// Verify signature</div>
          <div>const sig = crypto.createHmac('sha256', secret)</div>
          <div>&nbsp;&nbsp;.update(rawBody).digest('hex');</div>
          <div>if (sig !== req.headers['x-bovyn-signature']) {'{'}</div>
          <div>&nbsp;&nbsp;throw new Error('Invalid signature');</div>
          <div>{'}'}</div>
        </div>
      </Card>
    </div>
  );
}

function WebhookCard({ webhook, onDelete, onTest }: { webhook: WebhookConfig; onDelete: () => void; onTest: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-amber" />
          <span className="text-sm font-medium text-cream">{webhook.label}</span>
          <span className={cn(
            "text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border",
            webhook.active ? "text-bull bg-bull/[0.08] border-bull/20" : "text-fog bg-white/[0.04] border-white/[0.08]"
          )}>
            {webhook.active ? "ACTIVE" : "PAUSED"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onTest} className="p-1.5 rounded-lg text-fog hover:text-amber transition-colors" title="Test webhook">
            <TestTube2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-fog hover:text-bear transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="font-mono text-[11px] text-fog bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 mb-2 truncate">
        {webhook.url}
      </div>

      {/* Events */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {webhook.events.map((e) => (
          <span key={e} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber/[0.06] text-amber/80 border border-amber/15">
            {e}
          </span>
        ))}
      </div>

      {/* Last delivery */}
      {webhook.lastDelivery && (
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {webhook.lastDelivery.status === "success" ? (
            <CheckCircle2 className="h-3 w-3 text-bull" />
          ) : (
            <XCircle className="h-3 w-3 text-bear" />
          )}
          <span className={webhook.lastDelivery.status === "success" ? "text-bull" : "text-bear"}>
            {webhook.lastDelivery.statusCode}
          </span>
          <span className="text-fog">{webhook.lastDelivery.time}</span>
        </div>
      )}

      {/* Expandable HMAC key */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-fog hover:text-cream transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        HMAC Secret
      </button>
      {expanded && (
        <div className="mt-1.5 flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
          <span className="font-mono text-[11px] text-fog flex-1 truncate">
            {showKey ? webhook.hmacKey : "•".repeat(webhook.hmacKey.length)}
          </span>
          <button onClick={() => setShowKey(!showKey)} className="text-fog hover:text-cream transition-colors">
            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => navigator.clipboard.writeText(webhook.hmacKey)} className="text-fog hover:text-amber transition-colors" title="Copy secret">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </Card>
  );
}
