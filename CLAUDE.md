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
  order: number;           // position within parent
  type: 'list' | 'checklist';
};
```

Root-level lists have `parentId: null`. Items have `parentId` pointing to their list. Items can also have `parentId` pointing to another item — this creates sub-items (one level of nesting is currently rendered in the UI). The tree is reconstructed at read time via `getRootNodes()` / `getChildren()`.

### Drag-and-drop

There are **three DnD implementations** in various states of use:
1. **`@thisux/sveltednd`** — currently active in `+page.svelte` and `ListItem.svelte` via `use:draggable` / `use:droppable` directives
2. **Custom native HTML DnD actions** — `src/lib/actions/draggable.ts` and `src/lib/actions/droppable.ts` (serializes drag data via `dataTransfer`)
3. **`@dnd-kit-svelte`** — imported in `src/lib/components/dnd/droppable.svelte` but not wired into the main page

**Important `@thisux/sveltednd` behaviour**: `drop` events bubble up the DOM. When an item `<li>` and its parent list `<article>` both have `use:droppable`, dropping on an item fires both callbacks — the item's first (child → parent propagation). Guards in each handler prevent double-handling:

```ts
// onItemDrop: skip if item is already directly under targetItem (nest already handled)
if (draggedItem.parentId === targetItemId) return;

// onListDrop: skip if item is already a direct child of this list
if (!item || item.parentId === targetListId) return;
```

**Nested draggables**: Sub-items have both `use:draggable` and are inside a parent `<li>` that also has `use:draggable`. To prevent the parent from capturing the drag when a sub-item is grabbed, sub-items use `ondragstart={(e) => e.stopPropagation()}`. This stops the `dragstart` event from bubbling to the parent's draggable listener while still letting the sub-item's own listener fire.

DnD handlers live in `src/lib/handlers/dnd.ts` (`onListDrop`, `onItemDrop`, `onNestDrop`, `onTrashDrop`) — not in the page component.

`onNestDrop(targetItemId, state)` moves the dragged item to be a child of `targetItemId`. It guards against circular nesting with `isUnderNode(targetItemId, draggedItemId)` (walks the parentId chain).

`onTrashDrop` is used by the trash drop zone at the bottom of `+page.svelte` (container `'trash'`). The container identifier doesn't need to match the draggable's container — `@thisux/sveltednd` fires `onDrop` on any droppable the cursor lands on regardless of container mismatch. The trash zone sits outside the list DOM tree so event bubbling is not an issue.

### Layout

`+page.svelte` renders lists in a **4-column masonry layout** — items are distributed across columns by index modulo 4 (`getRootNodes().filter((_, i) => i % 4 === col)`), not CSS columns.

### File structure

```
src/lib/
  actions/
    focus.ts          # focus(node) action — auto-focuses an input on mount
    draggable.ts      # custom native HTML5 DnD (unused)
    droppable.ts      # custom native HTML5 DnD (unused)
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
- Manages its own `editing: boolean` state internally
- Uses `use:focus` action to auto-focus the textarea on edit
- Uses `<textarea>` with `field-sizing-content` for auto-height; Enter commits, Shift+Enter inserts newline
- Commits on `blur` or `Enter`; no cancel/escape handling
- In list mode, prepends a `-` bullet to non-title spans (`{#if getViewMode() === 'list' && !isTitle}-{/if}`)

Usage:
```svelte
<EditableText bind:value={node.description} />
<EditableText bind:value={list.description} isTitle />
```

When used inside a `use:draggable` element, include `interactive: ['span', 'input', 'textarea', 'label', 'button']` to prevent drag-start when clicking into the editable text.

### ListItem component

`src/lib/components/ListItem.svelte` renders a single list item and its sub-items (one level deep):
- Props: `itemId: string` — looks up the item reactively via `getItem(itemId)`
- Reads view mode from `getViewMode()` directly (no prop needed)
- The parent `<li>` has `use:draggable` + `use:droppable` (for reordering/cross-list moves)
- Sub-items are rendered inline as `<li>` elements inside a `<ul>` with `ondragstart|stopPropagation` to prevent parent drag capture
- A nest drop zone div (only rendered when `dndState.isDragging`) uses `onNestDrop` to accept drops and make them children of this item

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

| Concept | Avoid (Svelte 4) | Use (Svelte 5) |
|---|---|---|
| Props | `export let foo` | `let { foo } = $props()` |
| Events | `on:click={handler}` | `onclick={handler}` |
| Slots | `<slot>` | `{#snippet children()}` + `{@render children()}` |
| Actions | `use:action` | `@attach action` |
| Reactive decl | `$: value = expr` | `const value = $derived(expr)` |
| Side effects | `$: { sideEffect() }` | `$effect(() => { sideEffect() })` |

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
