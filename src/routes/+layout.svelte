<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';

	let { children } = $props();

	function isMobile(): boolean {
		if (!browser) return false;
		return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
			navigator.userAgent
		);
	}

	let showMobileBanner = $state(isMobile());

	const navItems = [
		{ href: `${base}/`, label: 'Home' },
		{ href: `${base}/learn`, label: 'Learn' },
		{ href: `${base}/quiz`, label: 'Quiz' },
		{ href: `${base}/encode`, label: 'Encode' },
		{ href: `${base}/mnemonics`, label: 'Decode' },
		{ href: `${base}/adventure`, label: 'Adventure' },
		{ href: `${base}/passive`, label: 'Passive' },
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Morse Code Academy</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-gray-100">
	{#if showMobileBanner}
		<div class="bg-yellow-600 text-yellow-950 px-4 py-3 flex items-start justify-between gap-4">
			<p class="text-sm font-medium leading-snug">
				⚠️ <strong>Warning:</strong> this application is designed for a desktop and does not run reliably on mobile.
			</p>
			<button
				onclick={() => (showMobileBanner = false)}
				class="shrink-0 text-yellow-950 hover:text-yellow-800 font-bold text-lg leading-none"
				aria-label="Dismiss warning"
			>
				&times;
			</button>
		</div>
	{/if}
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
