<script lang="ts">
	import { MORSE_ALPHABET, MORSE_NUMBERS, TIMING, textToMorse } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	let audioEngine: MorseAudioEngine | null = null;
	let playingChar = $state<string | null>(null);
	let tryText = $state('');
	let tryMorse = $derived(textToMorse(tryText));
	let isTryPlaying = $state(false);

	async function playLetter(code: string, char: string) {
		if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 12 });
		audioEngine.stop();
		playingChar = char;
		await audioEngine.playCode(code);
		playingChar = null;
	}

	async function playTryIt() {
		if (!tryMorse || isTryPlaying) return;
		if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 12 });
		audioEngine.stop();
		isTryPlaying = true;
		await audioEngine.playText(tryMorse);
		isTryPlaying = false;
	}
</script>

<div class="space-y-12">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-amber-400 mb-4">Learn Morse Code</h1>
		<p class="text-gray-400 max-w-2xl mx-auto">
			Click any letter or number to hear its Morse code sound. Pay attention to the rhythm —
			short sounds are <strong class="text-amber-300">dots</strong> and long sounds are <strong class="text-amber-300">dashes</strong>.
		</p>
	</div>

	<!-- Timing rules -->
	<section class="bg-gray-900 rounded-xl p-6 border border-gray-800">
		<h2 class="text-2xl font-bold text-amber-400 mb-4">Timing Rules</h2>
		<div class="grid md:grid-cols-5 gap-4">
			<div class="text-center">
				<div class="text-3xl font-mono text-amber-300">·</div>
				<p class="text-sm text-gray-400 mt-1">Dot = <strong class="text-gray-200">{TIMING.DOT} unit</strong></p>
			</div>
			<div class="text-center">
				<div class="text-3xl font-mono text-amber-300">&ndash;</div>
				<p class="text-sm text-gray-400 mt-1">Dash = <strong class="text-gray-200">{TIMING.DASH} units</strong></p>
			</div>
			<div class="text-center">
				<div class="text-3xl text-gray-600">|</div>
				<p class="text-sm text-gray-400 mt-1">Intra-letter gap = <strong class="text-gray-200">{TIMING.INTRA_CHAR_GAP} unit</strong></p>
			</div>
			<div class="text-center">
				<div class="text-3xl text-gray-600">| |</div>
				<p class="text-sm text-gray-400 mt-1">Letter gap = <strong class="text-gray-200">{TIMING.INTER_CHAR_GAP} units</strong></p>
			</div>
			<div class="text-center">
				<div class="text-3xl text-gray-600">/ /</div>
				<p class="text-sm text-gray-400 mt-1">Word gap = <strong class="text-gray-200">{TIMING.WORD_GAP} units</strong></p>
			</div>
		</div>
	</section>

	<!-- Letters -->
	<section>
		<h2 class="text-2xl font-bold text-amber-400 mb-4">Letters</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
			{#each MORSE_ALPHABET as entry}
				<button
					onclick={() => playLetter(entry.code, entry.char)}
					class="bg-gray-900 rounded-lg p-4 border transition-all cursor-pointer {playingChar === entry.char ? 'border-amber-400 bg-amber-950 scale-105' : 'border-gray-800 hover:border-amber-600'}"
					data-testid="learn-letter-{entry.char}"
				>
					<div class="text-2xl font-bold text-amber-400">{entry.char}</div>
					<div class="text-lg text-gray-300 font-mono tracking-wider">
						{entry.code.replace(/\./g, '·').replace(/-/g, '−')}
					</div>
					<div class="text-xs text-gray-500 mt-1">{entry.mnemonic}</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Numbers -->
	<section>
		<h2 class="text-2xl font-bold text-amber-400 mb-4">Numbers</h2>
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
			{#each MORSE_NUMBERS as entry}
				<button
					onclick={() => playLetter(entry.code, entry.char)}
					class="bg-gray-900 rounded-lg p-4 border transition-all cursor-pointer {playingChar === entry.char ? 'border-amber-400 bg-amber-950 scale-105' : 'border-gray-800 hover:border-amber-600'}"
					data-testid="learn-number-{entry.char}"
				>
					<div class="text-2xl font-bold text-amber-400">{entry.char}</div>
					<div class="text-lg text-gray-300 font-mono tracking-wider">
						{entry.code.replace(/\./g, '·').replace(/-/g, '−')}
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Try it yourself -->
	<section class="bg-gray-900 rounded-xl p-6 border border-gray-800">
		<h2 class="text-2xl font-bold text-amber-400 mb-4">Try It Yourself</h2>
		<p class="text-gray-400 mb-4">Type a message below and hear it in Morse code:</p>
		<div class="flex gap-4 mb-4">
			<input
				type="text"
				bind:value={tryText}
				placeholder="Type something..."
				class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-amber-500 focus:outline-none"
				data-testid="try-it-input"
			/>
			<button
				onclick={playTryIt}
				disabled={!tryMorse || isTryPlaying}
				class="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white font-bold px-6 py-2 rounded-lg transition-colors cursor-pointer"
				data-testid="try-it-play"
			>
				{isTryPlaying ? '🔊 Playing...' : '▶ Play'}
			</button>
		</div>
		{#if tryMorse}
			<div class="bg-gray-800 rounded-lg p-4 font-mono text-lg text-amber-300 tracking-wider" data-testid="try-it-output">
				{tryMorse}
			</div>
		{/if}
	</section>
</div>
