<script lang="ts">
	import { focus } from '$lib/actions/focus';

	let { value = $bindable(), class: className = '' }: { value: string; class?: string } = $props();

	let editing = $state(false);
</script>

{#if editing}
	<textarea
		use:focus
		bind:value
		rows="1"
		onblur={() => (editing = false)}
		onkeydown={(e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				editing = false;
			}
		}}
		class="field-sizing-content w-full resize-none rounded border border-gray-300 px-1"
	></textarea>
{:else}
	<span
		role="button"
		tabindex="0"
		onclick={() => (editing = true)}
		onkeydown={(e) => e.key === 'Enter' && (editing = true)}
		class={['block min-w-0 cursor-text wrap-anywhere select-none', className]}
	>
		{value}
	</span>
{/if}
