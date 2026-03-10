import { BrowserWindow, Updater, ApplicationMenu, Electrobun, defineElectrobunRPC, type ElectrobunRPCSchema } from "electrobun/bun";
import type { AppRPC } from "../shared/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Define the full schema for Electrobun
interface AppSchema extends ElectrobunRPCSchema {
	bun: {
		requests: AppRPC["requests"];
		messages: AppRPC["messages"];
	};
	webview: {
		requests: {}; // Logic for webview-side requests if any
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

// RPC Setup
const rpc = defineElectrobunRPC<AppSchema>("bun", {
	handlers: {
		requests: {
			dbOpen: async () => {
				return { ok: false, error: "Not implemented", dbName: "", dbPath: null, tables: [] };
			},
			dbCreate: async () => {
				return { ok: false, error: "Not implemented", dbName: "", dbPath: null, tables: [] };
			},
			dbSave: async () => {
				return { ok: false, error: "Not implemented" };
			},
			dbSaveAs: async () => {
				return { ok: false, error: "Not implemented" };
			},
			dbClose: async () => {
				return { ok: false, error: "Not implemented" };
			},
			tableList: async () => {
				return { tables: [] };
			},
			tableFetchAll: async () => {
				return { columns: [], rows: [] };
			},
			tableCreate: async () => {
				return { ok: false, error: "Not implemented" };
			},
			tableDrop: async () => {
				return { ok: false, error: "Not implemented" };
			},
			columnAdd: async () => {
				return { ok: false, error: "Not implemented" };
			},
			columnDrop: async () => {
				return { ok: false, error: "Not implemented" };
			},
			rowInsert: async () => {
				return { ok: false, error: "Not implemented" };
			},
			rowDelete: async () => {
				return { ok: false, error: "Not implemented" };
			},
			cellUpdate: async () => {
				return { ok: false, error: "Not implemented" };
			},
			cellExec: async () => {
				return { ok: false, error: "Not implemented" };
			},
			terminalExec: async () => {
				return { sql: "", error: "Not implemented" };
			},
			autosaveSet: async () => {
				return { ok: false, error: "Not implemented" };
			},
			sessionGet: async () => {
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
				click: () => mainWindow.executeJavaScript("window.dispatchEvent(new CustomEvent('app-menu-new-db'))"),
			},
			{
				label: "Open Database",
				accelerator: "CmdOrCtrl+O",
				click: () => mainWindow.executeJavaScript("window.dispatchEvent(new CustomEvent('app-menu-open-db'))"),
			},
			{ type: "separator" },
			{
				label: "Save",
				accelerator: "CmdOrCtrl+S",
				click: () => mainWindow.executeJavaScript("window.dispatchEvent(new CustomEvent('app-menu-save'))"),
			},
			{
				label: "Save As...",
				accelerator: "CmdOrCtrl+Shift+S",
				click: () => mainWindow.executeJavaScript("window.dispatchEvent(new CustomEvent('app-menu-save-as'))"),
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
				click: () => mainWindow.executeJavaScript("window.dispatchEvent(new CustomEvent('app-menu-refresh'))"),
			},
			{
				label: "Toggle Terminal",
				accelerator: "CmdOrCtrl+`",
				click: () => mainWindow.executeJavaScript("window.dispatchEvent(new CustomEvent('app-menu-toggle-terminal'))"),
			},
		],
	},
]);

Electrobun.events.on("before-quit", async (e) => {
	// Graceful shutdown logic will go here
});

console.log("SQL Editor started with HMR and correct RPC setup!");
