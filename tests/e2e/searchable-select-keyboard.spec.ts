import {test,expect} from '@playwright/test';
import { appPath } from './helpers/appBase';
for(const width of [390,1366]) {
  test(`searchable select keyboard filter selection and escape ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?searchable-select'));
    const trigger=page.locator('button').filter({hasText:'Chọn ngành…'});
    await expect(trigger).toHaveAccessibleName('Ngành audit Chọn ngành…');
    const tab=process.env.AUDIT_ENGINE==='webkit'?'Alt+Tab':'Tab';
    await page.keyboard.press(tab);await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    const search=page.getByRole('textbox',{name:'Tìm kiếm Ngành audit'});
    await expect(search).toBeFocused();await search.fill('be');
    await page.keyboard.press(tab);await page.keyboard.press(tab);
    const beta=page.getByRole('button',{name:'Beta',exact:true});await expect(beta).toBeFocused();
    expect((await beta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Selected',{exact:true})).toHaveText('Beta');
    const selected=page.getByRole('button',{name:'Ngành audit Beta',exact:true});
    await expect(selected).toBeFocused();await expect(selected).toHaveAttribute('aria-expanded','false');
    await selected.click();await expect(beta).toHaveAttribute('aria-pressed','true');
    await page.keyboard.press('Escape');await expect(selected).toBeFocused();await expect(search).toHaveCount(0);
    await selected.click();await search.fill('unknown');await expect(page.getByText('Không có kết quả.',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Chọn ngành…',exact:true}).click();
    await expect(page.getByLabel('Selected',{exact:true})).toHaveText('EMPTY');
    await trigger.click();
    await page.screenshot({animations:'disabled',path:`audit/evidence/c36-select-${process.env.AUDIT_ENGINE||'chromium'}-${width}.png`});
  });
  test(`searchable select custom option ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?searchable-select&custom'));
    await page.locator('button').filter({hasText:'Chọn ngành…'}).click();
    await page.getByPlaceholder('Tìm kiếm...').fill('  Custom audit  ');
    await page.getByRole('button',{name:'Sử dụng "Custom audit"',exact:true}).click();
    await expect(page.getByLabel('Selected',{exact:true})).toHaveText('Custom audit');
  });
}

test('picker Escape closes before its containing shared Modal',async({page})=>{
  await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?searchable-select&in-modal'));
  const dialog=page.getByRole('dialog',{name:'Audit form'});
  const trigger=page.getByRole('button',{name:'Ngành audit Chọn ngành…',exact:true});
  await trigger.click();
  await expect(page.getByRole('textbox',{name:'Tìm kiếm Ngành audit'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
