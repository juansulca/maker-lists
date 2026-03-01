<script lang="ts">
	import { draggable, droppable } from '@thisux/sveltednd';
	import EditableText from '$lib/components/EditableText.svelte';
	import { addList, addListItem, getRootNodes, getChildren } from '$lib/store/list.svelte';
	import { onListDrop, onItemDrop } from '$lib/handlers/dnd';
	import { generateRandomName } from '$lib/helpers/randomName';
</script>

<main class="mx-auto mt-10 mb-8 max-w-[1800px] px-4">
	<div class="mb-4 flex w-full flex-row items-center justify-between">
		<h1 class="mb-4 text-2xl font-bold">Lists</h1>
		<button onclick={() => addList(generateRandomName())} class="border-md border border-slate-200 bg-slate-100 px-6 py-2">
			Add List
		</button>
	</div>
	<div class="grid grid-cols-4 gap-4">
		{#each [0, 1, 2, 3] as col}
			<div class="flex flex-col gap-4">
				{#each getRootNodes().filter((_, i) => i % 4 === col) as list (list.id)}
					<article
						use:droppable={{ container: list.id, callbacks: { onDrop: (s) => onListDrop(list.id, s) } }}
						class="rounded border border-gray-300 bg-white p-4"
					>
						<div class="mb-3 flex items-center justify-between">
							<h2 class="text-lg font-semibold">
								<EditableText bind:value={list.description} />
							</h2>
							<button class="mt-3 text-sm underline" onclick={() => addListItem(list.id, generateRandomName())}>
								Add Item
							</button>
						</div>
						<ul class="min-h-32 space-y-2">
							{#each getChildren(list.id) as item (item.id)}
								<li
									use:draggable={{ container: list.id, dragData: { itemId: item.id, listId: list.id }, interactive: ['span', 'input'] }}
									use:droppable={{ container: item.id, callbacks: { onDrop: (s) => onItemDrop(item.id, s) } }}
									class="cursor-grab rounded border border-gray-200 bg-gray-50 p-2"
								>
									<EditableText bind:value={item.description} />
								</li>
							{/each}
						</ul>
					</article>
				{/each}
			</div>
		{/each}
	</div>
</main>
