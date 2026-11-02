import {test,expect,type Page} from '@playwright/test';
async function swipe(page:Page,cancel:boolean){
  const toast=page.getByTestId('app-toast');
  await expect(toast).toHaveCSS('opacity','1');
  const text=toast.getByText('Audit toast',{exact:true}),box=(await text.boundingBox())!;
  const x=box.x+box.width/2,y=box.y+box.height/2;
  if(process.env.AUDIT_ENGINE==='webkit') {
    // Real mouse drag; cancellation boundary is synthetic, not native iPhone touch.
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+130,y,{steps:5});
    if(cancel)await toast.dispatchEvent('pointercancel',{pointerId:1,bubbles:true});
    await page.mouse.up();
  } else {
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(const dx of [10,40,90,130])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await cdp.detach();
  }
}
test.beforeEach(async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/tests/e2e/helpers/materialHarness.html?toast-gesture');
  await expect(page.getByTestId('app-toast')).toHaveCSS('opacity','1');
});
test('cancelled swipe retains toast and does not invoke onDismiss',async({page})=>{
  await swipe(page,true);await expect(page.getByLabel('Toast counts')).toHaveText('0/0');
  await expect(page.getByTestId('app-toast')).toHaveCSS('opacity','1');
  await page.getByRole('button',{name:'Keep',exact:true}).click();await expect(page.getByLabel('Toast counts')).toHaveText('0/1');
});
test('completed swipe dismisses exactly once',async({page})=>{
  await swipe(page,false);await expect(page.getByLabel('Toast counts')).toHaveText('1/0');
  await expect(page.getByTestId('app-toast')).toHaveCount(0);
});
test('action keepOpen and finish preserve dismissal callback contract',async({page})=>{
  await page.getByRole('button',{name:'Keep',exact:true}).click();await expect(page.getByLabel('Toast counts')).toHaveText('0/1');
  await expect(page.getByTestId('app-toast')).toHaveCSS('opacity','1');
  await page.getByRole('button',{name:'Finish',exact:true}).click();await expect(page.getByLabel('Toast counts')).toHaveText('0/2');
  await expect(page.getByTestId('app-toast')).toHaveCount(0);
});
