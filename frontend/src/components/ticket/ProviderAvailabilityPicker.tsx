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

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtTime(d: Date) {
  return d.getMinutes() === 0 ? `${d.getHours()}:00` : `${d.getHours()}:${pad(d.getMinutes())}`;
}

function formatIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function slotTimeLabel(slot: PublicTimeBlock): string {
  return `${fmtTime(new Date(slot.startAt))}–${fmtTime(new Date(slot.endAt))}`;
}

export function ProviderAvailabilityPicker({
  providerId,
  selectedStart,
  selectedEnd,
  onSelect,
}: ProviderAvailabilityPickerProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const now = useMemo(() => new Date(), []);

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
    const available = (blocks ?? []).filter(
      (b) => b.type === "AVAILABLE" && new Date(b.startAt) >= weekStart && new Date(b.startAt) < weekEnd,
    );
    const map = new Map<string, PublicTimeBlock[]>();
    for (const slot of available) {
      const d = new Date(slot.startAt);
      const key = `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [blocks, weekStart, weekEnd]);

  if (isLoading) {
    return <div className="avail-loading">Loading availability…</div>;
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
                {slots.map((slot, i) => {
                  const selected = slot.startAt === selectedStart && slot.endAt === selectedEnd;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`avail-slot${selected ? " selected" : ""}`}
                      onClick={() => onSelect(slot.startAt, slot.endAt)}
                    >
                      {selected ? "● " : "○ "}
                      {slotTimeLabel(slot)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
