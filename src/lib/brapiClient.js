// Frontend brapi client — routes through backend proxy to use server-side BRAPI_API_KEY
import { base44 } from "@/api/base44Client";

export function getBrapiToken() { return ""; }
export function setBrapiToken() {}
export function clearBrapiCache() {}

export async function brapiFetch(path, { signal } = {}) {
  const response = await base44.functions.invoke("brapiProxy", { path }, { signal });
  return response.data;
}

export function formatUpdatedAt() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}