"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AgentState } from "@/lib/types";

interface IntelligenceReportProps {
  result: AgentState;
  onNewSearch: () => void;
  logs: string[];
}

// Map verdict to display label + colors
function getVerdictDisplay(verdict?: string) {
  switch (verdict) {
    case "INVEST":
      return { label: "STRONG BUY", color: "#a8cfbd", bg: "rgba(168, 207, 189, 0.1)", border: "rgba(168, 207, 189, 0.3)" };
    case "WATCH":
      return { label: "HOLD", color: "#dac769", bg: "rgba(218, 199, 105, 0.1)", border: "rgba(218, 199, 105, 0.3)" };
    case "PASS":
      return { label: "UNDERPERFORM", color: "#ffb4ab", bg: "rgba(255, 180, 171, 0.1)", border: "rgba(255, 180, 171, 0.3)" };
    default:
      return { label: "REVIEWING", color: "#c6c6cb", bg: "rgba(198, 198, 203, 0.1)", border: "rgba(198, 198, 203, 0.3)" };
  }
}

// Format financial values for display
function formatMetric(val?: string | number | null, suffix = ""): string {
  if (val === null || val === undefined) return "N/A";
  const s = String(val);
  if (s === "null" || s === "") return "N/A";
  if (suffix) return `${s}${suffix}`;
  return s;
}

export function IntelligenceReport({ result, onNewSearch, logs }: IntelligenceReportProps) {
  const [showFullReport, setShowFullReport] = useState(false);

  const info = result.companyInfo ?? {};
  const fin = result.financialAnalysis ?? {};
  const comp = result.competitiveAnalysis ?? {};
  const synth = result.synthesis ?? {};
  const scores = result.scores ?? {};
  const web = result.webAnalysis ?? {};

  const displayName = info.name ?? result.companyInput ?? "Unknown Company";
  const ticker = info.ticker;
  const exchange = info.exchange;
  const sector = info.sector ?? info.industry ?? "—";
  const verdict = getVerdictDisplay(result.verdict);
  const score = scores.weightedTotal ?? 0;

  // Derive alpha drivers from strengths (first 2) + web tailwinds
  const strengthsRaw = synth.keyStrengths ?? [];
  const alphaPairs: { title: string; desc: string }[] = strengthsRaw.slice(0, 2).map((s) => {
    const [first, ...rest] = s.split(":");
    return rest.length
      ? { title: first.trim(), desc: rest.join(":").trim() }
      : { title: "Key Strength", desc: s };
  });
  // pad to 2 if we only have 1
  if (alphaPairs.length < 2 && web.tailwinds?.length) {
    const tw = web.tailwinds[0];
    const [first, ...rest] = tw.split(":");
    alphaPairs.push({ title: first.trim(), desc: rest.join(":").trim() || tw });
  }

  // Key metrics rows
  const metrics: { label: string; value: string }[] = [
    { label: "Revenue Growth YoY", value: formatMetric(fin.revenueGrowthYoY) },
    { label: "Gross Margin", value: formatMetric(fin.grossMargin) },
    { label: "Net Margin", value: formatMetric(fin.netMargin) },
    { label: "Market Cap", value: formatMetric(fin.marketCap) },
    { label: "P/E Ratio", value: formatMetric(fin.peRatio, "x") },
    { label: "Debt / Equity", value: formatMetric(fin.debtToEquity, "x") },
    { label: "Financial Health", value: `${fin.financialHealthScore ?? "N/A"} / 10` },
    { label: "Valuation Risk", value: formatMetric(fin.valuationRisk) },
  ].filter((m) => m.value !== "N/A");

  const risks = synth.keyRisks ?? comp.threats ?? [];

  // Build SVG path from scores for decorative chart
  const scoreValues = [
    scores.sentiment ?? 5,
    scores.financialHealth ?? 5,
    scores.growth ?? 5,
    scores.moat ?? 5,
    scores.valuation ?? 5,
  ];
  const svgPoints = scoreValues.map((v, i) => {
    const x = (i / (scoreValues.length - 1)) * 100;
    const y = 100 - (v / 10) * 90;
    return `${x},${y}`;
  });
  const svgArea = `M0,${100 - (scoreValues[0] / 10) * 90} ` + svgPoints.slice(1).map((p, i) => `L${p}`).join(" ") + ` L100,100 L0,100 Z`;
  const svgLine = `0,${100 - (scoreValues[0] / 10) * 90} ` + svgPoints.slice(1).join(" ");

  const baseCaseScore = score >= 7 ? "Strong" : score >= 5.5 ? "Neutral" : "Cautious";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0C10", display: "flex", flexDirection: "column" }}>
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px",
          background: "rgba(18, 20, 20, 0.85)",
          backdropFilter: "blur(16px) saturate(160%)",
          WebkitBackdropFilter: "blur(16px) saturate(160%)",
          borderBottom: "1px solid rgba(69, 71, 75, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "-0.01em",
              color: "#e2e2e2",
            }}
          >
            EQUITY ANALYTICA
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {(["Terminal", "Intelligence", "Portfolio", "Settings"] as const).map((link) => (
              <a
                key={link}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (link === "Terminal") onNewSearch();
                }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: link === "Intelligence" ? "#c6c6cc" : "#c6c6cb",
                  textDecoration: "none",
                  padding: "4px 8px",
                  borderBottom: link === "Intelligence" ? "2px solid #dac769" : "2px solid transparent",
                  paddingBottom: link === "Intelligence" ? "2px" : "4px",
                  transition: "color 0.2s ease",
                  cursor: "pointer",
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: "#909095",
                pointerEvents: "none",
                fontVariationSettings: "'FILL' 0",
              }}
            >
              search
            </span>
            <input
              placeholder="Search entity or ticker..."
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#dac769";
                e.currentTarget.style.boxShadow = "0 0 0 1px #dac769";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(69,71,75,0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
              style={{
                background: "#0c0f0f",
                border: "1px solid rgba(69,71,75,0.3)",
                borderRadius: "2px",
                padding: "6px 12px 6px 36px",
                width: "240px",
                color: "#e2e2e2",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "0.08em",
                outline: "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            />
          </div>

          {/* Icons */}
          {["notifications", "account_circle", "logout"].map((icon) => (
            <button
              key={icon}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "#c6c6cb",
                borderRadius: "50%",
                display: "flex",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "rgba(40,42,43,0.5)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "none")
              }
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}
              >
                {icon}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main
        style={{
          flexGrow: 1,
          paddingTop: "128px",
          paddingBottom: "96px",
          paddingLeft: "64px",
          paddingRight: "64px",
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* ── Header ── */}
        <header style={{ marginBottom: "64px" }}>
          {/* Breadcrumb row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            {ticker && (
              <>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 500,
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                    color: "#c6c6cb",
                    textTransform: "uppercase",
                  }}
                >
                  {exchange ? `${exchange}: ${ticker}` : ticker}
                </span>
                <div style={{ width: "1px", height: "16px", background: "rgba(69,71,75,0.4)" }} />
              </>
            )}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#909095",
              }}
            >
              {sector}
            </span>
            <div style={{ width: "1px", height: "16px", background: "rgba(69,71,75,0.4)" }} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#909095",
              }}
            >
              {info.country ?? "Global"}
            </span>
            {fin.estimated && (
              <>
                <div style={{ width: "1px", height: "16px", background: "rgba(69,71,75,0.4)" }} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#dac769",
                  }}
                >
                  Estimated data
                </span>
              </>
            )}
          </div>

          {/* Company name + verdict + actions */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              borderBottom: "0.5px solid rgba(69,71,75,0.3)",
              paddingBottom: "32px",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: "clamp(36px, 4vw, 52px)",
                  lineHeight: "56px",
                  letterSpacing: "-0.02em",
                  color: "#e2e2e2",
                  margin: "0 0 12px 0",
                }}
              >
                {displayName}
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                {/* Weighted score as "price" equivalent */}
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "32px",
                    lineHeight: "40px",
                    color: "#e2e2e2",
                  }}
                >
                  {score.toFixed(1)} / 10
                </span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#a8cfbd",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "16px",
                        fontVariationSettings: "'FILL' 0",
                        color: score >= 5.5 ? "#a8cfbd" : "#ffb4ab",
                      }}
                    >
                      {score >= 5.5 ? "arrow_upward" : "arrow_downward"}
                    </span>
                    Confidence: {result.confidence ?? 0}%
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#909095",
                    }}
                  >
                    {result.timeHorizon ?? "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: verdict badge + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* Verdict pill */}
              <div
                style={{
                  background: verdict.bg,
                  border: `1px solid ${verdict.border}`,
                  padding: "8px 16px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: verdict.color,
                    animation: "pulse-dot 2s infinite",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: verdict.color,
                  }}
                >
                  {verdict.label}
                </span>
              </div>

              {/* New Search */}
              <button
                onClick={onNewSearch}
                style={{
                  background: "#dac769",
                  color: "#0A0C10",
                  border: "none",
                  padding: "10px 24px",
                  borderRadius: "2px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "#c5b358")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "#dac769")
                }
              >
                New Search
              </button>

              {/* Download report */}
              <button
                onClick={() => setShowFullReport(true)}
                style={{
                  border: "1px solid rgba(69,71,75,0.3)",
                  background: "none",
                  color: "#e2e2e2",
                  padding: "10px 14px",
                  borderRadius: "2px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "rgba(51,53,53,0.5)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background = "none")
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
                >
                  article
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Bento Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: "24px",
          }}
        >
          {/* Left 8 cols */}
          <div
            style={{
              gridColumn: "span 8",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Executive Synthesis */}
            <section
              style={{
                background: "#161B22",
                border: "0.5px solid rgba(69,71,75,0.3)",
                borderRadius: "2px",
                padding: "32px",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: "24px",
                  lineHeight: "32px",
                  color: "#e2e2e2",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#dac769", fontSize: "22px", fontVariationSettings: "'FILL' 0" }}
                >
                  menu_book
                </span>
                Executive Synthesis
              </h2>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "18px",
                  lineHeight: "28px",
                  fontWeight: 400,
                  color: "#c6c6cb",
                }}
              >
                {result.investThesis ||
                  result.headline ||
                  synth.growthRationale ||
                  "Analysis complete. See report below for full details."}
              </p>

              {/* Headline quote */}
              {result.headline && result.investThesis && (
                <blockquote
                  style={{
                    marginTop: "24px",
                    padding: "16px 20px",
                    borderLeft: "3px solid #dac769",
                    background: "rgba(218,199,105,0.06)",
                    borderRadius: "0 2px 2px 0",
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: "16px",
                    color: "#e2e2e2",
                  }}
                >
                  {result.headline}
                </blockquote>
              )}
            </section>

            {/* Key Alpha Drivers */}
            <section
              style={{
                background: "#161B22",
                border: "0.5px solid rgba(69,71,75,0.3)",
                borderRadius: "2px",
                padding: "32px",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: "24px",
                  lineHeight: "32px",
                  color: "#e2e2e2",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#dac769", fontSize: "22px", fontVariationSettings: "'FILL' 0" }}
                >
                  trending_up
                </span>
                Key Alpha Drivers
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "16px",
                }}
              >
                {/* If we have real strengths, use them; otherwise show rationales */}
                {(strengthsRaw.length > 0
                  ? strengthsRaw.slice(0, 4)
                  : [
                      synth.growthRationale,
                      synth.moatRationale,
                      synth.financialHealthRationale,
                      synth.sentimentRationale,
                    ].filter(Boolean)
                ).map((item, i) => {
                  const titles = ["Growth", "Competitive Moat", "Financial Health", "Sentiment"];
                  return (
                    <div
                      key={i}
                      style={{
                        border: "1px solid rgba(69,71,75,0.2)",
                        padding: "24px",
                        borderRadius: "2px",
                        background: "rgba(30,32,32,0.5)",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                          fontSize: "12px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#c6c6cc",
                          marginBottom: "12px",
                        }}
                      >
                        {strengthsRaw.length > 0 ? `Driver ${i + 1}` : titles[i]}
                      </h3>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "15px",
                          lineHeight: "22px",
                          color: "#c6c6cb",
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Comparable To */}
              {result.comparableTo && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px 20px",
                    background: "rgba(198,198,204,0.04)",
                    border: "1px solid rgba(69,71,75,0.2)",
                    borderRadius: "2px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    color: "#909095",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px", color: "#dac769", flexShrink: 0, marginTop: "1px", fontVariationSettings: "'FILL' 0" }}
                  >
                    compare
                  </span>
                  <span>{result.comparableTo}</span>
                </div>
              )}
            </section>

            {/* Score Visualization */}
            <section
              style={{
                background: "#161B22",
                border: "0.5px solid rgba(69,71,75,0.3)",
                borderRadius: "2px",
                padding: "32px",
                position: "relative",
                overflow: "hidden",
                height: "360px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    fontSize: "24px",
                    color: "#e2e2e2",
                  }}
                >
                  Score Profile
                </h2>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 500,
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                    color: "#c6c6cb",
                  }}
                >
                  {baseCaseScore} Case: {score.toFixed(1)} / 10
                </span>
              </div>

              {/* Score bars */}
              <div
                style={{
                  position: "relative",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[
                  { label: "Growth", value: scores.growth ?? 5, weight: "25%" },
                  { label: "Fin. Health", value: scores.financialHealth ?? 5, weight: "25%" },
                  { label: "Moat", value: scores.moat ?? 5, weight: "20%" },
                  { label: "Sentiment", value: scores.sentiment ?? 5, weight: "15%" },
                  { label: "Valuation", value: scores.valuation ?? 5, weight: "15%" },
                ].map(({ label, value, weight }) => (
                  <ScoreBar key={label} label={label} value={value} weight={weight} />
                ))}
              </div>

              {/* Decorative SVG background */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  top: "80px",
                  left: "32px",
                  right: "32px",
                  bottom: "32px",
                  opacity: 0.06,
                  pointerEvents: "none",
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="score-grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#dac769" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#dac769" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={svgArea} fill="url(#score-grad)" />
                  <polyline
                    fill="none"
                    points={svgLine}
                    stroke="#dac769"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </section>
          </div>

          {/* Right 4 cols */}
          <div
            style={{
              gridColumn: "span 4",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Key Metrics */}
            <section
              style={{
                background: "#161B22",
                border: "0.5px solid rgba(69,71,75,0.3)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "24px",
                  borderBottom: "0.5px solid rgba(69,71,75,0.3)",
                  background: "rgba(30,32,32,0.3)",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    fontSize: "24px",
                    lineHeight: "32px",
                    color: "#e2e2e2",
                  }}
                >
                  Key Metrics
                </h2>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#909095",
                    marginTop: "4px",
                  }}
                >
                  {fin.estimated ? "Estimated via AI" : "Source: Financial data"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {metrics.map(({ label, value }, i) => (
                  <MetricRow key={label} label={label} value={value} isLast={i === metrics.length - 1} />
                ))}
                {metrics.length === 0 && (
                  <div
                    style={{
                      padding: "24px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      color: "#909095",
                      textAlign: "center",
                    }}
                  >
                    Financial data unavailable
                  </div>
                )}
              </div>
            </section>

            {/* Competitive Position */}
            {(comp.moatType || comp.marketPosition) && (
              <section
                style={{
                  background: "#161B22",
                  border: "0.5px solid rgba(69,71,75,0.3)",
                  borderRadius: "2px",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    fontSize: "22px",
                    color: "#e2e2e2",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#dac769", fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
                  >
                    hub
                  </span>
                  Competitive Edge
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {comp.marketPosition && (
                    <MetricRow label="Market Position" value={comp.marketPosition.toUpperCase()} />
                  )}
                  {comp.moatType && comp.moatType !== "none" && (
                    <MetricRow label="Moat Type" value={comp.moatType.replace("_", " ").toUpperCase()} />
                  )}
                  {comp.moatStrength && (
                    <MetricRow label="Moat Strength" value={`${comp.moatStrength} / 10`} />
                  )}
                  {comp.marketSizeTAM && (
                    <MetricRow label="Market TAM" value={comp.marketSizeTAM} isLast />
                  )}
                </div>

                {comp.mainCompetitors && comp.mainCompetitors.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#909095",
                        marginBottom: "8px",
                      }}
                    >
                      Main Competitors
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {comp.mainCompetitors.slice(0, 5).map((c) => (
                        <span
                          key={c}
                          style={{
                            padding: "3px 10px",
                            background: "rgba(69,71,75,0.2)",
                            border: "1px solid rgba(69,71,75,0.3)",
                            borderRadius: "2px",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "11px",
                            color: "#c6c6cb",
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Counter-Thesis / Risks */}
            {risks.length > 0 && (
              <section
                style={{
                  background: "#161B22",
                  border: "0.5px solid rgba(69,71,75,0.3)",
                  borderRadius: "2px",
                  padding: "32px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    fontSize: "22px",
                    color: "#e2e2e2",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#ffb4ab", fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
                  >
                    warning
                  </span>
                  Counter-Thesis
                </h2>
                <ul
                  style={{
                    listStyle: "disc",
                    paddingLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {risks.map((risk, i) => (
                    <li
                      key={i}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "15px",
                        lineHeight: "22px",
                        color: "#c6c6cb",
                      }}
                    >
                      {risk}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Watch For */}
            {result.watchFor && result.watchFor.length > 0 && (
              <section
                style={{
                  background: "#161B22",
                  border: "0.5px solid rgba(69,71,75,0.3)",
                  borderRadius: "2px",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    fontSize: "20px",
                    color: "#e2e2e2",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#dac769", fontSize: "18px", fontVariationSettings: "'FILL' 0" }}
                  >
                    radar
                  </span>
                  Watch For
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.watchFor.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        color: "#c6c6cb",
                      }}
                    >
                      <span
                        style={{
                          color: "#dac769",
                          flexShrink: 0,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        →
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Full Report Section ─────────────────────────────────────────── */}
        {result.report && (
          <div style={{ marginTop: "48px" }}>
            {/* Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 600,
                    fontSize: "24px",
                    color: "#e2e2e2",
                  }}
                >
                  Full Intelligence Report
                </h2>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    color: "#909095",
                    marginTop: "4px",
                  }}
                >
                  AI-generated investment brief
                </p>
              </div>
              <button
                onClick={() => setShowFullReport(!showFullReport)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  border: "1px solid rgba(69,71,75,0.3)",
                  background: "none",
                  color: "#e2e2e2",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "2px",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(51,53,53,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#dac769";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(69,71,75,0.3)";
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", fontVariationSettings: "'FILL' 0" }}
                >
                  {showFullReport ? "expand_less" : "expand_more"}
                </span>
                {showFullReport ? "Hide Report" : "Show Full Report"}
              </button>
            </div>

            {showFullReport && (
              <div
                className="report-prose animate-fade-in"
                style={{
                  background: "#161B22",
                  border: "0.5px solid rgba(69,71,75,0.3)",
                  borderRadius: "2px",
                  padding: "40px 48px",
                }}
              >
                <ReactMarkdown>{result.report}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        style={{
          width: "100%",
          padding: "64px 64px",
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          background: "#0c0f0f",
          borderTop: "1px solid rgba(69,71,75,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "32px",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: "20px",
              color: "#e2e2e2",
            }}
          >
            EQUITY ANALYTICA
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service", "Disclosures", "Methodology"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(198,198,203,0.7)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "#dac769")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(198,198,203,0.7)")
                }
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "#c6c6cb",
          }}
        >
          © 2024 Equity Analytica. Institutional Grade Intelligence. Member FINRA/SIPC.
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const pct = (value / 10) * 100;
  const color = value >= 7 ? "#a8cfbd" : value >= 5 ? "#dac769" : "#ffb4ab";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: "90px",
          flexShrink: 0,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: "12px",
          letterSpacing: "0.04em",
          color: "#c6c6cb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: "10px", color: "#909095" }}>{weight}</span>
      </div>

      <div
        style={{
          flex: 1,
          height: "4px",
          background: "rgba(69,71,75,0.3)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "999px",
            boxShadow: `0 0 6px ${color}60`,
            transition: "width 0.8s ease",
          }}
        />
      </div>

      <div
        style={{
          width: "36px",
          flexShrink: 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          fontSize: "13px",
          color,
          textAlign: "right",
        }}
      >
        {value.toFixed(1)}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 24px",
        borderBottom: isLast ? "none" : "0.5px solid rgba(69,71,75,0.2)",
        transition: "background 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "rgba(40,42,43,0.3)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "none")
      }
    >
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "15px",
          lineHeight: "22px",
          color: "#c6c6cb",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          fontSize: "14px",
          letterSpacing: "-0.01em",
          color: "#e2e2e2",
        }}
      >
        {value}
      </span>
    </div>
  );
}
