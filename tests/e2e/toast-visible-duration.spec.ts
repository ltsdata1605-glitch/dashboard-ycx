import {test,expect} from '@playwright/test';
import { appPath } from './helpers/appBase';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?toast-queue'));});
test('queued toast retains duration until its first visible slot',async({page})=>{
  await page.getByRole('button',{name:'Queue',exact:true}).click();await expect(page.locator('[data-app-toast]')).toHaveCount(3);
  await expect(page.getByText('Queued finite',{exact:true})).toHaveCount(0);
  await page.waitForTimeout(1400); // deliberately exceed queued toast's900ms lifespan
  await page.getByRole('button',{name:'Release',exact:true}).click();
  const queued=page.locator('[data-app-toast]').filter({hasText:'Queued finite'});
  await expect(queued).toHaveCSS('opacity','1');
  await expect(queued).toHaveCount(0,{timeout:4000});
});
test('visible toast hover pauses and resumes its duration',async({page})=>{
  await page.getByRole('button',{name:'Timed',exact:true}).click();
  const toast=page.locator('[data-app-toast]').filter({hasText:'Timed toast'});await expect(toast).toHaveCSS('opacity','1');await toast.hover();
  await page.waitForTimeout(1600);await expect(toast).toHaveCSS('opacity','1');
  await page.mouse.move(900,700);await expect(toast).toHaveCount(0,{timeout:4000});
});
test('loading replacement expires and same-id resurrection cancels removal',async({page})=>{
  await page.getByRole('button',{name:'Loading',exact:true}).click();await expect(page.getByText('Loading audit')).toBeVisible();
  await page.getByRole('button',{name:'Success',exact:true}).click();await expect(page.getByText('Success audit')).toBeVisible();
  await expect(page.getByText('Success audit')).toHaveCount(0,{timeout:4000});
  await page.getByRole('button',{name:'Loading',exact:true}).click();await page.getByRole('button',{name:'Resurrect',exact:true}).click();
  await page.waitForTimeout(1400);await expect(page.locator('[data-app-toast]').filter({hasText:'Resurrected audit'})).toHaveCSS('opacity','1');
});
test('preempted toast resumes remaining time without overlapping visible rows',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Timed',exact:true}).click();
  const timed=page.locator('[data-app-toast]').filter({hasText:'Timed toast'});
  await expect(timed).toHaveCSS('opacity','1');await page.waitForTimeout(300);
  await page.getByRole('button',{name:'Queue',exact:true}).click();await expect(timed).toHaveCount(0);
  await page.waitForTimeout(1400);
  await page.getByRole('button',{name:'Release',exact:true}).click();
  await expect(page.locator('[data-app-toast]').filter({hasText:'Queued finite'})).toHaveCSS('opacity','1');
  const boxes=await page.locator('[data-app-toast]').evaluateAll(els=>els.filter(el=>getComputedStyle(el).opacity==='1').map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};}).sort((a,b)=>a.top-b.top));
  expect(boxes).toHaveLength(3);
  for(let i=0;i<boxes.length;i++){expect(boxes[i].left).toBeGreaterThanOrEqual(0);expect(boxes[i].right).toBeLessThanOrEqual(390);if(i)expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i-1].bottom);}
  await page.screenshot({animations:'disabled',path:`audit/evidence/c42-queue-${process.env.AUDIT_ENGINE||'chromium'}-390.png`});
  await expect(timed).toHaveCSS('opacity','1',{timeout:4000});
  await expect(timed).toHaveCount(0,{timeout:4000});
});
