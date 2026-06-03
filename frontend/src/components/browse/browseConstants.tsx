import type React from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  IconDrop,
  IconBolt,
  IconSpark,
  IconWrench,
  IconCmd,
  IconHammer,
  IconKey,
  IconBook,
  IconLeaf,
  IconHome,
  IconBrush,
  IconSparkles,
  IconTruck,
  IconBug,
  IconDots,
} from "./BrowseIcons";

export type Segment = "category" | "location" | "experience" | "budget" | "sort";

export const PAGE_SIZE = 8;

export const CATEGORY_META: Record<string, { label: string; Icon: ComponentType<{ size?: number }> }> = {
  PLUMBING:        { label: "Plumbing",        Icon: IconDrop },
  ELECTRICAL:      { label: "Electrical",      Icon: IconBolt },
  HVAC:            { label: "HVAC",            Icon: IconSpark },
  CARPENTRY:       { label: "Carpentry",       Icon: IconHammer },
  ROOFING:         { label: "Roofing",         Icon: IconHome },
  PAINTING:        { label: "Painting",        Icon: IconBrush },
  APPLIANCE_REPAIR:{ label: "Appliance Repair",Icon: IconWrench },
  LOCKSMITH:       { label: "Locksmith",       Icon: IconKey },
  CLEANING:        { label: "Cleaning",        Icon: IconSparkles },
  GARDENING:       { label: "Gardening",       Icon: IconLeaf },
  PEST_CONTROL:    { label: "Pest Control",    Icon: IconBug },
  MOVING:          { label: "Moving",          Icon: IconTruck },
  IT_SUPPORT:      { label: "IT Support",      Icon: IconCmd },
  TUTORING:        { label: "Tutoring",        Icon: IconBook },
  OTHER:           { label: "Other",           Icon: IconDots },
};

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.label]),
);

export const EXP_PRESETS = [
  { label: "Any", value: 0 },
  { label: "1+ yr", value: 1 },
  { label: "3+ yr", value: 3 },
  { label: "5+ yr", value: 5 },
  { label: "10+ yr", value: 10 },
];

export const BUDGET_PRESETS = [
  { label: "Any", min: "", max: "" },
  { label: "< €50", min: "1", max: "49" },
  { label: "€50–€100", min: "50", max: "100" },
  { label: "€100–€150", min: "100", max: "150" },
  { label: "€150+", min: "150", max: "" },
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
  const h = [...id].reduce((s, c) => s + (c.codePointAt(0) ?? 0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

/** Returns category labels, filter presets, and sort options in the active language. */
export function useBrowseI18n() {
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = Object.fromEntries(
    Object.keys(CATEGORY_META).map((key) => [key, t(`categories.${key}`, CATEGORY_META[key].label)]),
  );

  const expPresets = [
    { label: t("filterSidebar.any"),  value: 0 },
    { label: t("filterSidebar.yr1"),  value: 1 },
    { label: t("filterSidebar.yr3"),  value: 3 },
    { label: t("filterSidebar.yr5"),  value: 5 },
    { label: t("filterSidebar.yr10"), value: 10 },
  ];

  const sortOptions = [
    { value: "default",      label: t("filterSidebar.bestMatch") },
    { value: "price_asc",    label: t("filterSidebar.lowestPrice") },
    { value: "price_desc",   label: t("filterSidebar.highestPrice") },
    { value: "exp_desc",     label: t("filterSidebar.mostExperienced") },
    { value: "distance_asc", label: t("filterSidebar.closestFirst") },
  ];

  return { categoryLabels, expPresets, sortOptions };
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
