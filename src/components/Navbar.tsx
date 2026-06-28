"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  isAnalyzing: boolean;
  hasResults: boolean;
}

const NAV_LINKS = [
  { label: "Terminal", href: "/" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Contact", href: "#footer" },
];

export function Navbar({ isAnalyzing, hasResults }: NavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.style.borderBottomColor =
          window.scrollY > 10
            ? "rgba(69, 71, 75, 0.6)"
            : "rgba(69, 71, 75, 0.3)";
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 64px",
        background: "rgba(18, 20, 20, 0.85)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        borderBottom: "1px solid rgba(69, 71, 75, 0.3)",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Left: Logo + Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
        {/* Logo */}
        <a
          href="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "-0.01em",
            color: "#e2e2e2",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          MERIDIAN
        </a>

        {/* Nav Links */}
        <div className="nav-links" style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href || (href !== "/" && href !== "#footer" && pathname?.startsWith(href));
            return (
              <a
                key={label}
                href={href}
                onClick={(e) => {
                  if (href.startsWith("#")) {
                    // Let anchor link work natively for smooth scroll if on same page
                    // Or push if we want Next router to handle it
                  } else {
                    e.preventDefault();
                    router.push(href);
                  }
                }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isActive ? "#dac769" : "#c6c6cb",
                  textDecoration: "none",
                  borderBottom: isActive ? "2px solid #dac769" : "2px solid transparent",
                  paddingBottom: "4px",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "#e2e2e2";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "#c6c6cb";
                }}
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Right: Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

        {/* Profile */}
        {userEmail ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#909095",
                maxWidth: "160px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </span>
            <button
              aria-label="Logout"
              onClick={handleLogout}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px", borderRadius: "4px", color: "#c6c6cb",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "color 0.2s ease, background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#ffb4ab";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(40,42,43,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#c6c6cb";
                (e.currentTarget as HTMLButtonElement).style.background = "none";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px", fontVariationSettings: "'FILL' 0" }}>
                logout
              </span>
            </button>
          </div>
        ) : (
          <a
            href="/login"
            style={{
              padding: "6px 16px",
              background: "#dac769",
              color: "#0A0C10",
              borderRadius: "2px",
              textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Sign In
          </a>
        )}
      </div>
    </nav>
  );
}
