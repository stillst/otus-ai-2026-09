# JSON Viewer

A small JSON viewer built with Angular 22: paste or drop a JSON document on the left, explore it as a tree on the right.

## Features

- Source editor with live parsing (debounced) and a status line.
- Parse errors with line, column, a plain-language hint and a "Go to error" button. Positions come from a small recursive-descent locator, because only V8 reports them in `JSON.parse` messages.
- Collapsible tree built on `@angular/aria` (`ngTree`), keyboard navigable: arrows, Home/End, Enter, type-ahead.
- Search across keys and values with match highlighting, "n of m", Enter / Shift+Enter to move, ancestors expanded automatically.
- Copy path (JSONPath like `$.items[2].name`) and copy value per node, in the node bar, or with Ctrl/Cmd+C (Shift for the path) inside the tree.
- Beautify, Minify, Expand all, Collapse all.
- Open a file with the button or by drag-and-drop.
- Light and dark theme following the system, with a manual toggle remembered per browser. The last document is remembered too.

## Development

```bash
npm install
npm start        # http://localhost:4200
npm test         # vitest
npm run build
```

## Structure

- `src/app/core` — pure logic (`json-parse`, `json-tree`, `json-path`, `json-search`, `json-format`) and singleton stores (`JsonDocumentStore`, `ThemeStore`, `ClipboardWriter`).
- `src/app/features/editor` — source editor and the file-drop directive.
- `src/app/features/toolbar` — document actions.
- `src/app/features/viewer` — search, expansion, selection stores and the tree (`JsonTree`, recursive `JsonNode`).
- `src/app/shared` — highlight, toast, theme toggle.
- `src/styles.css` — design tokens for both themes.
