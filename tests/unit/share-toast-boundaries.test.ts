import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {toast} from '../../components/shared/ui/toast';
import {canShareBatch,offerBatchShare} from '../../components/shared/ui/BatchShareToast';
import {offerShareRetry} from '../../components/shared/ui/ShareRetryToast';
vi.mock('../../components/shared/ui/toast',()=>({toast:{action:vi.fn()}}));
const files=()=>[{blob:new Blob(['audit'],{type:'image/png'}),filename:'audit'}];
const lastAction=()=>vi.mocked(toast.action).mock.calls.at(-1)![0];
describe('share toast API boundaries (mock navigator, no native share)',()=>{
  beforeEach(()=>vi.clearAllMocks());
  afterEach(()=>vi.unstubAllGlobals());
  it('missing API and empty batch fallback without invoking share',()=>{
    vi.stubGlobal('navigator',{});expect(canShareBatch(files())).toBe(false);
    const fallback=vi.fn();offerBatchShare(files(),fallback);expect(fallback).toHaveBeenCalledTimes(1);expect(toast.action).not.toHaveBeenCalled();
    vi.stubGlobal('navigator',{share:vi.fn(),canShare:vi.fn(()=>true)});expect(canShareBatch([])).toBe(false);
  });
  it('canShare exception or false falls back without toast',()=>{
    const fallback=vi.fn();vi.stubGlobal('navigator',{share:vi.fn(),canShare:vi.fn(()=>{throw new Error('unsupported');})});
    offerBatchShare(files(),fallback);expect(fallback).toHaveBeenCalledTimes(1);expect(toast.action).not.toHaveBeenCalled();
    vi.stubGlobal('navigator',{share:vi.fn(),canShare:()=>false});offerBatchShare(files(),fallback);expect(fallback).toHaveBeenCalledTimes(2);
  });
  it('normalizes filenames and shares synchronously from the action callback',async()=>{
    const share=vi.fn().mockResolvedValue(undefined);vi.stubGlobal('navigator',{share,canShare:()=>true});
    const batch=[...files(),{blob:new Blob(['audit2']),filename:'READY.PNG'}],fallback=vi.fn();offerBatchShare(batch,fallback);
    expect(share).not.toHaveBeenCalled();const config=lastAction();expect(config.duration).toBe(Infinity);
    const pending=config.actions[0].onClick();expect(share).toHaveBeenCalledTimes(1);
    const sent=share.mock.calls[0][0].files as File[];expect(sent.map(f=>f.name)).toEqual(['audit.png','READY.PNG']);expect(sent.map(f=>f.type)).toEqual(['image/png','image/png']);
    await pending;expect(fallback).not.toHaveBeenCalled();
  });
  it('batch AbortError is cancellation, other rejection triggers fallback once',async()=>{
    const share=vi.fn().mockRejectedValue({name:'AbortError'}),fallback=vi.fn();vi.stubGlobal('navigator',{share,canShare:()=>true});
    offerBatchShare(files(),fallback);await lastAction().actions[0].onClick();expect(fallback).not.toHaveBeenCalled();
    share.mockRejectedValue({name:'NotAllowedError'});offerBatchShare(files(),fallback);await lastAction().actions[0].onClick();expect(fallback).toHaveBeenCalledTimes(1);
  });
  it('skip action does not share or invoke download fallback',async()=>{
    const share=vi.fn(),fallback=vi.fn();vi.stubGlobal('navigator',{share,canShare:()=>true});
    offerBatchShare(files(),fallback);await lastAction().actions[1].onClick();expect(share).not.toHaveBeenCalled();expect(fallback).not.toHaveBeenCalled();
  });
  it('retry preserves payload and invokes share directly on action',async()=>{
    const share=vi.fn().mockResolvedValue(undefined),fallback=vi.fn();vi.stubGlobal('navigator',{share});
    const data={title:'audit',files:[new File(['audit'],'audit.png',{type:'image/png'})]};offerShareRetry(data,fallback);
    expect(lastAction().duration).toBe(25000);expect(share).not.toHaveBeenCalled();const pending=lastAction().actions[0].onClick();expect(share).toHaveBeenCalledWith(data);await pending;expect(fallback).not.toHaveBeenCalled();
  });
  it('retry ignores AbortError and forwards non-cancel failure',async()=>{
    const share=vi.fn().mockRejectedValue({name:'AbortError'}),fallback=vi.fn();vi.stubGlobal('navigator',{share});
    offerShareRetry({title:'audit'},fallback);await lastAction().actions[0].onClick();expect(fallback).not.toHaveBeenCalled();
    share.mockRejectedValue(new Error('unsupported'));offerShareRetry({title:'audit'},fallback);await lastAction().actions[0].onClick();expect(fallback).toHaveBeenCalledTimes(1);
  });
});
