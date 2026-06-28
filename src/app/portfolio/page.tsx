"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
interface Report {
  id: string;
  company_name: string;
  ticker: string | null;
  verdict: string | null;
  weighted_score: number | null;
  headline: string | null;
  created_at: string;
}

interface WatchedCompany {
  name: string;
  ticker: string | null;
  latestVerdict: string | null;
  latestScore: number | null;
  latestHeadline: string | null;
  lastAnalyzed: string;
  reportCount: number;
  latestId: string;
}

function verdictColor(verdict: string | null) {
  if (!verdict) return "#909095";
  const v = verdict.toUpperCase();
  if (v === "STRONG BUY" || v === "BUY") return "#a8cfbd";
  if (v === "HOLD") return "#dac769";
  return "#ffb4ab";
}

function verdictBg(verdict: string | null) {
  if (!verdict) return "rgba(144,144,149,0.1)";
  const v = verdict.toUpperCase();
  if (v === "STRONG BUY" || v === "BUY") return "rgba(168,207,189,0.1)";
  if (v === "HOLD") return "rgba(218,199,105,0.1)";
  return "rgba(255,180,171,0.1)";
}

function scoreColor(score: number | null) {
  if (!score) return "#909095";
  if (score >= 7) return "#a8cfbd";
  if (score >= 5) return "#dac769";
  return "#ffb4ab";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function WatchlistPage() {
  const router = useRouter();
  const supabase = createClient();
  const [companies, setCompanies] = useState<WatchedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("id, company_name, ticker, verdict, weighted_score, headline, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Group by company name, keep latest per company
    const map = new Map<string, WatchedCompany>();
    for (const r of data as Report[]) {
      const key = r.company_name.toUpperCase();
      if (!map.has(key)) {
        map.set(key, {
          name: r.company_name,
          ticker: r.ticker,
          latestVerdict: r.verdict,
          latestScore: r.weighted_score,
          latestHeadline: r.headline,
          lastAnalyzed: r.created_at,
          reportCount: 1,
          latestId: r.id,
        });
      } else {
        map.get(key)!.reportCount += 1;
      }
    }

    setCompanies(Array.from(map.values()));
    setLoading(false);
  };

  const deleteAll = async (companyName: string) => {
    setDeleting(companyName);
    await supabase
      .from("reports")
      .delete()
      .eq("company_name", companyName);
    setCompanies((prev) => prev.filter((c) => c.name !== companyName));
    setDeleting(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0C10",
        paddingTop: "64px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar isAnalyzing={false} hasResults={false} />
      {/* ── Header ── */}
      <div
        style={{
          padding: "64px 64px 40px",
          borderBottom: "1px solid rgba(69,71,75,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#909095",
                marginBottom: "12px",
              }}
            >
              Meridian · Watchlist
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "clamp(28px, 4vw, 40px)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#e2e2e2",
                margin: 0,
              }}
            >
              Your Tracked Companies
            </h1>
            <p
              style={{
                marginTop: "12px",
                fontSize: "15px",
                color: "#909095",
                lineHeight: "22px",
              }}
            >
              Every company you&apos;ve researched, at a glance. Re-analyze anytime.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.08em",
              color: "#909095",
              padding: "8px 16px",
              border: "1px solid rgba(69,71,75,0.4)",
              borderRadius: "2px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: companies.length > 0 ? "#a8cfbd" : "#45474b",
                flexShrink: 0,
              }}
            />
            {loading ? "Loading..." : `${companies.length} tracked`}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ padding: "48px 64px 96px" }}>
        {loading ? (
          <LoadingState />
        ) : companies.length === 0 ? (
          <EmptyState onGo={() => router.push("/")} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {companies.map((company) => (
              <CompanyCard
                key={company.name}
                company={company}
                onReanalyze={() => router.push(`/?q=${encodeURIComponent(company.name)}`)}
                onDelete={() => deleteAll(company.name)}
                isDeleting={deleting === company.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function CompanyCard({
  company,
  onReanalyze,
  onDelete,
  isDeleting,
}: {
  company: WatchedCompany;
  onReanalyze: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#161B22",
        border: `1px solid ${hovered ? "rgba(218,199,105,0.35)" : "rgba(69,71,75,0.3)"}`,
        borderRadius: "2px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        transition: "border-color 0.2s ease",
        position: "relative",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: "18px",
              lineHeight: "24px",
              color: "#e2e2e2",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {company.name}
          </div>
          {company.ticker && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "#909095",
                marginTop: "4px",
              }}
            >
              {company.ticker}
            </div>
          )}
        </div>

        {/* Verdict pill */}
        {company.latestVerdict && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "2px",
              background: verdictBg(company.latestVerdict),
              border: `1px solid ${verdictColor(company.latestVerdict)}30`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: verdictColor(company.latestVerdict),
              flexShrink: 0,
            }}
          >
            {company.latestVerdict}
          </div>
        )}
      </div>

      {/* Score bar */}
      {company.latestScore !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              flex: 1,
              height: "3px",
              background: "rgba(69,71,75,0.4)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(company.latestScore / 10) * 100}%`,
                background: scoreColor(company.latestScore),
                borderRadius: "999px",
                transition: "width 0.8s ease",
                boxShadow: `0 0 6px ${scoreColor(company.latestScore)}60`,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              fontWeight: 500,
              color: scoreColor(company.latestScore),
              flexShrink: 0,
            }}
          >
            {company.latestScore.toFixed(1)}
          </div>
        </div>
      )}

      {/* Headline */}
      {company.latestHeadline && (
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            lineHeight: "20px",
            color: "#909095",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {company.latestHeadline}
        </div>
      )}

      {/* Footer row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "8px",
          borderTop: "1px solid rgba(69,71,75,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.06em",
              color: "#45474b",
              textTransform: "uppercase",
            }}
          >
            {timeAgo(company.lastAnalyzed)}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.06em",
              color: "#45474b",
            }}
          >
            ·
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.06em",
              color: "#45474b",
            }}
          >
            {company.reportCount} {company.reportCount === 1 ? "run" : "runs"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            title="Remove from watchlist"
            style={{
              background: "none",
              border: "none",
              cursor: isDeleting ? "not-allowed" : "pointer",
              padding: "6px",
              borderRadius: "2px",
              color: "#45474b",
              display: "flex",
              alignItems: "center",
              opacity: isDeleting ? 0.4 : 1,
              transition: "color 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                (e.currentTarget as HTMLButtonElement).style.color = "#ffb4ab";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,180,171,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#45474b";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 0" }}>
              delete
            </span>
          </button>

          {/* Re-analyze */}
          <button
            onClick={onReanalyze}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "none",
              border: "1px solid rgba(218,199,105,0.3)",
              borderRadius: "2px",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#dac769",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(218,199,105,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(218,199,105,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(218,199,105,0.3)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "13px", fontVariationSettings: "'FILL' 0" }}>
              refresh
            </span>
            Re-analyze
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onGo }: { onGo: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 32px",
        textAlign: "center",
        gap: "24px",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          border: "1px solid rgba(69,71,75,0.4)",
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#45474b",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "28px", fontVariationSettings: "'FILL' 0" }}>
          bookmark
        </span>
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            fontSize: "22px",
            color: "#e2e2e2",
            marginBottom: "8px",
          }}
        >
          Nothing tracked yet
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "#909095",
            lineHeight: "22px",
            maxWidth: "360px",
          }}
        >
          Run your first analysis on the Terminal. Every company you research will appear here automatically.
        </div>
      </div>
      <button
        onClick={onGo}
        style={{
          padding: "12px 28px",
          background: "#dac769",
          color: "#0A0C10",
          border: "none",
          borderRadius: "2px",
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: "11px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
      >
        Go to Terminal
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: "24px",
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            background: "#161B22",
            border: "1px solid rgba(69,71,75,0.3)",
            borderRadius: "2px",
            padding: "28px",
            height: "200px",
            opacity: 0.4,
            animation: "pulse-dot 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
