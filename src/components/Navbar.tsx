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
        navRef.current.style.borderBottomColor =
          window.scrollY > 10
            ? "rgba(69, 71, 75, 0.6)"
            : "rgba(69, 71, 75, 0.3)";
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
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 64px",
        background: "rgba(18, 20, 20, 0.85)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        borderBottom: "1px solid rgba(69, 71, 75, 0.3)",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Left: Logo + Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
        {/* Logo */}
        <a
          href="#"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "-0.01em",
            color: "#e2e2e2",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          EQUITY ANALYTICA
        </a>

        {/* Nav Links */}
        <div
          className="nav-links"
          style={{ display: "flex", gap: "32px", alignItems: "center" }}
        >
          <a
            href="#"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c6c6cc",
              textDecoration: "none",
              borderBottom: "2px solid #dac769",
              paddingBottom: "4px",
            }}
          >
            Terminal
          </a>
          <a
            href="#"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c6c6cb",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#e2e2e2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#c6c6cb")}
          >
            Intelligence
          </a>
          <a
            href="#"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c6c6cb",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#e2e2e2")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#c6c6cb")}
          >
            Portfolio
          </a>
        </div>
      </div>

      {/* Right: Status Pills + Icons */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            color: isAnalyzing ? "#dac769" : hasResults ? "#a8cfbd" : "#c6c6cb",
            letterSpacing: "0.04em",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: isAnalyzing ? "#dac769" : hasResults ? "#a8cfbd" : "#909095",
              flexShrink: 0,
              boxShadow: isAnalyzing ? "0 0 8px rgba(218,199,105,0.8)" : "none",
            }}
          />
          {isAnalyzing ? "Analyzing..." : hasResults ? "Complete" : "Ready"}
        </div>

        {/* Notifications icon */}
        <button
          aria-label="Notifications"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#c6c6cb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e2e2e2";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(40,42,43,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#c6c6cb";
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}>
            notifications
          </span>
        </button>

        {/* Account icon */}
        <button
          aria-label="Account"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#c6c6cb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e2e2e2";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(40,42,43,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#c6c6cb";
            (e.currentTarget as HTMLButtonElement).style.background = "none";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}>
            account_circle
          </span>
        </button>
      </div>
    </nav>
  );
}
