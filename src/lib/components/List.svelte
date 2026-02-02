<script lang="ts">
	import type { List } from '$lib/types/list';

	let { list }: { list: List } = $props();
</script>

<article class="border border-gray-900 p-4">
	<h2 class="text-lg font-semibold">{list.description}</h2>
	<ul class="list-outside list-disc">
		{#each list.items as item}
			<li class="ml-4">{item.description}</li>
		{/each}
	</ul>
</article>
