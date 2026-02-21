<script lang="ts">
	import {
		DndContext,
		type DragStartEvent,
		type DragEndEvent,
		type DragOverEvent,
		DragOverlay
	} from '@dnd-kit-svelte/core';
	import { dropAnimation, sensors } from './dnd/sensors';
	import List from '$lib/components/List.svelte';
	import { lists } from '$lib/store/list.svelte';

	let activeId = $state<string | null>(null);
	let activeItem = $derived(lists.find((list) => list.id === activeId));

	function handleDragStart({ active }: DragStartEvent) {
		activeId = active.id as string;
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		console.log(active, over);
	}

	function handleDragOver({ active, over }: DragOverEvent) {
		console.log(active, over);
	}
</script>

<DndContext
	{sensors}
	onDragStart={handleDragStart}
	onDragEnd={handleDragEnd}
	onDragOver={handleDragOver}
>
	<div class="grid grid-cols-3 gap-4">
		{#each lists as list}
			<List {list} />
		{/each}
	</div>

	<DragOverlay {dropAnimation}>
		{#if activeItem && activeId}
			<div class="bg-orange/50 h-4 w-24"></div>
		{/if}
	</DragOverlay>
</DndContext>
