<script lang="ts">
	import { focus } from '$lib/actions/focus';

	let { value = $bindable(), class: className = '' }: { value: string; class?: string } = $props();

	let editing = $state(false);
</script>

{#if editing}
	<input
		use:focus
		type="text"
		bind:value
		onblur={() => (editing = false)}
		onkeydown={(e) => e.key === 'Enter' && (editing = false)}
		class="w-full rounded border border-gray-300 px-1"
	/>
{:else}
	<span
		role="button"
		tabindex="0"
		onclick={() => (editing = true)}
		onkeydown={(e) => e.key === 'Enter' && (editing = true)}
		class={['cursor-text select-none', className]}
	>
		{value}
	</span>
{/if}
