import type { Metadata } from "next";
import SobreContent from "./SobreContent";

export const metadata: Metadata = {
  title: "Conheça o Aurum | Aurum Investimentos",
};

export default function SobrePage() {
  return <SobreContent />;
}
