import { Button, Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { getPingChannelIds, readAllPingsWithToast } from "./readPings";
import { useReadAllPingsSettings } from "./storage";

export default function ReadAllPingsSettings() {
    const store = useReadAllPingsSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Action">
                    <Button
                        text={`Read all pings (${getPingChannelIds().length} unread)`}
                        variant="primary"
                        onPress={() => { void readAllPingsWithToast(); }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Settings">
                    <TableSwitchRow
                        label="Show confirmation toast"
                        subLabel="Show a toast with how many channels were cleared"
                        value={store.showToast}
                        onValueChange={(v: boolean) => store.updateSettings({ showToast: v })}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
