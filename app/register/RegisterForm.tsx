"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: "#0d0b07" }}
      >
        <DecorativeCircles />
        <div
          className="relative z-10 w-full text-center"
          style={{
            maxWidth: "420px",
            margin: "0 auto",
            background: "#130f09",
            borderRadius: "4px",
            padding: "44px 40px 36px",
            boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
          }}
        >
          <AurumLogo />
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "1.5px solid rgba(201,168,76,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "32px auto 20px",
              color: "#C9A84C",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            className="font-display font-bold mb-2"
            style={{ fontSize: "22px", color: "#e8e0d0" }}
          >
            Conta criada!
          </h2>
          <p
            className="font-sans"
            style={{ fontSize: "13px", color: "#9a8a6a", lineHeight: 1.6, marginBottom: "32px" }}
          >
            Verifique seu e-mail para confirmar o cadastro antes de entrar.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full font-sans font-semibold uppercase tracking-[0.14em]"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)",
              color: "#0d0b07",
              border: "none",
              borderRadius: "3px",
              padding: "14px",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 2px 16px rgba(201,168,76,0.25)",
            }}
          >
            Ir para o login
          </button>
          <p
            className="text-center font-sans mt-8"
            style={{ fontSize: "10px", color: "#3a3020" }}
          >
            ©2026 Grupo Aurum. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#0d0b07" }}
    >
      <DecorativeCircles />

      {/* Card */}
      <div
        className="relative z-10 w-full animate-fade-in"
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          background: "#130f09",
          borderRadius: "4px",
          padding: "44px 40px 36px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <AurumLogo />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1
            className="font-display font-bold mb-1"
            style={{ fontSize: "28px", lineHeight: 1.2, color: "#e8e0d0" }}
          >
            Criar conta
          </h1>
          <p
            className="uppercase tracking-[0.18em] font-sans"
            style={{ fontSize: "11px", color: "#9a8a6a", marginTop: "6px" }}
          >
            Preencha seus dados
          </p>
          <div
            style={{
              width: "32px",
              height: "2px",
              background: "linear-gradient(90deg, #C9A84C, #8B6914)",
              marginTop: "10px",
              borderRadius: "1px",
            }}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block font-sans uppercase tracking-[0.18em] mb-2"
              style={{ fontSize: "10px", color: "#7a6a4a" }}
            >
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              placeholder="Seu nome"
              style={{
                width: "100%",
                background: "#1a1508",
                border: "1px solid #2a2010",
                borderRadius: "3px",
                padding: "12px 14px",
                color: "#e8dcc0",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2010"; }}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block font-sans uppercase tracking-[0.18em] mb-2"
              style={{ fontSize: "10px", color: "#7a6a4a" }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com.br"
              style={{
                width: "100%",
                background: "#1a1508",
                border: "1px solid #2a2010",
                borderRadius: "3px",
                padding: "12px 14px",
                color: "#e8dcc0",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2010"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block font-sans uppercase tracking-[0.18em] mb-2"
              style={{ fontSize: "10px", color: "#7a6a4a" }}
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Mín. 6 caracteres"
                style={{
                  width: "100%",
                  background: "#1a1508",
                  border: "1px solid #2a2010",
                  borderRadius: "3px",
                  padding: "12px 44px 12px 14px",
                  color: "#e8dcc0",
                  fontSize: "14px",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2010"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(201,168,76,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(201,168,76,0.8)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(201,168,76,0.4)"; }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-sans uppercase tracking-[0.18em] mb-2"
              style={{ fontSize: "10px", color: "#7a6a4a" }}
            >
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "#1a1508",
                  border: "1px solid #2a2010",
                  borderRadius: "3px",
                  padding: "12px 44px 12px 14px",
                  color: "#e8dcc0",
                  fontSize: "14px",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2010"; }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(201,168,76,0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(201,168,76,0.8)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(201,168,76,0.4)"; }}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="font-sans leading-relaxed"
              style={{ fontSize: "12px", color: "rgba(248,113,113,0.8)" }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-sans font-semibold uppercase tracking-[0.14em] transition-all active:scale-[0.985]"
            style={{
              background: loading
                ? "rgba(201,168,76,0.5)"
                : "linear-gradient(135deg, #C9A84C 0%, #A07820 100%)",
              color: "#0d0b07",
              border: "none",
              borderRadius: "3px",
              padding: "14px",
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 2px 16px rgba(201,168,76,0.25)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 24px rgba(201,168,76,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 2px 16px rgba(201,168,76,0.25)";
              }
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Criando conta...
              </span>
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div style={{ flex: 1, height: "1px", background: "#2a2010" }} />
          <span
            className="font-sans"
            style={{ fontSize: "11px", color: "#5a4a2a", letterSpacing: "0.1em" }}
          >
            OU
          </span>
          <div style={{ flex: 1, height: "1px", background: "#2a2010" }} />
        </div>

        {/* Back to login */}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full font-sans font-medium uppercase tracking-[0.14em] transition-all"
          style={{
            background: "transparent",
            color: "#9a8a6a",
            border: "1px solid #2a2010",
            borderRadius: "3px",
            padding: "13px",
            fontSize: "12px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.35)";
            (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2010";
            (e.currentTarget as HTMLButtonElement).style.color = "#9a8a6a";
          }}
        >
          Já tenho conta / Entrar
        </button>

        {/* Footer */}
        <p
          className="text-center font-sans mt-8"
          style={{ fontSize: "10px", color: "#3a3020" }}
        >
          ©2026 Grupo Aurum. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

function DecorativeCircles() {
  return (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-180px",
          left: "-180px",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          border: "1px solid rgba(180,150,60,0.12)",
          boxShadow: "0 0 0 40px rgba(180,150,60,0.04)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-100px",
          left: "-100px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          border: "1px solid rgba(180,150,60,0.08)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-200px",
          right: "-180px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          border: "1px solid rgba(180,150,60,0.10)",
          boxShadow: "0 0 0 40px rgba(180,150,60,0.03)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-120px",
          right: "-100px",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          border: "1px solid rgba(180,150,60,0.06)",
        }}
      />
    </>
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
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function AurumLogo() {
  return (
    <img
      src="/logo.png"
      alt="Aurum Grupo — Fundado em Valor"
      style={{
        height: "130px",
        objectFit: "contain",
        maxWidth: "380px",
      }}
    />
  );
}
