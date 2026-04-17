<script lang="ts">
	import { MORSE_ALPHABET, MORSE_NUMBERS, ALL_MORSE, textToMorse, morseToText, getEntryByChar } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	type QuizMode = 'char-to-morse' | 'morse-to-char' | 'audio-to-char' | 'char-to-audio';

	let mode = $state<QuizMode>('char-to-morse');
	let includeNumbers = $state(false);
	let score = $state(0);
	let total = $state(0);
	let streak = $state(0);
	let bestStreak = $state(0);
	let feedback = $state('');
	let feedbackCorrect = $state(false);
	let userAnswer = $state('');
	let showAnswer = $state(false);
	let audioEngine: MorseAudioEngine | null = null;

	const pool = $derived(includeNumbers ? ALL_MORSE : MORSE_ALPHABET);

	function randomEntry() {
		return pool[Math.floor(Math.random() * pool.length)];
	}

	let currentEntry = $state(randomEntry());

	function nextQuestion() {
		currentEntry = randomEntry();
		userAnswer = '';
		feedback = '';
		showAnswer = false;
	}

	function checkAnswer() {
		total++;
		let correct = false;

		if (mode === 'char-to-morse') {
			const normalized = userAnswer.trim().replace(/·/g, '.').replace(/−/g, '-').replace(/–/g, '-');
			correct = normalized === currentEntry.code;
		} else if (mode === 'morse-to-char' || mode === 'audio-to-char') {
			correct = userAnswer.trim().toUpperCase() === currentEntry.char;
		} else if (mode === 'char-to-audio') {
			// This mode is handled differently - user taps dots/dashes
			const normalized = userAnswer.trim().replace(/·/g, '.').replace(/−/g, '-');
			correct = normalized === currentEntry.code;
		}

		if (correct) {
			score++;
			streak++;
			if (streak > bestStreak) bestStreak = streak;
			feedback = '✓ Correct!';
			feedbackCorrect = true;
			setTimeout(nextQuestion, 800);
		} else {
			streak = 0;
			feedbackCorrect = false;
			const display = currentEntry.code.replace(/\./g, '·').replace(/-/g, '−');
			feedback = `✗ The answer was: ${currentEntry.char} = ${display}`;
			showAnswer = true;
		}
	}

	async function playCurrentSound() {
		if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 12 });
		audioEngine.stop();
		await audioEngine.playCode(currentEntry.code);
	}

	function addSymbol(symbol: '.' | '-') {
		userAnswer += symbol;
	}

	function clearInput() {
		userAnswer = '';
	}

	const modeLabels: Record<QuizMode, string> = {
		'char-to-morse': '📝 Letter → Morse',
		'morse-to-char': '🔤 Morse → Letter',
		'audio-to-char': '🎧 Audio → Letter',
		'char-to-audio': '🔊 Letter → Tap Morse',
	};
</script>

<div class="space-y-8">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-amber-400 mb-4">Quiz Mode</h1>
		<p class="text-gray-400 max-w-2xl mx-auto">
			Test your Morse code knowledge! Choose a quiz mode and challenge yourself.
		</p>
	</div>

	<!-- Score bar -->
	<div class="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
		<div class="flex gap-6">
			<div>
				<span class="text-gray-500 text-sm">Score</span>
				<div class="text-2xl font-bold text-amber-400" data-testid="quiz-score">{score}/{total}</div>
			</div>
			<div>
				<span class="text-gray-500 text-sm">Streak</span>
				<div class="text-2xl font-bold text-green-400">🔥 {streak}</div>
			</div>
			<div>
				<span class="text-gray-500 text-sm">Best</span>
				<div class="text-2xl font-bold text-yellow-400">⭐ {bestStreak}</div>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<label class="flex items-center gap-2 text-gray-400 cursor-pointer">
				<input type="checkbox" bind:checked={includeNumbers} onchange={nextQuestion} class="accent-amber-500" />
				Include Numbers
			</label>
		</div>
	</div>

	<!-- Mode selection -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each Object.entries(modeLabels) as [key, label]}
			<button
				onclick={() => { mode = key as QuizMode; nextQuestion(); }}
				class="p-3 rounded-lg font-bold text-sm transition-colors cursor-pointer {mode === key ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
				data-testid="quiz-mode-{key}"
			>
				{label}
			</button>
		{/each}
	</div>

	<!-- Quiz card -->
	<div class="max-w-xl mx-auto">
		<div class="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center space-y-6">
			{#if mode === 'char-to-morse'}
				<div class="text-gray-400 text-lg">What is the Morse code for:</div>
				<div class="text-8xl font-bold text-amber-400" data-testid="quiz-prompt">{currentEntry.char}</div>
				<div class="flex gap-2 justify-center">
					<button onclick={() => addSymbol('.')} class="bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold py-3 px-6 rounded-lg text-2xl transition-colors cursor-pointer" data-testid="quiz-dot">·</button>
					<button onclick={() => addSymbol('-')} class="bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold py-3 px-8 rounded-lg text-2xl transition-colors cursor-pointer" data-testid="quiz-dash">−</button>
					<button onclick={clearInput} class="bg-gray-800 hover:bg-gray-700 text-red-400 font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer">✕</button>
				</div>
				<div class="text-3xl font-mono text-gray-300 h-12" data-testid="quiz-answer-display">
					{userAnswer.replace(/\./g, '·').replace(/-/g, '−')}
				</div>
				<button onclick={checkAnswer} disabled={!userAnswer} class="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors cursor-pointer" data-testid="quiz-submit">
					Check Answer
				</button>

			{:else if mode === 'morse-to-char'}
				<div class="text-gray-400 text-lg">What letter is this?</div>
				<div class="text-6xl font-mono text-amber-400 tracking-[0.3em]" data-testid="quiz-prompt">
					{currentEntry.code.replace(/\./g, '·').replace(/-/g, '−')}
				</div>
				<form onsubmit={(e) => { e.preventDefault(); checkAnswer(); }} class="flex gap-4 justify-center">
					<input
						type="text"
						bind:value={userAnswer}
						maxlength="1"
						placeholder="?"
						class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:border-amber-500 focus:outline-none w-20 text-center text-4xl uppercase"
						data-testid="quiz-input"
					/>
					<button type="submit" class="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer" data-testid="quiz-submit">
						Check
					</button>
				</form>

			{:else if mode === 'audio-to-char'}
				<div class="text-gray-400 text-lg">Listen and identify the letter:</div>
				<button onclick={playCurrentSound} class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-6 px-12 rounded-xl text-3xl transition-colors cursor-pointer" data-testid="quiz-play-audio">
					🔊 Play
				</button>
				<form onsubmit={(e) => { e.preventDefault(); checkAnswer(); }} class="flex gap-4 justify-center">
					<input
						type="text"
						bind:value={userAnswer}
						maxlength="1"
						placeholder="?"
						class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:border-amber-500 focus:outline-none w-20 text-center text-4xl uppercase"
						data-testid="quiz-input"
					/>
					<button type="submit" class="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer" data-testid="quiz-submit">
						Check
					</button>
				</form>

			{:else if mode === 'char-to-audio'}
				<div class="text-gray-400 text-lg">Tap out the Morse code for:</div>
				<div class="text-8xl font-bold text-amber-400" data-testid="quiz-prompt">{currentEntry.char}</div>
				<div class="flex gap-2 justify-center">
					<button onclick={() => addSymbol('.')} class="bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold py-3 px-6 rounded-lg text-2xl transition-colors cursor-pointer" data-testid="quiz-dot">· Dot</button>
					<button onclick={() => addSymbol('-')} class="bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold py-3 px-8 rounded-lg text-2xl transition-colors cursor-pointer" data-testid="quiz-dash">− Dash</button>
					<button onclick={clearInput} class="bg-gray-800 hover:bg-gray-700 text-red-400 font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer">✕ Clear</button>
				</div>
				<div class="text-3xl font-mono text-gray-300 h-12" data-testid="quiz-answer-display">
					{userAnswer.replace(/\./g, '·').replace(/-/g, '−')}
				</div>
				<button onclick={checkAnswer} disabled={!userAnswer} class="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors cursor-pointer" data-testid="quiz-submit">
					Check Answer
				</button>
			{/if}

			<!-- Feedback -->
			{#if feedback}
				<div class="text-xl {feedbackCorrect ? 'text-green-400' : 'text-red-400'}" data-testid="quiz-feedback">
					{feedback}
				</div>
			{/if}

			{#if showAnswer}
				<button onclick={nextQuestion} class="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded-lg transition-colors cursor-pointer">
					Next Question →
				</button>
			{/if}
		</div>
	</div>
</div>
