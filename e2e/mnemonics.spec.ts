import { test, expect } from '@playwright/test';

test.describe('Mnemonics Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/mnemonics');
		await expect(page.locator('h1:has-text("Mnemonic Method")')).toBeVisible();
	});

	test('shows the first letter (A) in study mode', async ({ page }) => {
		await page.goto('/morse-code-fun/mnemonics');
		await expect(page.getByTestId('mnemonic-letter')).toHaveText('A');
	});

	test('can navigate to a different letter', async ({ page }) => {
		await page.goto('/morse-code-fun/mnemonics');
		await page.getByTestId('mnemonic-nav-S').click();
		await expect(page.getByTestId('mnemonic-letter')).toHaveText('S');
	});

	test('can toggle morse code visibility', async ({ page }) => {
		await page.goto('/morse-code-fun/mnemonics');
		// Initially hidden
		await expect(page.getByTestId('mnemonic-code')).not.toBeVisible();
		// Show it
		await page.locator('button:has-text("Show")').click();
		await expect(page.getByTestId('mnemonic-code')).toBeVisible();
	});

	test('shows full mnemonic reference', async ({ page }) => {
		await page.goto('/morse-code-fun/mnemonics');
		await expect(page.locator('text=Full Mnemonic Reference')).toBeVisible();
	});

	test('has listen button', async ({ page }) => {
		await page.goto('/morse-code-fun/mnemonics');
		await expect(page.getByTestId('mnemonic-play')).toBeVisible();
	});
});
