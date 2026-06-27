"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VerdictCardProps {
  companyName?: string;
  verdict?: "INVEST" | "WATCH" | "PASS";
  confidence?: number;
  headline?: string;
  timeHorizon?: string;
  weightedTotal?: number;
}

const VERDICT_CONFIG = {
  INVEST: {
    color: "#00E5A0",
    bg: "rgba(0, 229, 160, 0.06)",
    border: "rgba(0, 229, 160, 0.18)",
    glow: "rgba(0, 229, 160, 0.12)",
    icon: TrendingUp,
    label: "INVEST",
  },
  WATCH: {
    color: "#F5C842",
    bg: "rgba(245, 200, 66, 0.06)",
    border: "rgba(245, 200, 66, 0.18)",
    glow: "rgba(245, 200, 66, 0.12)",
    icon: Minus,
    label: "WATCH",
  },
  PASS: {
    color: "#FF5A6A",
    bg: "rgba(255, 90, 106, 0.06)",
    border: "rgba(255, 90, 106, 0.18)",
    glow: "rgba(255, 90, 106, 0.12)",
    icon: TrendingDown,
    label: "PASS",
  },
};

export function VerdictCard({
  companyName,
  verdict,
  confidence,
  headline,
  timeHorizon,
  weightedTotal,
}: VerdictCardProps) {
  const cfg = verdict ? VERDICT_CONFIG[verdict] : null;
  const Icon = cfg?.icon;

  return (
    <div
      className="animate-scale-in glass"
      style={{
        borderRadius: "20px",
        padding: "32px",
        position: "relative",
        overflow: "hidden",
        background: cfg ? cfg.bg : "rgba(12, 18, 36, 0.85)",
        borderLeft: cfg ? `3px solid ${cfg.color}` : "3px solid rgba(255,255,255,0.07)",
        boxShadow: cfg ? `0 0 60px ${cfg.glow}, 0 20px 40px rgba(0,0,0,0.3)` : "0 20px 40px rgba(0,0,0,0.3)",
        transition: "all 0.5s ease",
      }}
    >
      {/* Background glow orb */}
      {cfg && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Company name & signal label */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.12em",
            color: "#606880",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Investment Signal
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "22px",
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          {companyName || "—"}
        </div>
      </div>

      {/* Verdict */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
        {Icon && (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: cfg ? `rgba(${cfg.color === "#00E5A0" ? "0,229,160" : cfg.color === "#F5C842" ? "245,200,66" : "255,90,106"},0.1)` : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${cfg?.border}`,
            }}
          >
            <Icon size={22} color={cfg?.color} />
          </div>
        )}
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "36px",
              color: cfg?.color || "#A8B0C2",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {verdict || "—"}
          </div>
          {weightedTotal != null && (
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                color: "#606880",
                marginTop: "2px",
              }}
            >
              {weightedTotal.toFixed(2)}/10 composite
            </div>
          )}
        </div>
      </div>

      {/* Confidence meter */}
      {confidence != null && (
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              color: "#606880",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <span>Confidence</span>
            <span style={{ color: cfg?.color }}>{confidence}%</span>
          </div>
          <div
            style={{
              height: "4px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${confidence}%`,
                background: `linear-gradient(90deg, ${cfg?.color || "#A8B0C2"}, ${cfg?.color || "#A8B0C2"}99)`,
                borderRadius: "999px",
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Headline */}
      {headline && (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "#A8B0C2",
            lineHeight: 1.6,
            fontStyle: "italic",
            borderLeft: `2px solid ${cfg?.color || "rgba(255,255,255,0.1)"}`,
            paddingLeft: "12px",
            marginBottom: timeHorizon ? "16px" : "0",
          }}
        >
          "{headline}"
        </p>
      )}

      {/* Time horizon */}
      {timeHorizon && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            color: "#A8B0C2",
            letterSpacing: "0.04em",
          }}
        >
          ⏱ {timeHorizon}
        </div>
      )}
    </div>
  );
}
