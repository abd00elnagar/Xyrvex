import { Utils } from "electrobun/bun";
import { join } from "node:path";
import type { SessionData, AppSettings } from "../shared/types";

const sessionPath = join(Utils.paths.userData, "session.json");

const DEFAULT_SESSION: SessionData = {
    lastOpenedPath: null,
    windowMaximized: false,
    autoSave: false
};

export async function loadSession(): Promise<SessionData> {
    try {
        const file = Bun.file(sessionPath);
        if (!(await file.exists())) {
            return DEFAULT_SESSION;
        }
        const data = await file.json();
        return { ...DEFAULT_SESSION, ...data };
    } catch (e) {
        console.error("[Session] Error loading session:", e);
        return DEFAULT_SESSION;
    }
}

export async function saveSession(data: Partial<SessionData>): Promise<void> {
    try {
        const current = await loadSession();
        const updated = { ...current, ...data };
        await Bun.write(sessionPath, JSON.stringify(updated, null, 2));
    } catch (e) {
        console.error("[Session] Error saving session:", e);
    }
}

const settingsPath = join(Utils.paths.userData, "settings.json");

export const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    accentColor: 'emerald',
    fontSizeSql: 14,
    fontSizeTable: 13,
    confirmDrop: true,
    autoRefresh: true
};

export async function loadSettings(): Promise<AppSettings> {
    try {
        const file = Bun.file(settingsPath);
        if (!(await file.exists())) {
            return DEFAULT_SETTINGS;
        }
        const data = await file.json();
        return { ...DEFAULT_SETTINGS, ...data };
    } catch (e) {
        console.error("[Settings] Error loading settings:", e);
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(data: Partial<AppSettings>): Promise<void> {
    try {
        const current = await loadSettings();
        const updated = { ...current, ...data };
        await Bun.write(settingsPath, JSON.stringify(updated, null, 2));
    } catch (e) {
        console.error("[Settings] Error saving settings:", e);
    }
}
