import csv,hashlib,json,struct,urllib.parse
from pathlib import Path
from collections import defaultdict
root=Path.cwd()
scope=[r for r in csv.DictReader(open('audit/coverage-ledger.csv'))if r['scope']=='INCLUDED']
assets=[r for r in scope if r['path'].startswith('public/') and Path(r['path']).suffix.lower()in {'.png','.svg','.ttf','.otf'}]
texts=[]
for r in scope:
 p=Path(r['path'])
 if p.suffix.lower()not in {'.ts','.tsx','.js','.jsx','.mjs','.cjs','.css','.html','.json','.webmanifest','.md'} or p.name.endswith('lock.json'):continue
 try:texts.append((r['path'],p.read_text().splitlines()))
 except (UnicodeError,OSError):pass
records=[];hashes=defaultdict(list)
for r in assets:
 p=Path(r['path']);b=p.read_bytes();h=hashlib.sha256(b).hexdigest();hashes[h].append(str(p));url='/'+str(p).removeprefix('public/');encoded=urllib.parse.quote(url,safe='/');refs=[]
 for src,lines in texts:
  if src==str(p):continue
  for n,line in enumerate(lines,1):
   if url in line or encoded in line or p.name in line:refs.append(dict(file=src,line=n,match=line.strip()[:300]))
 size=struct.unpack('>II',b[16:24])if p.suffix=='.png'and b.startswith(b'\x89PNG\r\n\x1a\n')else None
 records.append(dict(path=str(p),url=url,sha256=h,bytes=len(b),dimensions=size,references=refs,classification='UNKNOWN',review='metadata/reference only; no visual acceptance'))
Path('audit/evidence/c23-asset-references.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
Path('audit/evidence/c23-asset-duplicate-hashes.json').write_text(json.dumps([v for v in hashes.values()if len(v)>1],indent=2)+'\n')
for r in records:print(r['path'],r['dimensions'],len(r['references']),'; '.join(dict.fromkeys(e['file']for e in r['references']))[:240])
