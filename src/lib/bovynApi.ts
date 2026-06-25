/**
 * BOVYN bot API client.
 *
 * Talks to the live prezi-dashboard service at https://bovyn.io/api/*.
 *
 * Auth (preference order):
 *   1. Bearer JWT — set via `setAuthToken(token)` after successful login.
 *      Login flow: POST /api/auth/login { license_key } → returns JWT.
 *   2. X-API-Key fallback — legacy, only used if no JWT is present.
 *      Configured via VITE_BOVYN_API_KEY at build time. Bundled into the
 *      client JS, so treat it as a "site token" not a real secret.
 *
 * Configuration (set in `.env.local`):
 *   VITE_BOVYN_API_URL=https://bovyn.io/api
 *   VITE_BOVYN_API_KEY=<legacy fallback, optional once JWT is in place>
 */
import type {
  Signal,
  InstrumentSymbol,
  Grade,
  Direction,
  Session,
  SignalStatus,
  Tier,
} from "../types";

const API_URL = import.meta.env.VITE_BOVYN_API_URL ?? "https://bovyn.io/api";
const API_KEY = import.meta.env.VITE_BOVYN_API_KEY ?? "";

// In-memory token. AuthContext owns the lifecycle; this module just reads it.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** True if we have either a JWT or a legacy API key available. */
export const bovynApiConfigured = true;

const VALID_INSTRUMENTS: ReadonlySet<InstrumentSymbol> = new Set<InstrumentSymbol>([
  "NQ",
  "ES",
  "YM",
  "RTY",
  "CL",
  "GC",
  "SI",
]);

const VALID_GRADES: ReadonlySet<Grade> = new Set<Grade>(["S++", "A+", "A"]);

const VALID_SESSIONS: ReadonlySet<Session> = new Set<Session>([
  "Asia",
  "London",
  "NY AM",
  "NY PM",
  "Pre-Market",
  "Off Hours",
]);

const VALID_STATUSES: ReadonlySet<SignalStatus> = new Set<SignalStatus>([
  "Pending",
  "Running",
  "TP1 Hit",
  "TP2 Hit",
  "TP3 Hit",
  "Stopped",
  "Cancelled",
]);

/** Raw row shape returned from /api/signals — matches `bovyn_dashboard_new.py` output. */
interface RawSignal {
  id?: string | number;
  timestamp?: string | number;
  instrument?: string;
  direction?: string;
  grade?: string;
  entry?: number | null;
  entry_zone_hi?: number | null;
  entry_zone_lo?: number | null;
  stop?: number | null;
  tp1?: number | null;
  tp2?: number | null;
  tp3?: number | null;
  rr_ratio?: number | null;
  confluence?: string[] | string | null;
  session?: string | null;
  status?: string | null;
  pnl?: number | null;
  gradeReasoning?: string | null;
  source?: string | null;
  consensus_score?: number | null;
  consensus_label?: string | null;
  engines_fired?: string | null;
  signal_tags?: string[] | string | null;
  setup_name?: string | null;
  engine_count?: number | null;
}

/**
 * Normalize a session string from the bot to the strict Signal.session union.
 * Maps common bot tags like "NY_AM", "ny am", "Asia KZ" to canonical values.
 */
function normalizeSession(raw: string | null | undefined): Session | null {
  if (!raw) return null;
  const s = raw.toUpperCase().replace(/[_-]/g, " ").trim();
  if (s.includes("NY") && s.includes("PM")) return "NY PM";
  if (s.includes("NY") && s.includes("AM")) return "NY AM";
  if (s.includes("NY")) return "NY AM";
  if (s.includes("LONDON") || s.includes("LDN")) return "London";
  if (s.includes("ASIA") || s.includes("TOKYO") || s.includes("SYDNEY")) return "Asia";
  if (s === "OFF" || s.includes("OFF")) return "Off Hours";
  if (s === "SB" || s.includes("PRE")) return "Pre-Market";
  // Fallback: return "Off Hours" rather than null so signals aren't dropped
  return "Off Hours";
}

/**
 * Normalize a status string from the bot. Bot emits "Expired" which is not in
 * the UI's SignalStatus union — map it to "Cancelled".
 */
function normalizeStatus(raw: string | null | undefined): SignalStatus | null {
  if (!raw) return null;
  if (raw === "Expired") return "Cancelled";
  if ((VALID_STATUSES as Set<string>).has(raw)) return raw as SignalStatus;
  // Try common alternates
  const lower = raw.toLowerCase();
  if (lower.includes("pending")) return "Pending";
  if (lower.includes("running") || lower.includes("active")) return "Running";
  if (lower.includes("stopped") || lower.includes("stop")) return "Stopped";
  if (lower.includes("tp1")) return "TP1 Hit";
  if (lower.includes("tp2")) return "TP2 Hit";
  if (lower.includes("tp3")) return "TP3 Hit";
  return null;
}

function normalizeDirection(raw: string | null | undefined): Direction | null {
  if (!raw) return null;
  const d = raw.toUpperCase();
  if (d === "LONG" || d === "BUY") return "LONG";
  if (d === "SHORT" || d === "SELL") return "SHORT";
  return null;
}

function normalizeConfluence(raw: RawSignal["confluence"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map((s) => String(s));
  if (typeof raw === "string") {
    // comma-separated or JSON string
    const trimmed = raw.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        /* fall through */
      }
    }
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Coerce a raw signal from the bot API into the strict Signal type.
 * Returns null if any required field is missing or out of the enum.
 * Caller is responsible for filtering nulls out.
 */
function coerceSignal(raw: RawSignal): Signal | null {
  const instrument = raw.instrument as InstrumentSymbol | undefined;
  if (!instrument || !VALID_INSTRUMENTS.has(instrument)) return null;

  const grade = raw.grade as Grade | undefined;
  if (!grade || !VALID_GRADES.has(grade)) return null;

  const direction = normalizeDirection(raw.direction);
  if (!direction) return null;

  const session = normalizeSession(raw.session);
  if (!session) return null;

  const status = normalizeStatus(raw.status);
  if (!status) return null;

  if (
    raw.entry == null ||
    raw.stop == null ||
    raw.tp1 == null ||
    raw.tp2 == null ||
    raw.tp3 == null
  ) {
    return null;
  }

  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw.id === "number"
        ? `sig_${raw.id}`
        : `sig_${Math.random().toString(36).slice(2, 10)}`;

  const timestamp =
    typeof raw.timestamp === "string"
      ? raw.timestamp
      : typeof raw.timestamp === "number"
        ? new Date(raw.timestamp * 1000).toISOString()
        : new Date().toISOString();

  const signalTags = raw.signal_tags
    ? Array.isArray(raw.signal_tags)
      ? raw.signal_tags
      : typeof raw.signal_tags === "string"
        ? raw.signal_tags.split(",").map((s) => s.trim()).filter(Boolean)
        : []
    : [];

  return {
    id,
    timestamp,
    instrument,
    direction,
    grade,
    entry: Number(raw.entry),
    stop: Number(raw.stop),
    tp1: Number(raw.tp1),
    tp2: Number(raw.tp2),
    tp3: Number(raw.tp3),
    confluence: normalizeConfluence(raw.confluence),
    session,
    status,
    pnl: raw.pnl == null ? 0 : Number(raw.pnl),
    gradeReasoning: raw.gradeReasoning ?? `${grade} grade setup`,
    source: "BOVYN",
    consensusScore: raw.consensus_score ?? undefined,
    consensusLabel: raw.consensus_label ?? undefined,
    enginesFired: raw.engines_fired ?? undefined,
    signalTags: signalTags.length > 0 ? signalTags : undefined,
    setupName: raw.setup_name ?? undefined,
    engineCount: raw.engine_count ?? undefined,
  };
}

export class BovynApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "BovynApiError";
    this.status = status;
    this.code = code;
  }
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  } else if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
}

async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!authToken && !API_KEY) {
    throw new BovynApiError("not_authenticated", 401, "not_authenticated");
  }
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      code = body.error;
    } catch {
      /* ignore body parse error */
    }
    throw new BovynApiError(
      `BOVYN API ${path} -> HTTP ${res.status}${code ? ` (${code})` : ""}`,
      res.status,
      code
    );
  }
  return (await res.json()) as T;
}

export interface SignalsResponse {
  signals: RawSignal[];
  count?: number;
}

export async function fetchSignals(
  limit = 50,
  abortSignal?: AbortSignal
): Promise<Signal[]> {
  const data = await apiFetch<SignalsResponse>(
    `/signals?limit=${encodeURIComponent(limit)}`,
    abortSignal
  );
  const raws = Array.isArray(data.signals) ? data.signals : [];
  return raws
    .map(coerceSignal)
    .filter((s): s is Signal => s !== null);
}

export interface MarketInstrumentRead {
  direction: string;
  grade: string;
  consensus_score: number;
  consensus_label: string;
  fresh: boolean;
  bias?: string;
  signal_tags?: string[];
  engines_fired?: string;
  setup_name?: string;
}

export interface MarketStateResponse {
  timestamp: string;
  session: string;
  daily_bias: string;
  flow_direction?: string;
  regime?: string;
  regime_label?: string;
  signals_last_hour: number;
  signals_today: number;
  top_grade_today: string | null;
  direction_counts?: { LONG: number; SHORT: number };
  consensus_distribution?: Record<string, number>;
  instruments?: Record<string, MarketInstrumentRead>;
}

export async function fetchMarketState(
  abortSignal?: AbortSignal
): Promise<MarketStateResponse> {
  return apiFetch<MarketStateResponse>("/market-state", abortSignal);
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  build: number;
  time: string;
  auth?: {
    whop: boolean;
    jwt: boolean;
    api_key: boolean;
  };
}

export async function fetchHealth(abortSignal?: AbortSignal): Promise<HealthResponse> {
  // health endpoint doesn't require auth — use plain fetch
  const url = `${API_URL.replace(/\/$/, "")}/health`;
  const res = await fetch(url, { signal: abortSignal });
  if (!res.ok) throw new Error(`BOVYN health -> HTTP ${res.status}`);
  return (await res.json()) as HealthResponse;
}

// ── Auth ──────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  tier: Tier;
  email: string | null;
  membership_id: string;
  plan_id: string;
  exp: number;
}

export interface MeResponse {
  authenticated: true;
  tier: Tier;
  email?: string | null;
  membership_id?: string;
  plan_id?: string;
  exp?: number;
  source?: "api_key";
}

/**
 * Log in with email + password.
 * Server syncs Whop subscription status on every login — tier auto-updates.
 */
export async function login(
  email: string,
  password: string,
  abortSignal?: AbortSignal
): Promise<LoginResponse> {
  const url = `${API_URL.replace(/\/$/, "")}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal: abortSignal,
  });

  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      code = body.error;
    } catch {
      /* ignore */
    }
    throw new BovynApiError(
      code ?? `login_failed_${res.status}`,
      res.status,
      code
    );
  }

  return (await res.json()) as LoginResponse;
}

/**
 * Create a BOVYN account linked to an active Whop subscription.
 * Verifies the email has an active Whop membership during signup.
 */
export async function signup(
  email: string,
  password: string,
  abortSignal?: AbortSignal
): Promise<LoginResponse> {
  const url = `${API_URL.replace(/\/$/, "")}/auth/signup`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    signal: abortSignal,
  });

  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      code = body.error;
    } catch {
      /* ignore */
    }
    throw new BovynApiError(
      code ?? `signup_failed_${res.status}`,
      res.status,
      code
    );
  }

  return (await res.json()) as LoginResponse;
}

/**
 * Fetch the current authenticated user's tier/email.
 * Requires a JWT or X-API-Key already in scope.
 */
export async function fetchMe(abortSignal?: AbortSignal): Promise<MeResponse> {
  return apiFetch<MeResponse>("/auth/me", abortSignal);
}

// ── Whop OAuth ──────────────────────────────────────────────────

export interface WhopOAuthConfig {
  client_id: string;
  redirect_uri: string;
  configured: boolean;
}

export interface WhopCallbackResponse extends LoginResponse {
  whop_user_id: string;
  whop_verified: boolean;
  is_new_user: boolean;
}

/** Fetch Whop OAuth config (client_id, redirect_uri) from backend. */
export async function fetchWhopConfig(): Promise<WhopOAuthConfig> {
  const url = `${API_URL.replace(/\/$/, "")}/auth/whop/config`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new BovynApiError("whop_config_failed", res.status);
  return (await res.json()) as WhopOAuthConfig;
}

/** Exchange Whop OAuth code + PKCE verifier for BOVYN JWT. */
export async function whopCallback(
  code: string,
  codeVerifier: string,
  abortSignal?: AbortSignal
): Promise<WhopCallbackResponse> {
  const url = `${API_URL.replace(/\/$/, "")}/auth/whop/callback`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
    signal: abortSignal,
  });
  if (!res.ok) {
    let code_err: string | undefined;
    try { const b = (await res.json()) as { error?: string }; code_err = b.error; } catch { /* */ }
    throw new BovynApiError(code_err ?? `whop_callback_${res.status}`, res.status, code_err);
  }
  return (await res.json()) as WhopCallbackResponse;
}

// ── AI Chat ──────────────────────────────────────────────────────

export interface AiChatResponse {
  response: string;
  model?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export async function fetchAiChat(
  message: string,
  abortSignal?: AbortSignal
): Promise<AiChatResponse> {
  const url = `${API_URL.replace(/\/$/, "")}/ai/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
    signal: abortSignal,
  });
  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      code = body.error;
    } catch { /* ignore */ }
    throw new BovynApiError(
      code ?? `ai_chat_failed_${res.status}`,
      res.status,
      code
    );
  }
  return (await res.json()) as AiChatResponse;
}

// ── Briefing ────────────────────────────────────────────────────

export interface BriefingInstrumentRead {
  direction: string;
  grade: string;
  consensus: string;
  score: number;
}

export interface BriefingSetup {
  instrument: string;
  direction: string;
  grade: string;
  entry: number;
  setup_name: string;
  consensus_score: number;
}

export interface BriefingResponse {
  type: string;
  date: string;
  timestamp: string;
  session: string;
  regime: string;
  regime_label: string;
  daily_bias: string;
  signals_today: number;
  top_grade_today: string | null;
  direction_counts: { LONG: number; SHORT: number };
  instruments: Record<string, BriefingInstrumentRead>;
  top_setups: BriefingSetup[];
  avoid_today: { instrument: string; reason: string }[];
  key_events: { title: string; time: string; impact: string }[];
  daily_pnl: number;
  weekly_pnl: number;
  guardian_status: { hwm: number; streak: number; kill_switch: boolean };
}

export async function fetchBriefing(
  type: "am" | "eod" = "am",
  abortSignal?: AbortSignal
): Promise<BriefingResponse> {
  return apiFetch<BriefingResponse>(`/brief/${type}`, abortSignal);
}

// ── Calendar ────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  impact: "high" | "medium" | "low";
  country: string;
  previous: string | null;
  forecast: string | null;
  actual: string | null;
  instruments: string[];
}

export interface CalendarResponse {
  events: CalendarEvent[];
}

export async function fetchCalendar(
  week?: string,
  abortSignal?: AbortSignal
): Promise<CalendarResponse> {
  const q = week ? `?week=${encodeURIComponent(week)}` : "";
  return apiFetch<CalendarResponse>(`/calendar${q}`, abortSignal);
}

// ── Journal ─────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  instrument: string | null;
  direction: string | null;
  grade: string | null;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number;
  contracts: number;
  session: string | null;
  setup: string | null;
  emotion: string | null;
  notes: string | null;
  tags: string;
  ai_insight: string | null;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalResponse {
  entries: JournalEntry[];
}

export async function fetchJournal(
  abortSignal?: AbortSignal
): Promise<JournalResponse> {
  return apiFetch<JournalResponse>("/journal", abortSignal);
}

async function apiPost<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (!authToken && !API_KEY) {
    throw new BovynApiError("not_authenticated", 401, "not_authenticated");
  }
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...buildAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let code: string | undefined;
    try { const b = (await res.json()) as { error?: string }; code = b.error; } catch { /* */ }
    throw new BovynApiError(`BOVYN API POST ${path} -> HTTP ${res.status}`, res.status, code);
  }
  return (await res.json()) as T;
}

async function apiPut<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  if (!authToken && !API_KEY) {
    throw new BovynApiError("not_authenticated", 401, "not_authenticated");
  }
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...buildAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    let code: string | undefined;
    try { const b = (await res.json()) as { error?: string }; code = b.error; } catch { /* */ }
    throw new BovynApiError(`BOVYN API PUT ${path} -> HTTP ${res.status}`, res.status, code);
  }
  return (await res.json()) as T;
}

async function apiDelete(path: string, signal?: AbortSignal): Promise<void> {
  if (!authToken && !API_KEY) {
    throw new BovynApiError("not_authenticated", 401, "not_authenticated");
  }
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: buildAuthHeaders(),
    signal,
  });
  if (!res.ok) {
    let code: string | undefined;
    try { const b = (await res.json()) as { error?: string }; code = b.error; } catch { /* */ }
    throw new BovynApiError(`BOVYN API DELETE ${path} -> HTTP ${res.status}`, res.status, code);
  }
}

export async function createJournalEntry(
  entry: Partial<JournalEntry>,
  abortSignal?: AbortSignal
): Promise<JournalEntry> {
  return apiPost<JournalEntry>("/journal", entry as Record<string, unknown>, abortSignal);
}

export async function updateJournalEntry(
  id: string,
  entry: Partial<JournalEntry>,
  abortSignal?: AbortSignal
): Promise<JournalEntry> {
  return apiPut<JournalEntry>(`/journal/${id}`, entry as Record<string, unknown>, abortSignal);
}

export async function deleteJournalEntry(
  id: string,
  abortSignal?: AbortSignal
): Promise<void> {
  return apiDelete(`/journal/${id}`, abortSignal);
}

// ── Weekly Report ───────────────────────────────────────────────

export interface WeeklyReportSummary {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  net_pnl: number;
  best_day_pnl: number;
  worst_day_pnl: number;
}

export interface WeeklyReportResponse {
  week_start: string;
  week_end: string;
  generated_at: string;
  summary: WeeklyReportSummary;
  daily_breakdown: { date: string; trades: number; wins: number; losses: number; pnl: number }[];
  grade_distribution: Record<string, number>;
  best_trade: Record<string, unknown> | null;
  worst_trade: Record<string, unknown> | null;
  strengths: string[];
  improvements: string[];
  emotion_summary: { most_common: string; fomo_count: number; revenge_count: number };
}

export async function fetchWeeklyReport(
  abortSignal?: AbortSignal
): Promise<WeeklyReportResponse> {
  return apiFetch<WeeklyReportResponse>("/weekly-report", abortSignal);
}

// ── Goals ────────────────────────────────────────────────────────

export interface GoalsResponse {
  user_id: string;
  weekly_target: number;
  daily_loss_limit: number;
  max_drawdown: number;
  max_consecutive_losses: number;
  max_trades_per_day: number;
  friday_cutoff_hour: number;
  auto_pause: number;
}

export async function fetchGoals(
  abortSignal?: AbortSignal
): Promise<GoalsResponse> {
  return apiFetch<GoalsResponse>("/goals", abortSignal);
}

export async function updateGoals(
  goals: Partial<GoalsResponse>,
  abortSignal?: AbortSignal
): Promise<GoalsResponse> {
  return apiPut<GoalsResponse>("/goals", goals as Record<string, unknown>, abortSignal);
}

// ── Alerts ──────────────────────────────────────────────────────

export interface AlertItem {
  id: string;
  user_id: string;
  instrument: string;
  condition: string;
  price: number;
  label: string;
  active: number;
  triggered: number;
  triggered_at: string | null;
  created_at: string;
}

export interface AlertsResponse {
  alerts: AlertItem[];
}

export async function fetchAlerts(
  abortSignal?: AbortSignal
): Promise<AlertsResponse> {
  return apiFetch<AlertsResponse>("/alerts", abortSignal);
}

export async function createAlert(
  alert: Partial<AlertItem>,
  abortSignal?: AbortSignal
): Promise<AlertItem> {
  return apiPost<AlertItem>("/alerts", alert as Record<string, unknown>, abortSignal);
}

export async function updateAlert(
  id: string,
  alert: Partial<AlertItem>,
  abortSignal?: AbortSignal
): Promise<AlertItem> {
  return apiPut<AlertItem>(`/alerts/${id}`, alert as Record<string, unknown>, abortSignal);
}

export async function deleteAlert(
  id: string,
  abortSignal?: AbortSignal
): Promise<void> {
  return apiDelete(`/alerts/${id}`, abortSignal);
}

// ── Webhooks ────────────────────────────────────────────────────

export interface WebhookItem {
  id: string;
  user_id: string;
  url: string;
  label: string;
  active: number;
  events: string[];
  hmac_key: string;
  last_status: string | null;
  last_status_code: number | null;
  last_delivery_at: string | null;
  created_at: string;
}

export interface WebhooksResponse {
  webhooks: WebhookItem[];
}

export async function fetchWebhooks(
  abortSignal?: AbortSignal
): Promise<WebhooksResponse> {
  return apiFetch<WebhooksResponse>("/webhooks", abortSignal);
}

export async function createWebhook(
  webhook: Partial<WebhookItem>,
  abortSignal?: AbortSignal
): Promise<WebhookItem> {
  return apiPost<WebhookItem>("/webhooks", webhook as Record<string, unknown>, abortSignal);
}

export async function updateWebhook(
  id: string,
  webhook: Partial<WebhookItem>,
  abortSignal?: AbortSignal
): Promise<WebhookItem> {
  return apiPut<WebhookItem>(`/webhooks/${id}`, webhook as Record<string, unknown>, abortSignal);
}

export async function deleteWebhook(
  id: string,
  abortSignal?: AbortSignal
): Promise<void> {
  return apiDelete(`/webhooks/${id}`, abortSignal);
}

export async function testWebhook(
  id: string,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(`/webhooks/${id}/test`, {}, abortSignal);
}

// ── Risk Dashboard ──────────────────────────────────────────────

export interface RiskDashboardResponse {
  risk_level: "normal" | "elevated" | "critical";
  hwm: number;
  cushion: number;
  max_drawdown: number;
  daily_loss_limit: number;
  daily_pnl: number;
  daily_remaining: number;
  consecutive_losses: number;
  kill_switch: boolean;
  recovery_mode: boolean;
  open_positions: { symbol: string; direction: string; qty: number; pnl: number; entry: number }[];
  risk_events: { time: string; symbol: string; type: string; reason: string }[];
  margin_used_pct: number;
}

export async function fetchRiskDashboard(
  abortSignal?: AbortSignal
): Promise<RiskDashboardResponse> {
  return apiFetch<RiskDashboardResponse>("/risk-dashboard", abortSignal);
}

// ── Replay ──────────────────────────────────────────────────────

export interface ReplaySignal {
  id: number | string;
  timestamp: string;
  direction: string;
  grade: string;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  tp3: number;
  status: string;
  pnl: number;
  session: string;
}

export interface ReplayResponse {
  date: string;
  instrument: string;
  signals: ReplaySignal[];
}

export async function fetchReplay(
  date: string,
  instrument: string,
  abortSignal?: AbortSignal
): Promise<ReplayResponse> {
  return apiFetch<ReplayResponse>(
    `/replay?date=${encodeURIComponent(date)}&instrument=${encodeURIComponent(instrument)}`,
    abortSignal
  );
}

// ── Stats (real data) ───────────────────────────────────────────

export interface StatsInstrument {
  symbol: string;
  winRate: number;
  signals: number;
  pnl: number;
}

export interface StatsGrade {
  grade: string;
  winRate: number;
  signals: number;
}

export interface StatsEquityPoint {
  date: string;
  bovyn: number;
  benchmark: number;
}

export interface StatsMonthly {
  month: string;
  pnl: number;
}

export interface StatsResponse {
  net_pnl: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  wins: number;
  losses: number;
  period: string;
  by_instrument: StatsInstrument[];
  by_grade: StatsGrade[];
  monthly: StatsMonthly[];
  equity_curve: StatsEquityPoint[];
}

export async function fetchStats(
  abortSignal?: AbortSignal
): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/stats", abortSignal);
}

// ── Execution ───────────────────────────────────────────────────

export interface ExecutionStatus {
  enabled: boolean;
  profile: string;
  daily_loss_limit: number;
  max_drawdown: number;
  session_kill: boolean;
  consecutive_loss_pause: number;
  instruments: string[];
  today: { trades: number; pnl: number; win_rate: number };
  connection: { broker: string; account: string; platform: string; status: string };
}

export async function fetchExecutionStatus(
  abortSignal?: AbortSignal
): Promise<ExecutionStatus> {
  return apiFetch<ExecutionStatus>("/execution/status", abortSignal);
}

export async function updateExecutionConfig(
  config: Partial<ExecutionStatus>,
  abortSignal?: AbortSignal
): Promise<ExecutionStatus> {
  return apiPost<ExecutionStatus>("/execution/config", config as Record<string, unknown>, abortSignal);
}

// ── Telegram ────────────────────────────────────────────────────

export async function connectTelegram(
  chatId: string,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/telegram/connect", { chat_id: chatId }, abortSignal);
}

export async function disconnectTelegram(
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/telegram/disconnect", {}, abortSignal);
}

export async function testTelegram(
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/telegram/test", {}, abortSignal);
}

// ── Push Notifications ──────────────────────────────────────────

export async function subscribePush(
  subscription: PushSubscriptionJSON,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/push/subscribe", subscription as unknown as Record<string, unknown>, abortSignal);
}

export async function unsubscribePush(
  endpoint: string,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/push/unsubscribe", { endpoint }, abortSignal);
}

export async function fetchVapidKey(): Promise<string> {
  const url = `${API_URL.replace(/\/$/, "")}/push/vapid-key`;
  const res = await fetch(url);
  const data = (await res.json()) as { key: string };
  return data.key;
}

// ── SSE Stream ──────────────────────────────────────────────────

export function createSignalStream(
  onSignal: (data: Record<string, unknown>) => void,
  onMarket?: (data: Record<string, unknown>) => void
): EventSource | null {
  if (!authToken) return null;
  const url = `${API_URL.replace(/\/$/, "")}/stream?token=${encodeURIComponent(authToken)}`;
  const es = new EventSource(url);
  es.addEventListener("signal", (e) => {
    try { onSignal(JSON.parse(e.data)); } catch { /* */ }
  });
  if (onMarket) {
    es.addEventListener("market", (e) => {
      try { onMarket(JSON.parse(e.data)); } catch { /* */ }
    });
  }
  return es;
}

// ── User Settings ───────────────────────────────────────────────

export interface UserSettingsResponse {
  user_id: string;
  account_size: number;
  risk_pct: number;
  instruments: string;
  min_grade: string;
  sessions: string;
  telegram_connected: number;
  telegram_chat_id?: string;
}

export async function fetchUserSettings(
  abortSignal?: AbortSignal
): Promise<UserSettingsResponse> {
  return apiFetch<UserSettingsResponse>("/settings", abortSignal);
}

export async function updateUserSettings(
  settings: Partial<UserSettingsResponse>,
  abortSignal?: AbortSignal
): Promise<UserSettingsResponse> {
  return apiPut<UserSettingsResponse>("/settings", settings as Record<string, unknown>, abortSignal);
}

// ── Public Track Record (no auth) ──────────────────────────────

export interface TrackRecordEquityPoint {
  date: string;
  cumulative_pnl: number;
}

export interface TrackRecordMonthly {
  month: string;
  pnl: number;
  trades: number;
  win_rate: number;
}

export interface TrackRecordInstrument {
  symbol: string;
  win_rate: number;
  pnl: number;
  signals: number;
}

export interface TrackRecordResponse {
  net_pnl: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  max_drawdown: number;
  days_trading: number;
  current_streak: { type: "win" | "loss"; count: number };
  equity_curve: TrackRecordEquityPoint[];
  monthly: TrackRecordMonthly[];
  by_instrument: TrackRecordInstrument[];
  last_updated: string;
}

export async function fetchPublicTrackRecord(
  abortSignal?: AbortSignal
): Promise<TrackRecordResponse> {
  const url = `${API_URL.replace(/\/$/, "")}/public/track-record`;
  const res = await fetch(url, { signal: abortSignal });
  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string };
      code = body.error;
    } catch { /* ignore */ }
    throw new BovynApiError(
      code ?? `track_record_error_${res.status}`,
      res.status,
      code
    );
  }
  return (await res.json()) as TrackRecordResponse;
}

// ── Referral ───────────────────────────────────────────────────

export interface ReferralResponse {
  code: string;
  total_referrals: number;
  credited: number;
  pending: number;
}

export async function fetchReferral(
  abortSignal?: AbortSignal
): Promise<ReferralResponse> {
  return apiFetch<ReferralResponse>("/referral", abortSignal);
}

export async function applyReferralCode(
  code: string,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean; message: string }> {
  return apiPost<{ ok: boolean; message: string }>("/referral/apply", { code }, abortSignal);
}

// ── Admin Analytics ────────────────────────────────────────────

export interface AdminAnalyticsResponse {
  total_users: number;
  active_users: number;
  mrr: number;
  churn_rate: number;
  ltv: number;
  tier_distribution: { tier: string; count: number }[];
  monthly_signups: { month: string; count: number }[];
  recent_signups: { email: string; tier: string; joined_at: string }[];
}

export interface ChurnRiskUser {
  user_id: string;
  email: string;
  tier: string;
  days_since_login: number;
  risk_level: "high" | "medium" | "low";
}

export interface ChurnRiskResponse {
  users: ChurnRiskUser[];
}

export async function fetchAdminAnalytics(
  abortSignal?: AbortSignal
): Promise<AdminAnalyticsResponse> {
  return apiFetch<AdminAnalyticsResponse>("/admin/analytics", abortSignal);
}

export async function fetchChurnRisk(
  abortSignal?: AbortSignal
): Promise<ChurnRiskResponse> {
  return apiFetch<ChurnRiskResponse>("/admin/churn-risk", abortSignal);
}

export async function sendWinback(
  userId: string,
  message: string,
  abortSignal?: AbortSignal
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/admin/winback", { user_id: userId, message }, abortSignal);
}

// ── Fractal Engine (shadow-mode snapshots) ─────────────────────
import type { FractalResponse, FractalTimeframe } from "../types/fractal";

/**
 * Fetch the latest BOVYN Fractal Engine snapshot for a symbol/TF.
 *
 * Reads the `shadow_fractal` table written by the bot's pipeline on every
 * bar close (when FRACTAL_ICT_SHADOW=1). Safe to poll at 5–10s intervals.
 */
export async function fetchFractal(
  symbol: string,
  timeframe: FractalTimeframe = "5m",
  abortSignal?: AbortSignal
): Promise<FractalResponse> {
  const q = `symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(timeframe)}`;
  return apiFetch<FractalResponse>(`/fractal?${q}`, abortSignal);
}
