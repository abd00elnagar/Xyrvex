import { Utils } from "electrobun/bun";
import { join } from "node:path";
import type { SessionData } from "../shared/types";

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
