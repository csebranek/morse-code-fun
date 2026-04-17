import { test, expect } from '@playwright/test';

test.describe('Binary Tree Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/tree');
		await expect(page.locator('h1:has-text("Build the Binary Tree")')).toBeVisible();
	});

	test('shows the E.T. Ian story', async ({ page }) => {
		await page.goto('/morse-code-fun/tree');
		await expect(page.locator('text=E.T. Ian Story')).toBeVisible();
	});

	test('allows placing a letter from level 1', async ({ page }) => {
		await page.goto('/morse-code-fun/tree');
		const input = page.getByTestId('tree-input');
		await input.fill('E');
		await page.getByTestId('tree-submit').click();
		await expect(page.getByTestId('tree-feedback')).toContainText('Correct');
	});

	test('rejects wrong letter for current level', async ({ page }) => {
		await page.goto('/morse-code-fun/tree');
		const input = page.getByTestId('tree-input');
		await input.fill('Z');
		await page.getByTestId('tree-submit').click();
		await expect(page.getByTestId('tree-feedback')).toContainText("doesn't belong");
	});

	test('completes level 1 and moves to level 2', async ({ page }) => {
		await page.goto('/morse-code-fun/tree');

		// Place E
		await page.getByTestId('tree-input').fill('E');
		await page.getByTestId('tree-submit').click();
		await expect(page.getByTestId('tree-feedback')).toContainText('Correct');

		// Place T
		await page.getByTestId('tree-input').fill('T');
		await page.getByTestId('tree-submit').click();

		// Wait for level transition
		await page.waitForTimeout(1200);
		await expect(page.getByTestId('tree-feedback')).toContainText('Level complete');
	});
});
