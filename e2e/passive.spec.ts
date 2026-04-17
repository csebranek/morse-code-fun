import { test, expect } from '@playwright/test';

test.describe('Passive Listening Quiz Page', () => {
	test('loads and shows title', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		await expect(page.getByTestId('passive-title')).toBeVisible();
		await expect(page.getByTestId('passive-title')).toHaveText('Passive Listening Quiz');
	});

	test('has mode toggle buttons for both modes', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		await expect(page.getByTestId('passive-mode-learn')).toBeVisible();
		await expect(page.getByTestId('passive-mode-quiz')).toBeVisible();
	});

	test('has speed multiplier control', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		await expect(page.getByTestId('passive-speed')).toBeVisible();
	});

	test('has start/stop button', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		await expect(page.getByTestId('passive-start')).toBeVisible();
	});

	test('start button is visible and clickable', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		const startBtn = page.getByTestId('passive-start');
		await expect(startBtn).toBeVisible();
		await expect(startBtn).toBeEnabled();
	});

	test('mode can be switched between Learn and Quiz', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		const learnBtn = page.getByTestId('passive-mode-learn');
		const quizBtn = page.getByTestId('passive-mode-quiz');

		// Start in learn mode (default)
		await expect(learnBtn).toHaveClass(/bg-amber-600/);

		// Switch to quiz
		await quizBtn.click();
		await expect(quizBtn).toHaveClass(/bg-amber-600/);
		await expect(learnBtn).not.toHaveClass(/bg-amber-600/);

		// Switch back to learn
		await learnBtn.click();
		await expect(learnBtn).toHaveClass(/bg-amber-600/);
	});

	test('speed multiplier can be changed', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		// The slider should be present inside the speed control
		const speedControl = page.getByTestId('passive-speed');
		const slider = speedControl.locator('input[type="range"]');
		await expect(slider).toBeVisible();
		// Change slider value (index 3 = 1.25x)
		await slider.fill('3');
		await expect(speedControl).toContainText('1.25x');
	});

	test('has include numbers toggle in quiz mode', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		// Switch to quiz mode first
		await page.getByTestId('passive-mode-quiz').click();
		await expect(page.getByTestId('passive-include-numbers')).toBeVisible();
	});

	test('include numbers toggle not shown in learn mode', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		// In learn mode (default), numbers toggle should not be visible
		await expect(page.getByTestId('passive-include-numbers')).not.toBeVisible();
	});

	test('stopping works - button toggles state', async ({ page }) => {
		await page.goto('/morse-code-fun/passive');
		const startBtn = page.getByTestId('passive-start');

		// Initially shows Start
		await expect(startBtn).toContainText('Start');

		// Click start
		await startBtn.click();

		// Should show Stop
		await expect(startBtn).toContainText('Stop');

		// Click stop
		await startBtn.click();

		// Should show Start again
		await expect(startBtn).toContainText('Start');
	});
});
