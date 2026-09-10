import type { Active } from '$lib/dnd';
import { nodes, moveItemToList, moveItemToListAt, swapItems, deleteItem } from '$lib/store/list.svelte';

function isUnderNode(itemId: string, ancestorId: string): boolean {
	const item = nodes.find((n) => n.id === itemId);
	if (!item?.parentId) return false;
	if (item.parentId === ancestorId) return true;
	return isUnderNode(item.parentId, ancestorId);
}

/** A list accepts anything that is not already one of its direct children. */
export function canDropOnList(listId: string, active: Active) {
	return nodes.find((n) => n.id === active.id)?.parentId !== listId;
}

/** Drop on a list: append to the end (also un-nests sub-items). */
export function onListDrop(targetListId: string, active: Active) {
	if (!canDropOnList(targetListId, active)) return;
	moveItemToList(active.id, targetListId);
}

/** Drop on an item: swap positions within the same parent, otherwise insert at the target's position. */
export function onItemDrop(targetItemId: string, active: Active) {
	if (active.id === targetItemId || isUnderNode(targetItemId, active.id)) return;
	const dragged = nodes.find((n) => n.id === active.id);
	const target = nodes.find((n) => n.id === targetItemId);
	if (!dragged || !target) return;
	if (dragged.parentId === target.parentId) swapItems(active.id, targetItemId);
	else moveItemToListAt(active.id, target.parentId!, target.order);
}

/** Drop to make the dragged item a child of the target. */
export function onNestDrop(targetItemId: string, active: Active) {
	if (active.id === targetItemId || isUnderNode(targetItemId, active.id)) return;
	const dragged = nodes.find((n) => n.id === active.id);
	if (!dragged || dragged.parentId === targetItemId) return;
	moveItemToList(active.id, targetItemId);
}

export function onTrashDrop(active: Active) {
	deleteItem(active.id);
}
