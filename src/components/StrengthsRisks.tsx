"use client";

import { Shield, AlertTriangle } from "lucide-react";

interface StrengthsRisksProps {
  strengths?: string[];
  risks?: string[];
}

export function StrengthsRisks({ strengths = [], risks = [] }: StrengthsRisksProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {/* Strengths */}
      <div
        className="glass animate-fade-up stagger-2"
        style={{
          borderRadius: "16px",
          padding: "24px",
          borderTop: "2px solid rgba(0,229,160,0.3)",
          opacity: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "rgba(0,229,160,0.1)",
              border: "1px solid rgba(0,229,160,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={14} color="#00E5A0" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#fff",
              }}
            >
              Key Strengths
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "9px",
                color: "#606880",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Competitive advantages
            </div>
          </div>
        </div>

        <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {strengths.length > 0 ? (
            strengths.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "#A8B0C2",
                  lineHeight: 1.5,
                  animation: "fadeIn 0.4s ease forwards",
                  animationDelay: `${i * 60}ms`,
                  opacity: 0,
                }}
              >
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#00E5A0",
                    flexShrink: 0,
                    marginTop: "7px",
                  }}
                />
                {s}
              </li>
            ))
          ) : (
            <li style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#606880" }}>
              Awaiting analysis...
            </li>
          )}
        </ul>
      </div>

      {/* Risks */}
      <div
        className="glass animate-fade-up stagger-3"
        style={{
          borderRadius: "16px",
          padding: "24px",
          borderTop: "2px solid rgba(255,90,106,0.3)",
          opacity: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "rgba(255,90,106,0.1)",
              border: "1px solid rgba(255,90,106,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={14} color="#FF5A6A" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#fff",
              }}
            >
              Key Risks
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "9px",
                color: "#606880",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Material concerns
            </div>
          </div>
        </div>

        <ul style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {risks.length > 0 ? (
            risks.map((r, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "#A8B0C2",
                  lineHeight: 1.5,
                  animation: "fadeIn 0.4s ease forwards",
                  animationDelay: `${i * 60}ms`,
                  opacity: 0,
                }}
              >
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#FF5A6A",
                    flexShrink: 0,
                    marginTop: "7px",
                  }}
                />
                {r}
              </li>
            ))
          ) : (
            <li style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#606880" }}>
              Awaiting analysis...
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
