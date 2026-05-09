import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard shadcn `cn` helper: clsx for conditional class composition + tailwind-merge
 * to dedupe conflicting Tailwind utilities (e.g. `px-2 px-4` → `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
