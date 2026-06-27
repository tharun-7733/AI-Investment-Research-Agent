"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { DimensionChart } from "./DimensionChart";
import { Search, Activity, FileText, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

type AgentState = {
  companyName: string;
  ticker?: string;
  sector?: string;
  country?: string;
  sentimentScore?: number;
  resolvedName?: string;
  financialHealthScore?: number;
  valuationScore?: number;
  growthScore?: number;
  moatScore?: number;
  synthesisScore?: number;
  verdict?: "INVEST" | "WATCH" | "PASS";
  report?: string;
  exchange?: string | null;
  industry?: string;
  isPublic?: boolean;
  founded?: string | null;
  companyDescription?: string;
  logs: string[];
};

export function ResearchUI() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({
    companyName: "",
    logs: [],
  });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentState.logs]);

  const startResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    setLoading(true);
    setAgentState({ companyName, logs: ["🚀 Starting Research..."] });

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      if (!res.ok) throw new Error("Failed to start research");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            if (dataStr === "[DONE]") {
              setLoading(false);
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "node_end") {
                setAgentState((prev) => ({
                  ...prev,
                  ...parsed.state,
                }));
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setAgentState((prev) => ({
        ...prev,
        logs: [...prev.logs, "❌ Error occurred during research."],
      }));
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict?: string) => {
    if (verdict === "INVEST") return "text-green-600 bg-green-50 border-green-200";
    if (verdict === "WATCH") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (verdict === "PASS") return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getVerdictIcon = (verdict?: string) => {
    if (verdict === "INVEST") return <CheckCircle className="w-8 h-8 text-green-600" />;
    if (verdict === "WATCH") return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    if (verdict === "PASS") return <XCircle className="w-8 h-8 text-red-600" />;
    return <Activity className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600">
          <Activity className="w-6 h-6" />
          <h1 className="font-bold text-xl tracking-tight">AI Investment Research Agent</h1>
        </div>
        <form onSubmit={startResearch} className="flex gap-2 max-w-md w-full relative">
          <input
            type="text"
            placeholder="Enter company name (e.g. Apple, Tesla)..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            disabled={loading || !companyName}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
          </button>
        </form>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Trace & Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Verdict Card */}
          <div className={`p-6 rounded-2xl border ${getVerdictColor(agentState.verdict)} shadow-sm transition-all flex flex-col items-center justify-center text-center`}>
            {getVerdictIcon(agentState.verdict)}
            <h2 className="text-3xl font-black mt-2 tracking-tight">
              {agentState.verdict || "AWAITING"}
            </h2>
            <p className="text-sm font-medium mt-1 opacity-80 uppercase tracking-widest">
              Final Verdict
            </p>
            {agentState.synthesisScore !== undefined && (
              <div className="mt-4 inline-flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                Score: <span className="text-lg">{agentState.synthesisScore.toFixed(1)}/10</span>
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-64 flex flex-col">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Dimension Scores</h3>
            <div className="flex-1">
              <DimensionChart 
                growth={agentState.growthScore || 0}
                moat={agentState.moatScore || 0}
                health={agentState.financialHealthScore || 0}
                sentiment={agentState.sentimentScore || 0}
                valuation={agentState.valuationScore || 0}
              />
            </div>
          </div>

          {/* Agent Trace Log */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-inner flex flex-col flex-1 min-h-[300px]">
            <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-4">
              <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Agent Execution Trace
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-green-400">
              {agentState.logs?.map((log, i) => (
                <div key={i} className="border-l-2 border-gray-700 pl-3 py-1">
                  {log}
                </div>
              ))}
              {agentState.logs?.length === 0 && !loading && (
                <div className="text-gray-600 italic">No execution history.</div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Panel: Final Report */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-700">Investment Brief</h2>
            {agentState.resolvedName && (
              <div className="ml-auto flex flex-wrap gap-2 items-center text-xs font-semibold">
                {agentState.ticker && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                    {agentState.ticker}
                    {agentState.exchange ? ` · ${agentState.exchange}` : ""}
                  </span>
                )}
                {!agentState.ticker && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">PRIVATE</span>
                )}
                {agentState.sector && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{agentState.sector}</span>
                )}
                {agentState.industry && agentState.industry !== agentState.sector && (
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{agentState.industry}</span>
                )}
                {agentState.country && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{agentState.country}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="p-8 prose prose-blue max-w-none flex-1 overflow-y-auto">
            {agentState.report ? (
              <ReactMarkdown>{agentState.report}</ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Report will appear here.</p>
                <p className="text-sm">Enter a company name and click Analyze to begin.</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
