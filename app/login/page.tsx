import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar | Aurum Investimentos",
};

export default function LoginPage() {
  return <LoginForm />;
}
