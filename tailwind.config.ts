import type { Config } from "tailwindcss";

/**
 * Tailwind config — wires shadcn semantic color names to the Aurum CSS
 * variables defined in app/globals.css. shadcn components written against
 * `bg-primary`, `text-muted-foreground`, etc. resolve to the warm-dark
 * gold-tinted Aurum palette without ever hardcoding a hex.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // ─── shadcn semantic tokens (mapped to Aurum) ─────────────
        background: "var(--bg-page)",
        foreground: "var(--text-default)",
        card: {
          DEFAULT: "var(--bg-card)",
          foreground: "var(--text-default)",
        },
        popover: {
          DEFAULT: "var(--bg-card)",
          foreground: "var(--text-default)",
        },
        primary: {
          DEFAULT: "var(--gold)",
          foreground: "#0d0b07",
        },
        secondary: {
          DEFAULT: "var(--bg-card-hover)",
          foreground: "var(--text-default)",
        },
        muted: {
          DEFAULT: "var(--bg-card-hover)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--bg-card-hover)",
          foreground: "var(--gold)",
        },
        destructive: {
          DEFAULT: "var(--negative)",
          foreground: "#f0e8d0",
        },
        border: "var(--border-soft)",
        input: "var(--border-soft)",
        ring: "var(--gold)",

        // ─── Aurum-specific extensions ────────────────────────────
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          dim: "var(--gold-dim)",
        },
        positive: {
          DEFAULT: "var(--positive)",
          bg: "var(--positive-bg)",
        },
        negative: {
          DEFAULT: "var(--negative)",
          bg: "var(--negative-bg)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
          6: "var(--chart-6)",
          7: "var(--chart-7)",
          8: "var(--chart-8)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "14px",
        md: "10px",
        sm: "6px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.55s ease-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
