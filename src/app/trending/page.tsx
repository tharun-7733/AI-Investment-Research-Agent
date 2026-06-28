"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const BOOMING_COMPANIES = [
  {
    name: "NVIDIA",
    ticker: "NVDA",
    category: "Semiconductors / AI Compute",
    description: "The undisputed leader in AI accelerators. Supplying the H100 and upcoming Blackwell GPUs that power global data centers and LLM training.",
    catalyst: "Incredible surge in AI infrastructure spending.",
    color: "#a8cfbd"
  },
  {
    name: "Palantir Technologies",
    ticker: "PLTR",
    category: "Enterprise AI Software",
    description: "Pioneering the Artificial Intelligence Platform (AIP). Helping governments and enterprises turn vast data silos into actionable operational intelligence.",
    catalyst: "Unprecedented commercial sector growth and AIP bootcamps.",
    color: "#dac769"
  },
  {
    name: "Super Micro Computer",
    ticker: "SMCI",
    category: "Server Infrastructure",
    description: "Specialists in liquid-cooled server racks. Working intimately with Nvidia to build the physical data center hardware required for hyperscalers.",
    catalyst: "Massive demand for efficient, high-density compute racks.",
    color: "#a8cfbd"
  },
  {
    name: "ARM Holdings",
    ticker: "ARM",
    category: "Chip Design Architecture",
    description: "The architect behind mobile and edge compute. Increasingly dominating data center CPUs (like AWS Graviton) due to superior power efficiency.",
    catalyst: "Shift towards power-efficient AI inference at the edge.",
    color: "#dac769"
  },
  {
    name: "ASML Holding",
    ticker: "ASML",
    category: "Semiconductor Equipment",
    description: "The exclusive manufacturer of Extreme Ultraviolet (EUV) lithography machines. Without ASML, advanced sub-5nm AI chips cannot be physically printed.",
    catalyst: "Monopoly on the most critical chokepoint in semiconductor manufacturing.",
    color: "#ffb4ab"
  },
  {
    name: "Advanced Micro Devices",
    ticker: "AMD",
    category: "Semiconductors",
    description: "The primary challenger to Nvidia's AI dominance. Their MI300X accelerators are gaining traction among cost-conscious hyperscalers.",
    catalyst: "Data centers seeking competitive alternatives to Nvidia.",
    color: "#a8cfbd"
  },
  {
    name: "Microsoft",
    ticker: "MSFT",
    category: "Cloud / Enterprise AI",
    description: "The biggest investor in OpenAI. Successfully integrating AI (Copilot) into Azure cloud services and enterprise software worldwide.",
    catalyst: "Massive enterprise adoption of AI Copilot and Azure OpenAI services.",
    color: "#dac769"
  },
  {
    name: "Meta Platforms",
    ticker: "META",
    category: "Social Media / AI Research",
    description: "Pioneering open-source AI with the Llama models. Utilizing massive proprietary AI compute clusters to dominate targeted advertising and engagement.",
    catalyst: "Open-source AI dominance and highly efficient AI-driven ad targeting.",
    color: "#ffb4ab"
  },
  {
    name: "Taiwan Semiconductor",
    ticker: "TSM",
    category: "Semiconductor Foundry",
    description: "The world's largest dedicated independent semiconductor foundry. They physically manufacture the cutting-edge chips designed by Nvidia, AMD, and Apple.",
    catalyst: "Absolute monopoly on the highest-yield 3nm and 5nm chip manufacturing.",
    color: "#a8cfbd"
  },
  {
    name: "Broadcom",
    ticker: "AVGO",
    category: "Networking / Custom Silicon",
    description: "The critical networking backbone for AI data centers. Designing custom ASIC chips for hyperscalers like Google (TPUs) to bypass Nvidia.",
    catalyst: "Explosive demand for AI networking (Ethernet/Tomahawk) and custom silicon.",
    color: "#dac769"
  },
  {
    name: "CrowdStrike",
    ticker: "CRWD",
    category: "Cybersecurity",
    description: "Cloud-native endpoint protection. Utilizing AI-driven threat detection to secure the massive new attack surfaces created by AI infrastructure.",
    catalyst: "Enterprise security budgets expanding to cover AI-related vulnerabilities.",
    color: "#ffb4ab"
  },
  {
    name: "Alphabet",
    ticker: "GOOGL",
    category: "Cloud / Consumer AI",
    description: "The creators of transformers. Integrating Gemini models across search, YouTube, and GCP, while designing their own custom TPU hardware.",
    catalyst: "Vertical integration of AI from custom hardware (TPUs) up to consumer applications.",
    color: "#a8cfbd"
  }
];

export default function TrendingPage() {
  const router = useRouter();

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
              Meridian · Trending
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
              Booming Companies
            </h1>
            <p
              style={{
                marginTop: "12px",
                fontSize: "15px",
                color: "#909095",
                lineHeight: "22px",
                maxWidth: "600px",
              }}
            >
              Curated intelligence on the most disruptive forces in the market today. Click any company to instantly launch a comprehensive AI research report.
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
                background: "#dac769",
                flexShrink: 0,
                boxShadow: "0 0 8px rgba(218,199,105,0.6)",
              }}
            />
            {BOOMING_COMPANIES.length} Trending Equities
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ padding: "48px 64px 96px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "24px",
          }}
        >
          {BOOMING_COMPANIES.map((company) => (
            <div
              key={company.ticker}
              style={{
                background: "#161B22",
                border: "1px solid rgba(69,71,75,0.3)",
                borderRadius: "2px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                transition: "transform 0.2s ease, border-color 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(218,199,105,0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(69,71,75,0.3)";
                e.currentTarget.style.transform = "none";
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 600,
                      fontSize: "22px",
                      color: "#e2e2e2",
                      marginBottom: "4px",
                    }}
                  >
                    {company.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      color: company.color,
                    }}
                  >
                    {company.ticker} · {company.category}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  lineHeight: "22px",
                  color: "#c6c6cb",
                  flex: 1,
                }}
              >
                {company.description}
              </div>

              {/* Catalyst */}
              <div
                style={{
                  padding: "16px",
                  background: "rgba(10,12,16,0.5)",
                  borderLeft: `2px solid ${company.color}`,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#909095",
                }}
              >
                <strong style={{ color: "#e2e2e2" }}>Core Catalyst:</strong> {company.catalyst}
              </div>

              {/* Action */}
              <button
                onClick={() => router.push(`/?q=${encodeURIComponent(company.name)}`)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(218,199,105,0.1)",
                  border: "1px solid rgba(218,199,105,0.3)",
                  borderRadius: "2px",
                  color: "#dac769",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s ease, color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dac769";
                  e.currentTarget.style.color = "#0A0C10";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(218,199,105,0.1)";
                  e.currentTarget.style.color = "#dac769";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  analytics
                </span>
                Launch Agent Analysis
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
