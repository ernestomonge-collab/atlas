import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for login or dashboard
    await page.waitForTimeout(2000);

    // Navigate to Espacios
    const espaciosLink = page.locator('text=Espacios').first();
    if (await espaciosLink.isVisible()) {
      await espaciosLink.click();
      await page.waitForTimeout(1000);
    }

    // Click on first space
    const firstSpace = page.locator('a[href*="/spaces/"]').first();
    if (await firstSpace.isVisible()) {
      await firstSpace.click();
      await page.waitForTimeout(1000);
    }

    // Click Add Member button
    const addMemberBtn = page.locator('button:has-text("Add Member")').first();
    if (await addMemberBtn.isVisible()) {
      await addMemberBtn.click();
      await page.waitForTimeout(1000);

      // Open the Select dropdown
      const selectTrigger = page.locator('text=Selecciona un usuario...').first();
      await selectTrigger.click();
      await page.waitForTimeout(500);

      // Select first user
      const firstUser = page.locator('[role="option"]').first();
      console.log('First user text:', await firstUser.textContent());
      await firstUser.click();
      await page.waitForTimeout(500);

      // Check what's displayed in the select trigger
      const triggerText = await selectTrigger.textContent();
      console.log('Selected value displayed:', triggerText);

      // Get the select trigger HTML
      const triggerHTML = await page.locator('[role="combobox"]').first().innerHTML();
      console.log('Trigger HTML:', triggerHTML);

      // Screenshot for debugging
      await page.screenshot({ path: 'select-debug.png' });
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await page.waitForTimeout(5000);
  await browser.close();
})();
