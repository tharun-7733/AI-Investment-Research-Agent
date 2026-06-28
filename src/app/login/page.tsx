"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handle = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Check your email for the confirmation link, then sign in.");
        setMode("login");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0C10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          fontSize: "28px",
          letterSpacing: "-0.01em",
          color: "#e2e2e2",
          marginBottom: "8px",
        }}
      >
        EQUITY ANALYTICA
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          color: "#909095",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "48px",
        }}
      >
        AI Investment Research Terminal
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#161B22",
          border: "0.5px solid rgba(69,71,75,0.5)",
          borderRadius: "4px",
          padding: "40px",
        }}
      >
        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "32px",
            borderBottom: "1px solid rgba(69,71,75,0.3)",
          }}
        >
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              style={{
                background: "none",
                border: "none",
                borderBottom: mode === m ? "2px solid #dac769" : "2px solid transparent",
                padding: "8px 20px 12px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: mode === m ? "#dac769" : "#909095",
                cursor: "pointer",
                transition: "color 0.2s ease",
                marginBottom: "-1px",
              }}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#909095",
                marginBottom: "8px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{
                width: "100%",
                background: "#0c0f0f",
                border: "1px solid rgba(69,71,75,0.4)",
                borderRadius: "2px",
                padding: "10px 14px",
                color: "#e2e2e2",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#dac769")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(69,71,75,0.4)")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#909095",
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handle()}
              style={{
                width: "100%",
                background: "#0c0f0f",
                border: "1px solid rgba(69,71,75,0.4)",
                borderRadius: "2px",
                padding: "10px 14px",
                color: "#e2e2e2",
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#dac769")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(69,71,75,0.4)")}
            />
          </div>

          {/* Error / Info */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(255,180,171,0.08)",
                border: "1px solid rgba(255,180,171,0.25)",
                borderRadius: "2px",
                color: "#ffb4ab",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}
          {info && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(168,207,189,0.08)",
                border: "1px solid rgba(168,207,189,0.25)",
                borderRadius: "2px",
                color: "#a8cfbd",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
              }}
            >
              {info}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handle}
            disabled={loading || !email || !password}
            style={{
              marginTop: "8px",
              padding: "12px",
              background: loading || !email || !password ? "rgba(218,199,105,0.4)" : "#dac769",
              color: "#0A0C10",
              border: "none",
              borderRadius: "2px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: loading || !email || !password ? "not-allowed" : "pointer",
              transition: "background 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading && (
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(10,12,16,0.3)",
                  borderTopColor: "#0A0C10",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }}
              />
            )}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          color: "#45474b",
          letterSpacing: "0.06em",
          textAlign: "center",
        }}
      >
        EQUITY ANALYTICA · NOT FINANCIAL ADVICE · JWT SECURED
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
