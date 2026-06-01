/**
 * Short, pleasant two-note chime for new notifications, synthesized with the
 * Web Audio API (no asset needed). The Notifications API only plays the OS
 * sound when the tab is backgrounded; this guarantees an audible cue even when
 * the page is focused.
 *
 * Browser autoplay policy requires the AudioContext to be created/resumed after
 * a user gesture — call `primeNotificationSound()` from a click handler once
 * (e.g. the notification bell) to unlock it.
 */

let ctx: AudioContext | null = null;

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/** Call once from a user gesture to unlock audio (Safari/Chrome autoplay policy). */
export function primeNotificationSound() {
  const c = getCtx();
  if (c && c.state === "suspended") {
    c.resume().catch(() => { /* ignored */ });
  }
}

/** Play the notification chime. No-op if audio is unavailable or still locked. */
export function playNotificationSound() {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    // Try to resume; if it's still blocked (no prior gesture) this no-ops.
    c.resume().catch(() => { /* ignored */ });
  }

  const now = c.currentTime;
  // Two soft sine notes (E6 → A6) with a quick fade so it's a gentle "ding".
  const notes = [
    { freq: 1318.5, start: 0, dur: 0.16 },
    { freq: 1760.0, start: 0.12, dur: 0.22 },
  ];
  for (const note of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    const t0 = now + note.start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + note.dur + 0.02);
  }
}
