import { useState, useEffect } from "react";
import { Electroview } from "electrobun/view";
import type { AppRPC } from "../shared/types";

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
	const [isTerminalOpen, setIsTerminalOpen] = useState(false);

	useEffect(() => {
		const handleToggleTerminal = () => setIsTerminalOpen(prev => !prev);
		window.addEventListener('app-menu-toggle-terminal', handleToggleTerminal);
		return () => window.removeEventListener('app-menu-toggle-terminal', handleToggleTerminal);
	}, []);

	return (
		<div className="flex flex-col h-screen bg-neutral-900 overflow-hidden">
			{/* Draggable Header */}
			<header className="h-10 bg-neutral-950 border-b border-neutral-800 flex items-center px-4 titlebar-drag flex-shrink-0">
				<div className="flex items-center space-x-3 w-full">
					<div className="w-12" /> {/* Space for traffic lights if on Mac */}
					<span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest bg-neutral-800 px-2 py-0.5 rounded">SQL Editor</span>
					<span className="text-sm font-medium text-neutral-200 truncate">{dbName}</span>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-950 flex-shrink-0">
					<div className="p-4 border-b border-neutral-800 flex items-center justify-between">
						<h2 className="text-xs font-bold text-neutral-500 uppercase">Tables</h2>
						<button className="p-1 hover:bg-neutral-800 rounded text-neutral-400">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-2 space-y-1">
						{/* Placeholder for tables list */}
						<div className="px-3 py-2 text-sm text-neutral-600 italic">Open a database to view tables</div>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col overflow-hidden bg-neutral-900">
					{/* Table View Placeholder */}
					<div className="flex-1 flex items-center justify-center text-neutral-600 bg-neutral-900 relative">
						<div className="text-center">
							<svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM4 7h16M4 11h16m-16 4h16" /></svg>
							<p className="text-lg font-medium opacity-50">Select a table to browse data</p>
						</div>
					</div>

					{/* Terminal Drawer */}
					<div className={`border-t border-neutral-800 bg-neutral-950 transition-all duration-300 ease-in-out ${isTerminalOpen ? 'h-64' : 'h-8'}`}>
						<div
							className="h-8 flex items-center px-4 bg-neutral-800/50 cursor-pointer hover:bg-neutral-800 transition-colors"
							onClick={() => setIsTerminalOpen(!isTerminalOpen)}
						>
							<span className="text-xs font-bold text-neutral-400 uppercase flex-1">SQL Terminal</span>
							<svg className={`w-4 h-4 text-neutral-400 transform transition-transform ${isTerminalOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
						</div>
						{isTerminalOpen && (
							<div className="p-4 h-56 flex flex-col">
								<textarea
									className="flex-1 bg-neutral-900 border border-neutral-800 rounded p-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50"
									placeholder="SELECT * FROM table..."
								/>
								<div className="flex justify-end mt-2">
									<button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 rounded transition-colors uppercase tracking-wider">Run Query</button>
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
