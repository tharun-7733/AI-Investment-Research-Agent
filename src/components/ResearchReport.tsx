"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, AlignLeft, Code2 } from "lucide-react";

interface ResearchReportProps {
  report?: string;
  rawState?: unknown;
  headline?: string;
}

type Tab = "summary" | "full" | "raw";

export function ResearchReport({ report, rawState, headline }: ResearchReportProps) {
  const [activeTab, setActiveTab] = useState<Tab>("full");

  const tabs = [
    { id: "summary" as Tab, label: "Summary", icon: AlignLeft },
    { id: "full" as Tab, label: "Full Report", icon: FileText },
    { id: "raw" as Tab, label: "Raw JSON", icon: Code2 },
  ];

  const getSummary = (md?: string): string => {
    if (!md) return "";
    // Extract first 2-3 paragraphs as summary
    const paras = md.split("\n\n").filter(p => p && !p.startsWith("#") && !p.startsWith(">")).slice(0, 3);
    return paras.join("\n\n");
  };

  return (
    <div
      className="glass"
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
          padding: "16px 24px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                color: isActive ? "#fff" : "#606880",
                borderBottom: isActive ? "2px solid #00E5A0" : "2px solid transparent",
                marginBottom: "-1px",
                transition: "all 0.2s ease",
                letterSpacing: "0.01em",
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px",
        }}
      >
        {activeTab === "full" && (
          <div className="report-prose animate-fade-in">
            {report ? (
              <ReactMarkdown>{report}</ReactMarkdown>
            ) : (
              <EmptyState />
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <div className="report-prose animate-fade-in">
            {report ? (
              <>
                {headline && (
                  <blockquote style={{ marginBottom: "20px" }}>
                    {headline}
                  </blockquote>
                )}
                <ReactMarkdown>{getSummary(report)}</ReactMarkdown>
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        )}

        {activeTab === "raw" && (
          <div className="animate-fade-in">
            <pre
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                color: "#A8B0C2",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                padding: "20px",
                overflow: "auto",
                lineHeight: 1.7,
                border: "1px solid rgba(255,255,255,0.04)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {rawState ? JSON.stringify(rawState, null, 2) : "No data yet."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "300px",
        gap: "12px",
        opacity: 0.5,
      }}
    >
      <FileText size={36} color="#606880" />
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "#606880",
          textAlign: "center",
        }}
      >
        Report will appear here.
        <br />
        <span style={{ fontSize: "12px" }}>Analyze a company to get started.</span>
      </div>
    </div>
  );
}
