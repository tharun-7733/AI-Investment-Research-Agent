"use client";

import { useEffect, useRef } from "react";

interface NavbarProps {
  isAnalyzing: boolean;
  hasResults: boolean;
}

export function Navbar({ isAnalyzing, hasResults }: NavbarProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 10) {
          navRef.current.style.borderColor = "rgba(255,255,255,0.08)";
        } else {
          navRef.current.style.borderColor = "rgba(255,255,255,0.04)";
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        background: "rgba(4, 6, 15, 0.75)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <polygon
              points="13,2 24,8 24,18 13,24 2,18 2,8"
              stroke="#00E5A0"
              strokeWidth="1.5"
              fill="none"
            />
            <polygon
              points="13,7 19,10.5 19,17.5 13,21 7,17.5 7,10.5"
              fill="rgba(0,229,160,0.12)"
              stroke="rgba(0,229,160,0.4)"
              strokeWidth="1"
            />
          </svg>
          {/* Animated status dot */}
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: isAnalyzing ? "#F5C842" : "#00E5A0",
              boxShadow: isAnalyzing
                ? "0 0 8px rgba(245,200,66,0.8)"
                : "0 0 8px rgba(0,229,160,0.8)",
              animation: "pulse-dot 2s infinite",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          AlphaSignal
        </span>
      </div>

      {/* Right side status pills */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <StatusPill
          label={isAnalyzing ? "Analyzing..." : hasResults ? "Complete" : "Ready"}
          color={isAnalyzing ? "#F5C842" : hasResults ? "#00E5A0" : "#A8B0C2"}
        />
        <StatusPill label="Gemini 2.5 Flash" color="#5EA8FF" />
        <StatusPill label="7 Nodes" color="#A8B0C2" />
      </div>
    </nav>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontSize: "11px",
        fontFamily: "'DM Mono', monospace",
        color: "#A8B0C2",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}
