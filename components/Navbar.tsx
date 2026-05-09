"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Home,
  BarChart2,
  Briefcase,
  BookOpen,
  Users,
  TrendingUp,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationsBell from "./NotificationsBell";

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
  userAvatar?: string | null;
  userEmail: string;
}

export default function Navbar({ userName, userInitial, userAvatar, userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
        background: "rgba(10,8,6,0.92)",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "58px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <img
            src="/selo.png"
            alt="Aurum"
            style={{
              height: "36px",
              width: "36px",
              objectFit: "contain",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              color: "#e8dcc0",
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
            }}
          >
            Aurum
          </span>
        </button>

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
                  padding: "7px 15px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.2s",
                  background: isActive
                    ? "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)"
                    : "transparent",
                  color: isActive ? "#0d0b07" : "#9a8a6a",
                  boxShadow: isActive
                    ? "0 2px 12px rgba(201,168,76,0.3)"
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <NavIconBtn
            label="Configurações"
            onClick={() => router.push("/dashboard/configuracoes")}
          >
            <Settings size={16} />
          </NavIconBtn>
          <NotificationsBell userEmail={userEmail} />

          {/* Avatar + Dropdown */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu do usuário"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: userAvatar
                  ? `url(${userAvatar}) center/cover no-repeat`
                  : "linear-gradient(135deg, #C9A84C, #8B6914)",
                border: "2px solid rgba(201,168,76,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0d0b07",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.2s",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
              }}
            >
              {!userAvatar && userInitial}
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "44px",
                  right: 0,
                  background: "#130f09",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "8px",
                  padding: "8px",
                  minWidth: "180px",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
                }}
              >
                <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid #2a2010", marginBottom: "6px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#e8dcc0", fontFamily: "var(--font-sans)", marginBottom: "2px" }}>
                    {userName}
                  </p>
                  <p style={{ fontSize: "11px", color: "#9a8a6a", fontFamily: "var(--font-sans)" }}>
                    Membro Aurum
                  </p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); router.push("/dashboard/perfil"); }}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "#e8dcc0",
                    fontSize: "13px",
                    fontFamily: "var(--font-sans)",
                    padding: "7px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "5px",
                    transition: "background 0.15s",
                    marginBottom: "4px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e8dcc0"; }}
                >
                  Meu Perfil
                </button>
                <button
                  onClick={() => { setMenuOpen(false); router.push("/dashboard/configuracoes"); }}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "#e8dcc0",
                    fontSize: "13px",
                    fontFamily: "var(--font-sans)",
                    padding: "7px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "5px",
                    transition: "background 0.15s",
                    marginBottom: "4px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.color = "#C9A84C"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e8dcc0"; }}
                >
                  Configurações
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "rgba(248,113,113,0.75)",
                    fontSize: "13px",
                    fontFamily: "var(--font-sans)",
                    padding: "7px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    borderRadius: "5px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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

function NavIconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "8px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#a09068",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(201,168,76,0.08)";
        e.currentTarget.style.color = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#a09068";
      }}
    >
      {children}
    </button>
  );
}
