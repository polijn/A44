<script>
	let { bpm = 120 } = $props();
	let timeSignature = $state(4);
	let isPlaying = $state(false);
	let activeBeat = $state(-1);
	let intervalId = $state(null);
	import Slider from '$lib/slider/Slider.svelte';
	import Button from '$lib/button/Button.svelte';
	import { Heading } from './heading';
	const intervalDuration = $derived((60 / bpm) * 1000);

	function toggleMetronome() {
		isPlaying = !isPlaying;
		activeBeat = -1;
	}

	$effect(() => {
		if (!isPlaying) {
			if (intervalId) clearInterval(intervalId);
			return;
		}
		intervalId = setInterval(() => {
			activeBeat = (activeBeat + 1) % timeSignature;
		}, intervalDuration);
		return () => {
			if (intervalId) clearInterval(intervalId);
		};
	});
</script>

<div
	class="mx-auto mb-8 max-w-xl rounded-2xl border border-pink-900 px-4 py-4 shadow-lg shadow-pink-500/70"
>
	<div class="text-sm">
		<Heading class="mt-0 mb-8">Metronome</Heading>
		<div class="visualizer flex h-24 gap-2">
			{#each Array(timeSignature) as _, i}
				<div
					class="bar flex-1 rounded-md bg-pink-900/10 transition-colors duration-100 {activeBeat ===
					i
						? '!bg-pink-700 '
						: ''}"
				></div>
			{/each}
		</div>
		<div class="mt-6">
			<div class="mb-2 text-sm">BPM: {bpm}</div>
			<Slider bind:value={bpm} min={40} max={200} step={1} type="single" />
		</div>
		<label class="mt-6 flex items-center gap-2">
			Time Signature:
			<select bind:value={timeSignature} class="rounded border border-pink-300 p-1 text-black">
				<option value={2}>2/4</option>
				<option value={3}>3/4</option>
				<option value={4}>4/4</option>
				<option value={8}>8/8</option>
			</select>
		</label>
		<Button class="mt-4" size="lg" onclick={toggleMetronome}>{isPlaying ? 'Stop' : 'Start'}</Button>
	</div>
</div>
