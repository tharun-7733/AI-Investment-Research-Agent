"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { AgentTrace } from "./AgentTrace";
import { IntelligenceReport } from "./IntelligenceReport";
import { createClient } from "@/lib/supabase/client";
import type { AgentState } from "@/lib/types";

type AppState = "idle" | "analyzing" | "done";

export function ResearchUI() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<AgentState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [companyQuery, setCompanyQuery] = useState("");

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnalyze = async (company: string) => {
    setAppState("analyzing");
    setCompanyQuery(company);
    setLogs(["🚀 Initializing AlphaSignal research pipeline..."]);
    setResult(null);
    setElapsedMs(0);

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - (startTimeRef.current ?? Date.now()));
    }, 100);

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
      readerRef.current = reader;

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
            // Smooth scroll to results after state settles
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 400);
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "log") {
              setLogs((prev) => [...prev, parsed.message]);
            } else if (parsed.type === "result") {
              const agentState = parsed.data as AgentState;
              setResult(agentState);
              saveReport(agentState);
            } else if (parsed.type === "error") {
              setLogs((prev) => [...prev, `❌ ${parsed.message}`]);
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (error) {
      if (timerRef.current) clearInterval(timerRef.current);
      setLogs((prev) => [
        ...prev,
        `⊗ FAULT — ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
      setAppState("done");
    }
  };

  // Auto-save result to Supabase when analysis completes
  const saveReport = async (state: AgentState) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // not logged in — skip silently
      const info = state.companyInfo ?? {};
      await supabase.from("reports").insert({
        user_id: user.id,
        company_input: state.companyInput ?? "",
        company_name: info.name ?? null,
        ticker: info.ticker ?? null,
        sector: info.sector ?? null,
        exchange: info.exchange ?? null,
        country: info.country ?? null,
        is_public: info.isPublic ?? null,
        verdict: state.verdict ?? null,
        confidence: state.confidence ?? null,
        headline: state.headline ?? null,
        invest_thesis: state.investThesis ?? null,
        time_horizon: state.timeHorizon ?? null,
        scores: state.scores ?? null,
        financial_analysis: state.financialAnalysis ?? null,
        competitive_analysis: state.competitiveAnalysis ?? null,
        synthesis: state.synthesis ?? null,
        web_analysis: state.webAnalysis ?? null,
        report: state.report ?? null,
      });
    } catch {
      // non-critical — fail silently
    }
  };

  const handleAbort = () => {
    readerRef.current?.cancel().catch(() => {});
    if (timerRef.current) clearInterval(timerRef.current);
    setLogs((prev) => [...prev, "⚠️ Analysis aborted by user."]);
    setAppState("done");
  };

  const scores = result?.scores;
  const synthesis = result?.synthesis;
  const companyInfo = result?.companyInfo;
  const displayName =
    companyInfo?.name ?? result?.companyInput ?? companyQuery ?? "Research in Progress";

  // ── ANALYZING: Full-screen workspace ─────────────────────────────────────
  if (appState === "analyzing") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#0A0C10",
          overflow: "hidden",
        }}
      >
        {/* Navbar */}
        <Navbar isAnalyzing={true} hasResults={false} />

        {/* Full-screen workspace below nav */}
        <div
          style={{
            marginTop: "64px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <AgentTrace
            logs={logs}
            isLoading={true}
            elapsedMs={elapsedMs}
            companyName={displayName}
            onAbort={handleAbort}
          />
        </div>
      </div>
    );
  }

  // ── IDLE: Home page ───────────────────────────────────────────────────────
  if (appState === "idle") {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0C10", display: "flex", flexDirection: "column" }}>
        <Navbar isAnalyzing={false} hasResults={false} />
        <Hero onAnalyze={handleAnalyze} isLoading={false} />
      </div>
    );
  }

  // ── DONE: Intelligence Report page ──────────────────────────────────────
  return (
    <IntelligenceReport
      result={result!}
      logs={logs}
      onNewSearch={() => {
        setAppState("idle");
        setResult(null);
        setLogs([]);
        setCompanyQuery("");
      }}
    />
  );
}


