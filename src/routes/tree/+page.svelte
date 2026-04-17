<script lang="ts">
	import { buildMorseBinaryTree, getEntryByChar, type BinaryTreeNode } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';
	import { base } from '$app/paths';

	const fullTree = buildMorseBinaryTree();

	// The E.T. Ian story order - level by level
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

	// User's placed letters
	let placed = $state<Record<string, string>>({});
	let currentLevel = $state(0);
	let inputValue = $state('');
	let feedback = $state('');
	let showHint = $state(false);
	let completed = $state(false);

	let audioEngine: MorseAudioEngine | null = null;

	// Get expected letters for current level
	const expectedLetters = $derived(levels[currentLevel]?.filter(l => l !== '') ?? []);
	const placedCount = $derived(Object.keys(placed).length);

	// Check how many of current level are placed
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

			// Play the sound
			if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 15 });
			audioEngine.playCode(entry.code);
		}

		// Check if level is complete after this state update
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

	function getNodeAtPath(path: string): BinaryTreeNode | undefined {
		let node: BinaryTreeNode | undefined = fullTree;
		for (const ch of path) {
			if (!node) return undefined;
			node = ch === '.' ? node.dot : node.dash;
		}
		return node;
	}

	// Build tree display data
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
</script>

<div class="space-y-12">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-amber-400 mb-4">Build the Binary Tree</h1>
		<p class="text-gray-400 max-w-3xl mx-auto">
			The <strong class="text-amber-300">"E.T. Ian" method</strong> helps you memorize the Morse code alphabet by building a binary tree.
			Going <strong class="text-amber-300">left = dot</strong>, going <strong class="text-amber-300">right = dash</strong>.
			Place each letter in the tree level by level.
		</p>
	</div>

	<!-- Story -->
	<section class="bg-gray-900 rounded-xl p-6 border border-gray-800">
		<h2 class="text-2xl font-bold text-amber-400 mb-4">The E.T. Ian Story</h2>
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
	</section>

	<!-- Tree Visualization -->
	<section class="bg-gray-900 rounded-xl p-6 border border-gray-800">
		<h2 class="text-2xl font-bold text-amber-400 mb-2">Your Tree</h2>
		<p class="text-sm text-gray-500 mb-4">Left = Dot (·) &nbsp;|&nbsp; Right = Dash (−)</p>

		<div class="relative w-full" style="height: 400px;">
			<!-- Root node -->
			<div class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gray-700 border-2 border-amber-500 flex items-center justify-center text-amber-400 font-bold text-lg">
				⚡
			</div>

			<!-- Tree nodes -->
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
	</section>

	<!-- Input -->
	{#if !completed}
		<section class="bg-gray-900 rounded-xl p-6 border border-gray-800">
			<h2 class="text-xl font-bold text-amber-400 mb-2">
				Level {currentLevel + 1}: Place the letters
			</h2>
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
		</section>
	{:else}
		<section class="bg-green-900/30 rounded-xl p-8 border border-green-700 text-center">
			<h2 class="text-3xl font-bold text-green-400 mb-4">🎉 Tree Complete!</h2>
			<p class="text-gray-300 mb-4">
				You've built the entire Morse code binary tree from memory! Now you can always reconstruct
				the full Morse code chart by remembering the E.T. Ian story.
			</p>
			<div class="flex gap-4 justify-center">
				<a href="{base}/mnemonics" class="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-lg transition-colors">
					Next: Learn Mnemonics →
				</a>
				<button
					onclick={() => { placed = {}; currentLevel = 0; completed = false; feedback = ''; }}
					class="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded-lg transition-colors cursor-pointer"
				>
					Try Again
				</button>
			</div>
		</section>
	{/if}
</div>
