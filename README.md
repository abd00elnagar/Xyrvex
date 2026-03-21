# <img src="./src/mainview/public/logo-long.png" width="40" height="40" align="center" style="margin-right: 10px;"> Xyrvex

A high-performance, modern SQLite desktop editor built with **Electrobun**, **React**, and **Tailwind CSS**. Designed for speed, flexibility, and a premium developer experience.

---

## ⚡ Quick Start

### 1. Prerequisites
You must have [Bun](https://bun.sh/) installed on your system.

### 2. Installation & Run
```bash
# Clone the repository and navigate to the project directory
git clone https://github.com/abd00elnagar/Xyrvex.git
cd Xyrvex

# Install dependencies
bun install

# Launch Development environment with HMR
bun run dev:hmr
```

> [!TIP]
> Use `bun run dev` for standard watch mode or `bun run build` to create a production-ready package.

---

## 🚀 Core Capabilities

1.  **Direct Database Access**: Open any existing SQLite database file (`.db`, `.sqlite`, `.sqlite3`) or create new ones from scratch.
2.  **In-place Data Editing**: Update cell data instantly by double-clicking. Robust handling for all SQLite types and `NULL` values.
3.  **Advanced Table Management**: Dedicated UI for creating new tables and modifying existing ones (adding/dropping columns).
4.  **Effortless Row Operations**: Insert new rows with intelligent defaults or delete records with safety confirmations.
5.  **Schema Browser**: Comprehensive object exploration for Views, Triggers, and Indexes, including raw `CREATE` SQL viewing.
6.  **Interactive SQL Console**: Execute raw SQL queries and view formatted results in an integrated terminal-like interface.
7.  **Snippet Library**: Manage frequently used queries with built-in renaming and `.sql` file import/export support.
8.  **Undo/Redo History**: Full transactional support for data edits—roll back changes safely at any time.
9.  **Premium UI Customization**: Choose between Dark, Light, and "True Black" modes. Global UI scaling and accent color support.
10. **Smart Persistence**: Switch between manual "Save" (transactions) for safety or "Autosave" for real-time disk syncing.
11. **Filtered Workspace**: Intelligent filtering automatically hides internal SQLite system tables for a cleaner view.
12. **Adaptive Layout**: Fully resizable sidebar that persists its configuration across your sessions.

---

## 🛠️ Tech Stack

*   **Runtime**: [Bun](https://bun.sh/)
*   **Desktop Engine**: [Electrobun](https://electrobun.dev/)
*   **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Database**: Native SQLite via Bun's high-speed driver.

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Open Database** | `Ctrl + O` |
| **New Database** | `Ctrl + N` |
| **Save Changes** | `Ctrl + S` |
| **Undo Edit** | `Ctrl + Z` |
| **Redo Edit** | `Ctrl + Shift + Z` |
| **Refresh Tables** | `Ctrl + R` |
| **Toggle SQL Console** | `Ctrl + \`` |
