# SQL Editor

A high-performance, modern SQLite desktop editor built with **Electrobun**, **React**, and **Tailwind CSS**. Designed for speed, flexibility, and a premium developer experience.

## ✨ Key Features

- **Database Management**: Seamlessly open, create, and "Save As" SQLite databases.
- **Interactive Data Grid**: Powerful table view with in-place cell editing, row insertion, and deletion.
- **SQL Workspace**: Execute raw SQL queries, manage a library of snippets, and import/export `.sql` files.
- **Object Explorer**: Dedicated views for Triggers, Views, and Indexes with SQL definition inspection.
- **Undo/Redo System**: Robust history tracking for data cell updates.
- **Customizable UI**: Dark/Light modes, multiple accent colors, and global font scaling for accessibility.
- **Auto-save Mode**: Toggle between transaction-based manual saving and real-time auto-saving.

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

For the best experience with Hot Module Replacement (HMR):

```bash
# Start Electrobun with Vite HMR
bun run dev:hmr
```

*This starts a Vite server on port 5173 and tells Electrobun to load the application from there, allowing for instant UI updates.*

### Building for Production

```bash
# Build the production bundle
bun run build
```

## 📂 Project Structure

- `src/bun/`: Main process logic (Database connections, IPC handlers).
- `src/mainview/`: Frontend React application and components.
- `src/shared/`: Shared TypeScript types and schemas.
- `electrobun.config.ts`: Main application configuration.

## ⌨️ Keyboard Shortcuts

- `Ctrl+O`: Open Database
- `Ctrl+N`: New Database
- `Ctrl+S`: Save Changes
- `Ctrl+Z`: Undo Edit
- `Ctrl+Shift+Z` / `Ctrl+Y`: Redo Edit
- `Ctrl+R`: Refresh Tables
- `Ctrl+``: Toggle Terminal
