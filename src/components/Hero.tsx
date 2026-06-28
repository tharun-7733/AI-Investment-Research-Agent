"use client";

import { useState } from "react";

interface HeroProps {
  onAnalyze: (company: string) => void;
  isLoading: boolean;
}

const TRENDING = [
  { icon: "trending_up", label: "NVDA" },
  { icon: "macro_auto", label: "Macro CPI" },
  { icon: "water_drop", label: "Brent Crude" },
];

const BENTO_CARDS = [
  {
    icon: "analytics",
    title: "Fundamental",
    desc: "Deep dive into financial statements, earnings call transcripts, and SEC filings with absolute precision.",
  },
  {
    icon: "hub",
    title: "Network",
    desc: "Map supply chains, executive movements, and institutional ownership shifts across global markets.",
  },
  {
    icon: "radar",
    title: "Sentiment",
    desc: "Real-time quantification of alternative data sources, news flow, and macro-economic chatter.",
  },
];

export function Hero({ onAnalyze, isLoading }: HeroProps) {
  const [value, setValue] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) onAnalyze(value.trim());
  };

  return (
    <>
      {/* ─── Main Canvas ─────────────────────────────────────────────────── */}
      <main
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "100%",
          paddingTop: "64px",
          minHeight: "100vh",
          background: "#0A0C10",
          overflow: "hidden",
        }}
      >
        {/* Dot grid background */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(198, 198, 204, 0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "center",
            opacity: 0.5,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Ambient gold glow — top right */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "10%",
            right: "8%",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(218,199,105,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Ambient blue glow — bottom left */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "15%",
            left: "5%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(94,168,255,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "896px",
            padding: "0 24px",
            margin: "0 auto",
            textAlign: "center",
            gap: "48px",
            paddingTop: "80px",
            paddingBottom: "80px",
          }}
        >
          {/* ── Headline Block ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h1
              className="animate-fade-in"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#e2e2e2",
                margin: 0,
              }}
            >
              Institutional Intelligence.
              <br />
              On Demand.
            </h1>
            <p
              className="animate-fade-in stagger-1"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "18px",
                lineHeight: "28px",
                fontWeight: 400,
                color: "#c6c6cb",
                maxWidth: "640px",
                margin: "0 auto",
              }}
            >
              Deploy a network of specialized AI agents to analyze any public or
              private entity. Precision engineering meets unprecedented scale.
            </p>
          </div>

          {/* ── Search Block ── */}
          <div
            className="animate-fade-in stagger-2"
            style={{ width: "100%", maxWidth: "768px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Search Bar */}
            <form onSubmit={handleSubmit} style={{ position: "relative", width: "100%" }}>
              {/* Search icon */}
              <span
                className="material-symbols-outlined"
                style={{
                  position: "absolute",
                  left: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#c6c6cb",
                  zIndex: 2,
                  pointerEvents: "none",
                  fontSize: "22px",
                  fontVariationSettings: "'FILL' 0",
                }}
              >
                search
              </span>

              <input
                id="company-search"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isLoading}
                placeholder="Search companies, tickers, or economic indicators..."
                style={{
                  width: "100%",
                  background: "#0A0C10",
                  border: "1px solid rgba(226, 226, 226, 0.2)",
                  borderRadius: "2px",
                  padding: "22px 176px 22px 64px",
                  color: "#e2e2e2",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "18px",
                  lineHeight: "28px",
                  outline: "none",
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#dac769";
                  e.currentTarget.style.boxShadow = "0 0 0 1px #dac769";
                  e.currentTarget.style.background = "#161B22";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(226, 226, 226, 0.2)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#0A0C10";
                }}
              />

              {/* Analyze Button */}
              <button
                id="analyze-btn"
                type="submit"
                disabled={isLoading || !value.trim()}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: isLoading || !value.trim() ? "rgba(197, 179, 88, 0.4)" : "#C5B358",
                  color: "#0A0C10",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "14px 28px",
                  borderRadius: "2px",
                  border: "none",
                  cursor: isLoading || !value.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && value.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#dac769";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && value.trim()) {
                    (e.currentTarget as HTMLButtonElement).style.background = "#C5B358";
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <span
                      style={{
                        width: "13px",
                        height: "13px",
                        border: "2px solid rgba(10,12,16,0.3)",
                        borderTopColor: "#0A0C10",
                        borderRadius: "50%",
                        animation: "spin-slow 0.8s linear infinite",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze Signal
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px", fontVariationSettings: "'FILL' 0" }}
                    >
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Trending chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                marginTop: "16px",
                opacity: 0.7,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#c6c6cb",
                }}
              >
                Trending Signals:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TRENDING.map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setValue(label)}
                    disabled={isLoading}
                    style={{
                      padding: "4px 12px",
                      background: hovered === label ? "rgba(40,42,43,0.8)" : "#1e2020",
                      border: "1px solid rgba(69, 71, 75, 0.3)",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#c6c6cb",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={() => setHovered(label)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "14px", fontVariationSettings: "'FILL' 0" }}
                    >
                      {icon}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bento Cards ── */}
          <div
            className="animate-fade-in stagger-3"
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
              marginTop: "40px",
              borderTop: "1px solid rgba(69, 71, 75, 0.2)",
              paddingTop: "64px",
            }}
          >
            {BENTO_CARDS.map(({ icon, title, desc }) => (
              <BentoCard key={title} icon={icon} title={title} desc={desc} />
            ))}
          </div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          width: "100%",
          padding: "64px 64px",
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          background: "#0c0f0f",
          borderTop: "1px solid rgba(69, 71, 75, 0.2)",
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
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "-0.01em",
              color: "#e2e2e2",
            }}
          >
            MERIDIAN
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
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
                  color: "rgba(198, 198, 203, 0.7)",
                  textDecoration: "none",
                  transition: "color 0.3s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#dac769")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(198, 198, 203, 0.7)")}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            lineHeight: "24px",
            color: "#c6c6cb",
          }}
        >
          © 2024 Meridian. Institutional Grade Intelligence. Member FINRA/SIPC.
        </div>
      </footer>
    </>
  );
}

function BentoCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#161B22",
        border: `1px solid ${hovered ? "rgba(218, 199, 105, 0.5)" : "rgba(69, 71, 75, 0.3)"}`,
        borderRadius: "2px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        transition: "border-color 0.3s ease",
        textAlign: "left",
        cursor: "default",
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: "48px",
          height: "48px",
          background: "#1e2020",
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#dac769",
          border: "1px solid rgba(218, 199, 105, 0.2)",
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}
        >
          {icon}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          fontSize: "24px",
          lineHeight: "32px",
          color: "#e2e2e2",
          margin: 0,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "16px",
          lineHeight: "24px",
          fontWeight: 400,
          color: "#c6c6cb",
          margin: 0,
        }}
      >
        {desc}
      </p>
    </div>
  );
}
