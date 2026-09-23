import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const gif = Buffer.from('R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', 'base64');

async function preview(page: import('@playwright/test').Page, url: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'GIF link' }).fill(url);
  await page.getByRole('button', { name: 'Preview GIF' }).click();
}

test('rejects unsafe and malformed links before loading a preview', async ({ page }) => {
  await preview(page, 'javascript:alert(1)');
  await expect(page.getByRole('status')).toHaveText('Enter a valid http or https GIF link.');
  await expect(page.getByRole('region', { name: 'GIF preview' })).toBeHidden();
});

test('previews a GIF and downloads its original bytes with a safe filename', async ({ page }) => {
  await page.route('**/cute%20cat.gif', (route) => route.fulfill({ contentType: 'image/gif', body: gif }));
  await preview(page, 'http://127.0.0.1:8765/cute%20cat.gif');
  await expect(page.getByText('Ready to save')).toBeVisible();
  await expect(page.getByRole('img', { name: 'GIF preview' })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download GIF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('cute-cat.gif');
  expect(await readFile(await download.path())).toEqual(gif);
  await expect(page.getByRole('status')).toContainText('Download started');
});

test('keeps gallery-saving guidance when source blocks browser download', async ({ page }) => {
  await page.route('https://cdn.example.test/blocked.gif', (route) =>
    route.request().resourceType() === 'fetch'
      ? route.abort()
      : route.fulfill({ contentType: 'image/gif', body: gif })
  );
  await preview(page, 'https://cdn.example.test/blocked.gif');
  await expect(page.getByText('Ready to save')).toBeVisible();
  await page.getByRole('button', { name: 'Download GIF' }).click();
  await expect(page.getByRole('status')).toContainText('blocks direct downloads');
  await expect(page.getByRole('link', { name: 'Open GIF' })).toHaveAttribute('href', 'https://cdn.example.test/blocked.gif');
  await expect(page.getByText('Touch and hold the GIF above')).toBeVisible();
});

test('rejects a non-GIF download even when image preview loaded', async ({ page }) => {
  await page.route('**/not-gif.gif', (route) => route.fulfill({
    contentType: route.request().resourceType() === 'image' ? 'image/gif' : 'image/png',
    body: gif
  }));
  await preview(page, 'http://127.0.0.1:8765/not-gif.gif');
  await expect(page.getByText('Ready to save')).toBeVisible();
  await page.getByRole('button', { name: 'Download GIF' }).click();
  await expect(page.getByRole('status')).toHaveText('This link did not return a GIF file. Try a direct .gif link.');
});
