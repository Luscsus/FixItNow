import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { searchAddresses, type AddressSuggestion } from "@/services/geocodeService";

interface Props {
  /** Current text value. */
  value: string;
  /** Called on every keystroke (free typing) — clears any picked coords. */
  onTextChange: (text: string) => void;
  /** Called when the user picks a suggestion — provides exact coordinates. */
  onSelect: (s: AddressSuggestion) => void;
  /** True once a suggestion has been picked (drives the ✓ affordance). */
  resolved: boolean;
  placeholder?: string;
  hasError?: boolean;
}

/**
 * Address field with Nominatim-backed autocomplete. Typing shows ranked
 * suggestions; picking one yields exact lat/lng (and a canonical, city-qualified
 * address) so navigation and tracking are accurate. Free text is still allowed,
 * but without coordinates the destination falls back to server-side geocoding.
 */
export function AddressAutocomplete({
  value,
  onTextChange,
  onSelect,
  resolved,
  placeholder,
  hasError,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounce(value, 350);

  // Only search when there's enough text and the user hasn't already picked.
  const enabled = open && debounced.trim().length >= 3 && !resolved;
  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["addressSearch", debounced],
    queryFn: () => searchAddresses(debounced),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(s: AddressSuggestion) {
    onSelect(s);
    setOpen(false);
    setActiveIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && enabled && suggestions.length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className={`input-wrap${hasError ? " error" : ""}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          className="input"
          value={value}
          placeholder={placeholder ?? "Start typing a street address…"}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            onTextChange(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {resolved && (
          <span title="Address located" style={{ color: "var(--emerald-600, #059669)", flexShrink: 0, display: "inline-flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
      </div>

      {/* One solid panel for all states (results / searching / empty) so nothing
          floats over the field hint below. */}
      {open && enabled && (showDropdown || isFetching || debounced.trim().length >= 3) && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                key={`${s.lat},${s.lng}`}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                  padding: "10px 14px",
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  border: "none",
                  borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  cursor: "pointer",
                  background: i === activeIdx ? "var(--slate-100)" : "var(--card)",
                  color: "var(--text)",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {s.displayName}
              </button>
            ))
          ) : (
            <div style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-muted)" }}>
              {isFetching ? "Searching…" : "No matching addresses."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
