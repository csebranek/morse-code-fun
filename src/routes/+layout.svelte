<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';

	let { children } = $props();

	const navItems = [
		{ href: `${base}/`, label: 'Home' },
		{ href: `${base}/learn`, label: 'Learn' },
		{ href: `${base}/tree`, label: 'Binary Tree' },
		{ href: `${base}/mnemonics`, label: 'Mnemonics' },
		{ href: `${base}/quiz`, label: 'Quiz' },
		{ href: `${base}/encode`, label: 'Encode' },
		{ href: `${base}/adventure`, label: 'Adventure' },
		{ href: `${base}/passive`, label: 'Passive' },
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Morse Code Academy</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-gray-100">
	<nav class="bg-gray-900 border-b border-amber-900/50 sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-4">
			<div class="flex items-center justify-between h-16">
				<a href="{base}/" class="flex items-center gap-2 text-amber-400 font-bold text-xl tracking-wider">
					<span class="text-2xl">⚡</span>
					Morse Code Academy
				</a>
				<div class="flex gap-1">
					{#each navItems as item}
						<a
							href={item.href}
							class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-amber-400 hover:bg-gray-800 transition-colors"
						>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-6xl mx-auto px-4 py-8">
		{@render children()}
	</main>

	<footer class="border-t border-gray-800 mt-16 py-8 text-center text-gray-500 text-sm">
		<p>Morse Code Academy &mdash; Learn, Practice, Master</p>
	</footer>
</div>
