import { useEffect, useState } from "react";
import type {
  RecurrenceFrequency,
  TimeBlock,
  TimeBlockType,
} from "@/services/calendarService";
import {
  useCreateTimeBlockMutation,
  useUpdateTimeBlockMutation,
  useDeleteTimeBlockMutation,
  useDeleteTimeBlockSeriesMutation,
} from "@/hooks/useOwnCalendarQuery";
import { useToast } from "@/components/ui/toast";

interface BlockTimeModalProps {
  open: boolean;
  onClose: () => void;
  initial?: TimeBlock | null;
  defaultDate?: string;
}

const SELECTABLE_TYPES: TimeBlockType[] = ["AVAILABLE", "BREAK", "OFF"];

function toLocalInputValue(iso: string | null | undefined, fallback?: string): string {
  if (!iso) {
    if (!fallback) return "";
    return fallback;
  }
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(local: string): string {
  // datetime-local has no timezone; treat as local time and send as ISO without offset.
  return local.length === 16 ? `${local}:00` : local;
}

export function BlockTimeModal({ open, onClose, initial, defaultDate }: BlockTimeModalProps) {
  const isEdit = Boolean(initial);
  const createMut = useCreateTimeBlockMutation();
  const updateMut = useUpdateTimeBlockMutation();
  const deleteMut = useDeleteTimeBlockMutation();
  const deleteSeriesMut = useDeleteTimeBlockSeriesMutation();
  const { notify } = useToast();

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [type, setType] = useState<TimeBlockType>("AVAILABLE");
  const [repeat, setRepeat] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("WEEKLY");
  const [count, setCount] = useState(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initial) {
      setStartAt(toLocalInputValue(initial.startAt));
      setEndAt(toLocalInputValue(initial.endAt));
      setType(initial.type === "BOOKED" ? "AVAILABLE" : initial.type);
    } else {
      const start = defaultDate
        ? (defaultDate.includes("T") ? defaultDate : `${defaultDate}T09:00`)
        : toLocalInputValue(new Date().toISOString());
      const end = (() => {
        if (!defaultDate) {
          return toLocalInputValue(new Date(new Date().getTime() + 60 * 60 * 1000).toISOString());
        }
        const startStr = defaultDate.includes("T") ? defaultDate : `${defaultDate}T09:00`;
        const d = new Date(startStr);
        d.setHours(d.getHours() + 1);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${startStr.split("T")[0]}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      })();
      setStartAt(start);
      setEndAt(end);
      setType("AVAILABLE");
    }
    setRepeat(false);
    setFrequency("WEEKLY");
    setCount(3);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, initial, defaultDate]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      startAt: fromLocalInputValue(startAt),
      endAt: fromLocalInputValue(endAt),
      type,
      title: null,
      notes: null,
      recurrence: !isEdit && repeat ? { frequency, count } : null,
    };
    try {
      if (isEdit && initial) {
        await updateMut.mutateAsync({ id: initial.id, payload });
      } else {
        const result = await createMut.mutateAsync(payload);
        if (result.skipped.length > 0) {
          notify(
            `Added ${result.created.length} block${result.created.length === 1 ? "" : "s"}; skipped ${result.skipped.length} that overlapped existing blocks.`,
            "info",
          );
        }
      }
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save block.";
      setError(msg);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setError(null);
    try {
      await deleteMut.mutateAsync(initial.id);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete block.";
      setError(msg);
    }
  }

  async function handleDeleteSeries() {
    if (!initial?.seriesId) return;
    setError(null);
    try {
      await deleteSeriesMut.mutateAsync(initial.seriesId);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete series.";
      setError(msg);
    }
  }

  const submitting =
    createMut.isPending ||
    updateMut.isPending ||
    deleteMut.isPending ||
    deleteSeriesMut.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <form
        className="block-time-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: "var(--card, #fff)",
          padding: 28,
          borderRadius: 12,
          width: "min(480px, 92vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        <h3 style={{ margin: "0 0 18px", fontSize: 18 }}>
          {isEdit ? "Edit time block" : "Block time"}
        </h3>

        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TimeBlockType)}
          style={{ width: "100%", padding: "8px 10px", marginBottom: 14, border: "1px solid var(--border, #e2e8f0)", borderRadius: 6 }}
        >
          {SELECTABLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "AVAILABLE" ? "Available" : t === "BREAK" ? "Break" : "Off"}
            </option>
          ))}
        </select>

        <div className="block-time-modal__times" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Start</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border, #e2e8f0)", borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>End</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border, #e2e8f0)", borderRadius: 6 }}
            />
          </div>
        </div>

        {!isEdit && (
          <div style={{ marginBottom: 14, padding: "12px 14px", border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, background: "var(--muted, #f8fafc)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
              />
              Repeat this block
            </label>

            {repeat && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border, #e2e8f0)", borderRadius: 6 }}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                    Occurrences
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={count}
                    onChange={(e) => setCount(Math.min(12, Math.max(2, Number(e.target.value) || 2)))}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border, #e2e8f0)", borderRadius: 6 }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--muted-foreground, #64748b)" }}>
                  Creates {count} blocks, one every {frequency === "WEEKLY" ? "week" : "day"}. Occurrences that overlap existing blocks are skipped.
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="btn btn-danger btn-sm"
              >
                {initial?.seriesId ? "Delete this" : "Delete"}
              </button>
            )}
            {isEdit && initial?.seriesId && (
              <button
                type="button"
                onClick={handleDeleteSeries}
                disabled={submitting}
                className="btn btn-danger btn-sm"
              >
                Delete series
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
