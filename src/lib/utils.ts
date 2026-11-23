import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names safely, including conflicting Tailwind utilities.
 * Shared by shadcn/ui-compatible components and custom studio components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
