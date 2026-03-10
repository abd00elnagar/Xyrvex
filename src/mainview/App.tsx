import { useState, useEffect, useCallback } from "react";
import { Electroview } from "electrobun/view";
import type { AppRPC } from "../shared/types";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";

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
								<p className="text-neutral-500">Table browser implementation coming in Phase 3</p>
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

					{/* Terminal Drawer */}
					<div className={`border-t border-neutral-800 bg-neutral-950/80 backdrop-blur-md transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) relative z-20 ${isTerminalOpen ? 'h-72 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'h-10'}`}>
						<div
							className="h-10 flex items-center px-6 bg-neutral-800/30 cursor-pointer hover:bg-neutral-800/50 transition-colors group"
							onClick={() => setIsTerminalOpen(!isTerminalOpen)}
						>
							<div className="flex items-center space-x-2 flex-1">
								<div className={`w-1.5 h-1.5 rounded-full ${isTerminalOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-600'}`} />
								<span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest group-hover:text-neutral-200 transition-colors">SQL Terminal</span>
							</div>
							<svg className={`w-4 h-4 text-neutral-500 transform transition-all duration-300 ${isTerminalOpen ? 'rotate-0' : 'rotate-180 opacity-50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7" /></svg>
						</div>

						{isTerminalOpen && (
							<div className="p-5 h-[calc(100%-40px)] flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
								<div className="relative flex-1 group">
									<textarea
										className="w-full h-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/30 transition-all resize-none shadow-inner"
										placeholder="-- Enter SQL command..."
										spellCheck={false}
									/>
									<div className="absolute right-3 bottom-3 flex space-x-2">
										<button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-wider active:scale-95">
											Execute Query
										</button>
									</div>
								</div>
								<div className="h-20 bg-neutral-900/80 border border-neutral-800/50 rounded-lg p-3 overflow-hidden">
									<div className="text-[10px] text-neutral-500 uppercase font-bold tracking-tight mb-1">Output</div>
									<div className="text-xs font-mono text-neutral-400 italic">No command executed yet.</div>
								</div>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}

export default App;
