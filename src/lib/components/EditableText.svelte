<script lang="ts">
	import { tick } from 'svelte';
	import { getViewMode } from '$lib/store/viewMode.svelte';

	let {
		value = $bindable(),
		class: className = '',
		isTitle = false
	}: { value: string; class?: string; isTitle?: boolean } = $props();
	let editing = $state(false);
	let draft = $state('');

	function start() {
		draft = value;
		editing = true;
	}

	function commit() {
		if (!editing) return;
		const next = draft.trim();
		if (next) value = next;
		editing = false;
	}

	function cancel() {
		editing = false;
	}

	/** Focus, put the caret at the end and keep the height in sync with the content. */
	function autosize(node: HTMLTextAreaElement) {
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight + node.offsetHeight - node.clientHeight}px`;
		};
		node.focus();
		tick().then(() => {
			node.setSelectionRange(node.value.length, node.value.length);
			resize();
		});
		node.addEventListener('input', resize);
		return () => node.removeEventListener('input', resize);
	}
</script>

{#if editing}
	<textarea
		bind:value={draft}
		{@attach autosize}
		rows="1"
		onblur={commit}
		onkeydown={(e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				commit();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				cancel();
			}
		}}
		class="block w-full resize-none overflow-hidden rounded px-1 wrap-anywhere whitespace-pre-wrap outline-1 outline-gray-300 focus:outline-purple-500"
	></textarea>
{:else}
	<span
		role="button"
		tabindex="0"
		onclick={start}
		onkeydown={(e) => e.key === 'Enter' && start()}
		class={['block min-w-0 cursor-text rounded px-1 wrap-anywhere whitespace-pre-wrap select-none', className]}
		>{#if getViewMode() === 'list' && !isTitle}-&nbsp;
		{/if}{value}</span
	>
{/if}
