<script lang="ts">
	import { onDestroy } from 'svelte';
	import { MORSE_ALPHABET, MORSE_NUMBERS, BINARY_TREE_ORDER, getEntryByChar } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	type PassiveMode = 'learn' | 'quiz';

	const SPEED_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
	const BASE_WPM = 12;

	// Learn mode base pauses (ms)
	const LEARN_STEP_PAUSE = 800;
	const LEARN_LETTER_PAUSE = 1500;

	// Quiz mode base pauses (ms)
	const QUIZ_ANSWER_DELAY_DEFAULT = 5;
	const QUIZ_LETTER_PAUSE = 1500;

	// Reveal delay steps (seconds)
	const REVEAL_DELAY_MIN = 1;
	const REVEAL_DELAY_MAX = 15;

	let mode = $state<PassiveMode>('learn');
	let speedIndex = $state(2); // default 1.0x
	let includeNumbers = $state(false);
	let revealDelay = $state(QUIZ_ANSWER_DELAY_DEFAULT); // seconds
	let running = $state(false);
	let currentLetter = $state('');
	let currentCode = $state('');
	let currentMnemonic = $state('');
	let letterIndex = $state(0);
	let totalLetters = $state(0);

	let audioEngine: MorseAudioEngine | null = null;
	let abortController: AbortController | null = null;

	const speedMultiplier = $derived(SPEED_STEPS[speedIndex]);

	function speak(text: string): Promise<void> {
		return new Promise((resolve) => {
			if (typeof speechSynthesis === 'undefined') {
				resolve();
				return;
			}
			speechSynthesis.cancel();
			const utter = new SpeechSynthesisUtterance(text);
			utter.rate = Math.min(speedMultiplier, 2.0);
			utter.onend = () => resolve();
			utter.onerror = () => resolve();
			speechSynthesis.speak(utter);
		});
	}

	function sleep(ms: number, signal: AbortSignal): Promise<void> {
		return new Promise((resolve) => {
			if (signal.aborted) { resolve(); return; }
			const timer = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); });
		});
	}

	function getLearnPool() {
		return BINARY_TREE_ORDER.filter((c) => c !== '')
			.map((c) => getEntryByChar(c))
			.filter((e): e is NonNullable<typeof e> => e != null);
	}

	function getQuizPool() {
		const pool = includeNumbers ? [...MORSE_ALPHABET, ...MORSE_NUMBERS] : [...MORSE_ALPHABET];
		// Fisher-Yates shuffle
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		return pool;
	}

	async function runLearnSession(signal: AbortSignal) {
		const pool = getLearnPool();
		totalLetters = pool.length;

		while (!signal.aborted) {
			for (let i = 0; i < pool.length; i++) {
				if (signal.aborted) return;
				const entry = pool[i];
				letterIndex = i + 1;
				currentLetter = entry.char;
				currentCode = entry.code;
				currentMnemonic = entry.mnemonic;

				// 1. Play Morse audio FIRST
				if (signal.aborted) return;
				if (audioEngine) {
					audioEngine.setWpm(BASE_WPM * speedMultiplier);
					await audioEngine.playCode(entry.code);
				}
				await sleep((revealDelay * 1000) / speedMultiplier, signal);

				// 2. Then say the letter
				if (signal.aborted) return;
				await speak(entry.char);
				await sleep(LEARN_STEP_PAUSE / speedMultiplier, signal);

				// 3. Then say the mnemonic
				if (signal.aborted) return;
				await speak(entry.mnemonic);

				// 4. Pause before next letter
				await sleep(LEARN_LETTER_PAUSE / speedMultiplier, signal);
			}
		}
	}

	async function runQuizSession(signal: AbortSignal) {
		while (!signal.aborted) {
			const pool = getQuizPool();
			totalLetters = pool.length;

			for (let i = 0; i < pool.length; i++) {
				if (signal.aborted) return;
				const entry = pool[i];
				letterIndex = i + 1;
				// Show only the code, hide the letter
				currentLetter = '?';
				currentCode = entry.code;
				currentMnemonic = '';

				// 1. Play Morse audio
				if (signal.aborted) return;
				if (audioEngine) {
					audioEngine.setWpm(BASE_WPM * speedMultiplier);
					await audioEngine.playCode(entry.code);
				}

				// 2. Wait for answer delay (user tries to guess)
				await sleep((revealDelay * 1000) / speedMultiplier, signal);

				// 3. NOW reveal the answer
				if (signal.aborted) return;
				currentLetter = entry.char;
				await speak(entry.char);

				// 4. Short pause before next
				await sleep(QUIZ_LETTER_PAUSE / speedMultiplier, signal);
			}
		}
	}

	function start() {
		if (running) return;
		running = true;
		currentLetter = '';
		currentCode = '';
		currentMnemonic = '';
		letterIndex = 0;

		abortController = new AbortController();
		const signal = abortController.signal;

		if (!audioEngine) {
			audioEngine = new MorseAudioEngine({ wpm: BASE_WPM * speedMultiplier });
		} else {
			audioEngine.setWpm(BASE_WPM * speedMultiplier);
		}

		const session = mode === 'learn' ? runLearnSession(signal) : runQuizSession(signal);
		session.finally(() => {
			running = false;
		});
	}

	function stop() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		if (audioEngine) {
			audioEngine.stop();
		}
		if (typeof speechSynthesis !== 'undefined') {
			speechSynthesis.cancel();
		}
		running = false;
	}

	function switchMode(newMode: PassiveMode) {
		if (running) stop();
		mode = newMode;
		currentLetter = '';
		currentCode = '';
		currentMnemonic = '';
		letterIndex = 0;
		totalLetters = 0;
	}

	onDestroy(() => {
		stop();
		audioEngine?.close();
	});
</script>

<div class="space-y-8">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-4xl font-bold text-amber-400 mb-4" data-testid="passive-title">Passive Listening Quiz</h1>
		<p class="text-gray-400 max-w-2xl mx-auto">
			Sit back and listen. No interaction needed — the app plays through Morse code automatically.
			<br />
			<span class="text-gray-500 text-sm">
				<strong class="text-gray-300">Learn:</strong> Hears Morse beeps, then the letter name and mnemonic (binary tree order).
				<strong class="text-gray-300 ml-2">Quiz:</strong> Hears Morse beeps, then the answer is revealed (random order).
			</span>
		</p>
	</div>

	<!-- Mode toggle -->
	<div class="flex justify-center gap-3">
		<button
			onclick={() => switchMode('learn')}
			class="px-5 py-3 rounded-lg font-bold text-sm transition-colors cursor-pointer {mode === 'learn' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
			data-testid="passive-mode-learn"
		>
			📖 Learn (Binary Tree Order)
		</button>
		<button
			onclick={() => switchMode('quiz')}
			class="px-5 py-3 rounded-lg font-bold text-sm transition-colors cursor-pointer {mode === 'quiz' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
			data-testid="passive-mode-quiz"
		>
			🎧 Quiz (Random Order)
		</button>
	</div>

	<!-- Controls -->
	<div class="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-wrap items-center gap-6 justify-center">
		<!-- Speed multiplier -->
		<div class="flex flex-col items-center gap-2" data-testid="passive-speed">
			<label class="text-gray-400 text-sm font-medium" for="speed-slider">
				Speed: <span class="text-amber-400 font-bold">{speedMultiplier}x</span>
			</label>
			<input
				id="speed-slider"
				type="range"
				min="0"
				max={SPEED_STEPS.length - 1}
				step="1"
				bind:value={speedIndex}
				class="w-40 accent-amber-500 cursor-pointer"
			/>
			<div class="flex justify-between w-40 text-xs text-gray-500">
				<span>0.5x</span>
				<span>3x</span>
			</div>
		</div>

		<!-- Include numbers (quiz only) -->
		{#if mode === 'quiz'}
			<label class="flex items-center gap-2 text-gray-400 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={includeNumbers}
					class="accent-amber-500"
					data-testid="passive-include-numbers"
				/>
				Include Numbers (0–9)
			</label>
		{/if}

		<!-- Reveal delay -->
		<div class="flex flex-col items-center gap-2" data-testid="passive-reveal-delay">
			<label class="text-gray-400 text-sm font-medium" for="reveal-delay-slider">
				Reveal Delay: <span class="text-amber-400 font-bold">{revealDelay}s</span>
			</label>
			<input
				id="reveal-delay-slider"
				type="range"
				min={REVEAL_DELAY_MIN}
				max={REVEAL_DELAY_MAX}
				step="1"
				bind:value={revealDelay}
				class="w-40 accent-amber-500 cursor-pointer"
			/>
			<div class="flex justify-between w-40 text-xs text-gray-500">
				<span>{REVEAL_DELAY_MIN}s</span>
				<span>{REVEAL_DELAY_MAX}s</span>
			</div>
		</div>
	</div>

	<!-- Start / Stop -->
	<div class="flex justify-center">
		{#if running}
			<button
				onclick={stop}
				class="bg-red-700 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-xl text-xl transition-colors cursor-pointer flex items-center gap-3"
				data-testid="passive-start"
			>
				<span class="inline-block w-3 h-3 rounded-full bg-red-300 animate-pulse"></span>
				Stop
			</button>
		{:else}
			<button
				onclick={start}
				class="bg-green-700 hover:bg-green-600 text-white font-bold py-4 px-12 rounded-xl text-xl transition-colors cursor-pointer"
				data-testid="passive-start"
			>
				▶ Start
			</button>
		{/if}
	</div>

	<!-- Progress -->
	{#if totalLetters > 0}
		<div class="text-center text-gray-400" data-testid="passive-progress">
			Letter {letterIndex} of {totalLetters}
		</div>
	{/if}

	<!-- Current letter display -->
	{#if currentLetter}
		<div class="text-center space-y-3" data-testid="passive-current-letter">
			<div class="text-8xl font-bold text-amber-400">{currentLetter}</div>
			<div class="text-3xl font-mono text-gray-300 tracking-[0.3em]">
				{currentCode.replace(/\./g, '·').replace(/-/g, '−')}
			</div>
			{#if mode === 'learn' && currentMnemonic}
				<div class="text-xl text-gray-400 italic">{currentMnemonic}</div>
			{/if}
		</div>
	{/if}
</div>
