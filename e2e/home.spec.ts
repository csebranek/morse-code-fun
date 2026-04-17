import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
	test('loads and shows hero section', async ({ page }) => {
		await page.goto('/morse-code-fun/');
		await expect(page.getByRole('link', { name: /Morse Code Academy/ })).toBeVisible();
		await expect(page.locator('text=HELLO').first()).toBeVisible();
	});

	test('displays the morse code reference chart', async ({ page }) => {
		await page.goto('/morse-code-fun/');
		await expect(page.getByTestId('morse-chart-A')).toBeVisible();
		await expect(page.getByTestId('morse-chart-Z')).toBeVisible();
	});

	test('has navigation links to all pages', async ({ page }) => {
		await page.goto('/morse-code-fun/');
		await expect(page.locator('nav a[href="/morse-code-fun/learn"]')).toBeVisible();
		await expect(page.locator('nav a[href="/morse-code-fun/tree"]')).toBeVisible();
		await expect(page.locator('nav a[href="/morse-code-fun/mnemonics"]')).toBeVisible();
		await expect(page.locator('nav a[href="/morse-code-fun/quiz"]')).toBeVisible();
		await expect(page.locator('nav a[href="/morse-code-fun/adventure"]')).toBeVisible();
	});

	test('shows history section about Samuel Morse', async ({ page }) => {
		await page.goto('/morse-code-fun/');
		await expect(page.getByText('Samuel Morse', { exact: true })).toBeVisible();
		await expect(page.locator('text=Story of Morse Code')).toBeVisible();
	});

	test('shows learning path cards', async ({ page }) => {
		await page.goto('/morse-code-fun/');
		await expect(page.locator('text=Learn the Basics')).toBeVisible();
		await expect(page.locator('text=Build the Binary Tree')).toBeVisible();
		await expect(page.locator('text=Master Mnemonics')).toBeVisible();
		await expect(page.locator('text=Test Yourself')).toBeVisible();
	});

	test('play demo button exists', async ({ page }) => {
		await page.goto('/morse-code-fun/');
		await expect(page.locator('button:has-text("Hear")')).toBeVisible();
	});
});
