<script lang="ts">
	import Heatmap from '$lib/heatmap/Heatmap.svelte';
	import { onMount } from 'svelte';
	import Progress from '$lib/progress/Progress.svelte';
	import Button from '$lib/button/Button.svelte';
	import { Heading } from './heading';
	import Badge from '$lib/badge/Badge.svelte';
	import Slider from '$lib/slider/Slider.svelte';

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
	let threshold = $state<number>(0.1);
	let isPlaying = $state<boolean>(false);
	let dominantFreq = $state<number>(0);
	let volumeLevel = $state<number>(0);
	let dominantNote = $state<string>('N/A');
	let heatmapData = $state<(0 | 1 | 2 | 3 | 4)[][]>([]);
	let progress = $state<number>(0);

	// Derived state
	const barWidth = $derived<number>(volumeLevel * 100);

	onMount(() => {
		const storedHistory: HistoryEntry[] = JSON.parse(
			localStorage.getItem('playtimeHistory') || '[]'
		);
		heatmapData = processHistoryData(storedHistory);
		console.log('heatmap data ', heatmapData);
	});

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

	async function startTracking(): Promise<void> {
		if (audioContext) return;

		audioContext = new AudioContext({ sampleRate: 48000 });
		analyser = audioContext.createAnalyser();

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		microphone = audioContext.createMediaStreamSource(stream);
		microphone.connect(analyser);
		analyser.fftSize = 2048;
		analyser.smoothingTimeConstant = 0.2;

		interval = setInterval(trackAudio, updateRate);
	}

	function stopTracking(): void {
		clearInterval(interval);
		isPlaying = false;
	}

	function trackAudio(): void {
		if (!analyser) return;
		let dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);
		let volume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
		volumeLevel = volume;

		if (volume > threshold) {
			playTime += 1;
		} else {
			studyTime += 1;
		}

		progress = (playTime + studyTime) / (1000 / updateRate);
		history = [...history, { playTime, studyTime }];

		if ((playTime + studyTime) / (1000 / updateRate) >= 4) {
			savePlaytimeHistory(playTime, studyTime);
			playTime = 0;
			studyTime = 0;
		}

		const freq = getDominantFrequency();
		dominantFreq = freq;
		dominantNote = getNoteFromFrequency(freq);
	}

	function savePlaytimeHistory(playTime: number, studyTime: number): void {
		const currentHistory: HistoryEntry[] = JSON.parse(
			localStorage.getItem('playtimeHistory') || '[]'
		);
		currentHistory.push({ playTime, studyTime, timestamp: new Date().toISOString() });
		localStorage.setItem('playtimeHistory', JSON.stringify(currentHistory));
		heatmapData = processHistoryData(currentHistory);
	}

	function getDominantFrequency(): number {
		if (!analyser || !audioContext) return 0;
		let dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);

		let maxIndex = dataArray.indexOf(Math.max(...dataArray));
		if (maxIndex > 0 && maxIndex < dataArray.length - 1) {
			const prev = dataArray[maxIndex - 1];
			const next = dataArray[maxIndex + 1];
			const delta = (next - prev) / (2 * (2 * dataArray[maxIndex] - prev - next));
			maxIndex += delta;
		}

		return (maxIndex / analyser.frequencyBinCount) * (audioContext.sampleRate / 2);
	}

	function getNoteFromFrequency(frequency: number): string {
		if (frequency === 0) return 'N/A';
		const A4 = 440;
		const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		let noteNumber = Math.round(12 * Math.log2(frequency / A4) + 49);
		let noteIndex = (noteNumber - 1) % 12;
		let octave = Math.floor((noteNumber - 1) / 12) - 1;
		return noteNames[noteIndex] + octave;
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

<div class="mx-auto max-w-xl px-4 py-16">
	<div>
		<Heading class="mt-4 mb-8">Instrument Practice Timer</Heading>

		<Button size="lg" onclick={() => (isPlaying = !isPlaying)}
			>{isPlaying ? 'Stop' : 'Start'}</Button
		>

		<p class="mt-2 mb-4 text-xs">{isPlaying ? 'Tracking...' : 'Press start to begin tracking.'}</p>
		<Badge variant="red">Play Time: {playTime / (1000 / updateRate)} sec</Badge>
		<Badge variant="purple">Study Time: {studyTime / (1000 / updateRate)} sec</Badge>

		<div class="mt-4">
			<div class="mb-2 text-sm">Threshold: {threshold}</div>
			<Slider bind:value={threshold} min={0.01} max={0.2} step={0.01} type="single" />
		</div>

		<br />
	</div>

	<Progress marker={threshold * 100} progress={barWidth} max={100} />

	<div class="mt-4 text-sm">
		<p>Current Volume: {volumeLevel.toFixed(2)}</p>
		<p>Dominant Frequency: {dominantFreq.toFixed(2)} Hz</p>
		<p class="mb-4">Piano Note: {dominantNote}</p>
		<Heatmap data={heatmapData} />
		<Progress class="mt-4" {progress} />

		<Button
			class="mt-4"
			variant="secondary"
			onclick={() => {
				localStorage.removeItem('playtimeHistory');
			}}
		>
			Reset History
		</Button>
	</div>
</div>
