import { showToast } from "@api/ui/toasts";
import { React } from "@metro/common";
import { Button, Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { EventKind, useCalendarSettings } from "./storage";
import { formatDate, newId, parseDate } from "./util";

const KINDS: { id: EventKind; label: string }[] = [
    { id: "birthday", label: "Birthday" },
    { id: "event", label: "Event" },
    { id: "holiday", label: "Holiday" },
];

export default function CalendarSettings() {
    const store = useCalendarSettings();
    const [title, setTitle] = React.useState("");
    const [date, setDate] = React.useState("");
    const [kind, setKind] = React.useState<EventKind>("birthday");

    const add = () => {
        const parsed = parseDate(date);
        if (!title.trim()) return showToast("Give it a name first");
        if (!parsed) return showToast("Date must look like 25/12 or 25/12/2000");

        store.updateSettings({
            events: [
                ...store.events,
                {
                    id: newId(),
                    title: title.trim(),
                    day: parsed.day,
                    month: parsed.month,
                    year: parsed.year,
                    kind,
                    // one-off events need a year; otherwise repeat yearly
                    yearly: kind !== "event" || parsed.year == null,
                },
            ],
        });
        setTitle("");
        setDate("");
        showToast(`Added ${title.trim()}`);
    };

    const remove = (id: string) =>
        store.updateSettings({ events: store.events.filter(e => e.id !== id) });

    const sorted = [...store.events].sort((a, b) => a.month - b.month || a.day - b.day);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }} keyboardShouldPersistTaps="handled">
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Add">
                    <TableRow
                        label="Name"
                        subLabel={
                            <View style={{ marginTop: 8 }}>
                                <TextInput placeholder="e.g. Ebru, or Diwali" value={title} onChange={setTitle} isClearable />
                            </View>
                        }
                    />
                    <TableRow
                        label="Date (DD/MM or DD/MM/YYYY)"
                        subLabel={
                            <View style={{ marginTop: 8 }}>
                                <TextInput placeholder="25/12  or  25/12/2000" value={date} onChange={setDate} isClearable />
                            </View>
                        }
                    />
                    <TableRow
                        label="Type"
                        subLabel={
                            <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
                                {KINDS.map(k => (
                                    <Button
                                        key={k.id}
                                        text={k.label}
                                        variant={kind === k.id ? "primary" : "secondary"}
                                        onPress={() => setKind(k.id)}
                                    />
                                ))}
                            </View>
                        }
                    />
                    <Button text="Add to calendar" variant="primary" onPress={add} />
                </TableRowGroup>

                <TableRowGroup title={`Saved (${sorted.length})`}>
                    {sorted.length === 0 ? (
                        <TableRow label="Nothing yet" subLabel="Add a birthday or event above" />
                    ) : sorted.map(ev => (
                        <TableRow
                            key={ev.id}
                            label={ev.title}
                            subLabel={`${ev.kind} - ${formatDate(ev)}${ev.yearly ? " - every year" : ""}`}
                            trailing={<Button text="Delete" variant="destructive" onPress={() => remove(ev.id)} />}
                        />
                    ))}
                </TableRowGroup>

                <TableRowGroup title="Settings">
                    <TableSwitchRow
                        label="Remind me when Discord opens"
                        subLabel="Shows a toast for today's events, once per day"
                        value={store.remindOnLaunch}
                        onValueChange={(v: boolean) => store.updateSettings({ remindOnLaunch: v })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
