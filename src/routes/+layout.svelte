<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { nodes } from '$lib/store/list.svelte';
	import { loadNodes, saveNodes } from '$lib/store/db';

	let { children } = $props();
	let ready = $state(false);

	onMount(async () => {
		const stored = await loadNodes();
		nodes.splice(0, nodes.length, ...stored);
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		saveNodes(JSON.parse(JSON.stringify(nodes)));
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
