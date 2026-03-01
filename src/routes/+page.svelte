<script lang="ts">
	import { draggable, droppable } from '@thisux/sveltednd';
	import type { DragDropState } from '@thisux/sveltednd';
	import { newId, newItemId } from '$lib/helpers/id';
	import {
		lists,
		addListItem,
		moveItemFromListToList,
		moveItemFromListToListAt,
		swapListItems,
		renameList,
		renameItem
	} from '$lib/store/list.svelte';
	import { generateRandomName } from '$lib/helpers/randomName';

	function addList() {
		lists.push({
			id: newId(),
			description: generateRandomName(),
			type: 'list',
			done: false,
			items: [{ id: newItemId(), description: generateRandomName(), done: false }]
		});
	}

	function handleListDrop(targetListId: string, state: DragDropState) {
		const data = state.draggedItem as { itemId: string; listId: string } | null;
		if (!data?.itemId || data.listId === targetListId) return;
		moveItemFromListToList(data.listId, targetListId, data.itemId);
	}

	let editingId = $state<string | null>(null);

	function focusInput(node: HTMLInputElement) {
		node.focus();
		return {};
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

<main class="mx-auto mt-10 mb-8 max-w-[1800px] px-4">
	<div class="mb-4 flex w-full flex-row items-center justify-between">
		<h1 class="mb-4 text-2xl font-bold">Lists</h1>
		<button onclick={addList} class="border-md border border-slate-200 bg-slate-100 px-6 py-2">Add List</button>
	</div>
	<div class="grid grid-cols-4 gap-4">
		{#each [0, 1, 2, 3] as col}
			<div class="flex flex-col gap-4">
				{#each lists.filter((_, i) => i % 4 === col) as list (list.id)}
					<article
						use:droppable={{
							container: list.id,
							callbacks: { onDrop: (s) => handleListDrop(list.id, s) }
						}}
						class="rounded border border-gray-300 bg-white p-4"
					>
						<div class="mb-3 flex items-center justify-between">
							<h2 class="text-lg font-semibold">
								{#if editingId === `list-${list.id}`}
									<input
										use:focusInput
										type="text"
										value={list.description}
										oninput={(e) => (list.description = e.currentTarget.value)}
										onblur={() => {
											renameList(list.id, list.description);
											editingId = null;
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												renameList(list.id, list.description);
												editingId = null;
											}
										}}
										class="w-full rounded border border-gray-300 px-1"
									/>
								{:else}
									<span
										role="button"
										tabindex="0"
										onclick={() => (editingId = `list-${list.id}`)}
										onkeydown={(e) => e.key === 'Enter' && (editingId = `list-${list.id}`)}
										class="cursor-text"
									>
										{list.description}
									</span>
								{/if}
							</h2>
							<button
								class="mt-3 text-sm underline"
								onclick={() => addListItem(list.id, { description: generateRandomName(), done: false })}
							>
								Add Item
							</button>
						</div>
						<ul class="min-h-32 space-y-2">
							{#each list.items as item (item.id)}
								<li
									use:draggable={{
										container: list.id,
										dragData: { itemId: item.id, listId: list.id },
										interactive: ['span']
									}}
									use:droppable={{
										container: item.id,
										callbacks: { onDrop: (s) => handleItemDrop(item.id, s) }
									}}
									class="cursor-grab rounded border border-gray-200 bg-gray-50 p-2"
								>
									{#if editingId === `item-${list.id}-${item.id}`}
										<input
											use:focusInput
											type="text"
											value={item.description}
											oninput={(e) => (item.description = e.currentTarget.value)}
											onblur={() => {
												renameItem(list.id, item.id, item.description);
												editingId = null;
											}}
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													renameItem(list.id, item.id, item.description);
													editingId = null;
												}
											}}
											class="w-full rounded border border-gray-300 px-1"
										/>
									{:else}
										<span
											role="button"
											tabindex="0"
											onclick={() => (editingId = `item-${list.id}-${item.id}`)}
											onkeydown={(e) => e.key === 'Enter' && (editingId = `item-${list.id}-${item.id}`)}
											class="cursor-text select-none"
										>
											{item.description}
										</span>
									{/if}
								</li>
							{/each}
						</ul>
					</article>
				{/each}
			</div>
		{/each}
	</div>
</main>
