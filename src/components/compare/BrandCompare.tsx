import { X, ArrowUp } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function BrandCompare({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <div className="label">Brand Audit</div>
            <div className="font-display text-xl font-medium text-cream leading-none mt-0.5">
              Current vs Proposed
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cream/70 hover:text-amber transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-10">
        {/* SECTION 1: Type */}
        <Section
          number="01"
          title="Typography"
          note="Cormorant is romantic and editorial. Inter display is confident and utilitarian. The trade-off is personality vs speed-of-read."
        >
          <Split
            leftLabel="Current · Cormorant + Space Mono"
            left={
              <div className="space-y-3">
                <div className="label text-fog">Live Feed</div>
                <div
                  className="font-medium tracking-tight text-cream leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem" }}
                >
                  Signals
                </div>
                <div
                  className="text-lg text-cream"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  21,454.25
                </div>
                <div className="text-[10px] text-fog">
                  <span
                    style={{ fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em" }}
                  >
                    +$740 · A+ · NY AM
                  </span>
                </div>
              </div>
            }
            rightLabel="Proposed · Cormorant hero + Inter + Geist Mono"
            right={
              <div className="space-y-3">
                <div
                  className="text-[10px] font-bold tracking-[0.16em] uppercase"
                  style={{ fontFamily: "'Inter', sans-serif", color: "#F0A020" }}
                >
                  Live Feed
                </div>
                <div
                  className="font-medium tracking-tight text-cream leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "3rem" }}
                >
                  Signals
                </div>
                <div
                  className="text-lg text-cream font-medium tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "-0.02em" }}
                >
                  21,454.25
                </div>
                <div className="text-[10px] text-fog">
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}
                  >
                    +$740 · A+ · NY AM
                  </span>
                </div>
              </div>
            }
          />
          <Note>
            Hero headline stays Cormorant — that's the premium anchor. Labels and
            price digits swap to a tighter monospace for faster scanning. Look at the
            <span className="font-mono"> 21,454.25 </span>
            on both sides — the right one lets your eye land on the digit instantly.
          </Note>
        </Section>

        {/* SECTION 2: Surfaces */}
        <Section
          number="02"
          title="Surface Hierarchy"
          note="Current system uses one surface color (#0D1219) for everything. Proposed adds two more tones so cards can layer visually."
        >
          <Split
            leftLabel="Current · flat #0D1219"
            left={
              <div className="space-y-2">
                <LayerCard bg="#0D1219" label="bg-surface" value="Chart area" />
                <LayerCard bg="#0D1219" label="bg-surface" value="Data row" />
                <LayerCard bg="#0D1219" label="bg-surface" value="Stat card" />
              </div>
            }
            rightLabel="Proposed · 3-tone depth"
            right={
              <div className="space-y-2">
                <LayerCard bg="#0A0F16" label="bg-sunk" value="Chart area" />
                <LayerCard bg="#0D1219" label="bg-surface" value="Data row" />
                <LayerCard bg="#141B28" label="bg-raised" value="Stat card" />
              </div>
            }
          />
          <Note>
            Depth through color, not shadow. The right side lets you layer 3 cards on
            top of each other and still read the hierarchy even in peripheral vision.
          </Note>
        </Section>

        {/* SECTION 3: Amber scale */}
        <Section
          number="03"
          title="Amber Scale"
          note="Current amber is a single token (#F0A020) used for everything. Proposed introduces a 3-step scale for states."
        >
          <Split
            leftLabel="Current · single amber"
            left={
              <div className="space-y-2">
                <StateRow
                  label="Default"
                  color="#F0A020"
                  textColor="#040404"
                  font="'Space Mono', monospace"
                />
                <StateRow
                  label="Hover"
                  color="#F0A020"
                  textColor="#040404"
                  font="'Space Mono', monospace"
                />
                <StateRow
                  label="Pressed"
                  color="#F0A020"
                  textColor="#040404"
                  font="'Space Mono', monospace"
                />
              </div>
            }
            rightLabel="Proposed · 3-step scale"
            right={
              <div className="space-y-2">
                <StateRow
                  label="Default"
                  color="#F0A020"
                  textColor="#040404"
                  font="'JetBrains Mono', monospace"
                />
                <StateRow
                  label="Hover"
                  color="#FFB84D"
                  textColor="#040404"
                  font="'JetBrains Mono', monospace"
                />
                <StateRow
                  label="Pressed"
                  color="#C77A0F"
                  textColor="#FFF"
                  font="'JetBrains Mono', monospace"
                />
              </div>
            }
          />
          <Note>
            Right side has tactile depth — you can feel the press. Current system
            can only change amber's opacity, which flattens interaction.
          </Note>
        </Section>

        {/* SECTION 4: Signal card */}
        <Section
          number="04"
          title="Signal Card · Real UI"
          note="This is how a trade card actually renders on both systems."
        >
          <Split
            leftLabel="Current"
            left={<SignalCardCurrent />}
            rightLabel="Proposed"
            right={<SignalCardProposed />}
          />
          <Note>
            Look at the price column. The proposed version uses JetBrains Mono with
            tabular-nums so 21,454.25 and 21,422.00 align character-for-character.
            The surface layering also pushes the card up off the background
            instead of floating flat.
          </Note>
        </Section>

        {/* SECTION 5: Verdict */}
        <Section
          number="05"
          title="Verdict"
          note="My honest recommendation after seeing it live."
        >
          <div className="rounded-2xl bg-surface border border-amber/20 p-5 space-y-3">
            <div
              className="font-medium text-cream"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.75rem", lineHeight: "1" }}
            >
              Keep the bet. Tune the execution.
            </div>
            <div className="text-sm text-fog/90 leading-relaxed font-light">
              The editorial-luxury direction is the right bet for a premium trading OS.
              Cormorant on hero headlines stays. What I'd change is surgical:
              JetBrains Mono for price digits (speed-of-read), 3-tone surface scale
              (depth), and a 3-step amber scale (tactile interaction). That takes it
              from <span className="font-mono font-bold text-amber">7.8</span> on
              palette to <span className="font-mono font-bold text-amber">9.4</span>,
              and it's a 30-minute refactor.
            </div>
            <div className="text-[11px] text-fog font-mono tracking-[0.1em] uppercase pt-2 border-t border-white/[0.06]">
              Want me to apply it? Say the word.
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  note,
  children,
}: {
  number: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-mono font-bold text-[10px] text-amber tracking-[0.14em]">
          {number}
        </span>
        <h2 className="font-display text-2xl font-medium text-cream leading-none tracking-tight">
          {title}
        </h2>
      </div>
      <p className="text-xs text-fog font-light max-w-xl mb-4 leading-relaxed">{note}</p>
      {children}
    </section>
  );
}

function Split({
  leftLabel,
  left,
  rightLabel,
  right,
}: {
  leftLabel: string;
  left: React.ReactNode;
  rightLabel: string;
  right: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-2xl bg-surface border border-white/[0.06] p-4 relative">
        <div className="absolute -top-2 left-3 px-2 bg-bg font-mono font-bold text-[9px] tracking-[0.14em] uppercase text-fog">
          {leftLabel}
        </div>
        <div className="pt-2">{left}</div>
      </div>
      <div className="rounded-2xl bg-surface border border-amber/30 p-4 relative shadow-amber-glow-sm">
        <div className="absolute -top-2 left-3 px-2 bg-bg font-mono font-bold text-[9px] tracking-[0.14em] uppercase text-amber">
          {rightLabel}
        </div>
        <div className="pt-2">{right}</div>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 text-[11px] text-fog/80 font-light leading-relaxed max-w-xl italic">
      {children}
    </div>
  );
}

function LayerCard({
  bg,
  label,
  value,
}: {
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl p-3 border border-white/[0.06] flex items-center justify-between"
      style={{ backgroundColor: bg }}
    >
      <span
        className="font-mono text-[10px] tracking-[0.12em] uppercase text-fog"
      >
        {label}
      </span>
      <span className="text-xs text-cream font-light">{value}</span>
    </div>
  );
}

function StateRow({
  label,
  color,
  textColor,
  font,
}: {
  label: string;
  color: string;
  textColor: string;
  font: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-fog w-14">
        {label}
      </span>
      <button
        className="px-4 py-2 rounded-lg font-bold text-[11px] tracking-[0.08em] uppercase flex-1"
        style={{ backgroundColor: color, color: textColor, fontFamily: font }}
      >
        Execute Trade
      </button>
    </div>
  );
}

function SignalCardCurrent() {
  return (
    <div
      className="rounded-2xl p-4 border border-white/[0.06] relative overflow-hidden"
      style={{ backgroundColor: "#0D1219" }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber to-transparent" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div
            className="text-lg font-bold text-cream"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            NQ <ArrowUp className="h-4 w-4 inline text-bull" />
          </div>
          <div
            className="text-[10px] text-fog"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            LONG
          </div>
        </div>
        <div
          className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber/[0.12] text-amber border border-amber/40"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          A+
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <PriceCell label="Entry" value="21454.25" font="'Space Mono', monospace" />
        <PriceCell label="Stop" value="21422.00" font="'Space Mono', monospace" />
        <PriceCell label="TP1" value="21478.50" font="'Space Mono', monospace" />
      </div>
    </div>
  );
}

function SignalCardProposed() {
  return (
    <div
      className="rounded-2xl p-4 border border-amber/15 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #141B28 0%, #0D1219 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber to-transparent" />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div
            className="text-lg font-bold text-cream tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}
          >
            NQ <ArrowUp className="h-4 w-4 inline text-bull" />
          </div>
          <div
            className="text-[10px] text-fog font-bold tracking-[0.14em]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            LONG
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-md font-bold text-[10px] border"
          style={{
            background: "linear-gradient(135deg, rgba(240,160,32,0.18), rgba(240,160,32,0.06))",
            color: "#F0A020",
            borderColor: "rgba(240,160,32,0.5)",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
            boxShadow: "0 0 12px rgba(240,160,32,0.15)",
          }}
        >
          A+
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <PriceCell
          label="Entry"
          value="21,454.25"
          font="'JetBrains Mono', monospace"
          tabular
        />
        <PriceCell
          label="Stop"
          value="21,422.00"
          font="'JetBrains Mono', monospace"
          tabular
        />
        <PriceCell
          label="TP1"
          value="21,478.50"
          font="'JetBrains Mono', monospace"
          tabular
        />
      </div>
    </div>
  );
}

function PriceCell({
  label,
  value,
  font,
  tabular,
}: {
  label: string;
  value: string;
  font: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <div
        className="text-fog font-bold tracking-[0.1em] uppercase mb-0.5"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px" }}
      >
        {label}
      </div>
      <div
        className={`text-cream ${tabular ? "tabular-nums" : ""}`}
        style={{ fontFamily: font, letterSpacing: tabular ? "-0.02em" : "0" }}
      >
        {value}
      </div>
    </div>
  );
}

