import { test, expect } from '@playwright/test';
import { appPath } from './helpers/appBase';
for (const width of [390,1366]) {
  test(`industry and subindustry labels toggle their rows once ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?industry-switch'));
    await page.getByRole('button',{name:'Mở rộng tất cả',exact:true}).click();
    await page.getByRole('button',{name:'Bộ lọc ngành hàng & nhóm hàng',exact:true}).click();
    for (const name of ['Audit a','Sub audit a']) {
      const control=page.getByRole('switch',{name,exact:true});
      await expect(control).toHaveAttribute('aria-checked','true');
      const row=page.locator('tbody tr').filter({has:page.getByRole('cell',{name,exact:true})});
      // Parent row also contains the child-count badge.
      const matchingRow=name==='Audit a'?page.locator('tbody tr').filter({has:page.locator('td').filter({has:page.getByText(name,{exact:true})})}):row;
      await expect(matchingRow).toHaveCount(1);
      const id=await control.getAttribute('id');
      const label=page.locator('label').filter({hasText:new RegExp(`^${name}$`)});
      await expect(label).toHaveAttribute('for',id!);
      await label.click();
      await expect(control).toHaveAttribute('aria-checked','false');
      await expect(matchingRow).toHaveCount(0);
      await control.click();
      await expect(control).toHaveAttribute('aria-checked','true');
      await expect(matchingRow).toHaveCount(1);
    }
    await page.screenshot({animations:'disabled',path:`audit/evidence/c28-industry-${process.env.AUDIT_ENGINE||'chromium'}-${width}.png`});
  });
}

for (const height of [844,568]) {
  test(`industry mobile filter stays inside viewport and closes by keyboard ${height}`,async({page})=>{
    await page.setViewportSize({width:390,height});
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?industry-switch'));
    const trigger=page.getByRole('button',{name:'Bộ lọc ngành hàng & nhóm hàng',exact:true});
    for (let step=0;step<8;step++) {
      await page.keyboard.press(process.env.AUDIT_ENGINE==='webkit'?'Alt+Tab':'Tab');
      if (await trigger.evaluate(el=>el===document.activeElement)) break;
    }
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    const label=page.locator('label').filter({hasText:/^Audit a$/});
    await expect(label).toBeVisible();
    await expect.poll(async()=> (await label.boundingBox())!.x).toBeGreaterThanOrEqual(0);
    const dialog=page.getByRole('dialog',{name:'Bộ lọc ngành hàng & nhóm hàng'});
    await expect(dialog).toBeVisible();
    const rect=await dialog.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x+rect!.width).toBeLessThanOrEqual(390);
    expect(rect!.y+rect!.height).toBeLessThanOrEqual(height+1);
    await dialog.getByPlaceholder('Tìm nhóm hàng...').fill('SUB AUDIT H');
    const last=dialog.getByRole('switch',{name:'Sub audit h',exact:true});
    await last.click();
    await expect(last).toHaveAttribute('aria-checked','false');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(last).toHaveAttribute('aria-checked','false');
    await expect.poll(()=>dialog.evaluate(el=>getComputedStyle(el).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await page.screenshot({animations:'disabled',path:`audit/evidence/c29-sheet-${process.env.AUDIT_ENGINE||'chromium'}-${height}.png`});
    await page.getByRole('button',{name:'Đóng',exact:true}).click();
    await expect(dialog).toHaveCount(0);
  });
}

test('industry tree expander has a name, expanded state and keyboard activation',async({page})=>{
  await page.setViewportSize({width:1366,height:844});
  await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?industry-switch'));
  const toggle=page.getByRole('button',{name:'Mở rộng Audit a',exact:true});
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  for(let step=0;step<40;step++) {
    await page.keyboard.press(process.env.AUDIT_ENGINE==='webkit'?'Alt+Tab':'Tab');
    if(await toggle.evaluate(el=>el===document.activeElement)) break;
  }
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  const expanded=page.getByRole('button',{name:'Thu gọn Audit a',exact:true});
  await expect(expanded).toHaveAttribute('aria-expanded','true');
  await expect(page.getByRole('cell',{name:'Sub audit a',exact:true})).toBeVisible();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(page.getByRole('cell',{name:'Sub audit a',exact:true})).toHaveCount(0);
});
