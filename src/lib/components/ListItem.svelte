<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import EditableText from './EditableText.svelte';
	import { draggable, droppable } from '$lib/dnd';
	import { getChildren, addListItem, getItem } from '$lib/store/list.svelte';
	import { onItemDrop } from '$lib/handlers/dnd';
	import { generateRandomName } from '$lib/helpers/randomName';
	import { getViewMode } from '$lib/store/viewMode.svelte';

	let { itemId }: { itemId: string } = $props();

	const item = $derived(getItem(itemId));
	const subItems = $derived(getChildren(itemId));

	const itemClass =
		'cursor-grab rounded outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 data-dragging:opacity-80 data-dragging:shadow-lg data-dragging:ring-2 data-dragging:ring-purple-400 data-over:ring-2 data-over:ring-purple-500';
</script>

<li
	{@attach draggable({ id: item.id })}
	{@attach droppable({ id: item.id, onDrop: (a) => onItemDrop(item.id, a) })}
	aria-describedby="dnd-instructions"
	class={[itemClass, 'border border-gray-200 bg-gray-50']}
>
	<div class="m-0 inline-flex h-full w-full items-center gap-2 p-2">
		{#if getViewMode() === 'checklist'}
			<input type="checkbox" bind:checked={item.done} class="h-4 w-4 shrink-0 cursor-pointer accent-purple-700" />
		{/if}
		<EditableText
			bind:value={item.description}
			class={getViewMode() === 'checklist' && item.done ? 'text-gray-400' : ''}
		/>
		<button
			onclick={() => addListItem(item.id, generateRandomName())}
			class="ml-auto shrink-0 rounded p-0.5 text-gray-300 hover:bg-gray-200 hover:text-gray-700"
			title="Add sub-item"
		>
			<Plus size={12} />
		</button>
	</div>

	{#if subItems.length > 0}
		<ul class="mx-4 mb-2 space-y-1">
			{#each subItems as subItem (subItem.id)}
				<li
					{@attach draggable({ id: subItem.id })}
					{@attach droppable({ id: subItem.id, onDrop: (a) => onItemDrop(subItem.id, a) })}
					aria-describedby="dnd-instructions"
					class={[itemClass, 'bg-gray-50']}
				>
					<div class="m-0 inline-flex h-full w-full items-center gap-2 p-2">
						{#if getViewMode() === 'checklist'}
							<input
								type="checkbox"
								bind:checked={subItem.done}
								class="h-4 w-4 shrink-0 cursor-pointer accent-purple-700"
							/>
						{/if}
						<EditableText
							bind:value={subItem.description}
							class={getViewMode() === 'checklist' && subItem.done ? 'text-gray-400' : ''}
						/>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</li>
