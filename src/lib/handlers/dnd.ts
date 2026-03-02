import type { DragDropState } from '@thisux/sveltednd';
import { nodes, moveItemToList, moveItemToListAt, swapItems, deleteItem } from '$lib/store/list.svelte';

type DragData = { itemId: string; listId: string };

// Set to true by the first droppable that handles a drop; prevents double-firing
// when drop events bubble through nested droppables. Reset after event loop tick.
// let dropHandled = false;

function isUnderNode(itemId: string, ancestorId: string): boolean {
	const item = nodes.find((n) => n.id === itemId);
	if (!item?.parentId) return false;
	if (item.parentId === ancestorId) return true;
	return isUnderNode(item.parentId, ancestorId);
}

export function onListDrop(targetListId: string, state: DragDropState) {
	// if (dropHandled) return;
	const data = state.draggedItem as DragData | null;
	if (!data?.itemId || data.listId === targetListId) return;
	const item = nodes.find((n) => n.id === data.itemId);
	// Direct parent check: allows un-nesting (item.parentId is a parent item, not the list)
	if (!item || item.parentId === targetListId) return;
	moveItemToList(data.itemId, targetListId);
}

export function onItemDrop(targetItemId: string, state: DragDropState) {
	// if (dropHandled) return;
	const data = state.draggedItem as DragData | null;
	if (!data?.itemId || data.itemId === targetItemId) return;
	const draggedItem = nodes.find((n) => n.id === data.itemId);
	const targetItem = nodes.find((n) => n.id === targetItemId);
	if (!draggedItem || !targetItem) return;
	// Guard: already nested under targetItem (onNestDrop ran first)
	if (draggedItem.parentId === targetItemId) return;
	if (draggedItem.parentId === targetItem.parentId) {
		swapItems(data.itemId, targetItemId);
	} else {
		moveItemToListAt(data.itemId, targetItem.parentId!, targetItem.order);
	}
	// dropHandled = true;
	// queueMicrotask(() => {
	// 	dropHandled = false;
	// });
}

export function onNestDrop(targetItemId: string, state: DragDropState) {
	// if (dropHandled) return;
	const data = state.draggedItem as DragData | null;
	if (!data?.itemId || data.itemId === targetItemId) return;
	const draggedItem = nodes.find((n) => n.id === data.itemId);
	if (!draggedItem) return;
	// Prevent circular nesting: can't nest an item under its own descendant
	if (isUnderNode(targetItemId, data.itemId)) return;
	if (draggedItem.parentId === targetItemId) return;
	moveItemToList(data.itemId, targetItemId);
	// dropHandled = true;
	// queueMicrotask(() => {
	// 	dropHandled = false;
	// });
}

export function onTrashDrop(state: DragDropState) {
	const data = state.draggedItem as DragData | null;
	if (!data?.itemId) return;
	deleteItem(data.itemId);
}
