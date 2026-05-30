<script lang="ts">
	import { MORSE_ALPHABET, MORSE_NUMBERS, TIMING, textToMorse, buildMorseBinaryTree, getEntryByChar, type BinaryTreeNode } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	let audioEngine: MorseAudioEngine | null = null;
	let playingChar = $state<string | null>(null);
	let tryText = $state('');
	let tryMorse = $derived(textToMorse(tryText));
	let isTryPlaying = $state(false);

	// Binary tree section
	const fullTree = buildMorseBinaryTree();

	const levels = [
		['E', 'T'],
		['I', 'A', 'N', 'M'],
		['S', 'U', 'R', 'W', 'D', 'K', 'G', 'O'],
		['H', 'V', 'F', '', 'L', '', 'P', 'J', 'B', 'X', 'C', 'Y', 'Z', 'Q'],
	];

	const storyParts = [
		{ text: "There is an E.T. (extra-terrestrial)", letters: ['E', 'T'] },
		{ text: "His name is Ian. He says 'Mm, sure.'", letters: ['I', 'A', 'N', 'M'] },
		{ text: "He gets some WD-40 and says 'Sur(e), Kay Go.' Then turns on a high voltage frequency.", letters: ['S', 'U', 'R', 'W', 'D', 'K', 'G', 'O'] },
		{ text: "He pauses, says 'Hah, very funny' (H,V,F). LOL (L). Puts on PJs, gets in a BoX, siZe Q, CYcle and Zip.", letters: ['H', 'V', 'F', 'L', 'P', 'J', 'B', 'X', 'C', 'Y', 'Z', 'Q'] },
	];

	let placed = $state<Record<string, string>>({});
	let currentLevel = $state(0);
	let inputValue = $state('');
	let feedback = $state('');
	let showHint = $state(false);
	let completed = $state(false);

	const expectedLetters = $derived(levels[currentLevel]?.filter(l => l !== '') ?? []);
	const placedCount = $derived(Object.keys(placed).length);

	const currentLevelPlaced = $derived(
		expectedLetters.filter(l => placed[l]).length
	);
	const currentLevelComplete = $derived(
		currentLevelPlaced === expectedLetters.length
	);

	function handleSubmit() {
		const letter = inputValue.trim().toUpperCase();
		inputValue = '';
		feedback = '';

		if (!letter || letter.length !== 1) {
			feedback = 'Enter a single letter.';
			return;
		}

		if (placed[letter]) {
			feedback = `${letter} is already placed!`;
			return;
		}

		if (!expectedLetters.includes(letter)) {
			feedback = `${letter} doesn't belong in this level. Expected: ${expectedLetters.filter(l => !placed[l]).join(', ')}`;
			return;
		}

		const entry = getEntryByChar(letter);
		if (entry) {
			placed = { ...placed, [letter]: entry.code };
			feedback = `✓ ${letter} = ${entry.code.replace(/\./g, '·').replace(/-/g, '−')} — Correct!`;

			if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 15 });
			audioEngine.playCode(entry.code);
		}

		const newPlacedCount = expectedLetters.filter(l => placed[l] || l === letter).length;
		if (newPlacedCount === expectedLetters.length && currentLevel < levels.length - 1) {
			setTimeout(() => {
				currentLevel++;
				feedback = `Level complete! Now place: ${levels[currentLevel].filter(l => l !== '').join(', ')}`;
				showHint = false;
			}, 1000);
		} else if (newPlacedCount === expectedLetters.length && currentLevel === levels.length - 1) {
			setTimeout(() => {
				completed = true;
				feedback = '🎉 You completed the entire binary tree!';
			}, 1000);
		}
	}

	interface TreeDisplayNode {
		char: string | null;
		code: string;
		placed: boolean;
		depth: number;
		x: number;
	}

	function buildDisplayNodes(): TreeDisplayNode[] {
		const nodes: TreeDisplayNode[] = [];
		const queue: { node: BinaryTreeNode; code: string; depth: number; x: number }[] = [
			{ node: fullTree, code: '', depth: 0, x: 0.5 }
		];

		while (queue.length > 0) {
			const item = queue.shift()!;
			if (item.depth > 4) continue;

			if (item.code !== '') {
				nodes.push({
					char: item.node.char,
					code: item.code,
					placed: item.node.char ? !!placed[item.node.char] : false,
					depth: item.depth,
					x: item.x,
				});
			}

			const spread = 0.25 / Math.pow(2, item.depth);
			if (item.node.dot) {
				queue.push({ node: item.node.dot, code: item.code + '.', depth: item.depth + 1, x: item.x - spread });
			}
			if (item.node.dash) {
				queue.push({ node: item.node.dash, code: item.code + '-', depth: item.depth + 1, x: item.x + spread });
			}
		}

		return nodes;
	}

	let displayNodes = $derived(buildDisplayNodes());

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

	<!-- Binary Tree -->
	<section class="bg-gray-900 rounded-xl p-6 border border-gray-800">
		<h2 class="text-2xl font-bold text-amber-400 mb-4">Build the Binary Tree</h2>
		<p class="text-gray-400 max-w-3xl mx-auto mb-6">
			The <strong class="text-amber-300">"E.T. Ian" method</strong> helps you memorize the Morse code alphabet by building a binary tree.
			Going <strong class="text-amber-300">left = dot</strong>, going <strong class="text-amber-300">right = dash</strong>.
			Place each letter in the tree level by level.
		</p>

		<!-- Story -->
		<div class="mb-8">
			<h3 class="text-xl font-bold text-amber-400 mb-4">The E.T. Ian Story</h3>
			<div class="space-y-3">
				{#each storyParts as part, i}
					<div class="flex items-start gap-3 {i <= currentLevel ? 'opacity-100' : 'opacity-40'}">
						<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold {i < currentLevel ? 'bg-green-700 text-green-100' : i === currentLevel ? 'bg-amber-600 text-amber-100' : 'bg-gray-700 text-gray-400'}">
							{i + 1}
						</div>
						<div>
							<p class="text-gray-300">{part.text}</p>
							<p class="text-sm text-amber-400 font-mono mt-1">{part.letters.join(' ')}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Tree Visualization -->
		<div class="mb-8">
			<h3 class="text-xl font-bold text-amber-400 mb-2">Your Tree</h3>
			<p class="text-sm text-gray-500 mb-4">Left = Dot (·) &nbsp;|&nbsp; Right = Dash (−)</p>

			<div class="relative w-full" style="height: 400px;">
				<div class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gray-700 border-2 border-amber-500 flex items-center justify-center text-amber-400 font-bold text-lg">
					⚡
				</div>

				{#each displayNodes as node}
					{@const top = node.depth * 80 + 20}
					{@const left = node.x * 100}
					<div
						class="absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold -translate-x-1/2 transition-all duration-300
							{node.placed ? 'bg-amber-600 text-white border-2 border-amber-400' : node.char && !placed[node.char] ? 'bg-gray-800 text-gray-600 border border-gray-700' : 'bg-gray-800 text-gray-700 border border-gray-700'}"
						style="top: {top}px; left: {left}%;"
						title="{node.code.replace(/\./g, '·').replace(/-/g, '−')}"
					>
						{#if node.placed}
							{node.char}
						{:else}
							?
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Input -->
		{#if !completed}
			<div>
				<h3 class="text-xl font-bold text-amber-400 mb-2">
					Level {currentLevel + 1}: Place the letters
				</h3>
				<p class="text-gray-400 mb-4">
					Enter letters one at a time. Expected: <span class="text-amber-300 font-mono">{expectedLetters.filter(l => !placed[l]).join(', ')}</span>
				</p>

				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="flex gap-4 mb-4">
					<input
						type="text"
						bind:value={inputValue}
						maxlength="1"
						placeholder="Enter a letter..."
						class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-amber-500 focus:outline-none w-40 text-center text-xl uppercase"
						data-testid="tree-input"
					/>
					<button
						type="submit"
						class="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded-lg transition-colors cursor-pointer"
						data-testid="tree-submit"
					>
						Place
					</button>
					<button
						type="button"
						onclick={() => showHint = !showHint}
						class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors cursor-pointer"
					>
						{showHint ? 'Hide Hint' : 'Show Hint'}
					</button>
				</form>

				{#if feedback}
					<div class="text-lg mb-2 {feedback.startsWith('✓') || feedback.startsWith('🎉') ? 'text-green-400' : 'text-red-400'}" data-testid="tree-feedback">
						{feedback}
					</div>
				{/if}

				{#if showHint}
					<div class="bg-gray-800 rounded-lg p-4 text-gray-400 text-sm">
						<p><strong class="text-amber-300">Hint:</strong> {storyParts[currentLevel].text}</p>
						<p class="mt-2">Remember: left branches = dots, right branches = dashes. The path from root to a letter spells out its Morse code.</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="bg-green-900/30 rounded-xl p-8 border border-green-700 text-center">
				<h3 class="text-3xl font-bold text-green-400 mb-4">🎉 Tree Complete!</h3>
				<p class="text-gray-300 mb-4">
					You've built the entire Morse code binary tree from memory! Now you can always reconstruct
					the full Morse code chart by remembering the E.T. Ian story.
				</p>
				<button
					onclick={() => { placed = {}; currentLevel = 0; completed = false; feedback = ''; }}
					class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded-lg transition-colors cursor-pointer"
				>
					Try Again
				</button>
			</div>
		{/if}
	</section>
</div>
