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

`src/lib/store/list.svelte.ts` holds the single global `$state<List[]>` array and exports all mutation functions (`addListItem`, `moveItemFromListToList`, `moveItemFromListToListAt`, `swapListItems`, `renameList`, `renameItem`). All state mutations go through these functions — never mutate the array directly in components (except `lists.push(...)` in `+page.svelte` for adding a new list).

### Types

`src/lib/types/list.ts` defines the two core types:
- `Item` — `{ id, description, done }`
- `List` — `{ id, description, type: 'list' | 'checklist', done, items: Item[] }`

### Drag-and-drop

There are **three DnD implementations** in various states of use:
1. **`@thisux/sveltednd`** — currently active in `+page.svelte` via `use:draggable` / `use:droppable` directives
2. **Custom native HTML DnD actions** — `src/lib/actions/draggable.ts` and `src/lib/actions/droppable.ts` (serializes drag data via `dataTransfer`)
3. **`@dnd-kit-svelte`** — imported in `src/lib/components/dnd/droppable.svelte` but not wired into the main page

The app is WIP; the DnD approach may still be in flux.

### Layout

`+page.svelte` renders lists in a **4-column masonry layout** — items are distributed across columns by index modulo 4 (`lists.filter((_, i) => i % 4 === col)`), not CSS columns.

### Helpers

- `src/lib/helpers/id.ts` — `newId()` (8-char nanoid for lists), `newItemId()` (6-char nanoid for items)
- `src/lib/helpers/randomName.ts` — `generateRandomName()` returns a random `adjective noun` string used as placeholder names

## Code style

Prettier config (tabs, single quotes, no trailing commas, 120 char width). Tailwind v4 with `@tailwindcss/vite` plugin — no `tailwind.config.js`, styles are in `src/routes/layout.css`.

Svelte 5 runes (`$state`, `$props`, `$derived`) are used throughout — avoid Svelte 4 reactive syntax.

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
