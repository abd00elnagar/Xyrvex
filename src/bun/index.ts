import Electrobun, { BrowserWindow, Updater, ApplicationMenu, defineElectrobunRPC, type ElectrobunRPCSchema } from "electrobun/bun";
import type { AppRPC, OpenResult, OpResult, TableData, TerminalResult, SessionData } from "../shared/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Define the full schema for Electrobun
interface AppSchema extends ElectrobunRPCSchema {
	bun: {
		requests: AppRPC["requests"];
		messages: AppRPC["messages"];
	};
	webview: {
		requests: {};
		messages: {};
	};
}

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

import { dbHandlers } from "./ipc/handlers";

// RPC Setup
const rpc = defineElectrobunRPC<AppSchema>("bun", {
	handlers: {
		requests: {
			dbOpen: dbHandlers.dbOpen,
			dbCreate: dbHandlers.dbCreate,
			dbSave: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			dbSaveAs: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			dbClose: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			tableList: dbHandlers.tableList,
			tableFetchAll: async (): Promise<TableData> => {
				return { columns: [], rows: [] };
			},
			tableCreate: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			tableDrop: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			columnAdd: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			columnDrop: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			rowInsert: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			rowDelete: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			cellUpdate: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			cellExec: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			terminalExec: async (): Promise<TerminalResult> => {
				return { sql: "", error: "Not implemented" };
			},
			autosaveSet: async (): Promise<OpResult> => {
				return { ok: false, error: "Not implemented" };
			},
			sessionGet: async (): Promise<SessionData> => {
				return { lastOpenedPath: null, windowMaximized: false, autoSave: false };
			},
		},
	},
});

// Create the main application window
const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "SQL Editor",
	url,
	rpc,
	frame: {
		width: 1100,
		height: 760,
		x: 200,
		y: 200,
	},
	titleBarStyle: "hidden",
});

// Menu Setup
ApplicationMenu.setApplicationMenu([
	{
		label: "SQL Editor",
		submenu: [
			{ role: "about" },
			{ type: "separator" },
			{ role: "quit" },
		],
	},
	{
		label: "File",
		submenu: [
			{
				label: "New Database",
				accelerator: "CmdOrCtrl+N",
				action: "new-db",
			},
			{
				label: "Open Database",
				accelerator: "CmdOrCtrl+O",
				action: "open-db",
			},
			{ type: "separator" },
			{
				label: "Save",
				accelerator: "CmdOrCtrl+S",
				action: "save",
			},
			{
				label: "Save As...",
				accelerator: "CmdOrCtrl+Shift+S",
				action: "save-as",
			},
		],
	},
	{
		label: "Edit",
		submenu: [
			{ role: "undo" },
			{ role: "redo" },
			{ type: "separator" },
			{ role: "cut" },
			{ role: "copy" },
			{ role: "paste" },
			{ role: "selectAll" },
		],
	},
	{
		label: "View",
		submenu: [
			{
				label: "Refresh Table",
				accelerator: "CmdOrCtrl+R",
				action: "refresh",
			},
			{
				label: "Toggle Terminal",
				accelerator: "CmdOrCtrl+`",
				action: "toggle-terminal",
			},
		],
	},
]);

// Handle Menu Clicks
ApplicationMenu.on("application-menu-clicked", (event: any) => {
	const action = event.action;
	if (!action) return;

	switch (action) {
		case "new-db":
			mainWindow.webview.executeJavascript("window.dispatchEvent(new CustomEvent('app-menu-new-db'))");
			break;
		case "open-db":
			mainWindow.webview.executeJavascript("window.dispatchEvent(new CustomEvent('app-menu-open-db'))");
			break;
		case "save":
			mainWindow.webview.executeJavascript("window.dispatchEvent(new CustomEvent('app-menu-save'))");
			break;
		case "save-as":
			mainWindow.webview.executeJavascript("window.dispatchEvent(new CustomEvent('app-menu-save-as'))");
			break;
		case "refresh":
			mainWindow.webview.executeJavascript("window.dispatchEvent(new CustomEvent('app-menu-refresh'))");
			break;
		case "toggle-terminal":
			mainWindow.webview.executeJavascript("window.dispatchEvent(new CustomEvent('app-menu-toggle-terminal'))");
			break;
	}
});

Electrobun.events.on("before-quit", async () => {
	// Graceful shutdown logic will go here
});

console.log("SQL Editor started with HMR and correct RPC setup!");
