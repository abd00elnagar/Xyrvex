# SQL Editor — Implementation Phases (React Stack)

This document provides a granular, feature-complete roadmap for building the SQL Editor using **React**, **Vite**, and **Tailwind CSS**.

---

## Phase 1: Foundation & React Shell
**Goal:** Establish the Electrobun environment and a functional React window with HMR support.

### 1.1 Project Scaffolding
- [ ] Configure `electrobun.config.ts` for Vite output copying.
- [ ] Set up `package.json` with `dev:hmr` and `build` scripts.
- [ ] Initialize `src/shared/types.ts` with `AppRPC` and shared interfaces.
- [ ] Verify `vite.config.ts`, `tailwind.config.js`, and `postcss.config.js`.

### 1.2 Window & Menu
- [x] Create `BrowserWindow` in `src/bun/index.ts` with HMR dev server check.
- [x] Implement `ApplicationMenu` in the Bun process.
- [x] Set up `before-quit` listener for graceful shutdown.

### 1.3 React App Shell
- [ ] Setup `src/mainview/main.tsx` and `App.tsx`.
- [ ] Implement layout shell using Tailwind CSS (Sidebar, Header, Main, Terminal).
- [ ] Add draggable region support for the custom header.

---

## Phase 2: Database Connectivity & Sidebar
**Goal:** Ability to open, create, and list tables from a SQLite database.

### 2.1 Backend Logic
- [ ] `db/connection.ts`: `openDatabase`, `createEmptyDatabase`, `isValidDatabase`.
- [ ] `db/queries.ts`: `getTableNames`.

### 2.2 RPC Handlers
- [ ] Implement `dbOpen`, `dbCreate`, and `tableList` handlers in `src/bun/ipc/handlers.ts`.

### 2.3 Sidebar Component
- [ ] Create `Sidebar.tsx` component in `src/mainview/components`.
- [ ] Fetch and display table list on DB load.
- [ ] Implement table selection state.

---

## Phase 3: Data Grid & Viewing
**Goal:** display table rows and column headers in a premium React table view.

### 3.1 Data Fetching
- [ ] `db/queries.ts`: `getTableInfo` and `fetchTableData`.
- [ ] `tableFetchAll` RPC handler.

### 3.2 TableGrid Component
- [ ] Create `TableView.tsx` and `TableGrid.tsx` in `src/mainview/components`.
- [ ] Render dynamic columns and data rows.
- [ ] Style table with Tailwind (sticky headers, row striping, hover effects).
- [ ] Implement "Empty State" view.

---

## Phase 4: CRUD Operations & Inline Editing
**Goal:** Support editing cells, adding/deleting rows, and maintaining history.

### 4.1 CRUD Backend
- [ ] `db/queries.ts`: `insertDefaultRow`, `deleteRowById`, `updateCell`.
- [ ] RPCs: `rowInsert`, `rowDelete`, `cellUpdate`.

### 4.2 Inline Cell Component
- [ ] Create `CellInput.tsx` with local state for active/readonly modes.
- [ ] Handle `Enter` to commit, `Escape` to cancel.
- [ ] Visual feedback for errors (red focus ring).

### 4.3 Undo / Redo System
- [ ] Implement `useHistory` hook or centralized history state.
- [ ] `cellExec` RPC for low-level SQL execution (undo/redo).
- [ ] Dedicated keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`).

---

## Phase 5: SQL Terminal
**Goal:** Functional raw SQL terminal with React-rendered results.

### 5.1 Terminal Backend
- [ ] `db/queries.ts`: `execRawSQL`.
- [ ] `terminalExec` RPC handler.

### 5.2 Terminal Component
- [ ] Create `Terminal.tsx` with collapsible drawer.
- [ ] Render execution results as beautifully styled Tailwind tables.
- [ ] Command history (up/down arrow navigation).

---

## Phase 6: Schema Editor & Modals
**Goal:** Create/Modify tables and columns via React modals.

### 6.1 Validation Logic
- [ ] `validateIdentifier` utility (port from Python).
- [ ] Integration with React form validation.

### 6.2 Modals
- [ ] Implement `Modal` base component with Tailwind.
- [ ] `CreateTableModal`: Dynamic form for columns.
- [ ] `AddColumnModal`: Shared definition form.
- [ ] RPCs: `tableCreate`, `tableDrop`, `columnAdd`, `columnDrop`.

---

## Phase 7: Session & Final Polish
**Goal:** Persistence, auto-save, and production readiness.

### 7.1 Session & Auto-Save
- [ ] `session.ts`: `loadSession` and `saveSession`.
- [ ] Implement Auto-Save toggle logic in both processes.
- [ ] Restore last opened database on launch.

### 7.2 UX & Shortcuts
- [ ] Complete `ApplicationMenu` accelerators.
- [ ] Global loading indicators and toast notifications.
- [ ] Final visual polish and performance optimization.
