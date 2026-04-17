import { test, expect } from '@playwright/test';

test.describe('Learn Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/learn');
		await expect(page.locator('h1:has-text("Learn Morse Code")')).toBeVisible();
	});

	test('displays all 26 letter buttons', async ({ page }) => {
		await page.goto('/morse-code-fun/learn');
		for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
			await expect(page.getByTestId(`learn-letter-${letter}`)).toBeVisible();
		}
	});

	test('displays all 10 number buttons', async ({ page }) => {
		await page.goto('/morse-code-fun/learn');
		for (const num of '0123456789') {
			await expect(page.getByTestId(`learn-number-${num}`)).toBeVisible();
		}
	});

	test('shows timing rules section', async ({ page }) => {
		await page.goto('/morse-code-fun/learn');
		await expect(page.locator('text=Timing Rules')).toBeVisible();
	});

	test('try-it-yourself converts text to morse', async ({ page }) => {
		await page.goto('/morse-code-fun/learn');
		const input = page.getByTestId('try-it-input');
		await input.fill('SOS');
		await expect(page.getByTestId('try-it-output')).toContainText('... --- ...');
	});

	test('try-it-yourself has a play button', async ({ page }) => {
		await page.goto('/morse-code-fun/learn');
		const input = page.getByTestId('try-it-input');
		await input.fill('HI');
		await expect(page.getByTestId('try-it-play')).toBeEnabled();
	});
});
