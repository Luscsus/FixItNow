import { useMemo, useState } from "react";
import { useProviderCalendarQuery } from "@/hooks/useProviderCalendarQuery";
import type { PublicTimeBlock } from "@/services/calendarService";

interface ProviderAvailabilityPickerProps {
  providerId: string;
  selectedStart: string | null;
  selectedEnd: string | null;
  onSelect: (startAt: string, endAt: string) => void;
}

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STEP_MIN = 30;
const STEP_MS = STEP_MIN * 60 * 1000;

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtTime(d: Date) {
  return `${d.getHours()}:${pad(d.getMinutes())}`;
}

function formatIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ticks(fromMs: number, toMs: number): Date[] {
  const out: Date[] = [];
  for (let t = fromMs; t <= toMs; t += STEP_MS) out.push(new Date(t));
  return out;
}

function selectionInsideSlot(slot: PublicTimeBlock, selStart: string | null, selEnd: string | null) {
  if (!selStart || !selEnd) return false;
  const ss = new Date(slot.startAt).getTime();
  const se = new Date(slot.endAt).getTime();
  const xs = new Date(selStart).getTime();
  const xe = new Date(selEnd).getTime();
  return xs >= ss && xe <= se && xe > xs;
}

export function ProviderAvailabilityPicker({
  providerId,
  selectedStart,
  selectedEnd,
  onSelect,
}: ProviderAvailabilityPickerProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const now = useMemo(() => new Date(), []);

  // Next 30-min boundary at or after now — earliest bookable time
  const minBookableMs = useMemo(
    () => Math.ceil(now.getTime() / STEP_MS) * STEP_MS,
    [now],
  );

  const in4Weeks = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 28);
    return d;
  }, [now]);

  const fromIso = useMemo(() => formatIsoLocal(now), [now]);
  const toIso   = useMemo(() => formatIsoLocal(in4Weeks), [in4Weeks]);

  const { data: blocks, isLoading } = useProviderCalendarQuery(providerId, fromIso, toIso);

  const weekStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    // snap back to Monday (0=Sun → -6, 1=Mon → 0, 2=Tue → -1, …)
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return d;
  }, [now, weekOffset]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const endDay = new Date(weekEnd);
    endDay.setDate(endDay.getDate() - 1);
    const sameMonth = weekStart.getMonth() === endDay.getMonth();
    return sameMonth
      ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${endDay.getDate()}`
      : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[endDay.getMonth()]} ${endDay.getDate()}`;
  }, [weekStart, weekEnd]);

  const grouped = useMemo(() => {
    const available = (blocks ?? []).filter((b) => {
      if (b.type !== "AVAILABLE") return false;
      const start = new Date(b.startAt);
      const end = new Date(b.endAt);
      // must fall within the displayed week
      if (start < weekStart || start >= weekEnd) return false;
      // must still have at least one bookable 30-min chunk remaining
      return end.getTime() > minBookableMs;
    });
    available.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    const map = new Map<string, PublicTimeBlock[]>();
    for (const slot of available) {
      const d = new Date(slot.startAt);
      const key = `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [blocks, weekStart, weekEnd, minBookableMs]);

  if (isLoading) {
    return <div className="avail-loading">Loading availability…</div>;
  }

  function renderSlot(slot: PublicTimeBlock, key: number) {
    const isActive = selectionInsideSlot(slot, selectedStart, selectedEnd);
    const slotStartMs = new Date(slot.startAt).getTime();
    const slotEndMs = new Date(slot.endAt).getTime();
    // earliest From time: the later of slot start and the next 30-min boundary after now
    const effectiveStartMs = Math.max(slotStartMs, minBookableMs);
    const canPickAny = slotEndMs - effectiveStartMs >= STEP_MS;

    if (!isActive) {
      return (
        <button
          key={key}
          type="button"
          className="avail-slot"
          onClick={() => {
            if (!canPickAny) return;
            const defaultStart = new Date(effectiveStartMs);
            const defaultEnd   = new Date(Math.min(effectiveStartMs + STEP_MS, slotEndMs));
            onSelect(formatIsoLocal(defaultStart), formatIsoLocal(defaultEnd));
          }}
          disabled={!canPickAny}
        >
          ○ {fmtTime(new Date(effectiveStartMs))}–{fmtTime(new Date(slot.endAt))}
        </button>
      );
    }

    const fromMs = new Date(selectedStart!).getTime();
    const toMs   = new Date(selectedEnd!).getTime();

    // From options start at effectiveStartMs so no past times appear
    const fromOptions = ticks(effectiveStartMs, slotEndMs - STEP_MS);
    const toOptions   = ticks(fromMs + STEP_MS, slotEndMs);

    return (
      <div key={key} className="avail-slot selected avail-slot-active">
        <div className="avail-slot-active-head">
          ● {fmtTime(new Date(effectiveStartMs))}–{fmtTime(new Date(slot.endAt))} available
        </div>
        <div className="avail-slot-range">
          <label className="avail-range-field">
            <span>From</span>
            <select
              value={formatIsoLocal(new Date(fromMs))}
              onChange={(e) => {
                const newFrom = new Date(e.target.value);
                let newTo = new Date(toMs);
                if (newTo.getTime() <= newFrom.getTime()) {
                  newTo = new Date(Math.min(newFrom.getTime() + STEP_MS, slotEndMs));
                }
                onSelect(formatIsoLocal(newFrom), formatIsoLocal(newTo));
              }}
            >
              {fromOptions.map((d) => (
                <option key={d.getTime()} value={formatIsoLocal(d)}>{fmtTime(d)}</option>
              ))}
            </select>
          </label>
          <span className="avail-range-dash">–</span>
          <label className="avail-range-field">
            <span>To</span>
            <select
              value={formatIsoLocal(new Date(toMs))}
              onChange={(e) => {
                const newTo = new Date(e.target.value);
                onSelect(formatIsoLocal(new Date(fromMs)), formatIsoLocal(newTo));
              }}
            >
              {toOptions.map((d) => (
                <option key={d.getTime()} value={formatIsoLocal(d)}>{fmtTime(d)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="avail-picker">
      <div className="avail-week-nav">
        <button
          type="button"
          className="avail-nav-btn"
          disabled={weekOffset === 0}
          onClick={() => setWeekOffset((w) => w - 1)}
        >
          ‹
        </button>
        <span className="avail-week-label">{weekLabel}</span>
        <button
          type="button"
          className="avail-nav-btn"
          disabled={weekOffset === 3}
          onClick={() => setWeekOffset((w) => w + 1)}
        >
          ›
        </button>
      </div>

      {grouped.size === 0 ? (
        <div className="avail-empty">No available slots this week.</div>
      ) : (
        <div className="avail-days">
          {Array.from(grouped.entries()).map(([dayLabel, slots]) => (
            <div key={dayLabel} className="avail-day-group">
              <div className="avail-day-label">{dayLabel}</div>
              <div className="avail-slots-row">
                {slots.map((slot, i) => renderSlot(slot, i))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
