/** Up to two uppercase initials from a display name ("Marko N." -> "MN"). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_BGS = [
  { bg: "var(--amber-500)", color: "var(--navy-900)" },
  { bg: "oklch(0.65 0.06 60)", color: "#fff" },
  { bg: "oklch(0.65 0.06 200)", color: "#fff" },
  { bg: "oklch(0.65 0.06 130)", color: "#fff" },
  { bg: "oklch(0.62 0.07 320)", color: "#fff" },
];

/** Deterministic avatar palette pick from a name, so it's stable across renders. */
export function avatarStyleFor(name: string): { bg: string; color: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_BGS[Math.abs(hash) % AVATAR_BGS.length];
}

/** Compact, localized "x ago" label (e.g. "2 MIN AGO"). Falls back to "JUST NOW". */
export function timeAgo(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  let out: string;
  if (sec < 45) return locale.startsWith("sl") ? "PRAVKAR" : "JUST NOW";
  if (sec < 3600) out = rtf.format(-Math.round(sec / 60), "minute");
  else if (sec < 86400) out = rtf.format(-Math.round(sec / 3600), "hour");
  else out = rtf.format(-Math.round(sec / 86400), "day");
  return out.toUpperCase();
}
