import { test, expect } from '@playwright/test';
for (const width of [390,1366]) {
  test(`summary store switch has native label and toggles once ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/tests/e2e/helpers/materialHarness.html?summary-switch');
    await page.getByRole('button',{name:'Lọc danh sách siêu thị'}).click();
    const control=page.getByRole('switch',{name:'AUDIT A',exact:true});
    await expect(control).toHaveAttribute('aria-checked','true');
    const row=page.locator('tbody tr').filter({has:page.getByRole('cell',{name:'AUDIT A',exact:true})});
    await expect(row).toHaveCount(1);
    const id=(await control.getAttribute('id'))!;
    await page.locator('label').filter({hasText:'AUDIT A'}).click();
    await expect(control).toHaveAttribute('aria-checked','false');
    await expect(row).toHaveCount(0);
    expect(await page.locator('label').filter({hasText:'AUDIT A'}).getAttribute('for')).toBe(id);
    await control.click();
    await expect(control).toHaveAttribute('aria-checked','true');
    await expect(row).toHaveCount(1);
    await page.screenshot({animations:'disabled',path:`audit/evidence/c27-summary-${process.env.AUDIT_ENGINE||'chromium'}-${width}.png`});
  });
}
