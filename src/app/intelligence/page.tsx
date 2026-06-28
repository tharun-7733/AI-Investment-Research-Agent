"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  company_input: string;
  company_name: string | null;
  ticker: string | null;
  sector: string | null;
  exchange: string | null;
  verdict: string | null;
  confidence: number | null;
  headline: string | null;
  scores: { weightedTotal?: number } | null;
  created_at: string;
}

function VerdictPill({ verdict }: { verdict?: string | null }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    INVEST: { label: "STRONG BUY", color: "#a8cfbd", bg: "rgba(168,207,189,0.12)" },
    WATCH: { label: "HOLD", color: "#dac769", bg: "rgba(218,199,105,0.12)" },
    PASS: { label: "UNDERPERFORM", color: "#ffb4ab", bg: "rgba(255,180,171,0.12)" },
  };
  const v = map[verdict ?? ""] ?? { label: "N/A", color: "#909095", bg: "rgba(144,144,149,0.12)" };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "2px",
        background: v.bg,
        color: v.color,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {v.label}
    </span>
  );
}

function ScoreBadge({ score }: { score?: number | null }) {
  const s = score ?? 0;
  const color = s >= 7 ? "#a8cfbd" : s >= 5 ? "#dac769" : "#ffb4ab";
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "18px",
        fontWeight: 600,
        color,
      }}
    >
      {s.toFixed(1)}
      <span style={{ fontSize: "11px", color: "#909095", marginLeft: "2px" }}>/10</span>
    </span>
  );
}

export default function IntelligencePage() {
  const router = useRouter();
  const supabase = createClient();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("reports")
        .select("id, company_input, company_name, ticker, sector, exchange, verdict, confidence, headline, scores, created_at")
        .order("created_at", { ascending: false });

      if (!error) setReports((data ?? []) as Report[]);
      setLoading(false);
    };
    init();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("reports").delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ minHeight: "100vh", background: "#0A0C10" }}>
      {/* Nav */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: "64px", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 64px",
          background: "rgba(18,20,20,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(69,71,75,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <a
            href="/"
            style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 700,
              fontSize: "18px", color: "#e2e2e2", textDecoration: "none",
            }}
          >
            MERIDIAN
          </a>
          {["Terminal", "Intelligence", "Portfolio", "Settings"].map((link) => (
            <a
              key={link}
              href={link === "Terminal" ? "/" : `/${link.toLowerCase()}`}
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase",
                color: link === "Intelligence" ? "#dac769" : "#c6c6cb",
                textDecoration: "none",
                borderBottom: link === "Intelligence" ? "2px solid #dac769" : "2px solid transparent",
                paddingBottom: "4px", transition: "color 0.2s ease",
              }}
            >
              {link}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#909095" }}>
            {userEmail}
          </span>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            style={{
              background: "none", border: "1px solid rgba(255,180,171,0.3)",
              borderRadius: "2px", padding: "6px 14px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#ffb4ab", transition: "background 0.2s",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ paddingTop: "96px", paddingBottom: "80px", maxWidth: "1200px", margin: "0 auto", padding: "96px 48px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#909095", marginBottom: "8px" }}>
            Intelligence
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 700,
              fontSize: "32px", color: "#e2e2e2", margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Analysis History
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#909095", marginTop: "8px" }}>
            {reports.length} saved {reports.length === 1 ? "report" : "reports"}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#909095", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
            <span style={{ width: "14px", height: "14px", border: "2px solid rgba(218,199,105,0.2)", borderTopColor: "#dac769", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            Loading reports...
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div
            style={{
              border: "1px dashed rgba(69,71,75,0.4)", borderRadius: "4px",
              padding: "64px 32px", textAlign: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#45474b", fontVariationSettings: "'FILL' 0", display: "block", marginBottom: "16px" }}>
              analytics
            </span>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#c6c6cb", marginBottom: "8px" }}>
              No analyses yet
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#909095", marginBottom: "24px" }}>
              Run your first company analysis from the Terminal to see it here.
            </div>
            <a
              href="/"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 24px", background: "#dac769", color: "#0A0C10",
                borderRadius: "2px", textDecoration: "none",
                fontFamily: "'Inter', sans-serif", fontWeight: 700,
                fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>search</span>
              Go to Terminal
            </a>
          </div>
        )}

        {/* Report list */}
        {!loading && reports.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#161B22",
                  border: "0.5px solid rgba(69,71,75,0.4)",
                  borderRadius: "4px",
                  padding: "24px 28px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "16px",
                  alignItems: "center",
                  transition: "border-color 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(218,199,105,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(69,71,75,0.4)")}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "18px", color: "#e2e2e2" }}>
                      {r.company_name ?? r.company_input}
                    </span>
                    {r.ticker && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#a8cfbd", background: "rgba(168,207,189,0.08)", padding: "2px 8px", borderRadius: "2px" }}>
                        {r.ticker}
                      </span>
                    )}
                    {r.exchange && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#c6c6cb", background: "rgba(198,198,203,0.06)", padding: "2px 8px", borderRadius: "2px" }}>
                        {r.exchange}
                      </span>
                    )}
                    <VerdictPill verdict={r.verdict} />
                  </div>
                  {r.headline && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#909095", margin: "0 0 8px", lineHeight: 1.5 }}>
                      {r.headline}
                    </p>
                  )}
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#45474b" }}>
                    {fmt(r.created_at)}
                    {r.sector && <span style={{ marginLeft: "12px", color: "#65676b" }}>· {r.sector}</span>}
                    {r.confidence && <span style={{ marginLeft: "12px", color: "#65676b" }}>· {r.confidence}% confidence</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <ScoreBadge score={r.scores?.weightedTotal} />
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#45474b", padding: "6px", borderRadius: "4px",
                      transition: "color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#ffb4ab";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,180,171,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#45474b";
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                    }}
                    title="Delete report"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 0", display: "block" }}>
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
