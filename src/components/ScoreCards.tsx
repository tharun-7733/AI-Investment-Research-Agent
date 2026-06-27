"use client";

interface ScoreCardsProps {
  growth?: number;
  moat?: number;
  financialHealth?: number;
  sentiment?: number;
  valuation?: number;
}

const SCORE_DEFS = [
  { key: "growth",          label: "Growth",          weight: "25%", color: "#00E5A0" },
  { key: "moat",            label: "Moat",            weight: "20%", color: "#5EA8FF" },
  { key: "financialHealth", label: "Financial Health", weight: "25%", color: "#00E5A0" },
  { key: "sentiment",       label: "Sentiment",       weight: "15%", color: "#F5C842" },
  { key: "valuation",       label: "Valuation",       weight: "15%", color: "#5EA8FF" },
];

export function ScoreCards({
  growth,
  moat,
  financialHealth,
  sentiment,
  valuation,
}: ScoreCardsProps) {
  const scores: Record<string, number | undefined> = {
    growth, moat, financialHealth, sentiment, valuation,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "12px",
      }}
    >
      {SCORE_DEFS.map((def, i) => {
        const score = scores[def.key];
        const pct = score != null ? (score / 10) * 100 : 0;
        const animDelay = i * 80;

        return (
          <div
            key={def.key}
            className="glass glass-hover animate-fade-up"
            style={{
              borderRadius: "16px",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              animationDelay: `${animDelay}ms`,
              opacity: 0,
            }}
          >
            {/* Label */}
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#fff",
                  marginBottom: "2px",
                }}
              >
                {def.label}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "9px",
                  color: "#606880",
                  letterSpacing: "0.08em",
                }}
              >
                WEIGHT {def.weight}
              </div>
            </div>

            {/* Score display */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "36px",
                  color: score != null ? def.color : "#606880",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  transition: "color 0.5s ease",
                }}
              >
                {score != null ? score.toFixed(0) : "—"}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  color: "#606880",
                  marginBottom: "5px",
                }}
              >
                /10
              </span>
            </div>

            {/* Progress arc */}
            <div
              style={{
                height: "3px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: def.color,
                  borderRadius: "999px",
                  transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: score != null ? `0 0 6px ${def.color}88` : "none",
                }}
              />
            </div>

            {/* Rating label */}
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "9px",
                color: score == null
                  ? "#606880"
                  : score >= 8
                  ? "#00E5A0"
                  : score >= 6
                  ? "#F5C842"
                  : "#FF5A6A",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {score == null
                ? "PENDING"
                : score >= 8
                ? "STRONG"
                : score >= 6
                ? "MODERATE"
                : score >= 4
                ? "WEAK"
                : "POOR"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
