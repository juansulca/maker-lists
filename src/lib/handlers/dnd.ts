import type { DragDropState } from '@thisux/sveltednd';
import { nodes, moveItemToList, moveItemToListAt, swapItems } from '$lib/store/list.svelte';

type DragData = { itemId: string; listId: string };

export function onListDrop(targetListId: string, state: DragDropState) {
	const data = state.draggedItem as DragData | null;
	if (!data?.itemId || data.listId === targetListId) return;
	const item = nodes.find((n) => n.id === data.itemId);
	if (!item || item.parentId === targetListId) return;
	moveItemToList(data.itemId, targetListId);
}

export function onItemDrop(targetItemId: string, state: DragDropState) {
	const data = state.draggedItem as DragData | null;
	if (!data?.itemId || data.itemId === targetItemId) return;
	const draggedItem = nodes.find((n) => n.id === data.itemId);
	const targetItem = nodes.find((n) => n.id === targetItemId);
	if (!draggedItem || !targetItem) return;
	if (draggedItem.parentId === targetItem.parentId) {
		swapItems(data.itemId, targetItemId);
	} else {
		moveItemToListAt(data.itemId, targetItem.parentId!, targetItem.order);
	}
}
