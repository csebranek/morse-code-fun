import { test, expect, type Page } from '@playwright/test';

// Morse code lookup used for keyboard-simulation tests
const MORSE_MAP: Record<string, string> = {
	A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
	I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
	Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
	Y: '-.--', Z: '--..',
	'0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
	'5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};

/**
 * Simulate tapping Morse code using Playwright's fake clock API (page.clock).
 * Call `await page.clock.install()` before `page.goto()` in tests that use this.
 *
 * By advancing the browser's fake clock with `page.clock.tick()` we get
 * deterministic, jitter-free timer execution regardless of CPU/worker load.
 *
 * Timing constants (calibrated against INITIAL_DOT_MS=100ms in the component):
 *   dot  press   80ms  (<  initial threshold 200ms = midpoint of 100ms/300ms)
 *   dash press  350ms  (>  initial threshold 200ms)
 *   intra-letter gap 150ms  (<  initial charGapMs 300ms = 3×dotEstimate)
 *   letter gap       350ms  (>  charGapMs after first few dots, ~280ms)
 *   word gap         800ms  (>  wordGapMs 700ms = 7×dotEstimate)
 */
async function typeChallengeMorse(page: Page, challengeText: string) {
	const DOT_MS = 80;
	const DASH_MS = 350;
	const INTRA_MS = 150;      // within a letter — must stay < charGapMs (~280ms)
	const LETTER_GAP_MS = 350; // between letters — must be > charGapMs
	const WORD_GAP_MS = 800;   // between words   — must be > wordGapMs

	const words = challengeText.toUpperCase().split(' ');
	for (let wi = 0; wi < words.length; wi++) {
		if (wi > 0) await page.clock.fastForward(WORD_GAP_MS);
		const letters = words[wi].split('');
		for (let li = 0; li < letters.length; li++) {
			if (li > 0) await page.clock.fastForward(LETTER_GAP_MS);
			const code = MORSE_MAP[letters[li]];
			if (!code) continue;
			for (let si = 0; si < code.length; si++) {
				if (si > 0) await page.clock.fastForward(INTRA_MS);
				await page.keyboard.down('j');
				await page.clock.fastForward(code[si] === '.' ? DOT_MS : DASH_MS);
				await page.keyboard.up('j');
			}
		}
	}
	await page.clock.fastForward(LETTER_GAP_MS); // finalise last letter
}

test.describe('Morse Encoding Challenge Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-title')).toBeVisible();
		await expect(page.getByTestId('encode-title')).toHaveText('Morse Encoding Challenge');
	});

	test('has all four difficulty levels', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-level-1')).toBeVisible();
		await expect(page.getByTestId('encode-level-2')).toBeVisible();
		await expect(page.getByTestId('encode-level-3')).toBeVisible();
		await expect(page.getByTestId('encode-level-4')).toBeVisible();
	});

	test('level 1 is selected by default', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-level-1')).toHaveClass(/border-green-500/);
	});

	test('can switch difficulty levels', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-level-2').click();
		await expect(page.getByTestId('encode-level-2')).toHaveClass(/border-green-500/);
		await expect(page.getByTestId('encode-level-1')).not.toHaveClass(/border-green-500/);
	});

	test('has start button before challenge begins', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-start')).toBeVisible();
		await expect(page.getByTestId('encode-start')).toContainText('Start Challenge');
	});

	test('starting a challenge shows prompt and timer', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-start').click();
		await expect(page.getByTestId('encode-prompt')).toBeVisible();
		await expect(page.getByTestId('encode-timer')).toBeVisible();
	});

	test('starting a challenge shows signal button', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-start').click();
		await expect(page.getByTestId('encode-signal-btn')).toBeVisible();
		await expect(page.getByTestId('encode-signal-btn')).toContainText('PRESS KEY (J)');
	});

	test('signal indicator starts as red', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-start').click();
		// The LED wrapper has an inner ring div with border-red-* when inactive
		const ring = page.getByTestId('encode-signal').locator('div').first();
		await expect(ring).toHaveClass(/border-red-/);
	});

	test('has clear and submit buttons', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-start').click();
		await expect(page.getByTestId('encode-clear')).toBeVisible();
		await expect(page.getByTestId('encode-submit')).toBeVisible();
	});

	test('has audio and text hint buttons during challenge', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-start').click();
		await expect(page.getByTestId('encode-signal-btn')).toBeVisible();
		await expect(page.getByTestId('encode-hint-audio')).toBeVisible();
		await expect(page.getByTestId('encode-hint-text')).toBeVisible();
	});

	test('text hint reveals morse code when clicked', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-start').click();
		await page.getByTestId('encode-hint-text').click();
		await expect(page.getByTestId('encode-hint-display')).toBeVisible();
	});

	test('shows score, streak and best counters', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-score')).toBeVisible();
		await expect(page.getByTestId('encode-streak')).toBeVisible();
	});

	test('has reset stats button', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-reset')).toBeVisible();
		await expect(page.getByTestId('encode-reset')).toContainText('Reset All Stats');
	});

	test('shows instructions panel', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.locator('text=Instructions')).toBeVisible();
		await expect(page.getByText('• Short press for dot (·)')).toBeVisible();
		await expect(page.getByText('• Long press for dash (−)')).toBeVisible();
	});

	test('shows timing rules in instructions', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.locator('text=Timing Rules')).toBeVisible();
		await expect(page.locator('text=Dot = 1 time unit')).toBeVisible();
		await expect(page.locator('text=Dash = 3 time units')).toBeVisible();
	});

	// ── WPM counter tests ──────────────────────────────────────────────────────

	test('WPM counter is not shown on level 1', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		// Level 1 is the default — WPM should not be rendered
		await expect(page.getByTestId('encode-wpm')).not.toBeVisible();
	});

	test('WPM counter is shown on level 2 with a dash placeholder', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-level-2').click();
		await expect(page.getByTestId('encode-wpm')).toBeVisible();
		await expect(page.getByTestId('encode-wpm')).toContainText('—');
	});

	test('WPM counter is shown on level 3 with a dash placeholder', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-level-3').click();
		await expect(page.getByTestId('encode-wpm')).toBeVisible();
		await expect(page.getByTestId('encode-wpm')).toContainText('—');
	});

	test('WPM counter is shown on level 4 with a dash placeholder', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-level-4').click();
		await expect(page.getByTestId('encode-wpm')).toBeVisible();
		await expect(page.getByTestId('encode-wpm')).toContainText('—');
	});

	test('WPM is hidden on level 1 but visible after switching to level 2', async ({ page }) => {
		await page.goto('/morse-code-fun/encode');
		await expect(page.getByTestId('encode-wpm')).not.toBeVisible();
		await page.getByTestId('encode-level-2').click();
		await expect(page.getByTestId('encode-wpm')).toBeVisible();
		// Switch back — WPM disappears again
		await page.getByTestId('encode-level-1').click();
		await expect(page.getByTestId('encode-wpm')).not.toBeVisible();
	});

	test('WPM shows a numeric value after a correct submission on level 2', async ({ page }) => {
		// Install a fake clock BEFORE navigation so all timers and performance.now()
		// in the component use the controlled clock — eliminates real-time jitter.
		await page.clock.install();
		await page.goto('/morse-code-fun/encode');
		await page.getByTestId('encode-level-2').click();
		await page.getByTestId('encode-start').click();
		await expect(page.getByTestId('encode-prompt')).toBeVisible();

		// Read the randomly selected challenge word and type its Morse code
		const challengeText = (await page.getByTestId('encode-prompt').textContent())!.trim();
		await typeChallengeMorse(page, challengeText);

		// Diagnostic: capture what was actually entered before submitting
		const inputDisplay = await page.getByTestId('encode-input-display').textContent();
		console.log(`Challenge: "${challengeText}" | Typed: "${inputDisplay?.trim()}"`);

		await page.keyboard.press('Enter');

		// Correct feedback should appear and WPM should show a positive number
		await expect(page.getByTestId('encode-feedback')).toContainText('Correct', { timeout: 3000 });
		await expect(page.getByTestId('encode-wpm')).not.toContainText('—');

		const wpmText = await page.getByTestId('encode-wpm').textContent();
		const wpm = Number(wpmText?.match(/\d+/)?.[0]);
		expect(wpm).toBeGreaterThan(0);
	});
});
