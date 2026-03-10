import { useState, useEffect, useCallback } from "react";
import { Electroview } from "electrobun/view";
import type { AppSchema, TableData } from "../shared/types";
import { Header } from "./components/Header";
import { Sidebar } from './components/Sidebar';
import { DataTable } from './components/DataTable';
import { Terminal } from "./components/Terminal";
import { NewDbModal } from "./components/NewDbModal";

const rpc = Electroview.defineRPC<AppSchema>({
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

// Initialize RPC transport
new Electroview({ rpc });

function App() {
	const [dbName, setDbName] = useState<string>("No database open");
	const [tables, setTables] = useState<string[]>([]);
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [tableData, setTableData] = useState<TableData>({ columns: [], rows: [] });
	const [isTerminalOpen, setIsTerminalOpen] = useState(false);
	const [isNewDbModalOpen, setIsNewDbModalOpen] = useState(false);

	const handleSelectTable = useCallback(async (tableName: string) => {
		console.log(`[App] handleSelectTable: "${tableName}"`);
		setActiveTable(tableName);
		try {
			const data = await rpc.request.tableFetchAll({ tableName });
			setTableData(data);
		} catch (err) {
			console.error("[App] Error fetching table data:", err);
		}
	}, []);

	const handleCellUpdate = useCallback(async (column: string, value: any, rowId: number) => {
		if (!activeTable) return;
		try {
			const result = await rpc.request.cellUpdate({
				tableName: activeTable,
				column,
				value,
				rowId
			});
			if (result.ok) {
				// Refresh data
				const data = await rpc.request.tableFetchAll({ tableName: activeTable });
				setTableData(data);
			}
		} catch (err) {
			console.error("[App] Cell update failed:", err);
		}
	}, [activeTable]);

	const handleRowDelete = useCallback(async (rowId: number) => {
		if (!activeTable) return;
		if (!confirm("Are you sure you want to delete this row?")) return;

		try {
			const result = await rpc.request.rowDelete({
				tableName: activeTable,
				rowId
			});
			if (result.ok) {
				const data = await rpc.request.tableFetchAll({ tableName: activeTable });
				setTableData(data);
			}
		} catch (err) {
			console.error("[App] Row deletion failed:", err);
		}
	}, [activeTable]);

	const handleOpenDb = useCallback(async () => {
		console.log("[App] handleOpenDb: Starting RPC request...");
		try {
			await rpc.request.dbOpen({});
		} catch (err) {
			console.error("[App] RPC Error opening DB:", err);
		}
	}, []);

	const handleNewDb = useCallback(() => {
		setIsNewDbModalOpen(true);
	}, []);

	const confirmCreateDb = useCallback(async (filename: string) => {
		console.log(`[App] confirmCreateDb: Starting RPC request for "${filename}"...`);
		try {
			setIsNewDbModalOpen(false);
			await rpc.request.dbCreate({ filename });
		} catch (err) {
			console.error("[App] RPC Error creating DB:", err);
		}
	}, []);

	const handleExecuteQuery = useCallback(async (sql: string) => {
		const result = await rpc.request.terminalExec({ sql });
		// After execution, refresh table list in case of mutations
		const tableList = await rpc.request.tableList({});
		setTables(tableList.tables);
		return result;
	}, []);

	useEffect(() => {
		const onMenuAction = (payload: { action: string }) => {
			const { action } = payload;
			switch (action) {
				case 'toggle-terminal':
					setIsTerminalOpen(prev => !prev);
					break;
				case 'open-db':
					handleOpenDb();
					break;
				case 'new-db':
					handleNewDb();
					break;
				case 'refresh':
					rpc.request.tableList({}).then(res => setTables(res.tables));
					if (activeTable) {
						rpc.request.tableFetchAll({ tableName: activeTable }).then(setTableData);
					}
					break;
			}
		};

		const onDbOpened = (payload: any) => {
			console.log("[App] dbOpened message received:", JSON.stringify(payload));
			if (payload.ok) {
				setDbName(payload.dbName);
				setTables(payload.tables);
				setActiveTable(null);
				setTableData({ columns: [], rows: [] });
				setIsNewDbModalOpen(false);
			} else {
				alert(`Failed to open database: ${payload.error}`);
			}
		};

		rpc.addMessageListener('menuAction', onMenuAction);
		rpc.addMessageListener('dbOpened', onDbOpened);
		return () => {
			rpc.removeMessageListener('menuAction', onMenuAction);
			rpc.removeMessageListener('dbOpened', onDbOpened);
		};
	}, [handleOpenDb, handleNewDb, activeTable]);

	return (
		<div className="flex flex-col h-full bg-neutral-900 overflow-hidden font-sans selection:bg-emerald-500/30">
			<Header dbName={dbName} />

			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					tables={tables}
					activeTable={activeTable}
					onSelectTable={handleSelectTable}
					onOpenDb={handleOpenDb}
					onNewDb={handleNewDb}
				/>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col bg-neutral-900/50 overflow-hidden relative">
					{/* Ambient backgrounds */}
					<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

					<div className="flex-1 flex flex-col overflow-hidden relative z-10">
						{activeTable ? (
							<DataTable
								tableName={activeTable}
								data={tableData}
								onCellUpdate={handleCellUpdate}
								onRowDelete={handleRowDelete}
							/>
						) : (
							<div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
								<div className="w-20 h-20 bg-neutral-800/50 rounded-2xl flex items-center justify-center mb-6 border border-neutral-700/50 shadow-xl">
									<svg className="w-10 h-10 text-neutral-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zM4 7h16M4 11h16m-16 4h16" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-neutral-300 mb-2">Ready to explore</h3>
								<p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-sm">
									{tables.length > 0
										? "Select a table from the sidebar to view its structure and data."
										: "Open a database to start managing your SQLite tables and data."}
								</p>

								{tables.length === 0 && (
									<button
										onClick={handleOpenDb}
										className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center space-x-2"
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

					<NewDbModal
						isOpen={isNewDbModalOpen}
						onClose={() => setIsNewDbModalOpen(false)}
						onCreate={confirmCreateDb}
					/>
				</main>
			</div>
		</div>
	);
}

export default App;
