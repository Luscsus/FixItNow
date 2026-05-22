import type React from "react";
import {
  IconDrop,
  IconBolt,
  IconSpark,
  IconWrench,
  IconCmd,
  IconHammer,
  IconKey,
} from "./BrowseIcons";

export type Segment = "category" | "location" | "experience" | "budget" | "sort";

export const PAGE_SIZE = 8;

export const ALL_CATEGORIES = [
  { key: "PLUMBING", label: "Plumbing", Icon: IconDrop },
  { key: "ELECTRICAL", label: "Electrical", Icon: IconBolt },
  { key: "HVAC", label: "HVAC", Icon: IconSpark },
  { key: "HARDWARE", label: "Hardware", Icon: IconWrench },
  { key: "IT", label: "IT / Software", Icon: IconCmd },
  { key: "CARPENTRY", label: "Carpentry", Icon: IconHammer },
  { key: "LOCKSMITH", label: "Locksmith", Icon: IconKey },
];

export const CATEGORY_LABEL: Record<string, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  HVAC: "HVAC",
  HARDWARE: "Hardware",
  IT: "IT / Software",
  CARPENTRY: "Carpentry",
  LOCKSMITH: "Locksmith",
};

export const EXP_PRESETS = [
  { label: "Any", value: 0 },
  { label: "1+ yr", value: 1 },
  { label: "3+ yr", value: 3 },
  { label: "5+ yr", value: 5 },
  { label: "10+ yr", value: 10 },
];

export const BUDGET_PRESETS = [
  { label: "Any", min: "", max: "" },
  { label: "< $50", min: "1", max: "49" },
  { label: "$50–$100", min: "50", max: "100" },
  { label: "$100–$150", min: "100", max: "150" },
  { label: "$150+", min: "150", max: "" },
];

export const SORT_OPTIONS = [
  { value: "default", label: "Best match" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "exp_desc", label: "Most experienced" },
  { value: "distance_asc", label: "Closest first" },
];

export const AVATAR_PALETTE = [
  { bg: "#0B1E3F", color: "#F59E0B" },
  { bg: "#065F46", color: "#fff" },
  { bg: "#1E3A8A", color: "#fff" },
  { bg: "#6D28D9", color: "#fff" },
  { bg: "#B45309", color: "#fff" },
  { bg: "#374151", color: "#fff" },
];

export function avatarColor(id: string) {
  const h = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export const DROPDOWN: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  background: "var(--card, #fff)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.05)",
  zIndex: 200,
};

export const FILTER_HEAD: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
};

export const RANGE_ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  color: "var(--text-muted)",
  marginTop: 6,
};
