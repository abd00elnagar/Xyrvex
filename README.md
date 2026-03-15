# <img src="./logo.png" width="40" height="40" align="center" style="margin-right: 10px;"> Xyrvex

A high-performance, modern SQLite desktop editor built with **Electrobun**, **React**, and **Tailwind CSS**. Designed for speed, flexibility, and a premium developer experience.

## 🚀 Core Capabilities

1. **Database Access**: Open any existing SQLite database file (`.db`, `.sqlite`, `.sqlite3`) or create new ones from scratch directly in the app.
2. **In-place Data Editing**: Update any cell in any table by double-clicking it. Supports all SQLite types with specialized handling for `NULL` values.
3. **Table Management**: Create new tables with a dedicated UI and modify existing ones by adding or dropping columns.
4. **Row Operations**: Instantly insert new rows with intelligent default values or delete existing records with safety confirmations.
5. **Schema Object Browser**: Explore and manage Views, Triggers, and Indexes. View the exact SQL `CREATE` statements used to define them.
6. **SQL Console**: Run raw SQL queries against your database and view formatted results in an integrated terminal.
7. **Snippet Library**: Save frequently used SQL queries, rename them, and import/export them as `.sql` files.
8. **Undo/Redo History**: Mis-edited a cell? Use full Undo/Redo support to roll back changes without losing data.
9. **Theme & UI Customization**: Switch between Dark, Light, and "True Black" modes. Customize accent colors and scale UI/Editor font sizes globally.
10. **Autosave & Transactions**: Choose between manual "Save" (transactions) for safety or "Autosave" for real-time synchronization to disk.
11. **Smart Filtering**: The app automatically hides internal SQLite system tables so you only see the data that matters to you.
12. **Sidebar Resizing**: Flexible workspace with a resizable sidebar that remembers its width between sessions.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Desktop Engine**: [Electrobun](https://electrobun.dev/)
- **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: Native SQLite via Bun's high-speed driver.

## 🚀 Getting Started

### Prerequisites

You must have [Bun](https://bun.sh/) installed on your system.

### Installation

```bash
# Clone the repository and install dependencies
bun install
```

### Development

```bash
# Start Electrobun with Vite HMR (Hot Module Replacement)
bun run dev:hmr
```

## ⌨️ Keyboard Shortcuts

- `Ctrl+O`: Open Database
- `Ctrl+N`: New Database
- `Ctrl+S`: Save Changes
- `Ctrl+Z`: Undo Edit
- `Ctrl+Shift+Z`: Redo Edit
- `Ctrl+R`: Refresh Tables
- `Ctrl+``: Toggle SQL Console
