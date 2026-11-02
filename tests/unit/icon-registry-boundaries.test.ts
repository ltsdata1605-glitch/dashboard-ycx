import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ICON_REGISTRY,type IconName} from '../../components/shared/ui/icon/iconRegistry';
import {LEGACY_ICON_NAMES,resolveIconName} from '../../components/shared/ui/icon/legacyIconNames';
import {AppIcon} from '../../components/shared/ui/icon/AppIcon';
import {renderIcon} from '../../components/shared/ui/icon/renderIcon';
import {isIconName} from '../../components/shared/ui/toast/toast';
describe('icon names are own registry keys only',()=>{
  it.each(['constructor','toString','__proto__','hasOwnProperty'])('rejects inherited key %s across resolution and rendering',name=>{
    expect(resolveIconName(name)).toBeUndefined();expect(isIconName(name)).toBe(false);
    expect(renderIcon(name,'md')).toBe(name);
    expect(renderToStaticMarkup(React.createElement(AppIcon,{name:name as IconName}))).toContain('<svg');
  });
  it('all canonical and saved legacy mappings remain valid',()=>{
    for(const name of Object.keys(ICON_REGISTRY)){expect(resolveIconName(name)).toBe(name);expect(isIconName(name)).toBe(true);}
    for(const [legacy,target]of Object.entries(LEGACY_ICON_NAMES)){
      expect(Object.hasOwn(ICON_REGISTRY,target)).toBe(true);
      expect(resolveIconName(legacy)).toBe(Object.hasOwn(ICON_REGISTRY,legacy)?legacy:target);
    }
    expect(resolveIconName('trash-2')).toBe('delete');expect(resolveIconName('camera')).toBe('exportImage');
  });
  it('unknown/empty names preserve fallback and React nodes are unchanged',()=>{
    for(const name of ['',null,undefined,'audit-unknown'])expect(resolveIconName(name)).toBeUndefined();
    const node=React.createElement('span',null,'Custom icon');expect(renderIcon(node,'md')).toBe(node);
    expect(renderToStaticMarkup(React.createElement(AppIcon,{name:'audit-unknown' as IconName}))).toContain('<svg');
  });
});
