// Static census only: never execute application modules, configs, or package scripts.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'audit');
const inputs = JSON.parse(fs.readFileSync(path.join(out, 'scan-input.json'), 'utf8'));
const files = new Set(inputs.map(r => r.path));
const edges = [], exports = [], components = [], usages = [], surfaces = [], entries = [], parsed = [], routing = [];
const csv = (name, rows, fields) => fs.writeFileSync(path.join(out, name), [fields, ...rows.map(r => fields.map(f => r[f] ?? ''))].map(row => row.map(x => '"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n')+'\n');
const rel = p => path.relative(root, p).split(path.sep).join('/');
const config = ts.readConfigFile(path.join(root,'tsconfig.json'), ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
function resolve(from, spec) {
  if (/^(https?:|data:|blob:|node:)/.test(spec)) return {target:spec, resolution:'EXTERNAL'};
  const clean=decodeURI(spec.split('?')[0].split('#')[0]);
  let base=clean.startsWith('@/') ? clean.slice(2) : clean.startsWith('/') ? clean.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(from),clean));
  if (clean.startsWith('.') || clean.startsWith('/') || clean.startsWith('@/')) {
    for (const candidate of [base,...['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.css','/index.ts','/index.tsx','/index.js'].map(ext=>base+ext), 'public/'+base]) {
      if (files.has(candidate)) return {target:candidate,resolution:'LOCAL'};
    }
    if(fs.existsSync(path.join(root,base))&&fs.statSync(path.join(root,base)).isDirectory())return {target:base,resolution:'LOCAL_DIRECTORY'};
    return {target:base,resolution:'UNRESOLVED_LOCAL'};
  }
  const found=ts.resolveModuleName(spec,path.join(root,from),options,ts.sys).resolvedModule;
  if(found && !found.isExternalLibraryImport && !found.resolvedFileName.includes('/node_modules/')) return {target:rel(found.resolvedFileName),resolution:'LOCAL'};
  return {target:spec,resolution:'PACKAGE'};
}
const isLiteral=n=>n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n));
const capital=n=>/^[A-Z]/.test(n);
for (const row of inputs) {
  const file=row.path;
  if(row.kind==='SYMLINK') continue;
  if(!/\.(tsx?|jsx?|mjs|cjs)$/.test(file)) {
    if(/\.(html|css)$/.test(file)) {
      const text=fs.readFileSync(path.join(root,file),'utf8');
      const matches=file.endsWith('.html') ? text.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g) : text.matchAll(/@import\s+["']([^"']+)["']|url\(\s*["']([^"']+)["']\s*\)|url\(\s*([^\s)]+)\s*\)/g);
      for(const m of matches) {const spec=m[1]??m[2]??m[3];edges.push({source:file,line:text.slice(0,m.index).split('\n').length,kind:'ASSET_REF',specifier:spec,...resolve(file,spec)});}
      if(file.endsWith('.html')) entries.push({file,line:1,name:file,kind:'HTML_ENTRY',evidence:'Standalone HTML; exposure/active status needs review'});
    }
    continue;
  }
  const text=fs.readFileSync(path.join(root,file),'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const line=n=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
  const locals=new Map(), bindings=new Map();
  const record=(n,kind,spec) => {
    while(ts.isAsExpression(spec)||ts.isParenthesizedExpression(spec)||ts.isNonNullExpression(spec))spec=spec.expression;
    if(ts.isNewExpression(spec)&&spec.expression.getText(sf)==='URL'&&spec.arguments?.length)spec=spec.arguments[0];
    const value=isLiteral(spec)?spec.text:ts.isIdentifier(spec)?locals.get(spec.text):undefined;
    edges.push({source:file,line:line(n),kind,specifier:value??spec.getText(sf).slice(0,180),...(value?resolve(file,value):{target:'',resolution:'DYNAMIC_EXPRESSION'})});
  };
  function collect(n) {
    if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&isLiteral(n.initializer)) locals.set(n.name.text,n.initializer.text);
    ts.forEachChild(n,collect);
  }
  collect(sf);
  const hasJSX=n=> {
    let yes=false;
    const visit=c=>{if(ts.isJsxElement(c)||ts.isJsxSelfClosingElement(c)||ts.isJsxFragment(c))yes=true;else ts.forEachChild(c,visit);};
    visit(n);return yes;
  };
  function visit(n) {
    if(ts.isImportTypeNode(n)&&ts.isLiteralTypeNode(n.argument)&&isLiteral(n.argument.literal))record(n,'IMPORT_TYPE',n.argument.literal);
    if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer&&capital(n.name.text)) {
      const imports=[];
      const find=c=>{if(ts.isCallExpression(c)&&c.expression.kind===ts.SyntaxKind.ImportKeyword&&isLiteral(c.arguments[0]))imports.push(c.arguments[0].text);ts.forEachChild(c,find);};
      find(n.initializer);
      if(imports.length===1)bindings.set(n.name.text,resolve(file,imports[0]).target);
      if(ts.isPropertyAccessExpression(n.initializer)&&n.initializer.name.text==='Provider')components.push({file,line:line(n),symbol:n.name.text,module:row.module,kind:'CONTEXT_PROVIDER_ALIAS',status:'INVENTORIED',reviewed:'NO',tested:'NOT_MAPPED',verified:'NO'});
    }
    if(ts.isImportDeclaration(n)&&n.moduleSpecifier) {
      record(n,n.importClause?.isTypeOnly?'IMPORT_TYPE':'IMPORT',n.moduleSpecifier);
      const resolved=resolve(file,n.moduleSpecifier.text);
      if(n.importClause?.name) bindings.set(n.importClause.name.text,resolved.target);
      const named=n.importClause?.namedBindings;
      if(named&&ts.isNamedImports(named))for(const el of named.elements)bindings.set(el.name.text,resolved.target);
      if(named&&ts.isNamespaceImport(named))bindings.set(named.name.text,resolved.target);
    }
    if(ts.isExportDeclaration(n)) {
      if(n.moduleSpecifier)record(n,'RE_EXPORT',n.moduleSpecifier);
      exports.push({file,line:line(n),symbol:n.exportClause?.getText(sf)??'*',kind:'RE_EXPORT',from:n.moduleSpecifier?.text??''});
    }
    if(ts.isExportAssignment(n)) exports.push({file,line:line(n),symbol:n.expression.getText(sf).slice(0,120),kind:'DEFAULT',from:''});
    if(ts.isExportAssignment(n)&&hasJSX(n)&&!ts.isIdentifier(n.expression))components.push({file,line:line(n),symbol:'default@'+line(n),module:row.module,kind:'ANONYMOUS_DEFAULT_JSX',status:'INVENTORIED',reviewed:'NO',tested:'NOT_MAPPED',verified:'NO'});
    if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword) && !ts.isExportDeclaration(n)) {
      const name=n.name?.getText(sf)??(ts.isVariableStatement(n)?n.declarationList.declarations.map(d=>d.name.getText(sf)).join(';'):'default');
      exports.push({file,line:line(n),symbol:name,kind:'DECLARATION',from:''});
    }
    if(ts.isCallExpression(n)) {
      const call=n.expression.getText(sf);
      if(n.arguments.length && (n.expression.kind===ts.SyntaxKind.ImportKeyword||call==='require'||call==='import.meta.glob')) record(n,n.expression.kind===ts.SyntaxKind.ImportKeyword?'DYNAMIC_IMPORT':call==='require'?'REQUIRE':'GLOB',n.arguments[0]);
      if(/(?:^|\.)(onCall|onRequest|onSchedule|onDocument\w+|onMessagePublished)$/.test(call)) entries.push({file,line:line(n),name:n.parent?.name?.getText(sf)??call,kind:'FIREBASE_TRIGGER',evidence:call});
      if(/(?:addEventListener|dispatchEvent|serviceWorker\.register|httpsCallable)$/.test(call) && n.arguments[0]) {
        const arg=n.arguments[call.endsWith('httpsCallable')?1:0];
        if(arg)entries.push({file,line:line(n),name:isLiteral(arg)?arg.text:'[expression]',kind:'RUNTIME_REGISTRATION',evidence:call});
      }
    }
    if(ts.isNewExpression(n)&&n.arguments?.length&&['Worker','SharedWorker','URL'].includes(n.expression.getText(sf))) record(n,'WORKER_OR_URL',n.arguments[0]);
    const declaration=(ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n)||ts.isVariableDeclaration(n))&&n.name&&ts.isIdentifier(n.name)&&capital(n.name.text);
    if(declaration) {
      const jsx=hasJSX(n);
      const signature=n.getText(sf).slice(0,400);
      const callable=ts.isFunctionDeclaration(n)||ts.isVariableDeclaration(n)&&n.initializer&&(ts.isArrowFunction(n.initializer)||ts.isFunctionExpression(n.initializer));
      if(jsx || callable&&file.endsWith('tsx') || /React\.FC|React\.Component|forwardRef|\bmemo\(|\blazy\(|lazyWithRetry/.test(signature)) {
        const item={file,line:line(n),symbol:n.name.text,module:row.module,kind:jsx?'JSX_DECLARATION':callable?'FUNCTION_COMPONENT_CANDIDATE':'WRAPPER_OR_TYPED_COMPONENT',status:'INVENTORIED',reviewed:'NO',tested:'NOT_MAPPED',verified:'NO'};
        components.push(item);
        if(/View$|Page$|Screen$|Modal|Dialog|Sheet|Tab$|Panel$|Wrapper$/.test(item.symbol))surfaces.push({...item,surface_type:/Modal|Dialog|Sheet/.test(item.symbol)?'OVERLAY':'SCREEN_OR_SUBSCREEN',route:'CONDITIONAL_OR_EMBEDDED; see screen-routing.csv'});
      }
    }
    if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)) {
      const name=n.tagName.getText(sf);
      if(capital(name))usages.push({source:file,line:line(n),component:name,target:bindings.get(name.split('.')[0])??file,resolution:bindings.has(name.split('.')[0])?'IMPORT_BINDING':'LOCAL_OR_NAMESPACE_NEEDS_REVIEW'});
      if(row.type!=='TEST'&&(/View$|Page$|Screen$|Modal|Dialog|Sheet|Tab$|Panel$/.test(name)||file==='App.tsx'||file.endsWith('/BiWrapper.tsx')))routing.push({file,line:line(n),selector:'JSX mount',component:name,kind:'SURFACE_MOUNT',status:'INVENTORIED; runtime unverified'});
    }
    if(row.type!=='TEST' && ts.isObjectLiteralExpression(n)) {
      const id=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='id');
      const component=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='component');
      const label=n.properties.find(p=>ts.isPropertyAssignment(p)&&/^(label|title|name)$/.test(p.name.getText(sf)));
      if(id&&isLiteral(id.initializer)&&(component||label))routing.push({file,line:line(n),selector:id.initializer.text,component:component?.initializer.getText(sf).slice(0,200)??'',kind:component?'ROUTE_DECLARATION':'TAB_OR_ACTION_CANDIDATE',status:'INVENTORIED; runtime unverified'});
    }
    if(row.type!=='TEST' && (ts.isConditionalExpression(n)||ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken)&&hasJSX(n)) {
      const condition=ts.isConditionalExpression(n)?n.condition:n.left;
      if(/tab|view|mode|screen|step|isOpen/i.test(condition.getText(sf)))routing.push({file,line:line(n),selector:condition.getText(sf).slice(0,200),component:'JSX conditional branch',kind:'CONDITIONAL_SURFACE',status:'INVENTORIED; runtime unverified'});
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
  parsed.push({file,parse_diagnostics:sf.parseDiagnostics.length,components:components.filter(c=>c.file===file).length,status:sf.parseDiagnostics.length?'PARSED_WITH_DIAGNOSTICS':'AST_ENUMERATED'});
}
for(const row of inputs.filter(r=>path.basename(r.path)==='package.json')) {
  const pkg=JSON.parse(fs.readFileSync(path.join(root,row.path),'utf8'));
  for(const [name,command]of Object.entries(pkg.scripts??{}))entries.push({file:row.path,line:1,name,kind:'PACKAGE_SCRIPT',evidence:command});
  if(pkg.main)entries.push({file:row.path,line:1,name:pkg.main,kind:'PACKAGE_MAIN',evidence:'Declared package entry; may point to compiled output'});
}
for(const row of inputs.filter(r=>r.path.startsWith('.github/workflows/')))entries.push({file:row.path,line:1,name:row.path,kind:'CI_WORKFLOW',evidence:'External CI entry; not executed'});
const local=edges.filter(e=>e.resolution==='LOCAL');
for(const [symbol,route] of [['Dashboard','dashboard'],['NhanVien','employee'],['DataUpdater','updater']]) {
  for(const c of components.filter(c=>c.symbol===symbol&&c.file.startsWith('features/bi-dashboard/')&&!c.file.endsWith('/BiWrapper.tsx'))) {
    if(!surfaces.some(s=>s.file===c.file&&s.symbol===symbol))surfaces.push({...c,surface_type:'SUBSCREEN',route:'employees/'+route});
  }
}
const moduleByFile=new Map(inputs.map(r=>[r.path,r.module]));
const moduleCounts=new Map();
for(const e of local){const key=moduleByFile.get(e.source)+' → '+moduleByFile.get(e.target);moduleCounts.set(key,(moduleCounts.get(key)??0)+1);}
csv('dependency-edges.csv',edges,['source','line','kind','specifier','target','resolution']);
csv('dependency-unresolved.csv',edges.filter(e=>['DYNAMIC_EXPRESSION','UNRESOLVED_LOCAL'].includes(e.resolution)),['source','line','kind','specifier','target','resolution']);
csv('exports.csv',exports,['file','line','symbol','kind','from']);
csv('component-inventory.csv',components,['file','line','symbol','module','kind','status','reviewed','tested','verified']);
csv('component-usage-map.csv',usages,['source','line','component','target','resolution']);
csv('screen-inventory.csv',surfaces,['file','line','symbol','module','surface_type','route','status','reviewed','tested','verified']);
csv('screen-routing.csv',routing,['file','line','selector','component','kind','status']);
csv('entry-point-inventory.csv',entries,['file','line','name','kind','evidence']);
csv('ast-coverage.csv',parsed,['file','parse_diagnostics','components','status']);
csv('ui-file-coverage.csv',inputs.filter(r=>/\.[jt]sx$/.test(r.path)).map(r=>({file:r.path,module:r.module,scope:r.type==='TEST'?'TEST_HARNESS':'APPLICATION_OR_TOOL',component_declarations:components.filter(c=>c.file===r.path).length,surface_candidates:surfaces.filter(c=>c.file===r.path).length,status:'AST_ENUMERATED; semantic screen classification pending deep review'})),['file','module','scope','component_declarations','surface_candidates','status']);
fs.writeFileSync(path.join(out,'dependency-graph.json'),JSON.stringify({method:'TypeScript syntax AST; local paths resolved; expressions retained as unresolved; not runtime proof',nodes:inputs.map(r=>({id:r.path,module:r.module})),edges},null,2)+'\n');
fs.writeFileSync(path.join(out,'dependency-graph.dot'),'digraph workspace {\n'+[...moduleCounts].map(([key,count])=>{const [a,b]=key.split(' → ');return `${JSON.stringify(a)} -> ${JSON.stringify(b)} [label="${count}"];`;}).join('\n')+'\n}\n');
const summary={parsed:parsed.length,parse_diagnostics:parsed.filter(p=>p.parse_diagnostics),components:components.length,surfaces:surfaces.length,jsx_usages:usages.length,edges:edges.length,edge_resolution:Object.fromEntries([...new Set(edges.map(e=>e.resolution))].map(k=>[k,edges.filter(e=>e.resolution===k).length])),entry_points:entries.length};
fs.writeFileSync(path.join(out,'dependency-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
