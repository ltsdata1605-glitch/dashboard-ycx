import {test,expect,type Page} from '@playwright/test';
// Chromium: trusted CDP touch input. WebKit: explicit synthetic PointerEvent boundary,
// both mount the actual React hook and buttons; neither proves physical iPhone behavior.
async function hold(page:Page, finish:'end'|'cancel') {
  const button=page.getByRole('button',{name:'Hint',exact:true});
  const rect=(await button.boundingBox())!,x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  const cdp=process.env.AUDIT_ENGINE==='webkit'?null:await page.context().newCDPSession(page);
  if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  else await button.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:1,clientX:x,clientY:y,bubbles:true});
  await expect(page.getByRole('tooltip')).toHaveText('Chú thích audit');
  if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:finish==='end'?'touchEnd':'touchCancel',touchPoints:[]});await cdp.detach();}
  else {
    await button.dispatchEvent(finish==='end'?'pointerup':'pointercancel',{pointerType:'touch',pointerId:1,bubbles:true});
    if(finish==='end')await button.dispatchEvent('click',{bubbles:true,cancelable:true});
  }
}
// Bài này đo cử chỉ CHẠM — phải chạy ở chế độ cảm ứng (trước 2026-10-30 thiếu dòng này nên trên project laptop luôn đỏ ở matchMedia).
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.beforeEach(async({page})=>{
  await page.goto('/tests/e2e/helpers/materialHarness.html?touch-title');
  await expect(page.getByRole('button',{name:'Hint',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>matchMedia('(hover: none) and (pointer: coarse)').matches)).toBe(true);
});
test('long hold consumes its click but next touch still works',async({page})=>{
  await hold(page,'end');await expect(page.getByLabel('Counts')).toHaveText('0/0');
  await page.getByRole('button',{name:'Other',exact:true}).tap();await expect(page.getByLabel('Counts')).toHaveText('0/1');
});
test('cancelled hold must not swallow next touch',async({page})=>{
  await hold(page,'cancel');
  await page.getByRole('button',{name:'Other',exact:true}).tap();await expect(page.getByLabel('Counts')).toHaveText('0/1');
});
test('quick tap remains a normal action without hint',async({page})=>{
  await page.getByRole('button',{name:'Hint',exact:true}).tap();await expect(page.getByLabel('Counts')).toHaveText('1/0');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});
