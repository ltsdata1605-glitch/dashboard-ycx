import {test,expect} from '@playwright/test';
for(const width of [390,1366]) {
  test(`DataTable native sort groups and loading/empty ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/tests/e2e/helpers/materialHarness.html?table-foundation');
    const header=page.getByRole('columnheader',{name:'Tên',exact:true});
    await expect(header).toBeVisible();
    await page.keyboard.press(process.env.AUDIT_ENGINE==='webkit'?'Alt+Tab':'Tab');
    await expect(header).toBeFocused();
    for(const [key,direction] of [['Enter','ascending'],[' ','descending'],['Enter','none']]) {
      await page.keyboard.press(key);await expect(header).toHaveAttribute('aria-sort',direction);
    }
    const groups=await page.locator('thead').evaluate(el=>{
      const visible=(cell:Element)=>getComputedStyle(cell).display!=='none';
      const rows=el.querySelectorAll('tr');
      return {span:Array.from(rows[0].querySelectorAll('th')).filter(visible).reduce((sum,cell)=>sum+cell.colSpan,0),columns:Array.from(rows[1].querySelectorAll('th')).filter(visible).length};
    });
    expect(groups.columns).toBe(width<1024?2:4);expect(groups.span).toBe(groups.columns);
    await page.getByRole('button',{name:'loading',exact:true}).click();
    await expect(page.locator('tbody tr')).toHaveCount(3);await expect(page.getByText('Audit 1',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'empty',exact:true}).click();await expect(page.getByText('Không có dữ liệu',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'data',exact:true}).click();await expect(page.locator('tbody tr')).toHaveCount(40);
  });
  test(`DataTable scroll cue sticky header and column ${width}`,async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/tests/e2e/helpers/materialHarness.html?table-foundation');
    const scroller=page.locator('#audit-table .overflow-x-auto');
    const head=page.locator('thead'),cell=page.getByRole('cell',{name:'Audit 1',exact:true});
    await expect(scroller).toHaveAttribute('data-xcue-right','');
    const y=(await head.boundingBox())!.y,x=(await cell.boundingBox())!.x;
    console.log('TABLE_GEOMETRY',JSON.stringify(await scroller.evaluate(el=>({viewport:window.innerWidth,clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,tableWidth:el.querySelector('table')!.getBoundingClientRect().width,minWidth:getComputedStyle(el.querySelector('table')!).minWidth,firstCellWidth:el.querySelector('td')!.getBoundingClientRect().width}))));
    await scroller.evaluate(el=>{el.scrollTop=400;el.scrollLeft=el.scrollWidth;});
    await expect.poll(async()=>Math.abs((await head.boundingBox())!.y-y)).toBeLessThan(2);
    await expect.poll(async()=>Math.abs((await cell.boundingBox())!.x-x)).toBeLessThan(2);
    await expect(scroller).not.toHaveAttribute('data-xcue-right','');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await scroller.evaluate(el=>{el.scrollTop=0;el.scrollLeft=0;});await expect(scroller).toHaveAttribute('data-xcue-right','');
    await page.screenshot({animations:'disabled',path:`audit/evidence/c37-table-${process.env.AUDIT_ENGINE||'chromium'}-${width}.png`});
  });
}

test('fixed width and group spans recompute across lg breakpoint',async({page})=>{
  await page.goto('/tests/e2e/helpers/materialHarness.html?table-foundation');
  for(const width of [1366,390,1366]) {
    await page.setViewportSize({width,height:844});
    await expect(page.locator('table')).toHaveCSS('min-width',width<1024?'400px':'800px');
    await expect(page.getByRole('columnheader',{name:'Nhóm 1',exact:true})).toHaveAttribute('colspan',width<1024?'1':'2');
  }
});
