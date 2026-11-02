import { test, expect } from '@playwright/test';
for(const width of [390,1366]) {
  test(`competition switch names and row bubbling ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/tests/e2e/helpers/materialHarness.html?competition-switch');
    await page.getByRole('button',{name:'Bộ lọc thi đua (Chương trình & Cột hiển thị)',exact:true}).click();
    const program=page.getByRole('switch',{name:/^AUDIT A$/i});
    await expect(program).toHaveAttribute('aria-checked','false');
    for(let step=0;step<20;step++) {
      await page.keyboard.press(process.env.AUDIT_ENGINE==='webkit'?'Alt+Tab':'Tab');
      if(await program.evaluate(el=>el===document.activeElement)) break;
    }
    await expect(program).toBeFocused();
    await page.keyboard.press('Space');
    await expect(program).toHaveAttribute('aria-checked','true');
    await page.keyboard.press('Space');
    await expect(program).toHaveAttribute('aria-checked','false');
    const row=program.locator('..');
    await row.locator('span[title]').click();
    await expect(program).toHaveAttribute('aria-checked','true');
    await program.click();
    await expect(program).toHaveAttribute('aria-checked','false');
    const column=page.getByRole('switch',{name:'THỰC HIỆN',exact:true});
    await expect(column).toHaveAttribute('aria-checked','true');
    await column.click();
    await expect(column).toHaveAttribute('aria-checked','false');
    await column.locator('..').getByText('THỰC HIỆN',{exact:true}).click();
    await expect(column).toHaveAttribute('aria-checked','true');
  });
}
