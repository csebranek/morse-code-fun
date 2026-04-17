import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('can navigate to all pages from nav bar', async ({ page }) => {
		await page.goto('/morse-code-fun/');

		// Navigate to Learn
		await page.locator('nav a[href="/morse-code-fun/learn"]').click();
		await expect(page.locator('h1:has-text("Learn Morse Code")')).toBeVisible();

		// Navigate to Tree
		await page.locator('nav a[href="/morse-code-fun/tree"]').click();
		await expect(page.locator('h1:has-text("Build the Binary Tree")')).toBeVisible();

		// Navigate to Mnemonics
		await page.locator('nav a[href="/morse-code-fun/mnemonics"]').click();
		await expect(page.locator('h1:has-text("Mnemonic Method")')).toBeVisible();

		// Navigate to Quiz
		await page.locator('nav a[href="/morse-code-fun/quiz"]').click();
		await expect(page.locator('h1:has-text("Quiz Mode")')).toBeVisible();

		// Navigate to Adventure
		await page.locator('nav a[href="/morse-code-fun/adventure"]').click();
		await expect(page.locator('h1:has-text("Telegraph Mystery")')).toBeVisible();

		// Navigate back home
		await page.locator('nav a[href="/morse-code-fun/"]').first().click();
		await expect(page.getByRole('link', { name: /Morse Code Academy/ })).toBeVisible();
	});
});
