import { showToast } from "@api/ui/toasts";

import { calendarSettings } from "./storage";
import { dayKey, describe, eventsOn, upcoming } from "./util";

export function todayLines(now = new Date()): string[] {
    return eventsOn(calendarSettings.events, now).map(ev => describe(ev, now, "today"));
}

export function upcomingLines(now = new Date(), days = calendarSettings.upcomingDays): string[] {
    return upcoming(calendarSettings.events, now, days).map(({ ev, inDays, date }) =>
        describe(ev, date, inDays === 1 ? "tomorrow" : { inDays })
    );
}

/** Shows today's reminders once per calendar day. Returns true if anything was shown. */
export function remindIfNeeded(force = false): boolean {
    const now = new Date();
    const key = dayKey(now);
    if (!force && calendarSettings.lastRemindedDay === key) return false;

    const lines = todayLines(now);
    calendarSettings.lastRemindedDay = key;
    if (lines.length === 0) return false;

    // one toast per event so none get truncated
    lines.forEach((line, i) => setTimeout(() => showToast(line), i * 2500));
    return true;
}
