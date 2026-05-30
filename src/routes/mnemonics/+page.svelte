<script lang="ts">
	import { MORSE_ALPHABET } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	let audioEngine: MorseAudioEngine | null = null;
	let currentIndex = $state(0);
	let showCode = $state(false);
	let practiceMode = $state(false);
	let practiceInput = $state('');
	let practiceFeedback = $state('');
	let masteredLetters = $state<Set<string>>(new Set());

	const currentEntry = $derived(MORSE_ALPHABET[currentIndex]);

	async function playSound() {
		if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 12 });
		audioEngine.stop();
		await audioEngine.playCode(currentEntry.code);
	}

	function next() {
		showCode = false;
		practiceFeedback = '';
		practiceInput = '';
		if (practiceMode) {
			let next = Math.floor(Math.random() * MORSE_ALPHABET.length);
			// avoid same letter twice in a row
			if (MORSE_ALPHABET.length > 1) {
				while (next === currentIndex) next = Math.floor(Math.random() * MORSE_ALPHABET.length);
			}
			currentIndex = next;
		} else {
			currentIndex = (currentIndex + 1) % MORSE_ALPHABET.length;
		}
	}

	function prev() {
		showCode = false;
		practiceFeedback = '';
		practiceInput = '';
		currentIndex = (currentIndex - 1 + MORSE_ALPHABET.length) % MORSE_ALPHABET.length;
	}

	function checkPractice() {
		const answer = practiceInput.trim().toUpperCase();
		if (answer === currentEntry.char) {
			practiceFeedback = '✓ Correct!';
			masteredLetters = new Set([...masteredLetters, currentEntry.char]);
			setTimeout(next, 800);
		} else {
			practiceFeedback = `✗ That was ${currentEntry.char}. The mnemonic is "${currentEntry.mnemonic}"`;
		}
	}

	function getMnemonicDisplay(entry: typeof MORSE_ALPHABET[0]): { text: string; isDash: boolean }[] {
		const syllables = entry.mnemonicStressed.split(' ');
		return syllables.map(s => ({
			text: s,
			isDash: s === s.toUpperCase() && s.length > 1,
		}));
	}
</script>

<div class="space-y-12">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-amber-400 mb-4">Mnemonic Method</h1>
		<p class="text-gray-400 max-w-2xl mx-auto">
			Learn each letter's Morse code by sound using memorable phrases.
			<strong class="text-amber-300">CAPITALIZED syllables = dashes (long)</strong>,
			<strong class="text-amber-300">lowercase = dots (short)</strong>.
		</p>
	</div>

	<!-- Mode toggle -->
	<div class="flex justify-center gap-4">
		<button
			onclick={() => { practiceMode = false; }}
			class="px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer {!practiceMode ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
		>
			📖 Study Mode
		</button>
		<button
			onclick={() => { practiceMode = true; currentIndex = Math.floor(Math.random() * MORSE_ALPHABET.length); showCode = false; practiceFeedback = ''; practiceInput = ''; }}
			class="px-6 py-2 rounded-lg font-bold transition-colors cursor-pointer {practiceMode ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
		>
			🎧 Practice Mode
		</button>
	</div>

	<!-- Progress -->
	<div class="flex items-center gap-2 justify-center flex-wrap">
		{#each MORSE_ALPHABET as entry, i}
			<button
				onclick={() => { currentIndex = i; showCode = false; practiceFeedback = ''; practiceInput = ''; }}
				class="w-8 h-8 rounded text-xs font-bold transition-all cursor-pointer
					{!practiceMode && i === currentIndex ? 'bg-amber-600 text-white scale-110' :
					masteredLetters.has(entry.char) ? 'bg-green-700 text-green-100' :
					'bg-gray-800 text-gray-500 hover:bg-gray-700'}"
				data-testid="mnemonic-nav-{entry.char}"
			>
				{entry.char}
			</button>
		{/each}
	</div>

	<!-- Card -->
	<div class="max-w-2xl mx-auto">
		<div class="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center space-y-6">
			{#if !practiceMode}
				<!-- Study mode -->
				<div class="text-8xl font-bold text-amber-400" data-testid="mnemonic-letter">
					{currentEntry.char}
				</div>

				<div class="text-2xl space-x-2">
					{#each getMnemonicDisplay(currentEntry) as syllable}
						<span class="{syllable.isDash ? 'text-amber-400 font-bold text-3xl' : 'text-gray-400'} inline-block">
							{syllable.text}
						</span>
					{/each}
				</div>

				<button
					onclick={() => showCode = !showCode}
					class="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
				>
					{showCode ? 'Hide' : 'Show'} Morse Code
				</button>

				{#if showCode}
					<div class="text-4xl font-mono text-amber-300 tracking-[0.3em]" data-testid="mnemonic-code">
						{currentEntry.code.replace(/\./g, '·').replace(/-/g, '−')}
					</div>
				{/if}

				<button
					onclick={playSound}
					class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors cursor-pointer"
					data-testid="mnemonic-play"
				>
					🔊 Listen
				</button>
			{:else}
				<!-- Practice mode -->
				<div class="text-2xl text-gray-400 mb-2">Listen and identify the letter:</div>

				<button
					onclick={playSound}
					class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-10 rounded-xl text-2xl transition-colors cursor-pointer"
					data-testid="mnemonic-practice-play"
				>
					🔊 Play Sound
				</button>

				<form onsubmit={(e) => { e.preventDefault(); checkPractice(); }} class="flex gap-4 justify-center mt-4">
					<input
						type="text"
						bind:value={practiceInput}
						maxlength="1"
						placeholder="?"
						class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:border-amber-500 focus:outline-none w-20 text-center text-3xl uppercase"
						data-testid="mnemonic-practice-input"
					/>
					<button
						type="submit"
						class="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer"
					>
						Check
					</button>
				</form>

				{#if practiceFeedback}
					<div class="text-xl {practiceFeedback.startsWith('✓') ? 'text-green-400' : 'text-red-400'}" data-testid="mnemonic-practice-feedback">
						{practiceFeedback}
					</div>
				{/if}
			{/if}

			<!-- Navigation -->
			<div class="flex justify-between pt-4">
				<button onclick={prev} class="text-gray-400 hover:text-amber-400 transition-colors cursor-pointer text-lg">
					← Previous
				</button>
				<span class="text-gray-600">{currentIndex + 1} / {MORSE_ALPHABET.length}</span>
				<button onclick={next} class="text-gray-400 hover:text-amber-400 transition-colors cursor-pointer text-lg">
					Next →
				</button>
			</div>
		</div>
	</div>

	<!-- All mnemonics reference -->
	<section>
		<h2 class="text-2xl font-bold text-amber-400 mb-4">Full Mnemonic Reference</h2>
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each MORSE_ALPHABET as entry}
				<div class="bg-gray-900 rounded-lg p-3 border border-gray-800 flex items-center gap-3">
					<div class="text-2xl font-bold text-amber-400 w-8">{entry.char}</div>
					<div class="flex-1">
						<div class="text-sm">
							{#each getMnemonicDisplay(entry) as syllable}
								<span class="{syllable.isDash ? 'text-amber-300 font-bold' : 'text-gray-400'}">
									{syllable.text}{' '}
								</span>
							{/each}
						</div>
						<div class="text-xs font-mono text-gray-600">
							{entry.code.replace(/\./g, '·').replace(/-/g, '−')}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
