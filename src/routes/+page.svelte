<script lang="ts">
	import { MorseAudioEngine } from '$lib/audio';
	import { textToMorse } from '$lib/morse';
	import { base } from '$app/paths';

	let audioEngine: MorseAudioEngine | null = null;
	let isPlaying = $state(false);

	async function playDemo() {
		if (!audioEngine) audioEngine = new MorseAudioEngine({ wpm: 10 });
		isPlaying = true;
		await audioEngine.playText(textToMorse('HELLO'));
		isPlaying = false;
	}
</script>

<div class="space-y-16">
	<!-- Hero -->
	<section class="text-center py-16">
		<h1 class="text-6xl font-bold text-amber-400 mb-4 tracking-tight">
			·&ndash; ·&ndash;·· ·&ndash;·· &ndash;&ndash;&ndash;
		</h1>
		<p class="text-2xl text-gray-300 mb-2">That spells <span class="text-amber-400 font-bold">HELLO</span> in Morse Code</p>
		<p class="text-gray-400 mb-8 max-w-2xl mx-auto">
			Welcome to Morse Code Academy &mdash; an interactive journey to learn, practice, and master
			the world's most iconic communication system.
		</p>
		<button
			onclick={playDemo}
			disabled={isPlaying}
			class="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors cursor-pointer"
		>
			{isPlaying ? '🔊 Playing...' : '▶ Hear "HELLO" in Morse'}
		</button>
	</section>

	<!-- History Section -->
	<section class="grid md:grid-cols-2 gap-12 items-start">
		<div class="space-y-6">
			<h2 class="text-3xl font-bold text-amber-400">The Story of Morse Code</h2>
			<div class="space-y-4 text-gray-300 leading-relaxed">
				<p>
					In 1825, <strong class="text-amber-300">Samuel Morse</strong> was away from home when he received a letter
					informing him that his wife was gravely ill. He immediately rushed home, but by the time he arrived,
					she had already passed away and been buried.
				</p>
				<p>
					This devastating experience drove Morse to become determined to find a way to make
					long-distance communication faster. Working with physicist <strong class="text-amber-300">Joseph Henry</strong>
					and machinist <strong class="text-amber-300">Alfred Vail</strong>, he developed the electric telegraph and
					the coding system that bears his name.
				</p>
				<p>
					The first official Morse code message, <em>"What hath God wrought"</em>, was sent on
					<strong class="text-amber-300">May 24, 1844</strong>, from Washington, D.C. to Baltimore. This moment
					marked the beginning of the telecommunications revolution.
				</p>
			</div>
		</div>
		<div class="space-y-4">
			<div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
				<img
					src="{base}/images/morse-key.jpg"
					alt="Wooden Morse telegraph key used for transmitting messages"
					class="w-full h-64 object-cover"
				/>
				<div class="p-4">
					<p class="text-sm text-gray-400">An early telegraph key used for transmitting Morse code. Operators would press the key to create short (dot) and long (dash) electrical pulses.</p>
				</div>
			</div>
			<div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
				<img
					src="{base}/images/morse-telegraph-1837.jpg"
					alt="Samuel Morse's original 1837 telegraph prototype"
					class="w-full h-64 object-cover"
				/>
				<div class="p-4">
					<p class="text-sm text-gray-400">Samuel Morse's original 1837 telegraph prototype — the device that started it all.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- The Basics -->
	<section class="space-y-8">
		<h2 class="text-3xl font-bold text-amber-400">The Basics</h2>
		<div class="grid md:grid-cols-3 gap-6">
			<div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
				<div class="text-4xl mb-4">·</div>
				<h3 class="text-xl font-bold text-amber-300 mb-2">Dot (Dit)</h3>
				<p class="text-gray-400">A short signal — <strong class="text-gray-300">1 unit</strong> in length. Quick and snappy.</p>
			</div>
			<div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
				<div class="text-4xl mb-4">&ndash;</div>
				<h3 class="text-xl font-bold text-amber-300 mb-2">Dash (Dah)</h3>
				<p class="text-gray-400">A long signal — <strong class="text-gray-300">3 units</strong> in length. Three times a dot.</p>
			</div>
			<div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
				<div class="text-4xl mb-4">⏱</div>
				<h3 class="text-xl font-bold text-amber-300 mb-2">Timing</h3>
				<p class="text-gray-400">
					<strong class="text-gray-300">1 unit</strong> gap between parts of a letter,
					<strong class="text-gray-300">3 units</strong> between letters,
					<strong class="text-gray-300">7 units</strong> between words.
				</p>
			</div>
		</div>
	</section>

	<!-- Reference Chart -->
	<section class="space-y-8">
		<h2 class="text-3xl font-bold text-amber-400">Morse Code Reference Chart</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
			{#each ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'] as letter}
				{@const codes: Record<string, string> = {A:'·−',B:'−···',C:'−·−·',D:'−··',E:'·',F:'··−·',G:'−−·',H:'····',I:'··',J:'·−−−',K:'−·−',L:'·−··',M:'−−',N:'−·',O:'−−−',P:'·−−·',Q:'−−·−',R:'·−·',S:'···',T:'−',U:'··−',V:'···−',W:'·−−',X:'−··−',Y:'−·−−',Z:'−−··'}}
				<div class="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center" data-testid="morse-chart-{letter}">
					<div class="text-2xl font-bold text-amber-400">{letter}</div>
					<div class="text-lg text-gray-300 font-mono tracking-wider">{codes[letter]}</div>
				</div>
			{/each}
		</div>
		<div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
			{#each ['0','1','2','3','4','5','6','7','8','9'] as num}
				{@const numCodes: Record<string, string> = {'0':'−−−−−','1':'·−−−−','2':'··−−−','3':'···−−','4':'····−','5':'·····','6':'−····','7':'−−···','8':'−−−··','9':'−−−−·'}}
				<div class="bg-gray-900 rounded-lg p-3 border border-gray-800 text-center">
					<div class="text-2xl font-bold text-amber-400">{num}</div>
					<div class="text-lg text-gray-300 font-mono tracking-wider">{numCodes[num]}</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Learning Path -->
	<section class="space-y-8">
		<h2 class="text-3xl font-bold text-amber-400">Your Learning Path</h2>
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<a href="{base}/learn" class="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-amber-600 transition-colors group">
				<div class="text-3xl mb-3">📖</div>
				<h3 class="text-lg font-bold text-amber-300 group-hover:text-amber-400 mb-2">1. Learn the Basics</h3>
				<p class="text-gray-400 text-sm">Understand the International Morse Code chart for letters, numbers, and timing.</p>
			</a>
			<a href="{base}/mnemonics" class="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-amber-600 transition-colors group">
				<div class="text-3xl mb-3">🧠</div>
				<h3 class="text-lg font-bold text-amber-300 group-hover:text-amber-400 mb-2">2. Master Mnemonics</h3>
				<p class="text-gray-400 text-sm">Learn fun phrases for each letter so you can decode Morse code by ear.</p>
			</a>
			<div class="bg-gray-900 rounded-xl p-6 border border-gray-800 group space-y-3">
				<div class="text-3xl mb-3">🔤</div>
				<h3 class="text-lg font-bold text-amber-300 mb-2">3. Explore Encode &amp; Decode</h3>
				<p class="text-gray-400 text-sm mb-3">Put your knowledge into practice — translate text to Morse and decode signals back to letters.</p>
				<div class="flex gap-2 flex-wrap">
					<a href="{base}/encode" class="text-xs bg-amber-700 hover:bg-amber-600 text-white font-semibold px-3 py-1 rounded-full transition-colors">Encode →</a>
					<a href="{base}/mnemonics" class="text-xs bg-gray-700 hover:bg-gray-600 text-white font-semibold px-3 py-1 rounded-full transition-colors">Decode →</a>
				</div>
			</div>
			<a href="{base}/quiz" class="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-amber-600 transition-colors group">
				<div class="text-3xl mb-3">🎯</div>
				<h3 class="text-lg font-bold text-amber-300 group-hover:text-amber-400 mb-2">4. Test Yourself</h3>
				<p class="text-gray-400 text-sm">Challenge yourself with quizzes — visual, audio, and speed tests.</p>
			</a>
		</div>
	</section>
</div>
