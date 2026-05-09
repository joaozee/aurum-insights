"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenciais inválidas. Verifique seu email e senha.");
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-shell)]">
      <DecorativeCircles />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto bg-card rounded-sm px-10 pt-11 pb-9 shadow-[0_8px_48px_rgba(0,0,0,0.6)] animate-fade-in">
        <div className="flex justify-center mb-10">
          <img
            src="/logo.png"
            alt="Aurum Grupo, Fundado em Valor"
            className="h-[130px] max-w-[380px] object-contain"
          />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-[28px] leading-tight text-[#e8e0d0]">
            Bem-vindo
          </h1>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Acesse sua conta
          </p>
          <div className="mt-2.5 h-0.5 w-8 rounded-[1px] bg-gradient-to-r from-gold to-gold-dim" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field id="email" label="E-mail">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com.br"
            />
          </Field>

          <Field id="password" label="Senha">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gold)]/40 hover:text-[var(--gold)]/80 transition-colors focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <div className="text-right">
            <Button
              asChild
              variant="link"
              size="sm"
              className="text-xs px-0 h-auto text-primary hover:text-gold-light"
            >
              <a href="/forgot-password">Esqueci minha senha</a>
            </Button>
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive/85 leading-relaxed">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="gold"
            disabled={loading}
            className="w-full uppercase tracking-[0.14em] active:scale-[0.985]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[#2a2010]" />
          <span className="text-[11px] tracking-[0.1em] text-[var(--text-faint)]">OU</span>
          <div className="flex-1 h-px bg-[#2a2010]" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/register")}
          className="w-full uppercase tracking-[0.14em] text-xs h-[46px] rounded-sm border-[#2a2010] text-[var(--text-faint)] hover:text-primary hover:border-[var(--border-emphasis)]"
        >
          Criar conta
        </Button>

        <p className="text-center text-[10px] mt-8 text-[#3a3020]">
          ©2026 Grupo Aurum. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Field({
  id, label, children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={id}
        className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function DecorativeCircles() {
  // Warm gold rings drawn at the canvas corners. Pure ambience: no info, but
  // they tint the empty space with the brand without resorting to the now-banned
  // glassmorphism or radial-glow halos elsewhere in the app.
  return (
    <>
      <Ring className="-top-[180px] -left-[180px] w-[520px] h-[520px] border-[rgba(180,150,60,0.12)] shadow-[0_0_0_40px_rgba(180,150,60,0.04)]" />
      <Ring className="-top-[100px] -left-[100px] w-[360px] h-[360px] border-[rgba(180,150,60,0.08)]" />
      <Ring className="-bottom-[200px] -right-[180px] w-[560px] h-[560px] border-[rgba(180,150,60,0.10)] shadow-[0_0_0_40px_rgba(180,150,60,0.03)]" />
      <Ring className="-bottom-[120px] -right-[100px] w-[380px] h-[380px] border-[rgba(180,150,60,0.06)]" />
    </>
  );
}

function Ring({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={cn("absolute pointer-events-none rounded-full border", className)}
    />
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
