import {test,expect} from '@playwright/test';
for(const withStore of [false,true]) {
  test(`legacy bonus native IndexedDB fallback store=${withStore}`,async({page})=>{
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      const state={legacyCloses:0};
      Object.assign(window,{auditLegacy:state});
      const nativeClose=IDBDatabase.prototype.close;
      IDBDatabase.prototype.close=function(){
        if(this.name==='BI_HUB_DATABASE_V2')state.legacyCloses++;
        return nativeClose.call(this);
      };
    });
    await page.goto(`/tests/e2e/helpers/materialHarness.html?bonus-fallback${withStore?'&with-store':''}`);
    // First close is fixture seeding; second means the real hook reached the legacy fallback.
    await expect.poll(()=>page.evaluate(()=> (window as unknown as {auditLegacy:{legacyCloses:number}}).auditLegacy.legacyCloses)).toBeGreaterThanOrEqual(2);
    await expect(page.locator('output')).toHaveText(withStore?'AUDIT legacy':'NO_BONUS');
    expect(errors).toEqual([]);
  });
}
