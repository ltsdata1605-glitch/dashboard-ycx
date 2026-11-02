import {test,expect} from '@playwright/test';
for(const variant of ['mobile','desktop']) {
  test(`PageActions latest callback and owner removal ${variant}`,async({page})=>{
    await page.setViewportSize({width:variant==='mobile'?390:1366,height:844});
    await page.goto(`/tests/e2e/helpers/materialHarness.html?page-actions&variant=${variant}`);
    const result=page.getByLabel('Action result');
    await page.getByRole('button',{name:'A primary',exact:true}).click();await expect(result).toHaveText('A:1:primary');
    await page.getByRole('button',{name:'Update callback',exact:true}).click();
    await page.getByRole('button',{name:'A primary',exact:true}).click();await expect(result).toHaveText('A:2:primary');
    await page.getByRole('button',{name:'A quick 1',exact:true}).click();await expect(result).toHaveText('A:2:q1');
    await page.getByRole('button',{name:'Toggle B',exact:true}).click();
    await expect(page.getByRole('button',{name:'A primary',exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'B primary',exact:true}).click();await expect(result).toHaveText('B:2:primary');
    await page.getByRole('button',{name:'Toggle B',exact:true}).click();await expect(page.getByRole('button',{name:'A primary',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Toggle B',exact:true}).click();await page.getByRole('button',{name:'Unmount B',exact:true}).click();
    await expect(page.getByRole('button',{name:'A primary',exact:true})).toBeVisible();
  });
  test(`PageActions overflow scope and loading ${variant}`,async({page})=>{
    await page.setViewportSize({width:variant==='mobile'?390:1366,height:844});
    await page.goto(`/tests/e2e/helpers/materialHarness.html?page-actions&variant=${variant}`);
    const bar=page.locator(`[data-page-actions="${variant}"]`);
    await expect(bar.getByRole('button')).toHaveCount(variant==='mobile'?3:4);
    await page.getByTestId('page-actions-more').click();
    await page.getByRole('menuitem',{name:'A quick 3',exact:true}).click();await expect(page.getByLabel('Action result')).toHaveText('A:1:q3');
    await page.getByRole('button',{name:'Update callback',exact:true}).click();await page.getByTestId('page-actions-more').click();
    await page.getByRole('menuitem',{name:'A item',exact:true}).click();await expect(page.getByLabel('Action result')).toHaveText('A:2:item');
    await page.getByRole('button',{name:'Busy',exact:true}).click();await expect(bar.getByRole('button',{name:'A primary',exact:true})).toBeDisabled();
    await page.getByRole('button',{name:'Busy',exact:true}).click();await expect(bar.getByRole('button',{name:'A primary',exact:true})).toBeEnabled();
    await page.screenshot({animations:'disabled',path:`audit/evidence/c39-actions-${process.env.AUDIT_ENGINE||'chromium'}-${variant}.png`});
    await page.getByRole('button',{name:'Mobile scope',exact:true}).click();await expect(bar).toHaveCount(variant==='mobile'?1:0);
  });
}
