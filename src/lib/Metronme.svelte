<script lang="ts">
	import Slider from '$lib/slider/Slider.svelte';
	import Button from '$lib/button/Button.svelte';
	import { Heading } from './heading';
	let showPendulumType = $state<'single' | 'multiple'>('single');

	const segments = Array.from({ length: 5 }, (_, i) => i);

	let { bpm } = $props();

	let isPlaying = $state(false);
	let beat = $state(0);
	let audioContext = null;

	const pendulumAngle = $derived<number>(beat ? 45 : -45);
	const transitionTime = $derived<number>(60 / bpm);

	function playSound() {
		if (!audioContext) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
		}
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
		gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.1);
	}

	$effect(() => {
		if (isPlaying) {
			const intervalTime = (60 / bpm) * 1000;
			playSound();

			const interval = setInterval(() => {
				beat = beat === 0 ? 1 : 0;
				playSound();
			}, intervalTime);

			return () => {
				clearInterval(interval);
				beat = 0;
			};
		}
	});
	// Add this effect
	$effect(() => {
		if (isPlaying) {
			const rotation = setInterval(
				() => {
					document.querySelector('.disc')?.classList.toggle('active');
				},
				(60 / bpm) * 1000
			);

			return () => clearInterval(rotation);
		}
	});
</script>

<div
	class="mx-auto max-w-xl rounded-2xl border border-pink-900 px-4 py-4 shadow-inner shadow-pink-600"
>
	<div class="mt-4 text-sm">
		<Heading class="mt-4 mb-8">Metronome</Heading>
		<div class="mt-4">
			<div class="mb-2 text-sm">BPM: {bpm}</div>
			<Slider bind:value={bpm} min={40} max={208} step={1} type="single" />
		</div>

		<div class="mt-4 flex gap-2">
			<Button class="mt-4" size="lg" onclick={() => (isPlaying = !isPlaying)}>
				{isPlaying ? 'Stop' : 'Start'}
			</Button>
			<Button class="mt-4" size="sm" variant="purple" onclick={() => (showPendulumType = 'single')}
				>Single Pendulum</Button
			>
			<Button
				class="mt-4"
				size="sm"
				variant="purple"
				onclick={() => (showPendulumType = 'multiple')}
			>
				Multiple Pendulum
			</Button>
		</div>

		<div class="mt-8 flex justify-center">
			<div class="relative h-[300px] w-[100px]">
				{#if showPendulumType === 'single'}
					<!-- Single stick pendulum -->
					<div
						class="absolute top-0 left-1/2 h-[300px] w-1 origin-top transform rounded bg-pink-800 transition-transform"
						style="transform: rotate({pendulumAngle}deg); transition-duration: {transitionTime}s;"
					></div>
				{:else}
					<!-- Multiple sticks pendulum -->
					{#each segments as _, index}
						<div
							class="absolute top-0 left-1/2 h-[300px] w-3 origin-top transform rounded-full bg-gradient-to-r from-pink-700 to-pink-900 transition-transform"
							style="transform: rotate({pendulumAngle}deg); 
								transition-duration: {transitionTime * (1 + index * 0.1)}s; 
								transition-delay: {index * 0.03}s;"
						></div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
