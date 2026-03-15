import { useState, useEffect, useCallback, useRef } from "react";
import { Electroview } from "electrobun/view";
import type { AppSchema, TableData, SqlSnippet, OpenResult, SessionData } from "../shared/types";
import { Header } from "./components/Header";
import { Sidebar } from './components/Sidebar';
import { DataTable } from './components/DataTable';
import { Terminal } from "./components/Terminal";
import { NewDbModal } from "./components/NewDbModal";
import { CreateTableModal } from "./components/CreateTableModal";
import { AddColumnModal } from "./components/AddColumnModal";
import { SaveAsModal } from "./components/SaveAsModal";
import { Menu } from "./components/Menu";
import { Dialog, DialogType } from "./components/Dialog";

const rpc = Electroview.defineRPC<AppSchema>({
	handlers: {
		messages: {
			dbSaved: (payload: { dbPath: string | null; dbName: string }) => {
				console.log("[RPC] Message dbSaved:", payload.dbPath);
			},
			dbDirtyChanged: (payload: { isDirty: boolean }) => {
				console.log("[RPC] Message dbDirtyChanged:", payload.isDirty);
			}
		}
	}
});

// Initialize RPC transport
new Electroview({ rpc });

function App() {
	const [dbName, setDbName] = useState<string>("No database open");
	const [dbPath, setDbPath] = useState<string | null>(null);
	const [tables, setTables] = useState<string[]>([]);
	const [activeTable, setActiveTable] = useState<string | null>(null);
	const [tableData, setTableData] = useState<TableData>({ columns: [], rows: [] });
	const [isTerminalOpen, setIsTerminalOpen] = useState(false);
	const [isNewDbModalOpen, setIsNewDbModalOpen] = useState(false);
	const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
	const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);
	const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const [isAutoSave, setIsAutoSave] = useState(false);
	const [undoStack, setUndoStack] = useState<any[]>([]);
	const [redoStack, setRedoStack] = useState<any[]>([]);

	// Snippets State
	const [snippets, setSnippets] = useState<SqlSnippet[]>([]);
	const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
	const lastLoadedDbPathForSnippets = useRef<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Dialog State
	const [dialog, setDialog] = useState<{
		isOpen: boolean;
		type: DialogType;
		title: string;
		message: string;
		onConfirm: () => void;
		onCancel?: () => void;
		showCancel?: boolean;
		confirmLabel?: string;
	}>({
		isOpen: false,
		type: 'info',
		title: '',
		message: '',
		onConfirm: () => {}
	});

	const showDialog = useCallback((params: {
		type: DialogType;
		title: string;
		message: string;
		onConfirm?: () => void;
		onCancel?: () => void;
		showCancel?: boolean;
		confirmLabel?: string;
		cancelLabel?: string;
	}) => {
		setDialog({
			isOpen: true,
			...params,
			onConfirm: () => {
				setDialog(prev => ({ ...prev, isOpen: false }));
				if (params.onConfirm) params.onConfirm();
			},
			onCancel: () => {
				setDialog(prev => ({ ...prev, isOpen: false }));
				if (params.onCancel) params.onCancel();
			}
		});
	}, []);

	const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		console.log("[App] File selected for import:", file.name);
		const reader = new FileReader();
		reader.onload = async (event) => {
			const content = event.target?.result as string;
			const newSnippet: SqlSnippet = {
				id: Math.random().toString(36).substring(2, 9),
				name: file.name.replace(/\.sql$/i, ''),
				code: content
			};

			setSnippets(prev => [...prev, newSnippet]);
			handleSelectSnippet(newSnippet.id);
			showDialog({
				type: 'success',
				title: 'Import Successful',
				message: `Successfully imported snippet: ${newSnippet.name}`
			});
			
			// Reset input
			if (fileInputRef.current) fileInputRef.current.value = '';
		};
		reader.readAsText(file);
	};

	const handleSelectTable = useCallback(async (tableName: string) => {
		console.log(`[App] handleSelectTable: "${tableName}"`);
		setActiveTable(tableName);
		setActiveSnippetId(null); // Deselect snippet when a table is selected
		try {
			const data = await rpc.request.tableFetchAll({ tableName });
			setTableData(data);
		} catch (err) {
			console.error("[App] Error fetching table data:", err);
		}
	}, []);

	const handleCellUpdate = useCallback(async (column: string, value: any, rowId: number) => {
		if (!activeTable) return;
		
		// Find old value for history
		const rowIndex = tableData.rows.findIndex(r => r[0] === rowId);
		const colIndex = tableData.columns.findIndex(c => c.name === column);
		const oldValue = rowIndex !== -1 && colIndex !== -1 ? tableData.rows[rowIndex][colIndex] : null;

		if (String(oldValue) === String(value)) return;

		try {
			const result = await rpc.request.cellUpdate({
				tableName: activeTable,
				columnName: column,
				rowId,
				value
			});
			if (result.ok) {
				// Record for undo
				const record = {
					tableName: activeTable,
					columnName: column,
					rowId,
					oldValue,
					newValue: value,
					undoSql: `UPDATE "${activeTable}" SET "${column}" = ? WHERE rowid = ?`,
					undoParams: [oldValue, rowId],
					redoSql: `UPDATE "${activeTable}" SET "${column}" = ? WHERE rowid = ?`,
					redoParams: [value, rowId]
				};

				setUndoStack(prev => [...prev, record]);
				setRedoStack([]); // Clear redo branch on new action

				// Refresh data
				const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
				setTableData(data);
			}
		} catch (err) {
			console.error("[App] Cell update failed:", err);
		}
	}, [activeTable, tableData]);

	const handleRowDelete = useCallback(async (rowId: number) => {
		if (!activeTable) return;
		
		showDialog({
			type: 'confirm',
			title: 'Delete Row',
			message: 'Are you sure you want to delete this row?',
			confirmLabel: 'Delete',
			onConfirm: async () => {
				try {
					const result = await rpc.request.rowDelete({
						tableName: activeTable,
						rowId
					});
					if (result.ok) {
						const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
						setTableData(data);
					}
				} catch (err) {
					console.error("[App] Row deletion failed:", err);
				}
			}
		});
	}, [activeTable, showDialog]);

	const handleRowInsert = useCallback(async () => {
		if (!activeTable) return;
		try {
			const result = await rpc.request.rowInsert({ tableName: activeTable });
			if (result.ok) {
				const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
				setTableData(data);
			}
		} catch (err) {
			console.error("[App] Row insertion failed:", err);
		}
	}, [activeTable]);

	const handleOpenDb = useCallback(async () => {
		console.log("[App] handleOpenDb called");
		try {
			const result = await rpc.request.dbOpen({});
			console.log("[App] dbOpen result:", result);
		} catch (err) {
			console.error("[App] RPC Error opening DB:", err);
		}
	}, []);

	const handleNewDb = useCallback(() => {
		setIsNewDbModalOpen(true);
	}, []);

	const confirmCreateDb = useCallback(async (filename: string) => {
		console.log(`[App] confirmCreateDb for "${filename}"`);
		try {
			setIsNewDbModalOpen(false);
			const result = await rpc.request.dbCreate({ filename });
			console.log("[App] dbCreate result:", result);
		} catch (err) {
			console.error("[App] RPC Error creating DB:", err);
		}
	}, []);

	const confirmSaveAs = useCallback(async (filename: string) => {
		try {
			setIsSaveAsModalOpen(false);
			const result = await rpc.request.dbSaveAs({ suggestedName: filename });
			if (result.ok) setIsDirty(false);
		} catch (err) {
			console.error("[App] RPC Error saving AS:", err);
		}
	}, []);

	const handleExecuteQuery = useCallback(async (sql: string) => {
		console.log("[App] Executing query:", sql);
		const result = await rpc.request.terminalExec({ sql });
		// After execution, refresh table list in case of mutations
		const tableList = await rpc.request.tableList({});
		setTables(tableList.tables);
		// If we're on a table, refresh it too
		if (activeTable) {
			try {
				const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
				setTableData(data);
			} catch (e) {
				console.error("Refresh failed:", e);
			}
		}
		return result;
	}, [activeTable]);

	const handleCreateTable = useCallback(async (tableName: string, columns: any[]): Promise<boolean> => {
		console.log("[App] handleCreateTable:", tableName);
		try {
			const result = await rpc.request.tableCreate({ tableName, columns });
			if (result.ok) {
				setIsCreateTableModalOpen(false);
				const res = await rpc.request.tableList({});
				setTables(res.tables);
				handleSelectTable(tableName);
				return true;
			}
			return false;
		} catch (err) {
			console.error("[App] Create table failed:", err);
			return false;
		}
	}, [handleSelectTable]);

	const handleDropTable = useCallback(async (tableName: string) => {
		showDialog({
			type: 'confirm',
			title: 'Drop Table',
			message: `Are you sure you want to DROP TABLE "${tableName}"? This action cannot be undone.`,
			confirmLabel: 'Drop Table',
			onConfirm: async () => {
				try {
					const result = await rpc.request.tableDrop({ tableName });
					if (result.ok) {
						const res = await rpc.request.tableList({});
						setTables(res.tables);
						if (activeTable === tableName) {
							setActiveTable(null);
							setTableData({ columns: [], rows: [] });
						}
					}
				} catch (err) {
					console.error("[App] Drop table failed:", err);
				}
			}
		});
	}, [activeTable, showDialog]);

	const handleAddColumn = useCallback(async (column: any): Promise<boolean> => {
		if (!activeTable) return false;
		console.log("[App] handleAddColumn to:", activeTable);
		try {
			const result = await rpc.request.columnAdd({ tableName: activeTable, column });
			if (result.ok) {
				setIsAddColumnModalOpen(false);
				const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
				setTableData(data);
				return true;
			}
			return false;
		} catch (err) {
			console.error("[App] Add column failed:", err);
			return false;
		}
	}, [activeTable]);

	const handleSave = useCallback(async () => {
		console.log("[App] handleSave");
		try {
			const result = await rpc.request.dbSave({});
			if (result.ok) {
				setIsDirty(false);
			}
		} catch (err) {
			console.error("[App] Save failed:", err);
		}
	}, []);

	const toggleAutoSave = useCallback(async () => {
		const newStatus = !isAutoSave;
		console.log("[App] toggleAutoSave:", newStatus);
		setIsAutoSave(newStatus);
		try {
			await rpc.request.autosaveSet({ enabled: newStatus });
		} catch (err) {
			console.error("[App] Toggle autosave RPC failed:", err);
		}
	}, [isAutoSave]);

	// --- Snippets Handlers ---

	const handleSelectSnippet = useCallback((id: string) => {
		setActiveSnippetId(id);
		setActiveTable(null); // Deselect table when snippet is selected
		// Optionally close the bottom terminal if standard UX implies it
		setIsTerminalOpen(false);
	}, []);

	const handleAddSnippet = useCallback(() => {
		const newSnippet: SqlSnippet = {
			id: crypto.randomUUID(),
			name: `Query ${snippets.length + 1}`,
			code: "-- Write your SQL query here\n"
		};
		setSnippets(prev => [...prev, newSnippet]);
		handleSelectSnippet(newSnippet.id);
	}, [snippets.length, handleSelectSnippet]);

	const handleImportSnippet = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleExportSnippet = useCallback(async (snippet: SqlSnippet) => {
		try {
			const result = await rpc.request.snippetExport({ snippet });
			if (!result.ok && result.error !== "No location selected" && result.error !== "Aborted by user") {
				showDialog({
					type: 'error',
					title: 'Export Failed',
					message: result.error || 'Unknown error during export'
				});
			}
		} catch (err) {
			console.error("[App] Snippet export failed", err);
		}
	}, []);

	const handleDeleteSnippet = useCallback((id: string) => {
		showDialog({
			type: 'confirm',
			title: 'Delete Snippet',
			message: 'Are you sure you want to delete this snippet?',
			confirmLabel: 'Delete',
			onConfirm: () => {
				setSnippets(prev => prev.filter(s => s.id !== id));
				if (activeSnippetId === id) {
					setActiveSnippetId(null);
				}
			}
		});
	}, [activeSnippetId, showDialog]);

    const handleRenameSnippet = useCallback((id: string, newName: string) => {
        setSnippets(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
    }, []);

	const handleSnippetCodeChange = useCallback((id: string, newCode: string) => {
		setSnippets(prev => prev.map(s => s.id === id ? { ...s, code: newCode } : s));
	}, []);
	
	// --- End Snippets Handlers ---

	const handleUndo = useCallback(async () => {
		if (undoStack.length === 0) return;
		console.log("[App] handleUndo");
		const record = undoStack[undoStack.length - 1];
		try {
			const result = await rpc.request.cellExec({ sql: record.undoSql, params: record.undoParams });
			if (result.ok) {
				setUndoStack(prev => prev.slice(0, -1));
				setRedoStack(prev => [...prev, record]);
				if (activeTable === record.tableName) {
					const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
					setTableData(data);
				}
			}
		} catch (err) {
			console.error("[App] Undo failed:", err);
		}
	}, [undoStack, activeTable]);

	const handleRedo = useCallback(async () => {
		if (redoStack.length === 0) return;
		console.log("[App] handleRedo");
		const record = redoStack[redoStack.length - 1];
		try {
			const result = await rpc.request.cellExec({ sql: record.redoSql, params: record.redoParams });
			if (result.ok) {
				setRedoStack(prev => prev.slice(0, -1));
				setUndoStack(prev => [...prev, record]);
				if (activeTable === record.tableName) {
					const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
					setTableData(data);
				}
			}
		} catch (err) {
			console.error("[App] Redo failed:", err);
		}
	}, [redoStack, activeTable]);
	
	const handleMenuAction = useCallback((action: string) => {
		console.log("[App] handleMenuAction:", action);
		const h = handlersRef.current;
		switch (action) {
			case 'toggle-terminal': setIsTerminalOpen(p => !p); break;
			case 'open-db': h.handleOpenDb(); break;
			case 'new-db': h.handleNewDb(); break;
			case 'save': h.handleSave(); break;
			case 'undo': h.handleUndo(); break;
			case 'redo': h.handleRedo(); break;
			case 'toggle-autosave': h.toggleAutoSave(); break;
			case 'refresh':
				rpc.request.tableList({}).then((res: { tables: string[] }) => h.setTables(res.tables));
				break;
			case 'save-as':
				setIsSaveAsModalOpen(true);
				break;
		}
	}, []);

	// Use a ref to store current state-dependent functions to avoid stale closures in RPC listeners
	const handlersRef = useRef({
		handleOpenDb,
		handleNewDb,
		handleSave,
		handleUndo,
		handleRedo,
		toggleAutoSave,
		handleMenuAction,
		setTables,
		activeTable
	});

	useEffect(() => {
		handlersRef.current = {
			handleOpenDb,
			handleNewDb,
			handleSave,
			handleUndo,
			handleRedo,
			toggleAutoSave,
			handleMenuAction,
			setTables,
			activeTable
		};
	}, [handleOpenDb, handleNewDb, handleSave, handleUndo, handleRedo, toggleAutoSave, handleMenuAction, activeTable]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleGlobalKeydown = (e: KeyboardEvent) => {
			const isMod = e.ctrlKey || e.metaKey;
			const key = e.key.toLowerCase();
			const h = handlersRef.current;

			if (isMod && key === 'z') {
				if (e.shiftKey) h.handleRedo();
				else h.handleUndo();
			} else if (isMod && (key === 'y')) {
				h.handleRedo();
			} else if (isMod && key === 'n') {
				e.preventDefault();
				h.handleNewDb();
			} else if (isMod && key === 'o') {
				e.preventDefault();
				h.handleOpenDb();
			} else if (isMod && key === 's') {
				e.preventDefault();
				h.handleSave();
			} else if (isMod && key === 'r') {
				e.preventDefault();
				h.handleMenuAction('refresh');
			} else if (isMod && e.key === '`') {
				e.preventDefault();
				h.handleMenuAction('toggle-terminal');
			}
		};
		window.addEventListener('keydown', handleGlobalKeydown);
		return () => window.removeEventListener('keydown', handleGlobalKeydown);
	}, []);

	// RPC Message Listeners & Initial Load
	useEffect(() => {
		console.log("[App] Initializing RPC listeners (on mount)");
		
		const onMenuAction = (payload: { action: string }) => {
			handlersRef.current.handleMenuAction(payload.action);
		};

		const onDbDirtyChanged = (p: { isDirty: boolean }) => {
			console.log("[App] Push message dbDirtyChanged:", p.isDirty);
			setIsDirty(p.isDirty);
		};

		const onDbSaved = (p: { dbPath: string | null; dbName: string }) => {
			console.log("[App] Push message dbSaved:", p.dbPath);
			setIsDirty(false);
			setDbName(p.dbName);
			setDbPath(p.dbPath);
		};

		const onDbOpened = (payload: OpenResult) => {
			console.log("[App] Push message dbOpened:", payload);
			if (payload.ok) {
				setDbName(payload.dbName);
				setDbPath(payload.dbPath || null);
				setTables(payload.tables);
				setActiveTable(null);
				setTableData({ columns: [], rows: [] });
				setIsNewDbModalOpen(false);
				
				if (payload.dbPath) {
					rpc.request.snippetsGet({ dbPath: payload.dbPath }).then((res: { snippets: SqlSnippet[] }) => {
						setSnippets(res.snippets);
						setActiveSnippetId(null);
						lastLoadedDbPathForSnippets.current = payload.dbPath;
					});
				} else {
					setSnippets([]);
					setActiveSnippetId(null);
					lastLoadedDbPathForSnippets.current = null;
				}
			} else {
				console.error("[App] dbOpened error:", payload.error);
				showDialog({
					type: 'error',
					title: 'Database Load Error',
					message: `Failed to open database: ${payload.error}`
				});
			}
		};

		const onDialogRequest = (payload: {
			id: string;
			type: 'info' | 'warning' | 'error' | 'confirm' | 'success'; 
			title: string; 
			message: string; 
			detail?: string;
			buttons: string[];
			defaultId?: number;
			cancelId?: number;
		}) => {
			console.log("[App] Push message dialogRequest:", payload);
			showDialog({
				type: payload.type,
				title: payload.title,
				message: payload.detail ? `${payload.message}\n\n${payload.detail}` : payload.message,
				confirmLabel: payload.buttons[0],
				cancelLabel: payload.buttons[1],
				showCancel: payload.buttons.length > 1,
				onConfirm: () => {
					rpc.request.dialogResponse({ id: payload.id, choice: 0 });
				},
				onCancel: () => {
					rpc.request.dialogResponse({ id: payload.id, choice: 1 });
				}
			});
		};

		rpc.addMessageListener('menuAction', onMenuAction);
		rpc.addMessageListener('dbOpened', onDbOpened);
		rpc.addMessageListener('dbDirtyChanged', onDbDirtyChanged);
		rpc.addMessageListener('dbSaved', onDbSaved);
		rpc.addMessageListener('dialogRequest', onDialogRequest);

		// Initial session load (ONCE)
		rpc.request.sessionGet({}).then((session: SessionData) => {
			console.log("[App] Session loaded:", session);
			setIsAutoSave(session.autoSave);
			if (session.lastOpenedPath) {
				console.log("[App] Auto-restoring path:", session.lastOpenedPath);
				rpc.request.dbOpenByPath({ path: session.lastOpenedPath }).then((res: OpenResult) => {
					console.log("[App] Auto-restore result:", res);
					if (res.ok) {
						setDbName(res.dbName);
						setDbPath(res.dbPath || null);
						setTables(res.tables);
						
						rpc.request.snippetsGet({ dbPath: session.lastOpenedPath }).then((snipRes: { snippets: SqlSnippet[] }) => {
							setSnippets(snipRes.snippets);
							lastLoadedDbPathForSnippets.current = session.lastOpenedPath;
						});
					}
				});
			} else {
				lastLoadedDbPathForSnippets.current = null;
			}
		});

		return () => {
			console.log("[App] Cleaning up listeners");
			rpc.removeMessageListener('menuAction', onMenuAction);
			rpc.removeMessageListener('dbOpened', onDbOpened);
			rpc.removeMessageListener('dbDirtyChanged', onDbDirtyChanged);
			rpc.removeMessageListener('dbSaved', onDbSaved);
			rpc.removeMessageListener('dialogRequest', onDialogRequest);
		};
	}, []);

	// Auto-save snippets when they change
	useEffect(() => {
		if (dbPath && lastLoadedDbPathForSnippets.current === dbPath) {
			const timeout = setTimeout(() => {
				rpc.request.snippetsSave({ dbPath, snippets }).catch((err: any) => {
					console.error("[App] Failed to auto-save snippets:", err);
				});
			}, 1000); // 1-second debounce
			return () => clearTimeout(timeout);
		}
	}, [snippets, dbPath]);

	return (
		<div className="flex flex-col h-full bg-neutral-900 overflow-hidden font-sans selection:bg-emerald-500/30">
			<Menu onAction={handleMenuAction} />
			<input 
				type="file" 
				ref={fileInputRef} 
				style={{ display: 'none' }} 
				accept=".sql,.txt"
				onChange={handleFileImport}
			/>
			<Header
				dbName={dbName}
				dbPath={dbPath}
				isDirty={isDirty}
				isAutoSave={isAutoSave}
				onSave={handleSave}
				onToggleAutoSave={toggleAutoSave}
			/>

			<div className="flex flex-1 overflow-hidden">
				<Sidebar
					tables={tables}
					activeTable={activeTable}
					onSelectTable={handleSelectTable}
					onOpenDb={handleOpenDb}
					onNewDb={handleNewDb}
					onAddTable={() => setIsCreateTableModalOpen(true)}
					onDropTable={handleDropTable}
					snippets={snippets}
					activeSnippetId={activeSnippetId}
					onSelectSnippet={handleSelectSnippet}
					onAddSnippet={handleAddSnippet}
					onImportSnippet={handleImportSnippet}
					onExportSnippet={handleExportSnippet}
					onDeleteSnippet={handleDeleteSnippet}
					onRenameSnippet={handleRenameSnippet}
				/>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col bg-neutral-900/50 overflow-hidden relative">
					{/* Ambient backgrounds */}
					<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

					<div className="flex-1 flex flex-col overflow-hidden relative z-10">
						{activeSnippetId ? (
							<Terminal
								isOpen={true}
								isFullPage={true}
								initialSql={snippets.find(s => s.id === activeSnippetId)?.code || ""}
								onSqlChange={(code) => handleSnippetCodeChange(activeSnippetId, code)}
								onExecute={handleExecuteQuery}
							/>
						) : activeTable ? (
							<DataTable
							data={tableData}
							onCellUpdate={handleCellUpdate}
							onRowDelete={handleRowDelete}
							onRowInsert={handleRowInsert}
							onAddColumn={() => setIsAddColumnModalOpen(true)}
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

					{/* Hide bottom terminal if a snippet is active (full page terminal) */}
					{!activeSnippetId && (
						<Terminal
							isOpen={isTerminalOpen}
							onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
							onExecute={handleExecuteQuery}
						/>
					)}

					<NewDbModal
						isOpen={isNewDbModalOpen}
						onClose={() => setIsNewDbModalOpen(false)}
						onCreate={confirmCreateDb}
					/>

					<SaveAsModal
						isOpen={isSaveAsModalOpen}
						onClose={() => setIsSaveAsModalOpen(false)}
						onSave={confirmSaveAs}
						currentDbName={dbName}
					/>

					<CreateTableModal
						isOpen={isCreateTableModalOpen}
						onClose={() => setIsCreateTableModalOpen(false)}
						onCreate={handleCreateTable}
						existingTables={tables}
					/>

					<AddColumnModal
						isOpen={isAddColumnModalOpen}
						onClose={() => setIsAddColumnModalOpen(false)}
						onAdd={handleAddColumn}
						existingColumns={tableData.columns.map(c => c.name)}
					/>

					<Dialog 
						isOpen={dialog.isOpen}
						type={dialog.type}
						title={dialog.title}
						message={dialog.message}
						confirmLabel={dialog.confirmLabel}
						onConfirm={dialog.onConfirm}
						onCancel={dialog.onCancel}
						showCancel={dialog.showCancel}
					/>
				</main>
			</div>
		</div>
	);
}

export default App;
