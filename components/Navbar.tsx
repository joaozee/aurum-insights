"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  BarChart2,
  Briefcase,
  BookOpen,
  Users,
  TrendingUp,
  Settings,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Início", href: "/dashboard", icon: Home },
  { label: "Finanças", href: "/dashboard/financas", icon: BarChart2 },
  { label: "Carteira", href: "/dashboard/carteira", icon: Briefcase },
  { label: "Cursos", href: "/dashboard/cursos", icon: BookOpen },
  { label: "Comunidade", href: "/dashboard/comunidade", icon: Users },
  { label: "Ações", href: "/dashboard/acoes", icon: TrendingUp },
];

interface NavbarProps {
  userName: string;
  userInitial: string;
}

export default function Navbar({ userName, userInitial }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#0a0806",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "32px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={() => router.push("/dashboard")}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1.5px solid #C9A84C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C9A84C",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
            }}
          >
            A
          </div>
          <span
            style={{
              color: "#e8dcc0",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.04em",
            }}
          >
            Aurum
          </span>
        </div>

        {/* Nav items — center */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                  background: isActive
                    ? "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)"
                    : "transparent",
                  color: isActive ? "#0d0b07" : "#9a8a6a",
                  boxShadow: isActive
                    ? "0 2px 10px rgba(201,168,76,0.25)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#C9A84C";
                    e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#9a8a6a";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Right icons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <IconBtn aria-label="Configurações">
            <Settings size={16} />
          </IconBtn>
          <IconBtn aria-label="Notificações">
            <Bell size={16} />
          </IconBtn>

          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu do usuário"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #C9A84C, #8B6914)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d0b07",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
              }}
            >
              {userInitial}
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  right: 0,
                  background: "#130f09",
                  border: "1px solid #2a2010",
                  borderRadius: "6px",
                  padding: "8px",
                  minWidth: "160px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  zIndex: 100,
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "#7a6a4a",
                    padding: "4px 8px 8px",
                    borderBottom: "1px solid #2a2010",
                    marginBottom: "8px",
                  }}
                >
                  {userName}
                </p>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "rgba(248,113,113,0.8)",
                    fontSize: "13px",
                    fontFamily: "var(--font-sans)",
                    padding: "6px 8px",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function IconBtn({
  children,
  "aria-label": label,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      aria-label={label}
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#7a6a4a",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(201,168,76,0.08)";
        e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#7a6a4a";
      }}
    >
      {children}
    </button>
  );
}
