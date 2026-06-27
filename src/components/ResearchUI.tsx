"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { AgentTrace } from "./AgentTrace";
import { VerdictCard } from "./VerdictCard";
import { ScoreCards } from "./ScoreCards";
import { StrengthsRisks } from "./StrengthsRisks";
import { ResearchReport } from "./ResearchReport";
import type { AgentState } from "@/lib/types";

type AppState = "idle" | "analyzing" | "done";

export function ResearchUI() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AgentState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnalyze = async (company: string) => {
    setAppState("analyzing");
    setLogs(["🚀 Initializing AlphaSignal research pipeline..."]);
    setResult(null);
    setElapsedMs(0);

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - (startTimeRef.current ?? Date.now()));
    }, 100);

    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Request failed");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream body");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const dataStr = part.slice(6).trim();

          if (dataStr === "[DONE]") {
            if (timerRef.current) clearInterval(timerRef.current);
            setAppState("done");
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.type === "log") {
              setLogs(prev => [...prev, parsed.message]);
            } else if (parsed.type === "result") {
              setResult(parsed.data as AgentState);
            } else if (parsed.type === "error") {
              setLogs(prev => [...prev, `❌ ${parsed.message}`]);
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (error) {
      if (timerRef.current) clearInterval(timerRef.current);
      setLogs(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`]);
      setAppState("done");
    }
  };

  const scores = result?.scores;
  const synthesis = result?.synthesis;
  const companyInfo = result?.companyInfo;
  const webAnalysis = result?.webAnalysis;

  const hasResults = appState !== "idle";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
      <Navbar isAnalyzing={appState === "analyzing"} hasResults={appState === "done"} />

      {/* Hero — always visible */}
      <Hero onAnalyze={handleAnalyze} isLoading={appState === "analyzing"} />

      {/* Results workspace */}
      {hasResults && (
        <div
          ref={resultsRef}
          style={{
            padding: "0 24px 80px",
            maxWidth: "1400px",
            margin: "0 auto",
            animation: "fadeIn 0.6s ease forwards",
          }}
        >
          {/* Section label */}
          <div
            style={{
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  color: "#606880",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Analysis Workspace
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "20px",
                  color: "#fff",
                  letterSpacing: "-0.02em",
                }}
              >
                {result?.companyInfo?.name ?? result?.companyInput ?? "Research in Progress"}
              </div>
            </div>

            {companyInfo && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {companyInfo.ticker && (
                  <MetaBadge label={companyInfo.ticker} color="#5EA8FF" />
                )}
                {companyInfo.sector && (
                  <MetaBadge label={companyInfo.sector} color="#A8B0C2" />
                )}
                {companyInfo.country && (
                  <MetaBadge label={companyInfo.country} color="#A8B0C2" />
                )}
                {companyInfo.isPublic === false && (
                  <MetaBadge label="PRIVATE" color="#F5C842" />
                )}
              </div>
            )}
          </div>

          {/* Main split layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "320px 1fr",
              gap: "20px",
              alignItems: "start",
              marginBottom: "24px",
            }}
          >
            {/* Left: Agent Trace */}
            <div style={{ position: "sticky", top: "80px" }}>
              <AgentTrace
                logs={logs}
                isLoading={appState === "analyzing"}
                elapsedMs={elapsedMs}
              />
            </div>

            {/* Right: Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Verdict Card */}
              <VerdictCard
                companyName={companyInfo?.name ?? result?.companyInput}
                verdict={result?.verdict}
                confidence={result?.confidence}
                headline={result?.headline}
                timeHorizon={result?.timeHorizon}
                weightedTotal={scores?.weightedTotal}
              />

              {/* Score Cards */}
              {scores && (
                <div>
                  <SectionHeader label="Investment Scorecard" sublabel="Weighted across 5 dimensions" />
                  <ScoreCards
                    growth={scores.growth}
                    moat={scores.moat}
                    financialHealth={scores.financialHealth}
                    sentiment={scores.sentiment}
                    valuation={scores.valuation}
                  />
                </div>
              )}

              {/* Strengths & Risks */}
              {synthesis && (synthesis.keyStrengths?.length || synthesis.keyRisks?.length) && (
                <div>
                  <SectionHeader label="Investment Factors" sublabel="Key strengths and material risks" />
                  <StrengthsRisks
                    strengths={synthesis.keyStrengths}
                    risks={synthesis.keyRisks}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Full-width Report section */}
          <div>
            <SectionHeader label="Research Report" sublabel="AI-generated investment brief" />
            <div style={{ height: "700px" }}>
              <ResearchReport
                report={result?.report}
                rawState={result}
                headline={result?.headline}
              />
            </div>
          </div>

          {/* Footer watermark */}
          <div
            style={{
              marginTop: "40px",
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              color: "#606880",
              letterSpacing: "0.06em",
            }}
          >
            ALPHASIGNAL · AI INVESTMENT RESEARCH · NOT FINANCIAL ADVICE
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          color: "#fff",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#606880",
            marginTop: "2px",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

function MetaBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        padding: "4px 10px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}33`,
        fontFamily: "'DM Mono', monospace",
        fontSize: "11px",
        color,
        fontWeight: 500,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
  );
}
