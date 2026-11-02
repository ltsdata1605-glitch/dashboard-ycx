import {test,expect} from '@playwright/test';
test('section quick action keyboard does not activate header',async({page})=>{
  await page.goto('/tests/e2e/helpers/materialHarness.html?section-header');
  const tab=process.env.AUDIT_ENGINE==='webkit'?'Alt+Tab':'Tab';
  const header=page.locator('[role="button"]').filter({has:page.getByRole('heading',{name:'Audit section',exact:true})});
  const quick=page.getByRole('button',{name:'Quick audit',exact:true});
  await page.keyboard.press(tab);
  await expect(header).toBeFocused();
  await page.keyboard.press(tab);
  await expect(quick).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Quick count')).toHaveText('1');
  await expect(page.getByLabel('Header count')).toHaveText('0');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Quick count')).toHaveText('2');
  await expect(page.getByLabel('Header count')).toHaveText('0');
  await page.keyboard.press(process.env.AUDIT_ENGINE==='webkit'?'Alt+Shift+Tab':'Shift+Tab');
  await expect(header).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Header count')).toHaveText('1');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Header count')).toHaveText('2');
});

for(const width of [390,1366]) {
  test(`card tokens and responsive section exception ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/tests/e2e/helpers/materialHarness.html?card-foundation');
    const sizes=await page.getByTestId('card').evaluate(el=>{
      const style=getComputedStyle(el);
      return {radius:style.borderTopLeftRadius,token:style.getPropertyValue('--card-radius').trim()};
    });
    expect(sizes.radius).toBe(sizes.token);
    const sectionRadius=await page.getByTestId('section').evaluate(el=>getComputedStyle(el).borderTopLeftRadius);
    expect(sectionRadius).toBe(width<1024?'0px':sizes.radius);
    const row=page.getByRole('button',{name:'Active row',exact:true});
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('button',{name:'Disabled row',exact:true})).toBeDisabled();
    await row.click();
    await expect(page.getByLabel('Rows activated')).toHaveText('1');
    await expect(page.getByRole('heading',{name:'Không có dữ liệu audit'})).toBeVisible();
    await page.screenshot({animations:'disabled',path:`audit/evidence/c33-cards-${process.env.AUDIT_ENGINE||'chromium'}-${width}.png`});
  });
}
