import type { Metadata } from "next";
import SobreContent from "./SobreContent";

export const metadata: Metadata = {
  title: "Conheça a Aurum | Aurum Investimentos",
};

export default function SobrePage() {
  return <SobreContent />;
}
