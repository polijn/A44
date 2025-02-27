import { writable } from 'svelte/store';

export const playTime = writable(0);
export const studyTime = writable(0);
export const history = writable([]);
export const threshold = writable(0.05);
export const minDuration = writable(2);
export const isPlaying = writable(false);

export const dominantFreq = writable(0);
export const dominantNote = writable('N/A');
export const volumeLevel = writable(0);
