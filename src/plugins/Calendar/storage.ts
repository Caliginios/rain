import { createPluginStore } from "@api/storage";

export type EventKind = "birthday" | "event" | "holiday";

export interface CalendarEvent {
    id: string;
    title: string;
    /** 1-12 */
    month: number;
    /** 1-31 */
    day: number;
    /** Optional. For birthdays this enables "turning N". */
    year?: number;
    kind: EventKind;
    /** Repeats every year. Birthdays/holidays default to true. */
    yearly: boolean;
}

interface CalendarSettings {
    events: CalendarEvent[];
    remindOnLaunch: boolean;
    /** YYYY-MM-DD of the last day we already reminded for */
    lastRemindedDay: string;
    upcomingDays: number;
}

export const {
    useStore: useCalendarSettings,
    settings: calendarSettings,
} = createPluginStore<CalendarSettings>("calendar", {
    events: [],
    remindOnLaunch: true,
    lastRemindedDay: "",
    upcomingDays: 7,
});
