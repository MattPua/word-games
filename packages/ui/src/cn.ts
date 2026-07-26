/** Light class joiner — enough for package widgets (no twMerge dep). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
