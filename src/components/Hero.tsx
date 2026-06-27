"use client";

import { useState } from "react";
import { Search, Zap } from "lucide-react";

interface HeroProps {
  onAnalyze: (company: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = ["Nvidia", "Reliance Industries", "Zepto", "Zomato"];

export function Hero({ onAnalyze, isLoading }: HeroProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) onAnalyze(value.trim());
  };

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%)",
          animation: "float-glow 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "25%",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(94,168,255,0.07) 0%, transparent 70%)",
          animation: "float-glow 10s ease-in-out infinite reverse",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Eyebrow badge */}
      <div
        className="animate-fade-in"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "999px",
          background: "rgba(0,229,160,0.08)",
          border: "1px solid rgba(0,229,160,0.18)",
          marginBottom: "36px",
          fontSize: "12px",
          fontFamily: "'DM Mono', monospace",
          color: "#00E5A0",
          letterSpacing: "0.05em",
        }}
      >
        <Zap size={11} fill="#00E5A0" />
        AI-POWERED INVESTMENT RESEARCH
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-in stagger-1"
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(44px, 7vw, 88px)",
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          color: "#fff",
          marginBottom: "8px",
          maxWidth: "900px",
        }}
      >
        Research any company.
      </h1>
      <h1
        className="animate-fade-in stagger-2 gradient-text"
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(44px, 7vw, 88px)",
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          marginBottom: "32px",
          maxWidth: "900px",
        }}
      >
        Get a verdict in seconds.
      </h1>

      {/* Supporting text */}
      <p
        className="animate-fade-in stagger-3"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "17px",
          color: "#A8B0C2",
          fontWeight: 400,
          maxWidth: "520px",
          lineHeight: 1.65,
          marginBottom: "52px",
        }}
      >
        AlphaSignal deploys 7 AI agents in parallel to analyze any public or
        private company — delivering institutional-grade research in under a minute.
      </p>

      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in stagger-4"
        style={{ width: "100%", maxWidth: "580px", marginBottom: "24px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0",
            background: "rgba(12, 18, 36, 0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "6px 6px 6px 20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,160,0.0) inset",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
          onFocusCapture={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,229,160,0.3)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,229,160,0.06)";
          }}
          onBlurCapture={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.5)";
          }}
        >
          <Search size={18} color="#606880" style={{ flexShrink: 0, marginRight: "12px" }} />
          <input
            id="company-search"
            type="text"
            placeholder="Enter company name — public or private..."
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={isLoading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              fontFamily: "'Inter', sans-serif",
              color: "#fff",
              padding: "10px 0",
            }}
          />
          <button
            id="analyze-btn"
            type="submit"
            disabled={isLoading || !value.trim()}
            style={{
              flexShrink: 0,
              padding: "11px 24px",
              borderRadius: "11px",
              background: isLoading || !value.trim()
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #00E5A0, #00C080)",
              border: "none",
              color: isLoading || !value.trim() ? "#606880" : "#000",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              cursor: isLoading || !value.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#A8B0C2",
                    borderRadius: "50%",
                    animation: "spin-slow 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                Analyzing
              </>
            ) : (
              <>
                <Zap size={14} />
                Analyze
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion chips */}
      <div
        className="animate-fade-in stagger-5"
        style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}
      >
        <span style={{ fontSize: "12px", color: "#606880", fontFamily: "'Inter', sans-serif", alignSelf: "center", marginRight: "4px" }}>
          Try:
        </span>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => { setValue(s); }}
            disabled={isLoading}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#A8B0C2",
              fontSize: "12px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,229,160,0.3)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,160,0.06)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLButtonElement).style.color = "#A8B0C2";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
