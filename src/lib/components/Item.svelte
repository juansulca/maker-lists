<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { fade } from 'svelte/transition';
	import { styleObjectToString, CSS } from '@dnd-kit-svelte/utilities';

	let { description, id }: { description: string; id: string } = $props();
	const { attributes, listeners, node, transform, transition, isDragging, isSorting, isOver } =
		useSortable({
			id
		});

	const style = $derived(
		styleObjectToString({
			// transform: CSS.Transform.toString(transform.current),
			transition: isSorting.current ? transition.current : undefined,
			zIndex: isDragging.current ? 1 : undefined
		})
	);
</script>

<li
	in:fade={{ duration: 150 }}
	out:fade={{ duration: 150 }}
	{style}
	class={[
		'border-md relative ml-4 inline-flex cursor-grab border bg-gray-200 p-2 select-none',
		{ invisible: isDragging.current, 'bg-orange/5!': isOver.current }
	]}
	bind:this={node.current}
	{...attributes.current}
	{...listeners.current}
>
	{description}

	{#if isDragging.current}
		<span class="text-orange">Moving: {description}</span>
	{/if}
</li>
