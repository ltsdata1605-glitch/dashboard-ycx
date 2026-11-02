import {test,expect} from '@playwright/test';
test('ordinary render failure can recover through actual retry state',async({page})=>{
  await page.goto('/tests/e2e/helpers/materialHarness.html?error-boundary');
  await expect(page.getByRole('heading',{name:'Đã xảy ra lỗi tại AUDIT'})).toBeVisible();
  await expect(page.getByText('AUDIT render failure',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Khắc phục fixture'}).click();
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await expect(page.getByText('AUDIT recovered',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toHaveCount(0);
});
test('exhausted chunk reload budget shows truthful recovery message and manual reload works',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('auditDocumentLoads',String(Number(sessionStorage.getItem('auditDocumentLoads')||0)+1)));
  await page.goto('/tests/e2e/helpers/materialHarness.html?error-boundary&chunk');
  await expect(page.getByText('Không tải được một phần ứng dụng. Vui lòng thử tải lại trang.',{exact:true})).toBeVisible();
  await expect(page.getByText(/Phiên bản mới đã được cập nhật/)).toHaveCount(0);
  const before=await page.evaluate(()=>Number(sessionStorage.getItem('auditDocumentLoads')));
  await page.getByRole('button',{name:'Tải lại trang',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>Number(sessionStorage.getItem('auditDocumentLoads')))).toBeGreaterThan(before);
  await expect(page.getByRole('heading',{name:'Đã xảy ra lỗi tại AUDIT'})).toBeVisible();
});
