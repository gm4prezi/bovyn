import { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string;        // e.g. "CAPITALCOM:NAS100" or "CME_MINI:NQ1!"
  theme?: "dark" | "light";
  interval?: string;     // "5", "15", "60", "D"
}

// Map BOVYN symbols to free TradingView ETF proxies (no subscription required)
const TV_SYMBOL_MAP: Record<string, string> = {
  NQ:  "NASDAQ:QQQ",  // Invesco QQQ Trust — tracks Nasdaq 100
  ES:  "AMEX:SPY",    // SPDR S&P 500 ETF
  GC:  "AMEX:GLD",    // SPDR Gold Shares
  CL:  "AMEX:USO",    // United States Oil ETF
  SI:  "AMEX:SLV",    // iShares Silver Trust
  RTY: "AMEX:IWM",    // iShares Russell 2000 ETF
  YM:  "AMEX:DIA",    // SPDR Dow Jones Industrial Average ETF
};

export function TradingViewWidget({ symbol, theme = "dark", interval = "5" }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const tvSymbol = TV_SYMBOL_MAP[symbol] ?? "NASDAQ:QQQ";

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval,
      timezone: "America/New_York",
      theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
      container_id: "bovyn_tv_chart",
      studies: [
        "VWAP@tv-basicstudies",
        "Volume@tv-basicstudies",
      ],
      overrides: {
        "paneProperties.background": "#0d0d0f",
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.03)",
        "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.03)",
        "scalesProperties.textColor": "#6b7280",
        "mainSeriesProperties.candleStyle.upColor": "#22c55e",
        "mainSeriesProperties.candleStyle.downColor": "#ef4444",
        "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
        "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
      },
    });

    containerRef.current.appendChild(script);
    scriptRef.current = script;

    return () => {
      script.remove();
    };
  }, [tvSymbol, interval, theme]);

  return (
    <div
      id="bovyn_tv_chart"
      ref={containerRef}
      className="tradingview-widget-container w-full h-full"
      style={{ minHeight: "100%" }}
    />
  );
}
