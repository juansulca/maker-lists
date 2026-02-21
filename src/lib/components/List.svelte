<script lang="ts">
	import { droppable, sortable } from '$lib/dnd';
	import type { DndStateSnapshot } from '$lib/dnd';
	import type { List } from '$lib/types/list';
	import { addListItem, moveItemFromListToList, swapListItems } from '$lib/store/list.svelte';
	import { flip } from 'svelte/animate';

	type DragData = {
		itemId: string;
		listId: string;
		description: string;
	};

	let { list }: { list: List } = $props();

	function handleAddItem() {
		addListItem(list.id, { description: 'sample item', done: false });
	}

	function handleSort(activeId: string, overId: string, state: DndStateSnapshot) {
		const fromIndex = list.items.findIndex((item) => item.id === activeId);
		const overIndex = list.items.findIndex((item) => item.id === overId);
		if (fromIndex < 0 || overIndex < 0) return;
		const rawTo = state.overPlacement === 'after' ? overIndex + 1 : overIndex;
		const targetIndex = fromIndex < rawTo ? rawTo - 1 : rawTo;
		if (targetIndex === fromIndex) return;
		swapListItems(list.id, fromIndex, targetIndex);
	}

	function handleDragEnd(state: DndStateSnapshot) {
		if (state.cancelled || !state.overId || !state.activeData) return;
		if (typeof state.activeData !== 'object') return;
		if (!('listId' in state.activeData) || !('itemId' in state.activeData)) return;

		const data = state.activeData as DragData;
		if (state.overId === data.listId) return;
		moveItemFromListToList(data.listId, state.overId, data.itemId);
	}
</script>

<article
	use:droppable={{
		id: list.id,
		data: { listId: list.id }
	}}
	class="rounded border border-gray-300 bg-white p-4"
>
	<h2 class="mb-3 text-lg font-semibold">{list.description}</h2>
	<ul class="min-h-40 space-y-2">
		{#each list.items as item (item.id)}
			<li
				animate:flip={{ duration: 150 }}
				use:sortable={{
					id: item.id,
					containerId: list.id,
					data: { itemId: item.id, listId: list.id, description: item.description },
					callbacks: {
						onSort: handleSort,
						onDragEnd: handleDragEnd
					}
				}}
				class="cursor-grab rounded border border-gray-200 bg-gray-50 p-2 select-none"
			>
				{item.description}
			</li>
		{/each}
	</ul>
	<button class="mt-3 text-sm underline" onclick={handleAddItem}>Add Item</button>
</article>
