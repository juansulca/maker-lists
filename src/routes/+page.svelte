<script lang="ts">
	import List from '$lib/components/List.svelte';
	import { lists } from '$lib/store/list.svelte';

	function addList() {
		lists.push({
			description: 'sample',
			type: 'list',
			done: false,
			items: [
				{
					description: 'sample item 1',
					done: false
				},
				{
					description: 'sample item 2',
					done: false
				}
			]
		});
	}
</script>

<main class="mx-auto mt-10 w-6xl">
	<h1 class="mb-4 text-2xl font-bold">Lists</h1>
	<button onclick={addList}>Add List</button>
	<div class="grid grid-cols-3 gap-4">
		{#each lists as list}
			<List {list} />
		{/each}
	</div>
</main>
