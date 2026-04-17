import { TIMING, type MorseCode } from './morse';

const DEFAULT_FREQ = 600; // Hz
const DEFAULT_WPM = 15;

function unitDuration(wpm: number): number {
	// PARIS standard: 50 units per word
	return 1200 / wpm; // ms per unit
}

export interface AudioEngineOptions {
	frequency?: number;
	wpm?: number;
}

export class MorseAudioEngine {
	private ctx: AudioContext | null = null;
	private frequency: number;
	private wpm: number;
	private abortController: AbortController | null = null;
	private continuousOsc: OscillatorNode | null = null;
	private continuousGain: GainNode | null = null;

	constructor(options: AudioEngineOptions = {}) {
		this.frequency = options.frequency ?? DEFAULT_FREQ;
		this.wpm = options.wpm ?? DEFAULT_WPM;
	}

	private async getContext(): Promise<AudioContext> {
		if (!this.ctx || this.ctx.state === 'closed') {
			this.ctx = new AudioContext();
		}
		if (this.ctx.state === 'suspended') {
			await this.ctx.resume();
		}
		return this.ctx;
	}

	/** Start a continuous tone (for live keying). Stops when stopContinuousTone() is called. */
	async startContinuousTone(): Promise<void> {
		this.stopContinuousTone();
		const ctx = await this.getContext();
		this.continuousOsc = ctx.createOscillator();
		this.continuousGain = ctx.createGain();
		this.continuousOsc.frequency.value = this.frequency;
		this.continuousOsc.type = 'sine';
		this.continuousGain.gain.value = 0.3;
		this.continuousOsc.connect(this.continuousGain);
		this.continuousGain.connect(ctx.destination);
		this.continuousOsc.start();
	}

	/** Stop the continuous tone started by startContinuousTone(). */
	stopContinuousTone(): void {
		if (this.continuousOsc) {
			try { this.continuousOsc.stop(); } catch { /* oscillator may already be stopped */ }
			this.continuousOsc.disconnect();
			this.continuousOsc = null;
		}
		if (this.continuousGain) {
			this.continuousGain.disconnect();
			this.continuousGain = null;
		}
	}

	get unitMs(): number {
		return unitDuration(this.wpm);
	}

	setWpm(wpm: number) {
		this.wpm = wpm;
	}

	setFrequency(freq: number) {
		this.frequency = freq;
	}

	stop() {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
	}

	async playDot(startTime?: number): Promise<void> {
		const ctx = await this.getContext();
		const t = startTime ?? (ctx.currentTime + 0.05);
		const dur = this.unitMs * TIMING.DOT / 1000;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.frequency.value = this.frequency;
		osc.type = 'sine';
		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(t);
		osc.stop(t + dur);

		// Wait for the tone to complete: time until start + duration
		const waitMs = (t - ctx.currentTime + dur) * 1000;
		return new Promise((resolve) => {
			setTimeout(resolve, Math.max(0, waitMs));
		});
	}

	async playDash(startTime?: number): Promise<void> {
		const ctx = await this.getContext();
		const t = startTime ?? (ctx.currentTime + 0.05);
		const dur = this.unitMs * TIMING.DASH / 1000;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.frequency.value = this.frequency;
		osc.type = 'sine';
		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start(t);
		osc.stop(t + dur);

		// Wait for the tone to complete: time until start + duration
		const waitMs = (t - ctx.currentTime + dur) * 1000;
		return new Promise((resolve) => {
			setTimeout(resolve, Math.max(0, waitMs));
		});
	}

	async playCode(code: MorseCode, signal?: AbortSignal): Promise<void> {
		if (!signal) {
			this.stop();
			this.abortController = new AbortController();
			signal = this.abortController.signal;
		}

		const unit = this.unitMs;

		for (let i = 0; i < code.length; i++) {
			if (signal.aborted) return;

			const symbol = code[i];
			if (symbol === '.') {
				await this.playDot();
			} else if (symbol === '-') {
				await this.playDash();
			}

			// Intra-character gap (between symbols within a letter)
			if (i < code.length - 1) {
				await sleep(unit * TIMING.INTRA_CHAR_GAP, signal);
			}
		}
	}

	async playText(morseText: string): Promise<void> {
		this.stop();
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		const unit = this.unitMs;
		const parts = morseText.split(' ');

		for (let i = 0; i < parts.length; i++) {
			if (signal.aborted) return;

			const part = parts[i];
			if (part === '/') {
				// Full word gap
				await sleep(unit * TIMING.WORD_GAP, signal);
			} else {
				await this.playCode(part, signal);
			}

			// Inter-character gap (only between actual letter codes, not after word gaps)
			if (i < parts.length - 1 && parts[i + 1] !== '/' && part !== '/') {
				await sleep(unit * TIMING.INTER_CHAR_GAP, signal);
			}
		}
	}

	async close() {
		this.stop();
		this.stopContinuousTone();
		if (this.ctx) {
			await this.ctx.close();
			this.ctx = null;
		}
	}
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			resolve();
			return;
		}
		const timer = setTimeout(resolve, ms);
		signal?.addEventListener('abort', () => {
			clearTimeout(timer);
			resolve();
		});
	});
}
