<script lang="ts">
	let { midi } = $props();

	// Staff configuration
	let scalar = 2; //
	let midiOld = 0;
	let midiHistory = [];
	const staffLinePositions = [
		scalar * 64,
		scalar * 67,
		scalar * 71,
		scalar * 74,
		scalar * 77, // E3-f5
		//
		scalar * 88,
		scalar * 91,
		scalar * 95,
		scalar * 98,
		scalar * 101 // E5-f7
	];
	let plotHistory = $derived.by(() => {
		midiHistory.push(midiOld);
		midiOld = midi;
		return midiHistory.slice(-10);
	});
</script>

<div
	class=" mx-auto mt-4 max-w-xl rounded-2xl border border-pink-900 bg-white px-4 py-4 shadow-lg shadow-pink-600/60"
>
	<svg width="300" height="300">
		<!-- Staff lines -->
		{#each staffLinePositions as y}
			<line
				x1="50"
				x2="300"
				y1={y}
				y2={y}
				stroke-width="2"
				class="stroke-width=2 stroke-accent-900"
			/>
		{/each}

		{#each plotHistory, ind}
			<g transform="translate({70 + 10 * (1.5 * ind)},{300 - 2 * plotHistory[ind]})">
				<circle cx="0" cy="0" r="4" class="fill-accent-500" />
				<!-- <line x1="-15" x2="15" y1="0" y2="0" stroke-width="2" class=" stroke-accent-900" /> -->
			</g>
		{/each}

		<!-- Treble clef symbol -->
		<!-- <text x="0" y="150" class="clef">𝄞</text>
		<text x="0" y="200" class="clef">𝄢</text> -->
		<text x="0" y="200">E3-F5</text>
		<text x="0" y="150">E5-F7</text>
	</svg>
</div>
