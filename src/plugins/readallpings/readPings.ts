import { showToast } from "@api/ui/toasts";
import { FluxDispatcher } from "@metro/common";
import { ReadStateStore } from "@metro/common/stores";
import { findByProps } from "@metro/wrappers";

export interface ReadResult {
    ok: boolean;
    count: number;
    message: string;
}

/** Channel ids (servers + DMs) that currently have unread @mentions. */
export function getPingChannelIds(): string[] {
    try {
        const ids = ReadStateStore.getMentionChannelIds?.();
        if (Array.isArray(ids)) return ids;
        if (ids && typeof ids[Symbol.iterator] === "function") return [...ids];
    } catch (e) {
        console.error("[ReadAllPings] getMentionChannelIds failed:", e);
    }
    return [];
}

function lastMessageId(channelId: string): string | undefined {
    try {
        return ReadStateStore.lastMessageId?.(channelId) ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * Marks every channel with unread mentions as read.
 * Prefers Discord's own bulk ack (one request); falls back to per-channel ack.
 */
export async function readAllPings(): Promise<ReadResult> {
    const channelIds = getPingChannelIds();
    if (channelIds.length === 0) {
        return { ok: true, count: 0, message: "No unread pings." };
    }

    const bulk = findByProps("bulkAck");
    const single = findByProps("ack", "ackCategory") ?? findByProps("ackChannel");

    try {
        if (bulk?.bulkAck) {
            const payload = channelIds
                .map(channelId => ({
                    channelId,
                    messageId: lastMessageId(channelId),
                    readStateType: 0,
                }))
                .filter(e => e.messageId != null);

            bulk.bulkAck(payload);
            return { ok: true, count: payload.length, message: `Marked ${payload.length} ping channel(s) as read.` };
        }

        const ackFn = single?.ack ?? single?.ackChannel;
        if (ackFn) {
            let done = 0;
            for (const channelId of channelIds) {
                try {
                    ackFn(channelId, true, true);
                    done++;
                } catch (e) {
                    console.error(`[ReadAllPings] ack failed for ${channelId}:`, e);
                }
                // small gap so we don't burst the API
                await new Promise(r => setTimeout(r, 120));
            }
            return { ok: done > 0, count: done, message: `Marked ${done}/${channelIds.length} ping channel(s) as read.` };
        }
    } catch (e) {
        console.error("[ReadAllPings] ack failed:", e);
        return { ok: false, count: 0, message: "Discord rejected the ack. See debug logs." };
    }

    return { ok: false, count: 0, message: "Couldn't find Discord's ack function in this build." };
}

export async function readAllPingsWithToast() {
    const result = await readAllPings();
    showToast(result.message);
    if (result.ok && result.count > 0) {
        // nudge stores that cache badge counts
        FluxDispatcher.dispatch({ type: "RAIN_PINGS_READ" });
    }
    return result;
}
