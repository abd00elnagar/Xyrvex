import { useState, useEffect, useCallback } from "react";
import { Electroview } from "electrobun/view";
import type { AppRPC } from "../shared/types";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Terminal } from "./components/Terminal";

const rpc = Electroview.defineRPC<AppRPC, {}>({
	handlers: {
		messages: {
			dbSaved: (payload) => {
				console.log("DB Saved:", payload.dbPath);
			},
			dbDirtyChanged: (payload) => {
				console.log("Is Dirty:", payload.isDirty);
			}
		}
	}
});

function App() {
	const [dbName, setDbName] = useState<string>("No database open");
	const [tables, setTables] = useState<string[]>([]);
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [isTerminalOpen, setIsTerminalOpen] = useState(false);

	const handleOpenDb = useCallback(async () => {
		try {
			const result = await rpc.requests.dbOpen({});
			if (result.ok) {
				setDbName(result.dbName);
				setTables(result.tables);
				setActiveTable(null);
			} else if (result.error !== "No file selected") {
				alert(`Failed to open database: ${result.error}`);
			}
		} catch (err) {
			console.error("RPC Error opening DB:", err);
		}
	}, []);

	const handleExecuteQuery = useCallback(async (sql: string) => {
		const result = await rpc.requests.terminalExec({ sql });
		// After execution, refresh table list in case of mutations
		const tableList = await rpc.requests.tableList({});
		setTables(tableList.tables);
		return result;
	}, []);

	useEffect(() => {
		const onToggleTerminal = () => setIsTerminalOpen(prev => !prev);
		const onOpenDb = () => handleOpenDb();

		window.addEventListener('app-menu-toggle-terminal', onToggleTerminal);
		window.addEventListener('app-menu-open-db', onOpenDb);

		return () => {
			window.removeEventListener('app-menu-toggle-terminal', onToggleTerminal);
			window.removeEventListener('app-menu-open-db', onOpenDb);
		};
	}, [handleOpenDb]);

	return (
		<div className="flex flex-col h-screen bg-neutral-900 overflow-hidden font-sans selection:bg-emerald-500/30">
			<Header dbName={dbName} />

			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					tables={tables}
					activeTable={activeTable}
					onSelectTable={setActiveTable}
					onOpenDb={handleOpenDb}
				/>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col overflow-hidden bg-neutral-900 relative">
					{/* Ambient backgrounds */}
					<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

					{/* Table View Placeholder */}
					<div className="flex-1 flex items-center justify-center text-neutral-600 relative z-10 px-10">
						{activeTable ? (
							<div className="text-center animate-in fade-in duration-500">
								<h1 className="text-3xl font-bold text-neutral-200 mb-2">{activeTable}</h1>
								<p className="text-neutral-500 text-sm">Table browser implementation coming in Phase 3</p>
							</div>
						) : (
							<div className="text-center max-w-sm">
								<div className="w-20 h-20 bg-neutral-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-neutral-700/50 shadow-xl">
									<svg className="w-10 h-10 text-neutral-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM4 7h16M4 11h16m-16 4h16" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-neutral-300 mb-2">Ready to explore</h3>
								<p className="text-sm text-neutral-500 leading-relaxed mb-8">
									{tables.length > 0
										? "Select a table from the sidebar to view its structure and data."
										: "Open a database to start managing your SQLite tables and data."}
								</p>

								{tables.length === 0 && (
									<button
										onClick={handleOpenDb}
										className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center space-x-2 mx-auto"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
										<span>Select SQLite File</span>
									</button>
								)}
							</div>
						)}
					</div>

					<Terminal
						isOpen={isTerminalOpen}
						onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
						onExecute={handleExecuteQuery}
					/>
				</main>
			</div>
		</div>
	);
}

export default App;
