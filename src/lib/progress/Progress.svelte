<script lang="ts">
	import { Progress as ProgressPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

	import type { HTMLAttributes } from 'svelte/elements';
	import { Progress } from 'bits-ui';

	let {
		ref = $bindable(null),
		progress = $bindable(0),
		value = $bindable(0),
		max = $bindable(4),

		marker = undefined,

		class: className,
		backgroundClass,
		progressClass,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> & {
		progress?: number;

		backgroundClass?: string;

		value?: number;
		max?: number;

		marker?: number;

		progressClass?: string;
	} = $props();
</script>

<ProgressPrimitive.Root
	bind:ref
	class={[
		'bg-base-100 dark:bg-base-900 relative h-2 w-full overflow-hidden rounded-2xl',
		className
	]}
	{value}
	{max}
	{...restProps}
>
	<div
		class={[
			'border-base-300 dark:border-base-800 absolute h-full w-full rounded-2xl border',
			backgroundClass
		]}
	></div>

	<div
		class={[
			'border-accent-600/50 bg-accent-500/50 dark:border-accent-600/50 dark:bg-accent-900/70 absolute h-full w-full rounded-2xl transition-all duration-50 ease-in-out',
			progress > 0 ? 'border' : '',
			progressClass
		]}
		style="width: {Math.min((progress / max) * 100, 100)}%"
	></div>

	{#if marker}
		<div
			class={['border-accent-900 dark:border-accent-500 absolute h-full w-full border-r-4']}
			style="width: {Math.min((marker / max) * 100, 100)}%"
		></div>
	{/if}
</ProgressPrimitive.Root>
