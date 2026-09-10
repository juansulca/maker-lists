import type { Attachment } from 'svelte/attachments';
import { register, type DroppableOptions } from './state.svelte';

/**
 * Registers an element as a drop target. Sets `data-over` while an accepted item hovers it.
 * Nested droppables are fine: the innermost accepting one under the pointer wins.
 */
export function droppable<T = unknown>(options: DroppableOptions<T>): Attachment<HTMLElement> {
	return (node) => {
		node.dataset.dndDroppable = options.id;
		const unregister = register(node, options as DroppableOptions);
		return () => {
			unregister();
			delete node.dataset.dndDroppable;
		};
	};
}
