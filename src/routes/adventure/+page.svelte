<script lang="ts">
	import { morseToText, textToMorse } from '$lib/morse';
	import { MorseAudioEngine } from '$lib/audio';

	interface Scene {
		id: string;
		title: string;
		description: string;
		morseClue: string; // in plain text, will be converted to morse
		hint: string;
		nextSceneId: string | null;
	}

	const scenes: Scene[] = [
		{
			id: 'start',
			title: 'The Abandoned Radio Station',
			description: `You step into a dusty radio station, long abandoned. Cobwebs hang from vintage telegraph equipment. The old brass telegraph key sits on a worn oak desk. Suddenly, the machine crackles to life! A message begins tapping out...`,
			morseClue: 'LOOK UNDER DESK',
			hint: 'The message is telling you where to search in this room.',
			nextSceneId: 'desk',
		},
		{
			id: 'desk',
			title: 'Under the Desk',
			description: `You crawl under the heavy oak desk. Your fingers find a small metal box bolted to the underside. Inside is a yellowed note with Morse code written on it, and a rusty key. The note reads:`,
			morseClue: 'GO TO ROOM SEVEN',
			hint: 'The note is giving you a location — a room number.',
			nextSceneId: 'room7',
		},
		{
			id: 'room7',
			title: 'Room Seven — The Map Room',
			description: `Room Seven is filled with maps pinned to every wall. Navigation charts, city maps, topographical surveys. In the center, a large table has a single map illuminated by a flickering lamp. Red circles mark several locations. The telegraph in the corner starts tapping:`,
			morseClue: 'NORTH TOWER HAS SAFE',
			hint: 'The telegraph is telling you about a specific location and what you\'ll find there.',
			nextSceneId: 'tower',
		},
		{
			id: 'tower',
			title: 'The North Tower',
			description: `You climb the spiral staircase of the north tower. At the top, wind howls through broken windows. A heavy iron safe sits against the far wall. The combination lock has letters, not numbers. Etched into the safe door in dots and dashes is the combination:`,
			morseClue: 'OPEN',
			hint: 'The code on the safe is just a simple word — what you want to do with the safe.',
			nextSceneId: 'safe',
		},
		{
			id: 'safe',
			title: 'Inside the Safe',
			description: `The safe clicks open! Inside you find a leather journal, its pages filled with encoded messages. A photograph falls out — it shows a group of people standing in front of this very radio station, dated 1943. One final message is scrawled on the inside of the safe door:`,
			morseClue: 'THE SECRET IS KNOWLEDGE',
			hint: 'This is the final revelation — what was the real treasure all along?',
			nextSceneId: 'finale',
		},
		{
			id: 'finale',
			title: 'The Secret of the Station',
			description: `You now understand. This station was used during the war to transmit coded messages. The operators who worked here were heroes, their skills in Morse code saving countless lives. The real treasure wasn't gold or jewels — it was the knowledge and skill of Morse code itself. And now, you carry that knowledge too.`,
			morseClue: 'CONGRATULATIONS AGENT',
			hint: '',
			nextSceneId: null,
		},
	];

	let currentSceneId = $state('start');
	let userInput = $state('');
	let decoded = $state(false);
	let showHint = $state(false);
	let showMorse = $state(true);
	let feedback = $state('');
	let audioEngine: MorseAudioEngine | null = null;

	const currentScene = $derived(scenes.find(s => s.id === currentSceneId)!);
	const morseDisplay = $derived(textToMorse(currentScene.morseClue));

	async function playClue() {
		if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 10 });
		audioEngine.stop();
		await audioEngine.playText(morseDisplay);
	}

	function checkAnswer() {
		const answer = userInput.trim().toUpperCase();
		const expected = currentScene.morseClue.toUpperCase();
		if (answer === expected) {
			decoded = true;
			feedback = '✓ Correct! You decoded the message!';
		} else {
			feedback = `✗ Not quite. Try again! You entered: "${answer}"`;
		}
	}

	function advance() {
		if (currentScene.nextSceneId) {
			currentSceneId = currentScene.nextSceneId;
			userInput = '';
			decoded = false;
			showHint = false;
			feedback = '';
		}
	}

	function restart() {
		currentSceneId = 'start';
		userInput = '';
		decoded = false;
		showHint = false;
		feedback = '';
	}

	const sceneIndex = $derived(scenes.findIndex(s => s.id === currentSceneId));
</script>

<div class="space-y-8">
	<div class="text-center">
		<h1 class="text-4xl font-bold text-amber-400 mb-4">The Telegraph Mystery</h1>
		<p class="text-gray-400 max-w-2xl mx-auto">
			A text-based adventure where you must decode Morse code clues to solve the mystery.
			Each clue leads to the next scene. Can you reach the end?
		</p>
	</div>

	<!-- Progress -->
	<div class="flex items-center justify-center gap-2">
		{#each scenes as scene, i}
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
					{i < sceneIndex ? 'bg-green-700 text-green-100' :
					i === sceneIndex ? 'bg-amber-600 text-white' :
					'bg-gray-800 text-gray-500'}">
					{i + 1}
				</div>
				{#if i < scenes.length - 1}
					<div class="w-8 h-0.5 {i < sceneIndex ? 'bg-green-700' : 'bg-gray-800'}"></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Scene -->
	<div class="max-w-3xl mx-auto">
		<div class="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
			<!-- Scene header -->
			<div class="bg-gray-800 px-6 py-4 border-b border-gray-700">
				<h2 class="text-xl font-bold text-amber-400" data-testid="adventure-title">
					Scene {sceneIndex + 1}: {currentScene.title}
				</h2>
			</div>

			<!-- Scene body -->
			<div class="p-6 space-y-6">
				<p class="text-gray-300 leading-relaxed text-lg" data-testid="adventure-description">
					{currentScene.description}
				</p>

				<!-- Morse clue -->
				{#if currentScene.nextSceneId !== null || !decoded}
					<div class="bg-gray-950 rounded-xl p-6 border border-amber-900/30">
						<div class="flex items-center justify-between mb-3">
							<h3 class="text-amber-400 font-bold">📡 Incoming Message</h3>
							<div class="flex gap-2">
								<button
									onclick={playClue}
									class="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-4 py-1 rounded transition-colors cursor-pointer"
									data-testid="adventure-play"
								>
									🔊 Listen
								</button>
								<button
									onclick={() => showMorse = !showMorse}
									class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-1 rounded transition-colors cursor-pointer"
								>
									{showMorse ? 'Hide' : 'Show'} Code
								</button>
							</div>
						</div>
						{#if showMorse}
							<div class="font-mono text-xl text-amber-300 tracking-wider break-all" data-testid="adventure-morse">
								{morseDisplay.replace(/\./g, '·').replace(/-/g, '−')}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Decode input -->
				{#if !decoded}
					<div class="space-y-4">
						<form onsubmit={(e) => { e.preventDefault(); checkAnswer(); }} class="flex gap-4">
							<input
								type="text"
								bind:value={userInput}
								placeholder="Decode the message..."
								class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:border-amber-500 focus:outline-none text-lg uppercase"
								data-testid="adventure-input"
							/>
							<button
								type="submit"
								class="bg-green-700 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-colors cursor-pointer"
								data-testid="adventure-submit"
							>
								Decode
							</button>
						</form>

						<div class="flex gap-4">
							<button
								onclick={() => showHint = !showHint}
								class="text-gray-500 hover:text-gray-300 text-sm transition-colors cursor-pointer"
							>
								{showHint ? 'Hide' : 'Need a'} hint?
							</button>
						</div>

						{#if showHint && currentScene.hint}
							<div class="bg-gray-800 rounded-lg p-4 text-gray-400 text-sm border border-gray-700">
								💡 <strong>Hint:</strong> {currentScene.hint}
							</div>
						{/if}

						{#if feedback}
							<div class="text-lg {feedback.startsWith('✓') ? 'text-green-400' : 'text-red-400'}" data-testid="adventure-feedback">
								{feedback}
							</div>
						{/if}
					</div>
				{:else}
					<div class="bg-green-900/20 rounded-xl p-6 border border-green-800">
						<div class="text-green-400 text-xl font-bold mb-2">✓ Decoded!</div>
						<div class="text-2xl text-amber-300 font-bold" data-testid="adventure-decoded">
							"{currentScene.morseClue}"
						</div>
					</div>

					{#if currentScene.nextSceneId}
						<button
							onclick={advance}
							class="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-lg text-lg transition-colors cursor-pointer"
							data-testid="adventure-next"
						>
							Continue to Next Scene →
						</button>
					{:else}
						<!-- Finale -->
						<div class="text-center space-y-4 py-4">
							<div class="text-5xl">🏆</div>
							<h3 class="text-2xl font-bold text-amber-400">Mystery Solved!</h3>
							<p class="text-gray-400">You've completed The Telegraph Mystery. Your Morse code skills are ready for anything!</p>
							<button
								onclick={restart}
								class="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3 rounded-lg transition-colors cursor-pointer"
							>
								Play Again
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
