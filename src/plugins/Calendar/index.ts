import { registerCommand } from "@api/commands";
import { ApplicationCommandOptionType, RainApplicationCommand } from "@api/commands/types";
import { FluxDispatcher, messageUtil } from "@metro/common";
import { definePlugin } from "@plugins";

import { remindIfNeeded, todayLines, upcomingLines } from "./reminders";
import Settings from "./Settings";
import { calendarSettings } from "./storage";
import { formatDate, newId, parseDate, parseKind } from "./util";

const unregisters: (() => void)[] = [];
let timer: ReturnType<typeof setInterval> | undefined;
let launchTimeout: ReturnType<typeof setTimeout> | undefined;

const reply = (ctx: any, text: string) => messageUtil.sendBotMessage(ctx.channel.id, text);

const todayCommand = (): RainApplicationCommand => ({
    name: "today",
    description: "Show today's events and birthdays",
    shouldHide: () => false,
    execute(_args, ctx) {
        const today = todayLines();
        const soon = upcomingLines();
        const parts = [
            today.length ? today.join("\n") : "Nothing on the calendar today.",
            ...(soon.length ? ["", `Coming up (${calendarSettings.upcomingDays} days):`, ...soon.map(l => `- ${l}`)] : []),
        ];
        reply(ctx, parts.join("\n"));
    },
});

const addEventCommand = (): RainApplicationCommand => ({
    name: "addevent",
    description: "Add a birthday or event, e.g. /addevent Ebru 25/12/2000 birthday",
    shouldHide: () => false,
    options: [
        { name: "name", description: "Who or what", type: ApplicationCommandOptionType.STRING, required: true },
        { name: "date", description: "DD/MM or DD/MM/YYYY", type: ApplicationCommandOptionType.STRING, required: true },
        { name: "type", description: "birthday, event or holiday (default: event)", type: ApplicationCommandOptionType.STRING },
    ],
    execute(args, ctx) {
        const get = (n: string) => args.find(a => a.name === n)?.value as string | undefined;
        const name = get("name")?.trim();
        const parsed = parseDate(get("date") ?? "");

        if (!name) return reply(ctx, "Give the event a name.");
        if (!parsed) return reply(ctx, "Date must look like 25/12 or 25/12/2000.");

        const kind = parseKind(get("type"));
        const ev = {
            id: newId(),
            title: name,
            day: parsed.day,
            month: parsed.month,
            year: parsed.year,
            kind,
            yearly: kind !== "event" || parsed.year == null,
        };
        calendarSettings.events = [...calendarSettings.events, ev];
        reply(ctx, `Added ${kind}: ${name} on ${formatDate(ev)}.`);
    },
});

export default definePlugin({
    name: "Calendar",
    description: "A tiny built-in calendar: reminds you of birthdays and events on the day. Use /today or /addevent.",
    author: [{ name: "Caliginios", id: 0n }],
    id: "calendar",
    version: "1.0.0",
    start() {
        unregisters.push(registerCommand(todayCommand()));
        unregisters.push(registerCommand(addEventCommand()));

        // Wait for Discord to finish connecting so the toast isn't swallowed by the splash.
        const kick = () => {
            if (calendarSettings.remindOnLaunch) remindIfNeeded();
        };
        launchTimeout = setTimeout(kick, 6000);

        // If the app stays open past midnight, remind again for the new day.
        timer = setInterval(kick, 15 * 60 * 1000);
        FluxDispatcher.subscribe("APP_STATE_UPDATE", onAppState);
    },
    stop() {
        unregisters.splice(0).forEach(u => u());
        if (timer) clearInterval(timer);
        if (launchTimeout) clearTimeout(launchTimeout);
        timer = launchTimeout = undefined;
        FluxDispatcher.unsubscribe("APP_STATE_UPDATE", onAppState);
    },
    settings: Settings,
});

function onAppState(e: { state?: string }) {
    if (e?.state === "active" && calendarSettings.remindOnLaunch) {
        setTimeout(() => remindIfNeeded(), 1500);
    }
}
