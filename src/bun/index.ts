import Electrobun, { BrowserWindow, Updater, Utils, defineElectrobunRPC } from "electrobun/bun";
import type { AppSchema } from "../shared/types";

process.on('uncaughtException', (err) => {
	console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

import { createDbHandlers, getIsDirty } from "./ipc/handlers";
import { getDatabase, closeDatabase } from "./db/connection";
import { commitOnly, rollbackTransaction } from "./db/transaction";

// RPC Setup
const rpc = defineElectrobunRPC<AppSchema>("bun", {
	handlers: {
		requests: {}
	}
});

const dbHandlers = createDbHandlers(rpc);

rpc.setRequestHandler({
	dbOpen: dbHandlers.dbOpen,
	dbOpenByPath: dbHandlers.dbOpenByPath,
	dbCreate: dbHandlers.dbCreate,
	dbSave: dbHandlers.dbSave,
	dbSaveAs: dbHandlers.dbSaveAs,
	dbClose: dbHandlers.dbClose,
	tableList: dbHandlers.tableList,
	tableFetchAll: dbHandlers.tableFetchAll,
	cellUpdate: dbHandlers.cellUpdate,
	rowDelete: dbHandlers.rowDelete,
	terminalExec: dbHandlers.terminalExec,
	cellExec: dbHandlers.cellExec,
	rowInsert: dbHandlers.rowInsert,
	autosaveSet: dbHandlers.autosaveSet,
	sessionGet: dbHandlers.sessionGet,
	// Schema editing handlers
	tableCreate: dbHandlers.tableCreate,
	tableDrop: dbHandlers.tableDrop,
	columnAdd: dbHandlers.columnAdd,
	columnDrop: dbHandlers.columnDrop,
	// Snippet handling
	snippetExport: dbHandlers.snippetExport,
	snippetsGet: dbHandlers.snippetsGet,
	snippetsSave: dbHandlers.snippetsSave,
	dialogResponse: dbHandlers.dialogResponse,
	objectsList: dbHandlers.objectsList,
	objectDrop: dbHandlers.objectDrop,
	settingsGet: dbHandlers.settingsGet,
	settingsSave: dbHandlers.settingsSave,
});

// Create the main application window
const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "Xyrvex",
	url,
	rpc,
	icon: "views://mainview/favicon.ico",
	frame: {
		width: 1200,
		height: 800,
		x: 100,
		y: 100,
	},
	titleBarStyle: "default",
	styleMask: {
		Titled: true,
		Closable: true,
		Miniaturizable: true,
		Resizable: true,
	},
});

// Force layout refresh for Windows to ensure webview matches window size initially
setTimeout(() => {
	const { width, height } = mainWindow.getSize();
	mainWindow.setSize(width + 1, height);
	setTimeout(() => {
		mainWindow.setSize(width, height);
	}, 100);
}, 500);

Electrobun.events.on("before-quit", async (e: any) => {
	if (getIsDirty()) {
		if (e && typeof e.preventDefault === 'function') e.preventDefault();
		
		// Note: Since we're in the bun process, and we want to show a JSX dialog,
		// we need to use the rpc instance. 
		// However, showCustomBox is in handlers.ts and we already have it in dbHandlers.
		// But dbHandlers doesn't expose it directly.
		// Let's just use Utils.showMessageBox for quit as a fallback, 
		// OR let's improve App.tsx to handle quit if possible.
		// Actually, let's just keep quit as native for now as it's the safest for shutdown, 
		// BUT the user said "no browser things". showMessageBox is native OS, not browser.
		// If they REALLY meant no OS things either, I should use JSX.
		
		// Let's try JSX for quit too.
		const { response } = await (dbHandlers as any).showCustomBox({
			type: "warning",
			title: "Unsaved Changes",
			message: "You have unsaved changes.",
			detail: "Do you want to save your changes before closing?",
			buttons: ["Save and Quit", "Don't Save", "Cancel"],
			defaultId: 0,
			cancelId: 2
		});

		if (response === 2) {
			return; // Cancel quit
		}

		const db = getDatabase();
		if (db) {
			if (response === 0) {
				commitOnly(db);
			} else if (response === 1) {
				rollbackTransaction(db);
			}
			closeDatabase();
		}
		
		Utils.quit();
	}
});

console.log("Xyrvex started with HMR and correct RPC setup!");
