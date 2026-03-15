import Electrobun, { BrowserWindow, Updater, ApplicationMenu, defineElectrobunRPC } from "electrobun/bun";
import type { AppSchema, OpenResult, OpResult, TableData, TerminalResult, SessionData } from "../shared/types";

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

import { createDbHandlers } from "./ipc/handlers";

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
});

// Create the main application window
const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "SQL Editor",
	url,
	rpc,
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

Electrobun.events.on("before-quit", async () => {
	console.log("SQL Editor is shutting down...");
	// Session saving is already handled by individual RPC actions that change state,
	// but we can ensure it's saved here too if needed.
});

console.log("SQL Editor started with HMR and correct RPC setup!");
