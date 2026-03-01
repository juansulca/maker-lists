import { newId, newItemId } from '$lib/helpers/id';
import type { Node } from '$lib/types/list';

export const nodes = $state<Node[]>([]);

export function getRootNodes() {
	return nodes.filter((n) => n.parentId === null).sort((a, b) => a.order - b.order);
}

export function getChildren(parentId: string) {
	return nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.order - b.order);
}

export function addList(description: string, type: 'list' | 'checklist' = 'list') {
	const order = nodes.filter((n) => n.parentId === null).length;
	nodes.push({ id: newId(), description, done: false, parentId: null, order, type });
}

export function addListItem(parentId: string, description: string) {
	const parent = nodes.find((n) => n.id === parentId);
	const order = nodes.filter((n) => n.parentId === parentId).length;
	nodes.push({ id: newItemId(), description, done: false, parentId, order, type: parent?.type ?? 'list' });
}

export function moveItemToList(itemId: string, toParentId: string) {
	const item = nodes.find((n) => n.id === itemId);
	if (!item) return;
	const oldParentId = item.parentId;
	nodes
		.filter((n) => n.parentId === oldParentId && n.id !== itemId)
		.sort((a, b) => a.order - b.order)
		.forEach((n, i) => (n.order = i));
	item.parentId = toParentId;
	item.order = nodes.filter((n) => n.parentId === toParentId && n.id !== itemId).length;
}

export function moveItemToListAt(itemId: string, toParentId: string, insertIndex: number) {
	const item = nodes.find((n) => n.id === itemId);
	if (!item) return;
	const oldParentId = item.parentId;
	nodes
		.filter((n) => n.parentId === oldParentId && n.id !== itemId)
		.sort((a, b) => a.order - b.order)
		.forEach((n, i) => (n.order = i));
	item.parentId = toParentId;
	nodes
		.filter((n) => n.parentId === toParentId && n.id !== itemId)
		.sort((a, b) => a.order - b.order)
		.forEach((n, i) => (n.order = i < insertIndex ? i : i + 1));
	item.order = insertIndex;
}

export function swapItems(id1: string, id2: string) {
	const a = nodes.find((n) => n.id === id1);
	const b = nodes.find((n) => n.id === id2);
	if (a && b) [a.order, b.order] = [b.order, a.order];
}

export function renameNode(id: string, description: string) {
	const node = nodes.find((n) => n.id === id);
	if (node) node.description = description;
}

export function deleteItem(itemId: string) {
	const idx = nodes.findIndex((n) => n.id === itemId);
	if (idx !== -1) nodes.splice(idx, 1);
}

export function deleteList(listId: string) {
	const toRemove = new Set(nodes.filter((n) => n.parentId === listId).map((n) => n.id));
	toRemove.add(listId);
	nodes.splice(0, nodes.length, ...nodes.filter((n) => !toRemove.has(n.id)));
}

export function clearAllLists() {
	nodes.splice(0, nodes.length);
}

export function resetDone() {
	for (const node of nodes) node.done = false;
}
