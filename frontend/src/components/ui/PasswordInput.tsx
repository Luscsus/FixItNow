import { forwardRef, useState, type InputHTMLAttributes } from "react";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** True when this field should be visually marked as having an error. */
  hasError?: boolean;
}

function IconLock() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.79 19.79 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.92 10.92 0 0 1 12 4c7 0 11 7 11 7a19.85 19.85 0 0 1-3.16 4" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * Password input that matches the project's auth-form styling (lock icon on
 * the left, full `input-wrap` border + focus ring) and includes a built-in
 * show/hide toggle on the right. Drop-in replacement for the bare `<input
 * type="password" className="input">` pattern that was scattered across
 * the auth pages.
 *
 * Usage:
 *   <PasswordInput
 *     id="login-password"
 *     placeholder="Your password"
 *     value={password}
 *     onChange={(e) => setPassword(e.target.value)}
 *     hasError={Boolean(errors.password)}
 *   />
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ hasError, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className={`input-wrap${hasError ? " error" : ""}`}>
        <IconLock />
        <input
          ref={ref}
          {...rest}
          type={visible ? "text" : "password"}
          className={`input${className ? ` ${className}` : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    );
  },
);
