# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # Type-check with svelte-check
pnpm lint         # Check formatting + ESLint
pnpm format       # Auto-format with Prettier
```

> Package manager is **pnpm**. There are no tests.

## Architecture

This is a **SvelteKit + Svelte 5** kanban/notes app with drag-and-drop list management.

### State management

`src/lib/store/list.svelte.ts` holds the single global `$state<Node[]>` flat array and exports all mutation functions and read helpers. All state mutations go through these functions — never mutate the array itself directly in components.

Exported store API:

- **Read**: `getRootNodes()`, `getChildren(parentId)`, `getItem(id)` (throws if not found)
- **Write**: `addList(description, type?)`, `addListItem(parentId, description)`, `moveItemToList(itemId, toParentId)`, `moveItemToListAt(itemId, toParentId, insertIndex)`, `swapItems(id1, id2)`, `renameNode(id, description)`, `deleteItem(itemId)`, `deleteList(listId)`, `clearAllLists()`, `resetDone()`

`deleteList` and `deleteItem` both recursively collect all descendant IDs before splicing — deleting a node always removes its entire subtree. `clearAllLists` does a single `splice(0, length)`.

`src/lib/store/viewMode.svelte.ts` holds global view mode state (`'list' | 'checklist'`). API: `getViewMode()`, `setViewMode(mode)`, `toggleViewMode()`. Import this anywhere view mode is needed instead of prop-drilling.

Direct property mutation on reactive `$state` objects (e.g. `node.description = ...`) is acceptable inside components — `$bindable` props do this implicitly and it is the correct Svelte 5 pattern. What must go through store functions is structural changes to the `nodes` array (push, splice, reorder).

### Data model

`src/lib/types/list.ts` defines a single flat `Node` type designed to map 1:1 to a SQL table:

```ts
type Node = {
	id: string;
	description: string;
	done: boolean;
	parentId: string | null; // null = root-level list
	order: number; // position within parent
	type: 'list' | 'checklist';
};
```

Root-level lists have `parentId: null`. Items have `parentId` pointing to their list. Items can also have `parentId` pointing to another item — this creates sub-items (one level of nesting is currently rendered in the UI). The tree is reconstructed at read time via `getRootNodes()` / `getChildren()`.

### Drag-and-drop

The app uses its own tiny runes-based DnD library in `src/lib/dnd/` (no HTML5 drag events). Public API (`$lib/dnd`):

- `draggable({ id, data?, disabled?, interactive? })` — attachment (`{@attach draggable(...)}`). Pointer: 4px move threshold for mouse (so clicks on children still work), 200ms hold for touch. Keyboard: element gets `tabindex="0"`; Space/Enter picks up, arrow keys move the target to the nearest droppable in that direction, Space/Enter drops, Escape/blur cancels. Sets `data-dragging` while active. `interactive` (default `input, textarea, select, button, a, [contenteditable]`) lists descendants that never start a pointer drag.
- `droppable({ id, accepts?, onDrop })` — attachment. `accepts(active)` returning `false` hides the highlight, blocks the drop and skips it during keyboard navigation. Sets `data-over` while an accepted item hovers it. Style with Tailwind variants: `data-over:ring-2`, `data-dragging:opacity-80`.
- `dnd` — reactive read-only state: `dnd.active` (`{ id, data } | null`), `dnd.over` (droppable id), `dnd.mode` (`'pointer' | 'keyboard'`), `dnd.dragging`.

Hit-testing uses `document.elementFromPoint` + `closest('[data-dnd-droppable]')`, so **nested droppables are safe**: the innermost accepting droppable wins and only its `onDrop` fires (no bubbling, no double-handling). A rejected droppable falls through to its nearest droppable ancestor. The dragged element (and its descendants) is never a valid target. Nested draggables are safe too: a `pointerdown` is only handled by the closest `[data-dnd-draggable]`.

Internals live in `src/lib/dnd/state.svelte.ts` (state, droppable registry, `overAt`, `moveOver`, `drop`, `cancel`); the attachments in `draggable.ts` / `droppable.ts` only wire DOM events to it.

DnD handlers live in `src/lib/handlers/dnd.ts`, all taking `(targetId, active: Active)`: `onListDrop` (append / un-nest), `onItemDrop` (swap within same parent, otherwise insert at the target's position), `onNestDrop` (make child of target, currently unused), `onTrashDrop` (delete). `canDropOnList(listId, active)` is the `accepts` predicate for lists (rejects direct children). `isUnderNode` walks the `parentId` chain to prevent circular nesting.

Older experiments still in the repo but unused: `src/lib/actions/draggable.ts` / `droppable.ts` (native HTML5 DnD) and `@dnd-kit-svelte` (`src/lib/components/Item.svelte`, `src/lib/components/dnd/`, `src/routes/test/`). `@thisux/sveltednd` is still in `package.json` but no longer imported.

### Layout

`+page.svelte` renders lists in a **4-column masonry layout** — items are distributed across columns by index modulo 4 (`getRootNodes().filter((_, i) => i % 4 === col)`), not CSS columns.

### File structure

```
src/lib/
  actions/
    focus.ts          # focus(node) action — auto-focuses an input on mount
    draggable.ts      # custom native HTML5 DnD (unused)
    droppable.ts      # custom native HTML5 DnD (unused)
  dnd/
    index.ts          # public API: draggable, droppable, dnd
    state.svelte.ts   # reactive drag state, droppable registry, hit-testing, keyboard navigation
    draggable.ts      # draggable attachment (pointer + keyboard)
    droppable.ts      # droppable attachment
  components/
    EditableText.svelte  # click-to-edit span/textarea toggle
    ListItem.svelte      # renders a list item + its sub-items; takes itemId prop
    Item.svelte          # @dnd-kit-svelte sortable item (unused in main page)
    dnd/droppable.svelte # @dnd-kit-svelte droppable (unused in main page)
  handlers/
    dnd.ts            # onListDrop, onItemDrop, onNestDrop, onTrashDrop
  helpers/
    id.ts             # newId() 8-char nanoid, newItemId() 6-char nanoid
    randomName.ts     # generateRandomName() → "adjective noun"
  store/
    list.svelte.ts    # global nodes $state + all mutation functions
    viewMode.svelte.ts # global viewMode $state ('list' | 'checklist')
    db.ts             # IndexedDB helpers (loadNodes / saveNodes)
  types/
    list.ts           # Node type
```

### EditableText component

`src/lib/components/EditableText.svelte` is a reusable click-to-edit component:

- Props: `bind:value` (bindable string), `class` (optional extra classes for the span), `isTitle` (boolean, default false)
- Manages its own `editing: boolean` state and a `draft` copy of the value; `value` is only written on commit
- Edits in a `<textarea>` sized to its content by an inline `autosize` attachment (focus, caret at end, `height = scrollHeight` on mount and on `input`) — no reliance on `field-sizing`, so it works in Safari/Firefox and shows the full text immediately
- Enter commits (trimmed; empty input keeps the old value), Shift+Enter inserts a newline, Escape cancels, blur commits
- Both span and textarea use `whitespace-pre-wrap wrap-anywhere px-1` so multi-line text renders identically in both modes and there is no layout jump
- In list mode, prepends a `- ` bullet to non-title spans

Usage:

```svelte
<EditableText bind:value={node.description} />
<EditableText bind:value={list.description} isTitle />
```

Inside a `draggable`, clicking the text still edits it: the pointer drag only starts after the cursor moves a few pixels, and the textarea is in the default `interactive` list.

### ListItem component

`src/lib/components/ListItem.svelte` renders a single list item and its sub-items (one level deep):

- Props: `itemId: string` — looks up the item reactively via `getItem(itemId)`
- Reads view mode from `getViewMode()` directly (no prop needed)
- The `<li>` has `{@attach draggable({ id })}` + `{@attach droppable({ id, onDrop: onItemDrop })}` (for reordering/cross-list moves) and `aria-describedby="dnd-instructions"` (visually hidden keyboard instructions in `+page.svelte`)
- Sub-items are rendered inline as `<li>` elements inside a `<ul>` with the same attachments; no special handling needed for nesting

### Helpers

- `src/lib/helpers/id.ts` — `newId()` (8-char nanoid for lists), `newItemId()` (6-char nanoid for items)
- `src/lib/helpers/randomName.ts` — `generateRandomName()` returns a random `adjective noun` string used as placeholder names

## Code style

Prettier config (tabs, single quotes, no trailing commas, 120 char width). Tailwind v4 with `@tailwindcss/vite` plugin — no `tailwind.config.js`, styles are in `src/routes/layout.css`.

Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`, `$inspect`) are used throughout — avoid Svelte 4 reactive syntax.

### Confirmation dialogs

Use inline Svelte state (`let confirming = $state(false)`) rather than `window.confirm()` for dangerous actions. Toggle to show an inline "Are you sure?" prompt with confirm/cancel buttons — no modal component needed.

## Coding rules

- Always use TypeScript; all `.svelte` files must have `<script lang="ts">`
- Do NOT write explicit return types for functions unless genuinely necessary
- Do NOT add unit tests unless explicitly asked
- Use Tailwind v4 for all styling; only write custom CSS when Tailwind can't cover it
- Be extremely concise — avoid unnecessary abstractions, helpers, and boilerplate
- Icons: import from `@lucide/svelte` (e.g. `import { Skull } from '@lucide/svelte'`)

## Svelte 5 patterns

Runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`, `$inspect`) are compiler keywords — never import them.

| Concept       | Avoid (Svelte 4)      | Use (Svelte 5)                                   |
| ------------- | --------------------- | ------------------------------------------------ |
| Props         | `export let foo`      | `let { foo } = $props()`                         |
| Events        | `on:click={handler}`  | `onclick={handler}`                              |
| Slots         | `<slot>`              | `{#snippet children()}` + `{@render children()}` |
| Actions       | `use:action`          | `@attach action`                                 |
| Reactive decl | `$: value = expr`     | `const value = $derived(expr)`                   |
| Side effects  | `$: { sideEffect() }` | `$effect(() => { sideEffect() })`                |

Additional rules:

- Keep `$derived` pure (no side effects); use `$effect` only for side effects (DOM, subscriptions, logging)
- `$effect` runs after DOM updates, browser-only; return a cleanup fn when needed
- For bindable props: `let { value = $bindable('') } = $props()`
- Do not destructure reactive `$state` objects/arrays — access properties directly
- Export reactive state as an object or via getter functions, not `export let x = $state()`
- Event modifiers (`on:click|preventDefault`) are gone — handle modifiers manually in the handler

## Tailwind v4

- Config is CSS-first: use `@theme` block in `src/routes/layout.css`, no `tailwind.config.js`
- Import: `@import "tailwindcss"` (replaces `@tailwind base; @tailwind components; @tailwind utilities;`)
- CSS variables in arbitrary values: `bg-(--brand-color)` not `bg-[--brand-color]`
- Opacity shorthand: `bg-black/50` — the old `bg-opacity-*` utilities are removed
- Renamed utilities: `shadow-sm`→`shadow-xs`, `blur-sm`→`blur-xs`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`
- Default `ring` width is 1px (was 3px); default border color is `currentColor` (was gray-200)
- Hover styles only apply on hover-capable devices (`@media (hover: hover)`) by default
