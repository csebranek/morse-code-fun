<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ALL_MORSE, MORSE_ALPHABET, MORSE_NUMBERS, textToMorse, getEntryByChar } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	type DifficultyLevel = 1 | 2 | 3 | 4;

	interface LevelConfig {
		name: string;
		description: string;
		timerSeconds: number;
		getChallenge: () => string;
	}

	const WORD_LIST_SIMPLE = [
		'CAT', 'DOG', 'SOS', 'HI', 'OK', 'RUN', 'GO', 'SIT', 'HAT', 'BIG',
		'RED', 'FUN', 'SUN', 'MAP', 'PEN', 'CUP', 'BOX', 'FOX', 'JAM', 'ZIP',
		'BAT', 'NET', 'HOP', 'WIN', 'TOP', 'MIX', 'JOB', 'BUS', 'GUM', 'LOG'
	];

	const PHRASE_LIST = [
		'HELLO', 'WORLD', 'SOS HELP', 'GOOD JOB', 'NICE TRY',
		'WELL DONE', 'GO HOME', 'COME IN', 'HELP ME', 'THANK YOU',
		'HI THERE', 'BE SAFE', 'ALL GOOD', 'STAY PUT', 'SEND AID'
	];

	const COMPLEX_LIST = [
		'THE QUICK FOX', 'MORSE CODE FUN', 'SEND HELP NOW', 'RADIO CHECK',
		'SIGNAL STRONG', 'COPY THAT', 'OVER AND OUT', 'MAYDAY MAYDAY',
		'BRAVO ZULU', 'STANDING BY', 'ALL CLEAR NOW', 'ROGER WILCO'
	];

	function randomFrom<T>(arr: T[]): T {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	const LEVELS: Record<DifficultyLevel, LevelConfig> = {
		1: {
			name: 'Basics',
			description: 'Single letters and numbers',
			timerSeconds: 60,
			getChallenge: () => randomFrom(ALL_MORSE).char
		},
		2: {
			name: 'Words',
			description: 'Simple 3-4 letter words',
			timerSeconds: 90,
			getChallenge: () => randomFrom(WORD_LIST_SIMPLE)
		},
		3: {
			name: 'Phrases',
			description: 'Short phrases and sentences',
			timerSeconds: 120,
			getChallenge: () => randomFrom(PHRASE_LIST)
		},
		4: {
			name: 'Pro',
			description: 'Complex messages with time pressure',
			timerSeconds: 60,
			getChallenge: () => randomFrom(COMPLEX_LIST)
		}
	};

	// State
	let level = $state<DifficultyLevel>(1);
	let challenge = $state('');
	let expectedMorse = $state('');
	let score = $state(0);
	let streak = $state(0);
	let bestStreak = $state(0);
	let bestScores = $state<Record<DifficultyLevel, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
	let timerSeconds = $state(0);
	let timerRunning = $state(false);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let signalActive = $state(false);
	let currentInput = $state(''); // finalized dots/dashes with spaces for letter boundaries
	let currentLetterInput = $state(''); // symbols for the letter currently being tapped
	let feedback = $state('');
	let feedbackCorrect = $state(false);
	let showResult = $state(false);
	let challengeActive = $state(false);

	// Key timing state
	let keyDownTime = $state(0);
	let lastKeyUpTime = $state(0);
	let gapTimer: ReturnType<typeof setTimeout> | null = null;
	let wordGapTimer: ReturnType<typeof setTimeout> | null = null;

	// Audio
	let audioEngine: MorseAudioEngine | null = null;

	// Adaptive timing - exponential moving average
	const INITIAL_DOT_MS = 100;
	const EMA_ALPHA = 0.3;
	let dotEstimate = $state(INITIAL_DOT_MS);
	let dashEstimate = $state(INITIAL_DOT_MS * 3);

	const threshold = $derived((dotEstimate + dashEstimate) / 2);
	const charGapMs = $derived(dotEstimate * 3);
	const wordGapMs = $derived(dotEstimate * 7);

	// WPM tracking (level 2+)
	let challengeStartTime = $state(0);
	let lastWpm = $state<number | null>(null);
	let wpmHistory = $state<number[]>([]);
	const avgWpm = $derived(
		wpmHistory.length > 0
			? Math.round(wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length)
			: null
	);

	// Hints
	let showTextHint = $state(false);
	let showMnemonicHint = $state(false);

	// Mnemonic hints for the current challenge (letters only — numbers have no useful phrase)
	const mnemonicHints = $derived(
		challenge
			.split('')
			.filter((ch) => ch !== ' ')
			.flatMap((ch) => {
				const entry = getEntryByChar(ch);
				if (!entry || entry.mnemonicStressed === ch) return [];
				return [{ char: ch, mnemonic: entry.mnemonicStressed }];
			})
	);

	function isDashWord(word: string): boolean {
		return word === word.toUpperCase();
	}

	// Timer display
	const timerDisplay = $derived(
		`${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`
	);

	// Input display
	const displayInput = $derived(() => {
		let display = currentInput;
		if (currentLetterInput) {
			if (display) display += ' ';
			display += currentLetterInput;
		}
		return display.replace(/\./g, '·').replace(/-/g, '−');
	});

	function ensureAudioEngine() {
		if (!audioEngine) {
			audioEngine = new MorseAudioEngine({ wpm: 12, frequency: 600 });
		}
		return audioEngine;
	}

	function startChallenge() {
		const config = LEVELS[level];
		challenge = config.getChallenge();
		expectedMorse = textToMorse(challenge);
		timerSeconds = config.timerSeconds;
		challengeActive = true;
		currentInput = '';
		currentLetterInput = '';
		feedback = '';
		showResult = false;
		showTextHint = false;
		showMnemonicHint = false;
		lastWpm = null;
		challengeStartTime = performance.now();
		dotEstimate = INITIAL_DOT_MS;
		dashEstimate = INITIAL_DOT_MS * 3;
		cancelGapTimers();
		startTimer();
	}

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerRunning = true;
		timerInterval = setInterval(() => {
			timerSeconds--;
			if (timerSeconds <= 0) {
				timerSeconds = 0;
				timeUp();
			}
		}, 1000);
	}

	function timeUp() {
		stopTimer();
		challengeActive = false;
		ensureAudioEngine().stopContinuousTone();
		signalActive = false;
		feedback = `⏰ Time's up! The answer was: ${expectedMorse.replace(/\./g, '·').replace(/-/g, '−')}`;
		feedbackCorrect = false;
		showResult = true;
	}

	function stopTimer() {
		timerRunning = false;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function cancelGapTimers() {
		if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
		if (wordGapTimer) { clearTimeout(wordGapTimer); wordGapTimer = null; }
	}

	// Key handlers
	function handleKeyDown(e: KeyboardEvent) {
		if (!challengeActive) return;

		if (e.key === 'j' || e.key === 'J') {
			if (e.repeat) return;
			e.preventDefault();
			activateSignal();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			submitAnswer();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			clearInput();
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (!challengeActive) return;

		if (e.key === 'j' || e.key === 'J') {
			e.preventDefault();
			deactivateSignal();
		}
	}

	function activateSignal() {
		if (signalActive) return;
		signalActive = true;
		keyDownTime = performance.now();
		cancelGapTimers();
		ensureAudioEngine().startContinuousTone();
	}

	function deactivateSignal() {
		if (!signalActive) return;
		signalActive = false;
		ensureAudioEngine().stopContinuousTone();

		const duration = performance.now() - keyDownTime;
		lastKeyUpTime = performance.now();

		// Classify as dot or dash
		const symbol = classifyPress(duration);
		currentLetterInput += symbol;

		// Update adaptive timing
		updateTimingEstimates(duration, symbol);

		// Start gap detection
		startGapDetection();
	}

	function classifyPress(duration: number): '.' | '-' {
		return duration < threshold ? '.' : '-';
	}

	function updateTimingEstimates(duration: number, symbol: '.' | '-') {
		if (symbol === '.') {
			dotEstimate = EMA_ALPHA * duration + (1 - EMA_ALPHA) * dotEstimate;
		} else {
			dashEstimate = EMA_ALPHA * duration + (1 - EMA_ALPHA) * dashEstimate;
		}
		// Ensure minimum separation: dash should be at least 2x dot
		if (dashEstimate < dotEstimate * 2) {
			dashEstimate = dotEstimate * 3;
		}
	}

	function startGapDetection() {
		cancelGapTimers();

		// After charGapMs of silence, finalize current letter
		gapTimer = setTimeout(() => {
			if (currentLetterInput) {
				if (currentInput) currentInput += ' ';
				currentInput += currentLetterInput;
				currentLetterInput = '';
			}
			gapTimer = null;

			// After wordGapMs of total silence, insert word gap
			wordGapTimer = setTimeout(() => {
				if (currentInput && !currentInput.endsWith(' / ')) {
					currentInput += ' / ';
				}
				wordGapTimer = null;
			}, wordGapMs - charGapMs);
		}, charGapMs);
	}

	// Mouse/touch support for the signal button
	function onSignalDown(e: Event) {
		e.preventDefault();
		if (!challengeActive) return;
		activateSignal();
	}

	function onSignalUp(e: Event) {
		e.preventDefault();
		if (!challengeActive) return;
		deactivateSignal();
	}

	function submitAnswer() {
		if (!challengeActive) return;

		// Finalize any pending letter
		if (currentLetterInput) {
			if (currentInput) currentInput += ' ';
			currentInput += currentLetterInput;
			currentLetterInput = '';
		}
		cancelGapTimers();

		// Normalize: remove trailing word separators, collapse whitespace
		const userMorse = currentInput.trim().replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ');
		const expected = expectedMorse.trim();
		const correct = userMorse === expected;

		if (correct) {
			score++;
			streak++;
			if (streak > bestStreak) bestStreak = streak;
			if (score > bestScores[level]) bestScores[level] = score;
			// WPM calculation for level 2+
			if (level >= 2 && challengeStartTime > 0) {
				const elapsedSeconds = (performance.now() - challengeStartTime) / 1000;
				const wordCount = challenge.length / 5; // PARIS standard: 1 word = 5 chars
				const wpm = Math.max(1, Math.round(wordCount / (elapsedSeconds / 60)));
				lastWpm = wpm;
				wpmHistory = [...wpmHistory, wpm];
			}
			feedback = '✓ Correct!';
			feedbackCorrect = true;
			showResult = true;
			stopTimer();
			// Auto-advance
			setTimeout(startChallenge, 1500);
		} else {
			streak = 0;
			feedback = `✗ Incorrect. Expected: ${expected.replace(/\./g, '·').replace(/-/g, '−')}`;
			feedbackCorrect = false;
			showResult = true;
			stopTimer();
			challengeActive = false;
		}
	}

	function clearInput() {
		currentInput = '';
		currentLetterInput = '';
		cancelGapTimers();
	}

	function switchLevel(newLevel: DifficultyLevel) {
		level = newLevel;
		stopTimer();
		challengeActive = false;
		challenge = '';
		currentInput = '';
		currentLetterInput = '';
		feedback = '';
		showResult = false;
		showTextHint = false;
		showMnemonicHint = false;
		lastWpm = null;
		wpmHistory = [];
	}

	function resetStats() {
		score = 0;
		streak = 0;
		bestStreak = 0;
		bestScores = { 1: 0, 2: 0, 3: 0, 4: 0 };
		lastWpm = null;
		wpmHistory = [];
	}

	async function playAudioHint() {
		const engine = ensureAudioEngine();
		engine.stop();
		await engine.playText(expectedMorse);
	}

	function nextChallenge() {
		startChallenge();
	}

	onDestroy(() => {
		stopTimer();
		cancelGapTimers();
		audioEngine?.stopContinuousTone();
		audioEngine?.close();
	});
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div class="space-y-6">
	<!-- Title -->
	<div class="text-center">
		<h1 class="text-4xl font-bold text-green-400 mb-3 tracking-widest uppercase" data-testid="encode-title">Morse Encoding Challenge</h1>
		<div class="flex items-center justify-center gap-4 mb-3">
			<div class="h-px w-16 bg-green-900"></div>
			<span class="font-mono text-green-800 text-xs tracking-widest select-none">· − · − · − ·</span>
			<div class="h-px w-16 bg-green-900"></div>
		</div>
		<p class="text-gray-400 max-w-2xl mx-auto text-sm">
			Encode characters into Morse code using the signal key. Press and hold <kbd class="px-1 py-0.5 bg-gray-800 rounded text-green-300">J</kbd> to signal — short press for dot, long press for dash.
		</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Main area -->
		<div class="lg:col-span-2 space-y-4">
			<!-- Challenge header -->
			<div class="bg-gray-900 rounded-xl p-6 border border-gray-800 border-l-4 border-l-green-800" data-testid="encode-challenge">
				<div class="flex justify-between items-start mb-4">
					<h2 class="text-2xl font-bold text-green-400">Current Challenge</h2>
					{#if timerRunning}
						<span class="text-green-400 font-mono text-xl" data-testid="encode-timer">{timerDisplay}</span>
					{/if}
				</div>
				{#if challenge}
					<div class="text-7xl font-bold text-amber-400 mb-2 tracking-wider" data-testid="encode-prompt">{challenge}</div>
					<div class="text-gray-400 text-sm">Level {level}: {LEVELS[level].name} — {score} points</div>
				{:else}
					<div class="text-gray-500 text-lg">Select a difficulty level and press Start to begin.</div>
				{/if}
			</div>

			<!-- Stats bar -->
			<div class="bg-gray-900 rounded-xl p-4 border border-gray-800">
				<div class="flex items-center justify-around">
					<!-- Signal indicator -->
					<div class="text-center">
						<div class="relative w-12 h-12 mx-auto mb-1" data-testid="encode-signal">
							<div class="absolute inset-0 rounded-full border-2 transition-colors duration-75 {signalActive ? 'border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'border-red-800'}"></div>
							<div class="absolute inset-2 rounded-full transition-colors duration-75 {signalActive ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-red-700'}">
								<div class="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/30"></div>
							</div>
						</div>
						<span class="text-xs font-bold {signalActive ? 'text-green-400' : 'text-red-400'}">SIGNAL</span>
					</div>
					<div class="border-l border-gray-700 h-12"></div>
					<div class="text-center">
						<div class="text-2xl font-bold text-amber-400" data-testid="encode-score">{score}</div>
						<span class="text-xs text-amber-400 font-bold">SCORE</span>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-amber-400" data-testid="encode-streak">{streak}</div>
						<span class="text-xs text-amber-400 font-bold">STREAK</span>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-amber-400">{bestScores[level]} <span class="text-sm text-gray-400">({bestStreak})</span></div>
						<span class="text-xs text-amber-400 font-bold">BEST</span>
					</div>
					{#if level >= 2}
						<div class="border-l border-gray-700 h-12"></div>
						<div class="text-center" data-testid="encode-wpm">
							<div class="text-2xl font-bold text-green-400">
								{lastWpm ?? '—'}
							</div>
							<span class="text-xs text-green-600 font-bold">WPM</span>
							{#if avgWpm !== null && wpmHistory.length > 1}
								<div class="text-xs text-gray-500">avg {avgWpm}</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Signal area -->
			<div class="bg-gray-900 rounded-xl p-6 border border-gray-800 min-h-52 flex flex-col items-center justify-center relative" data-testid="encode-signal-area">
				{#if challengeActive}
					<!-- Telegraph key -->
					<div class="flex flex-col items-center select-none">
						<button
							class="w-52 py-3 font-bold text-sm tracking-widest transition-all select-none cursor-pointer rounded-t-lg border border-b-0 {signalActive ? 'bg-gradient-to-b from-green-400 to-green-600 text-white border-green-400 shadow-[0_4px_0_#14532d,0_0_18px_rgba(34,197,94,0.4)] translate-y-0.5' : 'bg-gradient-to-b from-gray-500 to-gray-700 text-gray-200 border-gray-500 shadow-[0_4px_0_#111827] hover:from-gray-400 hover:to-gray-600'}"
							onmousedown={onSignalDown}
							onmouseup={onSignalUp}
							onmouseleave={onSignalUp}
							ontouchstart={onSignalDown}
							ontouchend={onSignalUp}
							data-testid="encode-signal-btn"
						>
							PRESS KEY (J)
						</button>
						<!-- Contact gap -->
						<div class="w-52 h-2 {signalActive ? 'bg-green-900/50' : 'bg-gray-900'} flex items-center justify-between px-8">
							<div class="w-px h-full bg-gray-600"></div>
							<div class="w-px h-full bg-gray-600"></div>
						</div>
						<!-- Base plate -->
						<div class="w-60 h-3 bg-gradient-to-b from-gray-600 to-gray-800 rounded-b border border-t-0 border-gray-600 flex items-center justify-center">
							<div class="w-44 h-px bg-gray-500"></div>
						</div>
						<!-- Feet -->
						<div class="flex gap-16 mt-0.5">
							<div class="w-6 h-1.5 bg-gray-700 rounded-full border border-gray-600"></div>
							<div class="w-6 h-1.5 bg-gray-700 rounded-full border border-gray-600"></div>
						</div>
					</div>
				{:else if showResult}
					<button
						onclick={nextChallenge}
						class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-10 rounded-xl text-xl transition-colors cursor-pointer"
						data-testid="encode-next"
					>
						Next Challenge →
					</button>
				{:else}
					<button
						onclick={startChallenge}
						class="bg-green-700 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-xl text-xl transition-colors cursor-pointer"
						data-testid="encode-start"
					>
						▶ Start Challenge
					</button>
				{/if}
			</div>

			<!-- Input display -->
			<div class="bg-gray-950 rounded-lg p-4 border border-gray-700 border-b-2 border-b-green-800 min-h-16" data-testid="encode-input-display">
				<div class="text-2xl font-mono text-green-300 text-center tracking-[0.3em] min-h-8">
					{displayInput()}
				</div>
			</div>

			<!-- Feedback -->
			{#if feedback}
				<div class="text-center text-xl font-bold {feedbackCorrect ? 'text-green-400' : 'text-red-400'}" data-testid="encode-feedback">
					{feedback}
				</div>
			{/if}

			<!-- Action buttons -->
			<div class="flex justify-center gap-8">
				<button
					onclick={clearInput}
					disabled={!challengeActive}
					class="flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-40"
					data-testid="encode-clear"
				>
					<div class="w-14 h-14 rounded-lg border border-gray-600 bg-gray-800 group-hover:bg-gray-700 group-hover:border-gray-500 flex items-center justify-center transition-colors">
						<span class="text-xl text-gray-300">✕</span>
					</div>
					<span class="text-sm font-bold text-gray-400">CLEAR</span>
					<span class="text-xs text-gray-500">[ESC]</span>
				</button>
				<button
					onclick={submitAnswer}
					disabled={!challengeActive}
					class="flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-40"
					data-testid="encode-submit"
				>
					<div class="w-14 h-14 rounded-lg border border-green-700 bg-green-900/40 group-hover:bg-green-800/50 group-hover:border-green-600 flex items-center justify-center transition-colors">
						<span class="text-xl text-green-300">✓</span>
					</div>
					<span class="text-sm font-bold text-green-400">SUBMIT</span>
					<span class="text-xs text-gray-500">[ENTER]</span>
				</button>
			</div>

			<!-- Hint buttons -->
			{#if challengeActive}
				<div class="flex justify-center gap-4 flex-wrap">
					<button
						onclick={playAudioHint}
						class="flex items-center gap-2 px-4 py-2 border-l-2 border-green-700 bg-gray-800/70 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer rounded-r-lg"
						title="Play the correct Morse code audio"
						data-testid="encode-hint-audio"
					>
						<span class="text-xl">🔊</span>
						<span class="text-sm">Audio Hint</span>
					</button>
					<button
						onclick={() => showTextHint = !showTextHint}
						class="flex items-center gap-2 px-4 py-2 border-l-2 border-green-700 bg-gray-800/70 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer rounded-r-lg"
						title="Show the answer in dots and dashes"
						data-testid="encode-hint-text"
					>
						<span class="text-xl">📝</span>
						<span class="text-sm">Text Hint</span>
					</button>
					{#if mnemonicHints.length > 0}
						<button
							onclick={() => showMnemonicHint = !showMnemonicHint}
							class="flex items-center gap-2 px-4 py-2 border-l-2 border-amber-700 bg-gray-800/70 hover:bg-gray-700 text-gray-300 transition-colors cursor-pointer rounded-r-lg"
							title="Show a mnemonic phrase to help remember the pattern"
							data-testid="encode-hint-mnemonic"
						>
							<span class="text-xl">💡</span>
							<span class="text-sm">Mnemonic Hint</span>
						</button>
					{/if}
				</div>
				{#if showTextHint}
					<div class="text-center text-lg font-mono text-yellow-400 bg-gray-800 rounded-lg p-3" data-testid="encode-hint-display">
						{expectedMorse.replace(/\./g, '·').replace(/-/g, '−')}
					</div>
				{/if}
				{#if showMnemonicHint && mnemonicHints.length > 0}
					<div class="bg-gray-800 rounded-lg p-3" data-testid="encode-hint-mnemonic-display">
						<p class="text-xs text-gray-500 text-center mb-2 uppercase tracking-wide font-bold">Mnemonic Hint &mdash; CAPS = dash, lower = dot</p>
						{#if mnemonicHints.length === 1}
							<p class="text-center text-lg font-semibold tracking-wide">
								{#each mnemonicHints[0].mnemonic.split(' ') as word, i}
									{#if i > 0}{' '}{/if}<span class="{isDashWord(word) ? 'text-amber-400' : 'text-gray-300'}">{word}</span>
								{/each}
							</p>
						{:else}
							<div class="space-y-1">
								{#each mnemonicHints as hint}
									<div class="flex items-baseline gap-2">
										<span class="text-amber-400 font-bold w-5 shrink-0">{hint.char}:</span>
										<span class="text-base font-semibold tracking-wide">
											{#each hint.mnemonic.split(' ') as word, i}
												{#if i > 0}{' '}{/if}<span class="{isDashWord(word) ? 'text-amber-400' : 'text-gray-300'}">{word}</span>
											{/each}
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="space-y-4">
			<!-- Difficulty Level -->
			<div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
				<h3 class="text-xl font-bold text-green-400 mb-4">Difficulty Level</h3>
				<div class="space-y-3">
					{#each [1, 2, 3, 4] as lvl}
						<button
							onclick={() => switchLevel(lvl as DifficultyLevel)}
							class="w-full text-left p-4 rounded-lg border transition-colors cursor-pointer {level === lvl ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}"
							data-testid="encode-level-{lvl}"
						>
							<div class="font-bold {level === lvl ? 'text-green-400' : 'text-amber-400'}">
								Level {lvl}: {LEVELS[lvl as DifficultyLevel].name}
							</div>
							<div class="text-sm text-gray-400">{LEVELS[lvl as DifficultyLevel].description}</div>
						</button>
					{/each}
				</div>

				<button
					onclick={resetStats}
					class="w-full mt-4 p-3 rounded-lg border border-gray-700 text-red-400 hover:bg-gray-800 transition-colors cursor-pointer text-sm font-bold"
					data-testid="encode-reset"
				>
					Reset All Stats
				</button>
			</div>

			<!-- Instructions -->
			<div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
				<h3 class="text-xl font-bold text-green-400 mb-4">Instructions</h3>
				<ul class="space-y-2 text-gray-400 text-sm">
					<li>• Press and hold <kbd class="px-1 py-0.5 bg-gray-800 rounded text-green-300">J</kbd> or click the key for signals</li>
					<li>• Short press for dot (·)</li>
					<li>• Long press for dash (−)</li>
					<li>• Wait briefly between letters</li>
					<li>• Press <kbd class="px-1 py-0.5 bg-gray-800 rounded text-green-300">ENTER</kbd> to submit</li>
					<li>• Press <kbd class="px-1 py-0.5 bg-gray-800 rounded text-green-300">ESC</kbd> to clear</li>
				</ul>

				<h4 class="text-sm font-bold text-green-400 mt-4 mb-2">Timing Rules</h4>
				<ul class="space-y-1 text-gray-500 text-xs">
					<li>• Dot = 1 time unit</li>
					<li>• Dash = 3 time units</li>
					<li>• Gap between parts of a letter = 1 unit</li>
					<li>• Gap between letters = 3 units</li>
					<li>• Gap between words = 7 units</li>
					<li>• Timing is adaptive — dot/dash is detected by <em>relative</em> press length, not absolute duration</li>
				</ul>
			</div>
		</div>
	</div>
</div>
