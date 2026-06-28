"use client";

import { useEffect, useRef, useState } from "react";

const PIPELINE_NODES = [
  {
    id: "identifier",
    label: "Entity Identification",
    desc: "Resolving company entity and aliases",
    keywords: ["identified", "identifying", "entity"],
  },
  {
    id: "webSearch",
    label: "Web Research & Sentiment",
    desc: "Scanning institutional chatter and news",
    keywords: ["web research", "search", "sentiment"],
  },
  {
    id: "financials",
    label: "Financial Extraction",
    desc: "Parsing financial statements and data",
    keywords: ["financials analyzed", "financial", "financ"],
  },
  {
    id: "competitive",
    label: "Competitive Intelligence",
    desc: "Mapping competitive landscape and moat",
    keywords: ["competitive", "compet"],
  },
  {
    id: "synthesis",
    label: "Synthesis & Scoring",
    desc: "Calculating weighted dimension scores",
    keywords: ["score", "synth", "scoring"],
  },
  {
    id: "decision",
    label: "Investment Decision",
    desc: "Generating investment verdict",
    keywords: ["verdict", "decision"],
  },
  {
    id: "reporter",
    label: "Report Generation",
    desc: "Writing investment brief",
    keywords: ["report"],
  },
];

type NodeStatus = "pending" | "running" | "done";

interface AgentTraceProps {
  logs: string[];
  isLoading: boolean;
  elapsedMs?: number;
  companyName?: string;
  onAbort?: () => void;
}

export function AgentTrace({
  logs,
  isLoading,
  elapsedMs = 0,
  companyName,
  onAbort,
}: AgentTraceProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>(
    Object.fromEntries(PIPELINE_NODES.map((n) => [n.id, "pending"]))
  );

  // Auto-scroll log to bottom on new entries
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Derive node statuses from log messages
  useEffect(() => {
    if (!logs || logs.length === 0) {
      setNodeStatuses(Object.fromEntries(PIPELINE_NODES.map((n) => [n.id, "pending"])));
      return;
    }

    const updated: Record<string, NodeStatus> = Object.fromEntries(
      PIPELINE_NODES.map((n) => [n.id, "pending"])
    );

    logs.forEach((log) => {
      const l = log.toLowerCase();
      for (const node of PIPELINE_NODES) {
        if (node.keywords.some((kw) => l.includes(kw))) {
          updated[node.id] = l.includes("✅") ? "done" : "running";
        }
      }
    });

    setNodeStatuses(updated);
  }, [logs]);

  const doneCount = Object.values(nodeStatuses).filter((s) => s === "done").length;
  const progressPct = Math.round((doneCount / PIPELINE_NODES.length) * 100);

  // Format elapsed time as MM:SS.ms
  const totalSec = Math.floor(elapsedMs / 1000);
  const mins = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const secs = String(totalSec % 60).padStart(2, "0");
  const ms = String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, "0");
  const timeStr = `${mins}:${secs}.${ms}`;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#0A0C10",
        overflow: "hidden",
      }}
    >
      {/* ── Global Progress Bar (thin, top of workspace) ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "rgba(51,53,53,0.8)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "#dac769",
            boxShadow: "0 0 10px rgba(218,199,105,0.5)",
            transition: "width 0.8s ease-out",
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR — Agent Pipeline                                   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: "320px",
          flexShrink: 0,
          background: "#0c0f0f",
          borderRight: "1px solid rgba(69,71,75,0.3)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Session header */}
        <div
          style={{
            padding: "32px",
            borderBottom: "1px solid rgba(69,71,75,0.3)",
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c6c6cb",
              marginBottom: "8px",
            }}
          >
            Active Session
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: "22px",
              lineHeight: "28px",
              color: "#e2e2e2",
            }}
          >
            {companyName || "Research in Progress"}
          </div>

          {/* Progress row */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                color: isLoading ? "#dac769" : "#a8cfbd",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isLoading ? "#dac769" : "#a8cfbd",
                  animation: isLoading ? "pulse-dot 2s infinite" : "none",
                  flexShrink: 0,
                }}
              />
              {isLoading ? "Analysis in Progress" : "Analysis Complete"}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#909095",
              }}
            >
              {doneCount}/{PIPELINE_NODES.length}
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: "10px",
              height: "2px",
              background: "rgba(69,71,75,0.4)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "#dac769",
                boxShadow: "0 0 8px rgba(218,199,105,0.4)",
                transition: "width 0.8s ease-out",
                borderRadius: "999px",
              }}
            />
          </div>
        </div>

        {/* Pipeline steps list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          {PIPELINE_NODES.map((node) => {
            const status = nodeStatuses[node.id];
            const isDone = status === "done";
            const isRunning = status === "running";
            return (
              <PipelineStep
                key={node.id}
                label={node.label}
                desc={node.desc}
                status={status}
                isDone={isDone}
                isRunning={isRunning}
              />
            );
          })}
        </div>

        {/* Abort button */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid rgba(69,71,75,0.3)",
          }}
        >
          <button
            onClick={onAbort}
            disabled={!isLoading}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid rgba(69,71,75,0.5)",
              background: "none",
              color: "#e2e2e2",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: isLoading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "border-color 0.2s ease",
              opacity: isLoading ? 1 : 0.4,
              borderRadius: "2px",
            }}
            onMouseEnter={(e) => {
              if (isLoading)
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#dac769";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(69,71,75,0.5)";
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px", fontVariationSettings: "'FILL' 0" }}
            >
              stop_circle
            </span>
            Abort Analysis
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL — Live Intelligence Log                             */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          flex: 1,
          background: "#0A0C10",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Log header bar */}
        <div
          style={{
            padding: "14px 32px",
            borderBottom: "1px solid rgba(69,71,75,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#161B22",
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#c6c6cb",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {isLoading && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#dac769",
                  animation: "pulse-dot 1.5s infinite",
                  flexShrink: 0,
                }}
              />
            )}
            Live Intelligence Log
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              fontSize: "13px",
              letterSpacing: "-0.01em",
              color: "#909095",
            }}
          >
            T: {timeStr}
          </div>
        </div>

        {/* Log entries */}
        <div
          id="log-container"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            paddingBottom: "80px",
          }}
        >
          {logs.length === 0 ? (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                color: "#45474b",
              }}
            >
              [SYS] Awaiting agent initialization...
            </div>
          ) : (
            logs.map((log, i) => <LogLine key={i} log={log} isLatest={i === logs.length - 1} />)
          )}
          {/* Blinking cursor at the end */}
          {isLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  color: "#dac769",
                }}
              >
                ›
              </span>
              <span
                style={{
                  width: "8px",
                  height: "16px",
                  background: "#dac769",
                  display: "inline-block",
                  animation: "blink-cursor 1s step-end infinite",
                  borderRadius: "1px",
                }}
              />
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {/* Fade gradient at bottom */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "linear-gradient(to top, #0A0C10, transparent)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      </section>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function PipelineStep({
  label,
  desc,
  isDone,
  isRunning,
}: {
  label: string;
  desc: string;
  status: NodeStatus;
  isDone: boolean;
  isRunning: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        position: "relative",
        opacity: isDone ? 0.5 : isRunning ? 1 : 0.3,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Active left accent bar */}
      {isRunning && (
        <div
          style={{
            position: "absolute",
            left: "-32px",
            top: "4px",
            width: "3px",
            height: "28px",
            background: "#dac769",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}

      {/* Icon / Status indicator */}
      <div style={{ flexShrink: 0, marginTop: "2px" }}>
        {isDone ? (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              color: "#dac769",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            check_circle
          </span>
        ) : isRunning ? (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "20px",
              color: "#dac769",
              animation: "spin-slow 1.5s linear infinite",
            }}
          >
            sync
          </span>
        ) : (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#c6c6cb",
              margin: "6px 6px",
            }}
          />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            lineHeight: "22px",
            color: isRunning ? "#dac769" : "#e2e2e2",
            transition: "color 0.3s ease",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: "12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isRunning ? "#e2e2e2" : "#c6c6cb",
            marginTop: "4px",
            lineHeight: "16px",
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

function LogLine({ log, isLatest }: { log: string; isLatest: boolean }) {
  const isSuccess = log.startsWith("✅");
  const isError = log.startsWith("❌");
  const isWarning = log.startsWith("⚠️");

  let prefixColor = "#c6c6cb";
  let textColor = "#c6c6cb";

  if (isSuccess) {
    prefixColor = "#a8cfbd";
    textColor = "#a8cfbd";
  } else if (isError) {
    prefixColor = "#ffb4ab";
    textColor = "#ffb4ab";
  } else if (isWarning) {
    prefixColor = "#dac769";
    textColor = "#dac769";
  } else if (isLatest) {
    textColor = "#dac769";
    prefixColor = "#dac769";
  }

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        fontSize: "13px",
        lineHeight: "20px",
        letterSpacing: "-0.01em",
        color: textColor,
        opacity: isLatest ? 1 : 0.75,
        transition: "opacity 0.3s ease",
        display: "flex",
        gap: "8px",
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: prefixColor, flexShrink: 0 }}>›</span>
      <span>{log}</span>
    </div>
  );
}
