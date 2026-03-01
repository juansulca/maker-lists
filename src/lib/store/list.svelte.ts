import { newItemId } from '$lib/helpers/id';
import type { Item, List } from '$lib/types/list';

export const lists = $state<List[]>([]);

export function swapListItems(id: string, ...swapIndex: [number, number]) {
	const list = lists.find((list) => list.id === id);
	if (list) {
		const [from, to] = swapIndex;
		const [item] = list.items.splice(from, 1);
		list.items.splice(to, 0, item);
	}

	return;
}

export function addListItem(id: string, item: Pick<Item, 'description' | 'done'>) {
	const list = lists.find((list) => list.id === id);
	if (list) {
		const newItem = {
			id: newItemId(),
			...item
		};
		list.items.push(newItem);
	}
}

export function moveItemFromListToList(fromId: string, toId: string, itemId: string) {
	const fromList = lists.find((list) => list.id === fromId);
	const toList = lists.find((list) => list.id === toId);
	if (fromList && toList) {
		const item = fromList.items.find((item) => item.id === itemId);
		if (item) {
			toList.items = [...toList.items, item];
			fromList.items = fromList.items.filter((item) => item.id !== itemId);
		}
	}
	return;
}

export function moveItemFromListToListAt(
	fromId: string,
	toId: string,
	itemId: string,
	insertIndex: number
) {
	const fromList = lists.find((list) => list.id === fromId);
	const toList = lists.find((list) => list.id === toId);
	if (fromList && toList) {
		const item = fromList.items.find((item) => item.id === itemId);
		if (item) {
			toList.items = [
				...toList.items.slice(0, insertIndex),
				item,
				...toList.items.slice(insertIndex)
			];
			fromList.items = fromList.items.filter((item) => item.id !== itemId);
		}
	}
	return;
}

export function renameList(id: string, description: string) {
	const list = lists.find((l) => l.id === id);
	if (list) list.description = description;
}

export function renameItem(listId: string, itemId: string, description: string) {
	const list = lists.find((l) => l.id === listId);
	const item = list?.items.find((i) => i.id === itemId);
	if (item) item.description = description;
}
