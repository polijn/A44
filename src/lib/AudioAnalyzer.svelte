<script lang="ts">
	import Heatmap from '$lib/heatmap/Heatmap.svelte';
	import Progress from './progress/Progress.svelte';
	import Button from '$lib/button/Button.svelte';
	import { Heading } from './heading';
	import Badge from '$lib/badge/Badge.svelte';
	import Slider from '$lib/slider/Slider.svelte';
	import { onMount } from 'svelte';

	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let microphone: MediaStreamAudioSourceNode | null = null;
	let interval: number;
	const updateRate: number = 100;

	interface HistoryEntry {
		playTime: number;
		studyTime: number;
		timestamp?: string;
	}

	// State declarations
	let playTime = $state<number>(0);
	let studyTime = $state<number>(0);
	let history = $state<HistoryEntry[]>([]);
	let volHistory = $state([]);
	let threshold = $state<number>(0.1);
	let isPlaying = $state<boolean>(false);
	let dominantFreq = $state<number>(0);
	let volumeLevel = $state<number>(0);
	let dominantNote = $state<string>('N/A');
	let heatmapData = $state<(0 | 1 | 2 | 3 | 4)[][]>([]);
	let progress = $state<number>(0);
	let trackPeriod = $state<number>(1);
	let transposition = $state<number>(-2);
	// Derived state
	const barWidth = $derived<number>(volumeLevel * 100);

	let pitchDetector = undefined;
	let noteData = [];

	onMount(async () => {
		const res = await fetch(
			'https://gist.githubusercontent.com/dimitre/439f5ab75a0c2e66c8c63fc9e8f7ea77/raw/65cc3bf37ac4d0b4ab268b41bf60077eae48e25e/note_freq_440_432.csv'
		);
		const text = await res.text();
		noteData = text
			.trim()
			.split('\n')
			.map((line) => {
				const [midi, note, octave, freq440, freq432] = line.split(',');
				return {
					midi: parseInt(midi, 10),
					note,
					octave: parseInt(octave, 10),
					freq440: parseFloat(freq440),
					freq432: parseFloat(freq432)
				};
			});
	});

	async function startTracking(): Promise<void> {
		if (audioContext) return;

		audioContext = new AudioContext({ sampleRate: 48000 });
		analyser = audioContext.createAnalyser();

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		microphone = audioContext.createMediaStreamSource(stream);
		pitchDetector = ml5.pitchDetection(
			'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/',
			audioContext,
			microphone.mediaStream,
			modelLoaded
		);

		interval = setInterval(trackAudio, updateRate);
	}

	function gotPitch(error, frequency) {
		pitchDetector.getPitch(gotPitch);
		if (frequency) {
			dominantFreq = frequency;
			dominantNote = getClosestNoteTo440(frequency);
		}
	}

	function modelLoaded() {
		pitchDetector.getPitch(gotPitch);
	}

	function stopTracking(): void {
		clearInterval(interval);
		isPlaying = false;
	}

	function trackAudio(): void {
		volumeLevel = 10;
		if (volumeLevel > threshold) {
			playTime += 1;
		} else {
			studyTime += 1;
		}

		volHistory.push({ x: new Date(), value: volumeLevel });
		progress = (playTime + studyTime) / (1000 / updateRate);

		if ((playTime + studyTime) / (1000 / updateRate) >= trackPeriod) {
			history.push({ playTime, studyTime, timestamp: new Date().toISOString() });
			heatmapData = processHistoryData(history);
			playTime = 0;
			studyTime = 0;
			volHistory = [];
		}
	}
	function processHistoryData(history: HistoryEntry[]): (0 | 1 | 2 | 3 | 4)[][] {
		if (history.length > 30) history = history.slice(-30 * 7 - (history.length % 7));

		const maxPlayTime = Math.max(...history.map((item) => item.playTime), 1);

		return Array.from({ length: 34 }, (_, i) =>
			Array.from({ length: 7 }, (_, j) => {
				const data = history[i * 7 + j];
				return data ? Math.floor((data.playTime / maxPlayTime) * 3) + 1 : 0;
			})
		) as (0 | 1 | 2 | 3 | 4)[][];
	}
	function getClosestNoteTo440(frequency: number) {
		if (!noteData.length) return 'Loading...';

		let closestNote = noteData.reduce((prev, curr) => {
			return Math.abs(curr.freq440 - frequency) < Math.abs(prev.freq440 - frequency) ? curr : prev;
		});

		const index = noteData.indexOf(closestNote);
		const noteUp = index + 1 < noteData.length ? noteData[index + 1] : null;
		const noteDown = index - 1 >= 0 ? noteData[index - 1] : null;
		const transPose = noteData[index - transposition];

		return {
			note: `${closestNote.note}${closestNote.octave}`,
			distanceUp: noteUp ? noteUp.freq440 - closestNote.freq440 : null,
			distanceDown: noteDown ? closestNote.freq440 - noteDown.freq440 : null,
			transPose: `${transPose.note}${transPose.octave}`
		};
	}

	$effect(() => {
		if (isPlaying) {
			startTracking();
		} else {
			stopTracking();
		}

		return () => {
			if (interval) clearInterval(interval);
			if (audioContext) audioContext.close();
		};
	});
</script>

<div
	class="mx-auto max-w-xl rounded-2xl border border-pink-900 px-4 py-4 shadow-lg shadow-pink-600/60"
>
	<div class=" text-sm">
		<Heading class=" mb-8">Instrument Practice Timer</Heading>
		<Heatmap data={heatmapData} />

		<!-- start stop button -->
		<Button class="mt-4" size="sm" onclick={() => (isPlaying = !isPlaying)}
			>{isPlaying ? 'Stop' : 'Start'}</Button
		>
		<!-- <p class="mt-2 mb-4 text-xs">{isPlaying ? 'Tracking...' : 'Press start to begin tracking.'}</p> -->
		<Badge class="mt-4" variant="red">Play Time: {playTime / (1000 / updateRate)} sec</Badge>
		<Badge class="mt-4" variant="purple">Study Time: {studyTime / (1000 / updateRate)} sec</Badge>
		<!-- <br /> -->

		<!-- clear history button -->
		<!-- <Button
			class="mt-4"
			size="sm"
			variant="secondary"
			onclick={() => {
				localStorage.removeItem('playtimeHistory');
			}}
		>
			Reset History
		</Button> -->
		<div class="mt-4 flex items-center gap-4">
			<!-- trackPeriod slider -->
			<div class="flex-1">
				<div class="mb-2 text-sm">Track Period in Seconds: {trackPeriod}</div>
				<Slider bind:value={trackPeriod} min={1} max={60} step={1} type="single" />
				<Progress class="mt-4" {progress} max={trackPeriod} />
			</div>
			<!-- threshold slider -->
			<div class="flex-1">
				<div class="mb-2 text-sm">Threshold: {threshold}</div>
				<Slider bind:value={threshold} min={0.01} max={0.2} step={0.01} type="single" />
				<!-- progress  -->
				<Progress class="mt-4" marker={threshold * 100} progress={barWidth} max={100} />
			</div>
		</div>

		<!-- extra stadds -->
		<div class="mt-4 flex items-center gap-2">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-2xl border border-pink-900 px-4 py-4 text-2xl"
			>
				{dominantNote.note}
			</div>
			<div
				class="flex h-20 items-center justify-center rounded-2xl border border-pink-900 px-4 py-4 text-2xl"
			>
				<p>{dominantFreq.toFixed(2)} Hz</p>
			</div>
			<div
				class="flex h-20 items-center justify-center rounded-2xl border border-violet-900 px-4 py-4 text-2xl"
			>
				<p>Transposed (-2): {dominantNote.transPose}</p>
			</div>
		</div>
	</div>
</div>
