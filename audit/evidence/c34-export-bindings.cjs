const ts=require(process.cwd()+'/node_modules/typescript');
const fs=require('fs'),path=require('path');
const scanned=JSON.parse(fs.readFileSync('audit/evidence/c34-scanned-hashes.json','utf8'));
const roots=scanned.filter(r=>/\.tsx?$/.test(r.path)).map(r=>path.resolve(r.path));
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const options=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd()).options;
const program=ts.createProgram(roots,{...options,noEmit:true});const checker=program.getTypeChecker();
const names={Card:'Card',CardHeader:'Card',CardBody:'Card',CardFooter:'Card',SectionCard:'SectionCard',SectionHeader:'SectionHeader',ListGroup:'ListGroup',ListRow:'ListGroup',EmptyState:'EmptyState'};
const targets=new Map(),out={};
for(const [name,file]of Object.entries(names)) {
 const sf=program.getSourceFile(path.resolve('components/shared/ui/'+file+'.tsx'));
 const mod=checker.getSymbolAtLocation(sf);const symbol=checker.getExportsOfModule(mod).find(s=>s.name===name);
 targets.set(symbol,name);out[name]=[];
}
for(const f of roots){const sf=program.getSourceFile(f);if(!sf)continue;
 const visit=n=>{if(ts.isIdentifier(n)) {let sym=checker.getSymbolAtLocation(n);if(sym&&(sym.flags&ts.SymbolFlags.Alias))sym=checker.getAliasedSymbol(sym);
 const name=targets.get(sym);if(name){const line=sf.getLineAndCharacterOfPosition(n.getStart()).line+1;const rel=path.relative(process.cwd(),f);out[name].push({path:rel,line,text:n.getText(),kind:rel==='components/shared/ui/'+names[name]+'.tsx'?'definition':path.basename(rel)==='index.ts'?'barrel':rel.startsWith('tests/')||rel.includes('.test.')?'test':'source_binding'});}}
 ts.forEachChild(n,visit);};visit(sf);
}
fs.writeFileSync('audit/evidence/c34-export-bindings.json',JSON.stringify(out,null,2)+'\n');
for(const [name,rows]of Object.entries(out))console.log(name,JSON.stringify([...new Set(rows.filter(r=>r.kind==='source_binding').map(r=>r.path))]));
