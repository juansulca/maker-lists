# Maker List

This project is inspired on the chapter "Checklist" from Every tool's a hammer by Adam Savage.

It follows the 4 simple principles:

1. Brain dump: The quickly and dirty stuff.
2. The big chunks: Group and organize into manageable chunks. Break out and then break down.
3. The medium chunks: Reorganize the the components into medium chunks by subcategories.
4. Checklists: track progress and make

The application has two modes: list mode and checklists mode.
List mode si simplified and optimized for input. Items can be dragged and dropped to sort, swap and delete items from a list.

Checklist mode is for tracking progress, entries can be sorted, swapped and deleted in addition to tracking the progress.

## Upcoming features:

- Subitems on lists
- Grouping
- Search
- Cloud sync

## Developing

Once you've created a project and installed dependencies with `pnpm install`, start a development server:

```sh
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.
