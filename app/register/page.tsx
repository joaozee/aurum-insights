import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta | Aurum Investimentos",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
