export type Active<T = unknown> = { id: string; data: T };
export type Mode = 'pointer' | 'keyboard';
export type Direction = 'up' | 'down' | 'left' | 'right';

export type DroppableOptions<T = unknown> = {
	id: string;
	/** Return false to reject the active item (no highlight, no drop, skipped by keyboard navigation). */
	accepts?: (active: Active<T>) => boolean;
	onDrop: (active: Active<T>) => void;
};

type Entry = { node: HTMLElement; options: DroppableOptions };

const droppables = new Map<string, Entry>();

let active = $state.raw<Active | null>(null);
let over = $state.raw<string | null>(null);
let mode = $state.raw<Mode | null>(null);
let activeNode: HTMLElement | null = null;

/** Reactive, read-only view of the current drag. */
export const dnd = {
	get active() {
		return active;
	},
	get over() {
		return over;
	},
	get mode() {
		return mode;
	},
	get dragging() {
		return active !== null;
	}
};

// --- internals used by the attachments ---

export function register(node: HTMLElement, options: DroppableOptions) {
	const entry = { node, options };
	droppables.set(options.id, entry);
	return () => {
		if (droppables.get(options.id) === entry) droppables.delete(options.id);
		if (over === options.id) setOver(null);
	};
}

export function begin(node: HTMLElement, a: Active, m: Mode) {
	activeNode = node;
	active = a;
	mode = m;
	node.setAttribute('data-dragging', '');
}

export function setOver(id: string | null) {
	if (id === over) return;
	if (over) droppables.get(over)?.node.removeAttribute('data-over');
	if (id) droppables.get(id)?.node.setAttribute('data-over', '');
	over = id;
}

function allowed(id: string) {
	const entry = droppables.get(id);
	if (!entry || !active || !activeNode) return false;
	if (activeNode === entry.node || activeNode.contains(entry.node)) return false;
	return entry.options.accepts?.(active) ?? true;
}

/** Innermost accepting droppable under the given viewport point. */
export function overAt(x: number, y: number) {
	let el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-dnd-droppable]') ?? null;
	while (el) {
		const id = el.dataset.dndDroppable!;
		if (allowed(id)) return id;
		el = el.parentElement?.closest<HTMLElement>('[data-dnd-droppable]') ?? null;
	}
	return null;
}

/** Keyboard navigation: move `over` to the closest accepting droppable in a direction. */
export function moveOver(dir: Direction) {
	const ref = (over && droppables.get(over)?.node) || activeNode;
	if (!ref) return;
	const r = ref.getBoundingClientRect();
	const cx = r.left + r.width / 2;
	const cy = r.top + r.height / 2;
	let best: { id: string; score: number } | null = null;
	for (const [id, entry] of droppables) {
		if (id === over || !allowed(id)) continue;
		const b = entry.node.getBoundingClientRect();
		if (!b.width && !b.height) continue;
		const vertical = dir === 'up' || dir === 'down';
		const forward =
			dir === 'down'
				? b.top - r.top
				: dir === 'up'
					? r.top - b.top
					: dir === 'right'
						? b.left - r.left
						: r.left - b.left;
		if (forward <= 0) continue;
		const side = vertical ? Math.abs(b.left + b.width / 2 - cx) : Math.abs(b.top + b.height / 2 - cy);
		const score = forward + side * 2;
		if (!best || score < best.score) best = { id, score };
	}
	if (!best) return;
	setOver(best.id);
	droppables.get(best.id)!.node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

export function drop() {
	const entry = over && allowed(over) ? droppables.get(over) : null;
	const a = active;
	end();
	if (entry && a) entry.options.onDrop(a);
}

export function cancel() {
	end();
}

function end() {
	activeNode?.removeAttribute('data-dragging');
	setOver(null);
	active = null;
	mode = null;
	activeNode = null;
}
