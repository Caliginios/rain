import type { CalendarEvent, EventKind } from "./storage";

export const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Feb 29 falls back to Feb 28 in non-leap years. */
function effectiveDay(ev: CalendarEvent, year: number) {
    return ev.month === 2 && ev.day === 29 && !isLeap(year) ? 28 : ev.day;
}

export function occursOn(ev: CalendarEvent, date: Date): boolean {
    if (ev.month !== date.getMonth() + 1) return false;
    if (effectiveDay(ev, date.getFullYear()) !== date.getDate()) return false;
    if (ev.yearly) return ev.year == null || date.getFullYear() >= ev.year;
    return ev.year != null && ev.year === date.getFullYear();
}

export function eventsOn(events: CalendarEvent[], date: Date) {
    return events.filter(e => occursOn(e, date));
}

/** Events in the next `days` days (excluding today), with days-until. */
export function upcoming(events: CalendarEvent[], from: Date, days: number) {
    const out: { ev: CalendarEvent; inDays: number; date: Date }[] = [];
    for (let i = 1; i <= days; i++) {
        const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        for (const ev of eventsOn(events, d)) out.push({ ev, inDays: i, date: d });
    }
    return out;
}

const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

export function describe(ev: CalendarEvent, date: Date, when: "today" | "tomorrow" | { inDays: number }) {
    const age = ev.kind === "birthday" && ev.year != null ? date.getFullYear() - ev.year : null;
    const turning = age && age > 0 ? ` (turning ${age})` : "";

    const prefix =
        when === "today" ? "Today" :
            when === "tomorrow" ? "Tomorrow" :
                `In ${when.inDays} days`;

    if (ev.kind === "birthday") {
        return `${prefix} is ${possessive(ev.title)} birthday${turning}`;
    }
    return `${prefix}: ${ev.title}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const formatDate = (ev: CalendarEvent) =>
    `${ev.day} ${MONTHS[ev.month - 1]}${ev.year != null ? ` ${ev.year}` : ""}`;

/**
 * Accepts DD/MM or DD/MM/YYYY (also - or . as separators).
 * Returns null on anything invalid.
 */
export function parseDate(input: string): { day: number; month: number; year?: number } | null {
    const m = input.trim().match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{4}))?$/);
    if (!m) return null;

    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = m[3] ? Number(m[3]) : undefined;

    if (month < 1 || month > 12 || day < 1) return null;
    const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (day > maxDay) return null;

    return { day, month, year };
}

export function parseKind(input?: string): EventKind {
    const v = (input ?? "").toLowerCase();
    if (v.startsWith("b")) return "birthday";
    if (v.startsWith("h")) return "holiday";
    return "event";
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
