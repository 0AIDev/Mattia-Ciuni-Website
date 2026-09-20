// Minimal `cn` helper (nessuna dipendenza: clsx/tailwind-merge non installati).
// Le icone lucide-animated importano `cn` da `@/lib/utils`.
export function cn(
  ...inputs: (string | undefined | null | false)[]
): string {
  return inputs.filter(Boolean).join(" ");
}
