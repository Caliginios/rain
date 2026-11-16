import { createPluginStore } from "@api/storage";

interface ReadAllPingsSettings {
    showToast: boolean;
}

export const {
    useStore: useReadAllPingsSettings,
    settings: readAllPingsSettings,
} = createPluginStore<ReadAllPingsSettings>("readallpings", {
    showToast: true,
});
