"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Clock } from "lucide-react";

const PIPELINE_NODES = [
  { id: "identifier",  label: "Company Identification",   desc: "Resolving company entity" },
  { id: "webSearch",   label: "Web Research",             desc: "Searching recent news & events" },
  { id: "financials",  label: "Financial Analysis",       desc: "Fetching & analyzing financials" },
  { id: "competitive", label: "Competitive Intelligence", desc: "Mapping competitive landscape" },
  { id: "synthesis",   label: "Synthesis & Scoring",      desc: "Calculating dimension scores" },
  { id: "decision",    label: "Investment Decision",      desc: "Generating verdict" },
  { id: "reporter",    label: "Report Generation",        desc: "Writing investment brief" },
];

type NodeStatus = "pending" | "running" | "done";

interface AgentTraceProps {
  logs: string[];
  isLoading: boolean;
  elapsedMs?: number;
}

export function AgentTrace({ logs, isLoading, elapsedMs }: AgentTraceProps) {
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>(
    Object.fromEntries(PIPELINE_NODES.map(n => [n.id, "pending"]))
  );
  const [nodeTimes, setNodeTimes] = useState<Record<string, number>>({});
  const [startTimes, setStartTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!logs || logs.length === 0) {
      setNodeStatuses(Object.fromEntries(PIPELINE_NODES.map(n => [n.id, "pending"])));
      setNodeTimes({});
      setStartTimes({});
      return;
    }

    const updated: Record<string, NodeStatus> = Object.fromEntries(
      PIPELINE_NODES.map(n => [n.id, "pending"])
    );
    const times: Record<string, number> = {};

    // Infer node states from log messages
    logs.forEach(log => {
      const l = log.toLowerCase();
      if (l.includes("company identification") || l.includes("identifying")) {
        updated.identifier = l.includes("✅") ? "done" : "running";
      }
      if (l.includes("web") || l.includes("search")) {
        updated.webSearch = l.includes("✅") ? "done" : "running";
      }
      if (l.includes("financ")) {
        updated.financials = l.includes("✅") ? "done" : "running";
      }
      if (l.includes("compet")) {
        updated.competitive = l.includes("✅") ? "done" : "running";
      }
      if (l.includes("synth") || l.includes("score")) {
        updated.synthesis = l.includes("✅") ? "done" : "running";
      }
      if (l.includes("verdict") || l.includes("decision")) {
        updated.decision = l.includes("✅") ? "done" : "running";
      }
      if (l.includes("report")) {
        updated.reporter = l.includes("✅") ? "done" : "running";
      }
    });

    setNodeStatuses(updated);
  }, [logs]);

  const doneCount = Object.values(nodeStatuses).filter(s => s === "done").length;
  const runningNode = PIPELINE_NODES.find(n => nodeStatuses[n.id] === "running");

  return (
    <div
      className="glass"
      style={{
        borderRadius: "20px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "0",
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: "#606880",
              textTransform: "uppercase",
            }}
          >
            Agent Pipeline
          </span>
          {isLoading && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                color: "#F5C842",
              }}
            >
              <Loader2 size={10} style={{ animation: "spin-slow 1s linear infinite" }} />
              LIVE
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: "3px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "999px",
            overflow: "hidden",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(doneCount / PIPELINE_NODES.length) * 100}%`,
              background: "linear-gradient(90deg, #00E5A0, #5EA8FF)",
              borderRadius: "999px",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "6px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            color: "#606880",
          }}
        >
          <span>{doneCount}/{PIPELINE_NODES.length} nodes complete</span>
          {elapsedMs != null && elapsedMs > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={9} />
              {(elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Node list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {PIPELINE_NODES.map((node, i) => {
          const status = nodeStatuses[node.id];
          return (
            <NodeRow
              key={node.id}
              label={node.label}
              desc={node.desc}
              status={status}
              animDelay={i * 50}
              isActive={runningNode?.id === node.id}
            />
          );
        })}
      </div>

      {/* Log stream */}
      {logs && logs.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.08em",
              color: "#606880",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Live Log
          </div>
          <div
            style={{
              maxHeight: "120px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {logs.slice(-8).map((log, i) => (
              <div
                key={i}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  color: log.startsWith("✅")
                    ? "#00E5A0"
                    : log.startsWith("❌")
                    ? "#FF5A6A"
                    : "#606880",
                  lineHeight: 1.5,
                  opacity: i < logs.slice(-8).length - 1 ? 0.6 : 1,
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline stats glass card */}
      {doneCount > 0 && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            background: "rgba(0,229,160,0.04)",
            border: "1px solid rgba(0,229,160,0.1)",
            borderRadius: "12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 16px",
          }}
        >
          <Stat label="Nodes Complete" value={`${doneCount}/${PIPELINE_NODES.length}`} />
          <Stat label="Model" value="Gemini 2.5" />
          <Stat label="Status" value={isLoading ? "Running" : "Done"} color={isLoading ? "#F5C842" : "#00E5A0"} />
          {elapsedMs != null && <Stat label="Elapsed" value={`${(elapsedMs / 1000).toFixed(1)}s`} />}
        </div>
      )}
    </div>
  );
}

function NodeRow({
  label,
  desc,
  status,
  animDelay,
  isActive,
}: {
  label: string;
  desc: string;
  status: NodeStatus;
  animDelay: number;
  isActive: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "10px",
        background: isActive
          ? "rgba(245,200,66,0.05)"
          : status === "done"
          ? "rgba(0,229,160,0.04)"
          : "transparent",
        border: isActive
          ? "1px solid rgba(245,200,66,0.15)"
          : status === "done"
          ? "1px solid rgba(0,229,160,0.1)"
          : "1px solid transparent",
        transition: "all 0.4s ease",
        animationDelay: `${animDelay}ms`,
      }}
    >
      {/* Status icon */}
      <div style={{ flexShrink: 0 }}>
        {status === "done" ? (
          <CheckCircle2 size={16} color="#00E5A0" style={{ animation: "node-complete 0.4s ease" }} />
        ) : status === "running" ? (
          <Loader2
            size={16}
            color="#F5C842"
            style={{ animation: "spin-slow 1s linear infinite" }}
          />
        ) : (
          <Circle size={16} color="rgba(255,255,255,0.12)" />
        )}
      </div>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12.5px",
            fontWeight: 500,
            color: status === "done"
              ? "#fff"
              : status === "running"
              ? "#F5C842"
              : "#A8B0C2",
            lineHeight: 1.3,
            transition: "color 0.3s ease",
          }}
        >
          {label}
        </div>
        {isActive && (
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              color: "rgba(245,200,66,0.7)",
              marginTop: "2px",
              letterSpacing: "0.02em",
            }}
          >
            {desc}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          color: "#606880",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "12px",
          color: color || "#fff",
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}
