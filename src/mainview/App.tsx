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
import { ObjectExplorerView } from "./components/ObjectExplorerView";
import type { DbObject } from "../shared/types";

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

	// Objects State
	const [objects, setObjects] = useState<DbObject[]>([]);
	const [activeObject, setActiveObject] = useState<DbObject | null>(null);

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

	const fetchTableData = useCallback(async (tableName: string) => {
		try {
			const data = await rpc.request.tableFetchAll({ tableName });
			setTableData(data);
		} catch (err) {
			console.error("[App] Error fetching table data:", err);
		}
	}, []);



	const loadObjects = useCallback(async () => {
		try {
			const { objects } = await rpc.request.objectsList({});
			setObjects(objects);
		} catch (err) {
			console.error("[App] loadObjects failed:", err);
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

	const handleDeleteRow = useCallback(async (rowId: number) => {
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

	const handleInsertRow = useCallback(async () => {
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
		// After execution, refresh everything in case of mutations
		const tableList = await rpc.request.tableList({});
		setTables(tableList.tables);
		loadObjects();

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
	}, [activeTable, loadObjects]);

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
	}, [fetchTableData]);

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

	const handleDropColumn = useCallback(async (columnName: string) => {
		if (!activeTable) return;
		showDialog({
			type: 'confirm',
			title: 'Drop Column',
			message: `Are you sure you want to drop column "${columnName}"? This action cannot be undone.`,
			onConfirm: async () => {
				try {
					const result = await rpc.request.columnDrop({ tableName: activeTable, columnName });
					if (result.ok) {
						const data = await rpc.request.tableFetchAll({ tableName: activeTable! });
						setTableData(data);
					}
				} catch (err) {
					console.error("[App] Drop column failed:", err);
				}
			}
		});
	}, [activeTable, showDialog]);

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

	const handleSelectTable = (tableName: string) => {
		setActiveSnippetId(null);
		setActiveObject(null);
		setActiveTable(tableName);
		fetchTableData(tableName);
	};

	const handleSelectSnippet = (snippetId: string) => {
		setActiveTable(null);
		setActiveObject(null);
		setActiveSnippetId(snippetId);
	};

	const handleSelectObject = useCallback((obj: DbObject | null) => {
		setActiveObject(obj);
		setActiveTable(null);
		setActiveSnippetId(null);
	}, []);

	const handleAddObject = useCallback((type: 'trigger' | 'index' | 'view' | 'function', tableName?: string) => {
		let sql = "";
		const placeholderName = `new_${type}_${Date.now().toString().slice(-4)}`;
		
		if (type === 'trigger') {
			sql = `-- Trigger for ${tableName || 'table_name'}\nCREATE TRIGGER ${placeholderName}\nAFTER INSERT ON "${tableName || 'table_name'}"\nBEGIN\n  -- Trigger logic here\nEND;`;
		} else if (type === 'index') {
			sql = `-- Index for ${tableName || 'table_name'}\nCREATE INDEX ${placeholderName} ON "${tableName || 'table_name'}"(column_name);`;
		} else if (type === 'view') {
			sql = `-- Create View\nCREATE VIEW ${placeholderName} AS\nSELECT * FROM "${tables[0] || 'table_name'}";`;
		} else if (type === 'function') {
			sql = `-- User Defined Function (Application Level)\n-- SQLite does not store functions in the DB file.\n-- You can define them in your app code or use them in queries.\nSELECT ${placeholderName}(column_name) FROM table_name;`;
		}

		const newSnippet: SqlSnippet = {
			id: `add-obj-${Date.now()}`,
			name: `SQL: Add ${type}`,
			code: sql
		};
		setSnippets(prev => [...prev, newSnippet]);
		setActiveSnippetId(newSnippet.id);
		setActiveTable(null);
		setActiveObject(null);
	}, [tables]);

	const handleDropObject = async (type: string, name: string) => {
		showDialog({
			type: 'confirm',
			title: `Drop ${type.charAt(0).toUpperCase() + type.slice(1)}`,
			message: `Are you sure you want to drop the ${type} "${name}"? This action cannot be undone.`,
			onConfirm: async () => {
				try {
					const result = await rpc.request.objectDrop({ type, name });
					if (result.ok) {
						setActiveObject(null);
						loadObjects();
					} else {
						showDialog({
							type: 'error',
							title: 'Drop Failed',
							message: result.error || 'Check console for details'
						});
					}
				} catch (err) {
					console.error("[App] objectDrop failed:", err);
				}
			}
		});
	};

	const handleCopySql = (sql: string) => {
		navigator.clipboard.writeText(sql).then(() => {
			// Maybe a toast would be nice, but for now console.log or just assume success
			console.log("SQL copied to clipboard");
		});
	};

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
				setDbPath(payload.dbPath);
				setDbName(payload.dbName);
				setTables(payload.tables);
				setActiveTable(null);
				setActiveSnippetId(null);
				setActiveObject(null);
				setTableData({ columns: [], rows: [] });
				loadObjects();
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
			} else if (payload.error) {
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
						loadObjects();
						
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
					// Objects
					objects={objects}
					activeObject={activeObject}
					onSelectObject={handleSelectObject}
					onRefreshObjects={loadObjects}
					onAddObject={handleAddObject}
				/>

				{/* Main Content Area */}
				<main className="flex-1 flex flex-col min-w-0 bg-neutral-900 border-l border-neutral-800 shadow-inner overflow-hidden relative">
					{!dbPath ? (
						<div className="flex-1 flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/50">
							<div className="w-16 h-16 rounded-2xl bg-neutral-800/50 flex items-center justify-center mb-6 border border-neutral-800 shadow-inner">
								<svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7h16M4 11h16m-16 4h16" /></svg>
							</div>
							<p className="text-sm font-medium tracking-wide">Open or create a database to begin</p>
						</div>
					) : activeSnippetId ? (
						<Terminal 
							isOpen={true}
							isFullPage={true}
							initialSql={snippets.find(s => s.id === activeSnippetId)?.code || ""}
							onSqlChange={(sql) => handleSnippetCodeChange(activeSnippetId, sql)}
							onExecute={async (sql) => {
								return rpc.request.terminalExec({ sql });
							}}
						/>
					) : activeObject ? (
						<ObjectExplorerView 
							object={activeObject}
							onDrop={handleDropObject}
							onCopySql={handleCopySql}
						/>
					) : activeTable ? (
						<DataTable 
							data={tableData}
							onCellUpdate={handleCellUpdate}
							onRowDelete={handleDeleteRow}
							onRowInsert={handleInsertRow}
							onAddColumn={() => setIsAddColumnModalOpen(true)}
							onDropColumn={handleDropColumn}
						/>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-neutral-500 slide-in">
							<svg className="w-12 h-12 opacity-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
							<p className="text-sm">Select a table, object, or snippet to begin exploration</p>
							{tables.length === 0 && (
								<button
									onClick={handleOpenDb}
									className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center space-x-2"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
									<span>Select SQLite File</span>
								</button>
							)}
						</div>
					)}

					{/* Hide bottom terminal if a snippet is active (full page terminal) or if object explorer is open */}
					{!activeSnippetId && !activeObject && (
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
