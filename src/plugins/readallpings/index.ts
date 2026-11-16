import { registerCommand } from "@api/commands";
import { ApplicationCommand } from "@api/commands/types";
import { showToast } from "@api/ui/toasts";
import { messageUtil } from "@metro/common";
import { definePlugin } from "@plugins";

import { readAllPings } from "./readPings";
import Settings from "./Settings";
import { readAllPingsSettings } from "./storage";

let unregister: (() => void) | undefined;

const readPingsCommand = (): ApplicationCommand & { shouldHide: () => boolean } => ({
    name: "readpings",
    description: "Mark every unread ping (servers + DMs) as read",
    shouldHide: () => false,
    async execute(_args, ctx) {
        const result = await readAllPings();
        if (readAllPingsSettings.showToast) showToast(result.message);
        messageUtil.sendBotMessage(ctx.channel.id, result.message);
    },
});

export default definePlugin({
    name: "ReadAllPings",
    description: "One tap to clear every unread ping. Use /readpings or the button in this plugin's settings.",
    author: [{ name: "Caliginios", id: 0n }],
    id: "readallpings",
    version: "1.0.0",
    start() {
        unregister = registerCommand(readPingsCommand());
    },
    stop() {
        unregister?.();
        unregister = undefined;
    },
    settings: Settings,
});
