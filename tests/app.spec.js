const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

test('homepage opens the app and bundled assets work offline', async ({ page }) => {
    const externalRequests = [];
    page.on('request', request => {
        if (!request.url().startsWith('http://127.0.0.1:4173/')) externalRequests.push(request.url());
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/PhishGuard_API_Free\.html$/);
    await expect(page.locator('#offlineStatus')).toContainText('Offline cache active');
    await expect(page.getByRole('heading', { name: /PhishGuard/ })).toBeVisible();
    expect(await page.evaluate(() => typeof jsQR)).toBe('function');
    expect(externalRequests).toEqual([]);

    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.context().setOffline(true);
    try {
        await page.reload();
        await expect(page.getByRole('button', { name: 'Email Analyzer' })).toBeVisible();
        expect(await page.evaluate(() => typeof jsQR)).toBe('function');
    } finally {
        await page.context().setOffline(false);
    }
});

test('email analyzer detects mismatches, pasted auth failures, and suspicious links', async ({ page }) => {
    await page.goto('/PhishGuard_API_Free.html');
    await page.getByRole('button', { name: 'Email Analyzer' }).click();
    await page.locator('#emailInput').fill([
        'From: Billing Team <notice@example.com>',
        'Reply-To: support@another-domain.example',
        'Subject: Verify your account',
        'Authentication-Results: mx.example; spf=fail; dkim=none; dmarc=fail',
        '',
        'Please review your account at https://paypa1-login-account.xyz/verify'
    ].join('\n'));
    await page.getByRole('button', { name: 'Analyze Email Locally' }).click();

    await expect(page.locator('#emailSummary')).toContainText('Review recommended');
    await expect(page.locator('#emailHeaderFindings')).toContainText('Reply-To domain differs');
    await expect(page.locator('#emailHeaderFindings')).toContainText('SPF reported fail');
    await expect(page.locator('#emailHeaderFindings')).toContainText('DKIM reported none');
    await expect(page.locator('#emailHeaderFindings')).toContainText('DMARC reported fail');
    await expect(page.locator('#emailLinksBody')).toContainText('paypa1-login-account.xyz');
    await expect(page.locator('#emailLinksBody')).toContainText('Suspicious / Caution');
});

test('labeled fixture predictions remain correct at the default threshold', async ({ page }) => {
    await page.goto('/PhishGuard_API_Free.html');
    await page.getByRole('button', { name: 'Detection Test Lab' }).click();
    await page.getByRole('button', { name: 'Run Labeled Tests' }).click();

    await expect(page.locator('#testMetrics')).toContainText('Accuracy');
    await expect(page.locator('#testMetrics')).toContainText('100.0%');
    await expect(page.locator('#testMetrics')).toContainText('TP 6 · FP 0 · TN 6 · FN 0');
    await expect(page.locator('#testResultsBody tr')).toHaveCount(12);
    await expect(page.locator('#testResultsBody')).not.toContainText('MISS');
});

test('report export safely defangs links and domains by default', async ({ page }) => {
    await page.goto('/PhishGuard_API_Free.html');
    await page.getByRole('button', { name: 'Typosquat (PayPal)' }).click();

    const downloadEvent = page.waitForEvent('download');
    await page.locator('#exportIocsBtn').click();
    const download = await downloadEvent;
    const contents = await fs.readFile(await download.path(), 'utf8');

    expect(download.suggestedFilename()).toMatch(/-iocs\.json$/);
    expect(contents).toContain('hxxp://');
    expect(contents).toContain('[.]');
    expect(contents).not.toContain('http://paypa1.com.account-update.xyz');
});

test('batch CSV export includes analyzed rows', async ({ page }) => {
    await page.goto('/PhishGuard_API_Free.html');
    await page.getByRole('button', { name: 'Batch Audit & CSV Export' }).click();
    await page.locator('#batchUrlsInput').fill('https://www.google.com\nhttps://paypa1-login-account.xyz/verify');
    await page.getByRole('button', { name: 'Execute Batch Audit' }).click();
    await expect(page.locator('#batchResultsTableBody tr')).toHaveCount(2);

    const downloadEvent = page.waitForEvent('download');
    await page.locator('#exportCsvBtn').click();
    const download = await downloadEvent;
    const contents = await fs.readFile(await download.path(), 'utf8');

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    expect(contents).toContain('Target Domain / Host,Risk Score,Verdict');
    expect(contents).toContain('paypa1-login-account.xyz');
});
