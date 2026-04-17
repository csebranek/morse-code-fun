import { test, expect } from '@playwright/test';

test.describe('Adventure Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await expect(page.locator('h1:has-text("Telegraph Mystery")')).toBeVisible();
	});

	test('shows first scene', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await expect(page.getByTestId('adventure-title')).toContainText('Abandoned Radio Station');
	});

	test('shows morse code clue', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await expect(page.getByTestId('adventure-morse')).toBeVisible();
	});

	test('has listen button for clue', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await expect(page.getByTestId('adventure-play')).toBeVisible();
	});

	test('wrong answer shows error feedback', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await page.getByTestId('adventure-input').fill('WRONG ANSWER');
		await page.getByTestId('adventure-submit').click();
		await expect(page.getByTestId('adventure-feedback')).toContainText('Not quite');
	});

	test('correct answer decodes the message', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await page.getByTestId('adventure-input').fill('LOOK UNDER DESK');
		await page.getByTestId('adventure-submit').click();
		await expect(page.getByTestId('adventure-decoded')).toContainText('LOOK UNDER DESK');
	});

	test('can advance to next scene after correct answer', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		await page.getByTestId('adventure-input').fill('LOOK UNDER DESK');
		await page.getByTestId('adventure-submit').click();
		await page.getByTestId('adventure-next').click();
		await expect(page.getByTestId('adventure-title')).toContainText('Under the Desk');
	});

	test('can complete multiple scenes', async ({ page }) => {
		await page.goto('/morse-code-fun/adventure');
		
		// Scene 1
		await page.getByTestId('adventure-input').fill('LOOK UNDER DESK');
		await page.getByTestId('adventure-submit').click();
		await page.getByTestId('adventure-next').click();

		// Scene 2
		await page.getByTestId('adventure-input').fill('GO TO ROOM SEVEN');
		await page.getByTestId('adventure-submit').click();
		await page.getByTestId('adventure-next').click();

		// Scene 3
		await expect(page.getByTestId('adventure-title')).toContainText('Map Room');
	});
});
