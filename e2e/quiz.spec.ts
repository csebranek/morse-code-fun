import { test, expect } from '@playwright/test';

test.describe('Quiz Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await expect(page.locator('h1:has-text("Quiz Mode")')).toBeVisible();
	});

	test('shows score display', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await expect(page.getByTestId('quiz-score')).toContainText('0/0');
	});

	test('has all four quiz modes', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await expect(page.getByTestId('quiz-mode-char-to-morse')).toBeVisible();
		await expect(page.getByTestId('quiz-mode-morse-to-char')).toBeVisible();
		await expect(page.getByTestId('quiz-mode-audio-to-char')).toBeVisible();
		await expect(page.getByTestId('quiz-mode-char-to-audio')).toBeVisible();
	});

	test('char-to-morse mode shows a letter prompt', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await page.getByTestId('quiz-mode-char-to-morse').click();
		await expect(page.getByTestId('quiz-prompt')).toBeVisible();
	});

	test('char-to-morse mode has dot and dash buttons', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await page.getByTestId('quiz-mode-char-to-morse').click();
		await expect(page.getByTestId('quiz-dot')).toBeVisible();
		await expect(page.getByTestId('quiz-dash')).toBeVisible();
	});

	test('morse-to-char mode shows morse code prompt', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await page.getByTestId('quiz-mode-morse-to-char').click();
		await expect(page.getByTestId('quiz-prompt')).toBeVisible();
		await expect(page.getByTestId('quiz-input')).toBeVisible();
	});

	test('can submit an answer in morse-to-char mode', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await page.getByTestId('quiz-mode-morse-to-char').click();
		await page.getByTestId('quiz-input').fill('A');
		await page.getByTestId('quiz-submit').click();
		// Should show feedback (correct or incorrect)
		await expect(page.getByTestId('quiz-feedback')).toBeVisible();
	});

	test('score updates after answering', async ({ page }) => {
		await page.goto('/morse-code-fun/quiz');
		await page.getByTestId('quiz-mode-morse-to-char').click();
		await page.getByTestId('quiz-input').fill('A');
		await page.getByTestId('quiz-submit').click();
		// Score should not be 0/0 anymore
		await expect(page.getByTestId('quiz-score')).not.toContainText('0/0');
	});
});
