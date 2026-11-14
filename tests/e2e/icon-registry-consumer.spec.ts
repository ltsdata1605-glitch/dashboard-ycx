import {test,expect} from '@playwright/test';
import { appPath } from './helpers/appBase';
for(const width of [390,1366])test(`invalid icon names preserve React consumer and fallback ${width}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:844});await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?icon-boundary'));
  await expect(page.getByRole('textbox',{name:'Audit inherited icon'})).toBeVisible();
  await expect(page.locator('svg[data-icon="help"]')).toHaveCount(1);
  await expect(page.locator('#raw-icon svg[role="img"]')).toHaveAccessibleName('Fallback icon');
  await expect(page.locator('#literal-icon')).toHaveText('toString');
  await expect(page.getByRole('img',{name:'Xuất ảnh'})).toBeVisible();expect(errors).toEqual([]);
  await page.screenshot({animations:'disabled',path:`audit/evidence/c43-icons-${process.env.AUDIT_ENGINE||'chromium'}-${width}.png`});
});
