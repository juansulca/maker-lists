<script lang="ts">
	import { draggable, droppable, dndState } from '@thisux/sveltednd';
	import { Plus } from '@lucide/svelte';
	import EditableText from './EditableText.svelte';
	import { getChildren, addListItem, getItem } from '$lib/store/list.svelte';
	import { onItemDrop } from '$lib/handlers/dnd';
	import { generateRandomName } from '$lib/helpers/randomName';
	import { getViewMode } from '$lib/store/viewMode.svelte';

	let { itemId }: { itemId: string } = $props();

	const item = $derived(getItem(itemId));
	const subItems = $derived(getChildren(itemId));
</script>

<li
	use:draggable={{
		container: item.parentId!,
		dragData: { itemId: item.id, listId: item.parentId! },
		interactive: ['span', 'input', 'textarea', 'label', 'button']
	}}
	use:droppable={{ container: item.id, callbacks: { onDrop: (s) => onItemDrop(item.id, s) } }}
	class="cursor-grab rounded border border-gray-200 bg-gray-50"
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
					class="cursor-grab rounded bg-gray-50"
					ondragstart={(e) => e.stopPropagation()}
					use:draggable={{
						container: subItem.parentId!,
						dragData: { itemId: subItem.id, listId: subItem.parentId! },
						interactive: ['span', 'input', 'textarea', 'label', 'button']
					}}
					use:droppable={{ container: subItem.id, callbacks: { onDrop: (s) => onItemDrop(subItem.id, s) } }}
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
