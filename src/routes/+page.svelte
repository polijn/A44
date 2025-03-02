<script>
	import AudioAnalyzer from '$lib/AudioAnalyzer.svelte';
	import Metronome from '$lib/Metronme.svelte';
	import MetronomeV2 from '$lib/MetronomeV2.svelte';
</script>

<main>
	<div class="mt-4">
		<AudioAnalyzer />
	</div>

	<div class="mt-4">
		<MetronomeV2 />
	</div>
	<div class="mt-4">
		<Metronome />
	</div>
	<!-- <div class="mt-4">
		<AudioStats />
	</div> -->
</main>
