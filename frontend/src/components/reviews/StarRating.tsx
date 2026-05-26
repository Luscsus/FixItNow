import { useState } from "react";

interface StarRatingProps {
  value: number;            // current rating (0–5; 0 = none)
  size?: number;            // px
  interactive?: boolean;    // if true, calls onChange on click
  onChange?: (v: number) => void;
}

// A classic, well-formed 5-point star, drawn in a 24×24 viewBox.
// Both the fill (for filled state) and stroke (for outline) use the same
// path so screen scaling / mobile devices render it crisply.
const STAR_PATH =
  "M12 17.27 L18.18 21 L16.54 13.97 L22 9.24 L14.81 8.63 L12 2 L9.19 8.63 L2 9.24 L7.46 13.97 L5.82 21 Z";

const FILLED = "#F59E0B";   // amber-500
const EMPTY  = "#D1D5DB";   // gray-300 — visible on white card backgrounds

/**
 * Simple 5-star rating. Half-stars not supported (keep it simple).
 * In display mode, a non-integer `value` is rounded to the nearest int.
 */
export function StarRating({
  value,
  size = 18,
  interactive = false,
  onChange,
}: Readonly<StarRatingProps>) {
  const [hover, setHover] = useState<number>(0);
  const displayValue = interactive && hover > 0 ? hover : Math.round(value);

  return (
    <span
      style={{
        display: "inline-flex",
        gap: 2,
        lineHeight: 0,
        verticalAlign: "middle",
      }}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating: ${value.toFixed(1)} out of 5`}
      onMouseLeave={() => {
        if (interactive) setHover(0);
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const isOn = n <= displayValue;
        const color = isOn ? FILLED : EMPTY;
        const Star = (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", flexShrink: 0 }}
            aria-hidden="true"
          >
            <path
              d={STAR_PATH}
              fill={color}
              stroke={color}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </svg>
        );
        if (!interactive) return <span key={n}>{Star}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === Math.round(value)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange?.(n)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              lineHeight: 0,
              display: "inline-flex",
            }}
          >
            {Star}
          </button>
        );
      })}
    </span>
  );
}
