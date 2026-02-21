<script lang="ts">
	import { draggable, droppable } from '@thisux/sveltednd';
	import type { DragDropState } from '@thisux/sveltednd';
	import { newId, newItemId } from '$lib/helpers/id';
	import {
		lists,
		addListItem,
		moveItemFromListToList,
		moveItemFromListToListAt,
		swapListItems
	} from '$lib/store/list.svelte';

	function addList() {
		lists.push({
			id: newId(),
			description: 'sample',
			type: 'list',
			done: false,
			items: [
				{ id: newItemId(), description: 'sample item 1', done: false },
				{ id: newItemId(), description: 'sample item 2', done: false }
			]
		});
	}

	function handleListDrop(targetListId: string, state: DragDropState) {
		const data = state.draggedItem as { itemId: string; listId: string } | null;
		if (!data?.itemId || data.listId === targetListId) return;
		moveItemFromListToList(data.listId, targetListId, data.itemId);
	}

	function handleItemDrop(targetItemId: string, state: DragDropState) {
		const data = state.draggedItem as { itemId: string; listId: string } | null;
		if (!data?.itemId || data.itemId === targetItemId) return;

		const fromList = lists.find((l) => l.id === data.listId);
		const toList = lists.find((l) => l.items.some((i) => i.id === targetItemId));
		if (!fromList || !toList) return;

		const fromIndex = fromList.items.findIndex((i) => i.id === data.itemId);
		const toIndex = toList.items.findIndex((i) => i.id === targetItemId);
		if (fromIndex < 0 || toIndex < 0) return;

		if (fromList.id === toList.id) {
			if (fromIndex === toIndex) return;
			swapListItems(fromList.id, fromIndex, toIndex);
		} else {
			moveItemFromListToListAt(data.listId, toList.id, data.itemId, toIndex);
		}
	}
</script>

<main class="mx-auto mt-10 w-6xl">
	<h1 class="mb-4 text-2xl font-bold">Lists</h1>
	<button onclick={addList}>Add List</button>
	<div class="grid grid-cols-3 gap-4">
		{#each lists as list (list.id)}
			<article
				use:droppable={{
					container: list.id,
					callbacks: { onDrop: (s) => handleListDrop(list.id, s) }
				}}
				class="rounded border border-gray-300 bg-white p-4"
			>
				<h2 class="mb-3 text-lg font-semibold">{list.description}</h2>
				<ul class="min-h-40 space-y-2">
					{#each list.items as item (item.id)}
						<li
							use:draggable={{
								container: list.id,
								dragData: { itemId: item.id, listId: list.id }
							}}
							use:droppable={{
								container: item.id,
								callbacks: { onDrop: (s) => handleItemDrop(item.id, s) }
							}}
							class="cursor-grab rounded border border-gray-200 bg-gray-50 p-2 select-none"
						>
							{item.description}
						</li>
					{/each}
				</ul>
				<button
					class="mt-3 text-sm underline"
					onclick={() => addListItem(list.id, { description: 'sample item', done: false })}
				>
					Add Item
				</button>
			</article>
		{/each}
	</div>
</main>
