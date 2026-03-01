<script lang="ts">
	import { onMount } from 'svelte';
	import { draggable, droppable } from '@thisux/sveltednd';
	import { Plus, Trash2, X } from '@lucide/svelte';
	import EditableText from '$lib/components/EditableText.svelte';
	import {
		addList,
		addListItem,
		getRootNodes,
		getChildren,
		clearAllLists,
		deleteList,
		resetDone
	} from '$lib/store/list.svelte';
	import { onListDrop, onItemDrop, onTrashDrop } from '$lib/handlers/dnd';
	import { generateRandomName } from '$lib/helpers/randomName';

	let confirmingClear = $state(false);
	let viewMode = $state<'list' | 'checklist'>('list');

	onMount(() => {
		const saved = localStorage.getItem('viewMode');
		if (saved === 'list' || saved === 'checklist') viewMode = saved;
	});

	$effect(() => {
		localStorage.setItem('viewMode', viewMode);
	});
</script>

<main class="mx-auto mt-10 mb-8 max-w-450 px-4 font-mono">
	<div class="mb-4 flex w-full flex-row items-center justify-between">
		<h1 class="mb-4 text-4xl font-bold">Maker lists</h1>
		<div class="flex items-center gap-2">
			{#if viewMode === 'checklist'}
				<button onclick={resetDone} class="rounded-md border border-slate-300 px-4 py-2"> Reset Done </button>
			{/if}
			<button
				onclick={() => (viewMode = viewMode === 'list' ? 'checklist' : 'list')}
				class="min-w-20 rounded-md border border-slate-300 px-4 py-2"
			>
				{viewMode === 'list' ? 'Checklist' : 'List'}
			</button>
			{#if confirmingClear}
				<span class="text-sm text-gray-600">This will delete all lists. Are you sure?</span>
				<button
					onclick={() => {
						clearAllLists();
						confirmingClear = false;
					}}
					class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
				>
					Yes, delete all
				</button>
				<button
					onclick={() => (confirmingClear = false)}
					class="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
				>
					Cancel
				</button>
			{:else}
				<button
					onclick={() => addList(generateRandomName())}
					class="rounded-md border border-slate-200 bg-slate-100 px-6 py-2"
				>
					Add List
				</button>
				<button
					onclick={() => (confirmingClear = true)}
					class="rounded-md border border-red-300 bg-red-600 px-6 py-2 text-white hover:bg-red-700"
				>
					Clear
				</button>
			{/if}
		</div>
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
							<div class="flex items-center gap-1">
								<button
									class="rounded-md p-2 text-sm hover:bg-gray-100"
									onclick={() => addListItem(list.id, generateRandomName())}
								>
									<Plus size={20} />
								</button>
								<button
									onclick={() => deleteList(list.id)}
									class="rounded-md p-2 text-sm hover:bg-red-200"
									title="Delete list"
								>
									<Trash2 size={20} />
									<!-- ❌ -->
								</button>
							</div>
						</div>
						<ul class="min-h-32 space-y-2">
							{#each getChildren(list.id) as item (item.id)}
								<li
									use:draggable={{
										container: list.id,
										dragData: { itemId: item.id, listId: list.id },
										interactive: ['span', 'input', 'label']
									}}
									use:droppable={{ container: item.id, callbacks: { onDrop: (s) => onItemDrop(item.id, s) } }}
									class="cursor-grab rounded border border-gray-200 bg-gray-50"
								>
									<div class="m-0 inline-flex h-full w-full items-center gap-3 p-2">
										{#if viewMode === 'checklist'}
											<input
												type="checkbox"
												bind:checked={item.done}
												class="h-5 w-5 cursor-pointer accent-purple-700"
											/>
										{/if}
										<EditableText
											bind:value={item.description}
											class={viewMode === 'checklist' && item.done ? 'text-gray-400 ' : ''}
										/>
									</div>
								</li>
							{/each}
						</ul>
					</article>
				{/each}
			</div>
		{/each}
	</div>

	<div
		use:droppable={{ container: 'trash', callbacks: { onDrop: onTrashDrop } }}
		class="mt-8 flex items-center justify-center gap-2 rounded border-2 border-dashed border-red-200 py-6 text-red-300 transition-colors hover:border-red-400 hover:text-red-500"
	>
		<Trash2 size={20} />
		<span class="text-sm">Drop items here to delete</span>
	</div>
</main>
