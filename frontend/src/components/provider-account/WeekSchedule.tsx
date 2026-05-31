import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { useOwnCalendarQuery } from "@/hooks/useOwnCalendarQuery";
import { useProviderCalendarQuery } from "@/hooks/useProviderCalendarQuery";
import { useMediaQuery, BREAKPOINTS } from "@/hooks/useBreakpoint";
import type { PublicTimeBlock, TimeBlock, TimeBlockType } from "@/services/calendarService";
import { BlockTimeModal } from "./BlockTimeModal";

interface WeekScheduleProps {
  providerId: string;
  editable: boolean;
}

type AnyBlock = TimeBlock | PublicTimeBlock;

function isOwnerBlock(b: AnyBlock): b is TimeBlock {
  return (b as TimeBlock).id !== undefined;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function formatDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatIsoLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function weekRangeLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getDate()}–${end.getDate()}`;
  }
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;
}

function dayLabel(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function renderBlockLabel(b: AnyBlock): string {
  if (b.type === "BOOKED") {
    const owner = (b as TimeBlock).title;
    if (owner && owner.trim()) return owner.trim();
    const pub = (b as PublicTimeBlock).label;
    if (pub && pub.trim()) return pub.trim();
    return "Booked";
  }
  return b.type === "AVAILABLE" ? "Available"
    : b.type === "BREAK" ? "Break"
    : "Off";
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const m = d.getMinutes();
  return m === 0 ? `${d.getHours()}:00` : `${d.getHours()}:${pad(m)}`;
}

function eventPropsForType(type: TimeBlockType) {
  switch (type) {
    case "AVAILABLE": return { backgroundColor: "#D1FAE5", borderColor: "transparent", textColor: "#047857" };
    case "BREAK":     return { backgroundColor: "#EFF3FB", borderColor: "transparent", textColor: "#142C5E" };
    case "BOOKED":    return { backgroundColor: "#FFFBEB", borderColor: "transparent", textColor: "#B45309" };
    case "OFF":       return { backgroundColor: "transparent", borderColor: "transparent", textColor: "#64748B" };
  }
}

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function EventContent({ arg, editable }: { arg: EventContentArg; editable: boolean }) {
  const type = arg.event.extendedProps.type as TimeBlockType;
  const block = arg.event.extendedProps.block as AnyBlock | undefined;
  const start = arg.event.start;
  const end = arg.event.end;

  let timeText = start ? formatTime(start) : arg.timeText;
  if (start && end && end.getTime() - start.getTime() >= 60 * 60 * 1000) {
    timeText = `${formatTime(start)}–${formatTime(end)}`;
  }

  const isOff = type === "OFF";
  const label = block ? renderBlockLabel(block) : "";
  const isRecurring = Boolean(block && isOwnerBlock(block) && block.seriesId);

  return (
    <div
      className={`fc-block-inner fc-block-${type.toLowerCase()}`}
      style={{
        padding: "4px 6px",
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.4,
        overflow: "hidden",
        height: "100%",
        cursor: editable && type !== "BOOKED" ? "pointer" : "default",
        ...(isOff ? {
          backgroundImage: "repeating-linear-gradient(135deg, #F1F5F9 0 6px, #E2E8F0 6px 12px)",
        } : {}),
      }}
    >
      <b style={{ display: "block", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.04em" }}>
        {timeText}
      </b>
      {label}
      {isRecurring && (
        <span title="Repeats" style={{ marginLeft: 4, opacity: 0.7 }}>↻</span>
      )}
    </div>
  );
}

export function WeekSchedule({ providerId, editable }: WeekScheduleProps) {
  const calRef = useRef<FullCalendar>(null);
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const [rangeStart, setRangeStart] = useState<Date>(() => startOfWeek(new Date()));
  const [rangeEnd, setRangeEnd] = useState<Date>(() => {
    const d = startOfWeek(new Date());
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  // Only use initialDate on first mount — FullCalendar ignores changes after mount anyway
  const initialDate = useMemo(() => startOfWeek(new Date()), []);

  // When the viewport crosses the mobile breakpoint, swap FullCalendar views.
  useEffect(() => {
    const api = calRef.current?.getApi();
    if (!api) return;
    api.changeView(isMobile ? "timeGridDay" : "timeGridWeek");
  }, [isMobile]);

  const fromIso = useMemo(() => formatIsoLocal(rangeStart), [rangeStart]);
  const toIso   = useMemo(() => formatIsoLocal(rangeEnd),   [rangeEnd]);

  const ownQuery    = useOwnCalendarQuery(fromIso, toIso, editable);
  const publicQuery = useProviderCalendarQuery(editable ? undefined : providerId, fromIso, toIso);

  const blocks: AnyBlock[] = useMemo(
    () => (editable ? ownQuery.data : publicQuery.data) ?? [],
    [editable, ownQuery.data, publicQuery.data],
  );

  const events = useMemo(
    () =>
      blocks.map((b, i) => ({
        id: isOwnerBlock(b) && b.id ? b.id : `virt-${i}`,
        title: renderBlockLabel(b),
        start: b.startAt,
        end: b.endAt,
        extendedProps: { type: b.type, block: b },
        classNames: [`fc-block-${b.type.toLowerCase()}`],
        ...eventPropsForType(b.type),
        editable: false,
      })),
    [blocks],
  );

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRangeStart((prev) =>
      prev.getTime() === arg.start.getTime() ? prev : new Date(arg.start),
    );
    setRangeEnd((prev) =>
      prev.getTime() === arg.end.getTime() ? prev : new Date(arg.end),
    );
  }, []);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      if (!editable) return;
      const d = arg.date;
      const pad = (n: number) => String(n).padStart(2, "0");
      setEditingBlock(null);
      setDefaultDate(`${formatDateOnly(d)}T${pad(d.getHours())}:00`);
      setModalOpen(true);
    },
    [editable],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      if (!editable) return;
      const block = arg.event.extendedProps.block as AnyBlock;
      if (!isOwnerBlock(block) || block.type === "BOOKED" || !block.id) return;
      setEditingBlock(block);
      setDefaultDate(undefined);
      setModalOpen(true);
    },
    [editable],
  );

  const renderContent = useCallback(
    (arg: EventContentArg) => <EventContent arg={arg} editable={editable} />,
    [editable],
  );

  return (
    <>
      <div className="panel-title">
        <span className="num">03</span>
        <span className="label">
          {isMobile ? dayLabel(rangeStart) : `This week · ${weekRangeLabel(rangeStart)}`}
        </span>
        <span className="rule" />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => calRef.current?.getApi().prev()}
            aria-label={isMobile ? "Previous day" : "Previous week"}
          >
            ‹
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => calRef.current?.getApi().today()}
          >
            Today
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => calRef.current?.getApi().next()}
            aria-label={isMobile ? "Next day" : "Next week"}
          >
            ›
          </button>
          {editable && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingBlock(null);
                setDefaultDate(undefined);
                setModalOpen(true);
              }}
            >
              + Block time
            </button>
          )}
        </div>
      </div>

      <div className="fc-week-calendar" style={{ marginBottom: 32 }}>
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          initialDate={initialDate}
          headerToolbar={false}
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          events={events}
          eventContent={renderContent}
          dateClick={editable ? handleDateClick : undefined}
          eventClick={handleEventClick}
          height="auto"
          slotDuration="01:00:00"
          slotLabelInterval="01:00:00"
          nowIndicator
          editable={false}
          selectable={false}
          datesSet={handleDatesSet}
          dayHeaderContent={(arg) => (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  color: arg.isToday ? "var(--amber-700)" : "var(--text-muted)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                {DAY_ABBR[arg.date.getDay()]}
              </span>
              <b
                style={{
                  display: "block",
                  color: arg.isToday ? "var(--amber-700)" : "var(--text)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 2,
                  letterSpacing: "-0.01em",
                }}
              >
                {arg.date.getDate()}
              </b>
            </div>
          )}
          slotLabelContent={(arg) => {
            const h = arg.date.getHours();
            const label =
              h === 0 ? "12AM" :
              h < 12  ? `${h}AM` :
              h === 12 ? "12PM" :
              `${h - 12}PM`;
            return (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </span>
            );
          }}
        />
      </div>

      {editable && (
        <BlockTimeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initial={editingBlock}
          defaultDate={defaultDate}
        />
      )}
    </>
  );
}
