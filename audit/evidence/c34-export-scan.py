import csv,re,json,hashlib
from pathlib import Path
names={'Card':'components/shared/ui/Card.tsx','CardHeader':'components/shared/ui/Card.tsx','CardBody':'components/shared/ui/Card.tsx','CardFooter':'components/shared/ui/Card.tsx','SectionCard':'components/shared/ui/SectionCard.tsx','SectionHeader':'components/shared/ui/SectionHeader.tsx','ListGroup':'components/shared/ui/ListGroup.tsx','ListRow':'components/shared/ui/ListGroup.tsx','EmptyState':'components/shared/ui/EmptyState.tsx'}
refs={k:[] for k in names};scanned=[]
with open('audit/coverage-ledger.csv',newline='') as f:
 for r in csv.DictReader(f):
  p=Path(r['path'])
  if r['scope']!='INCLUDED' or p.suffix not in ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.html','.css']:continue
  s=p.read_text();scanned.append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
  for name,source in names.items():
   for no,line in enumerate(s.splitlines(),1):
    if re.search(r'\b'+name+r'\b',line):
     kind='definition' if str(p)==source else 'barrel' if p.name in ['index.ts','index.tsx'] else 'test' if 'tests/' in str(p) or '.test.' in str(p) else 'source_reference'
     refs[name].append({'path':str(p),'line':no,'kind':kind,'text':line.strip()[:260]})
Path('audit/evidence/c34-export-references.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n')
Path('audit/evidence/c34-scanned-hashes.json').write_text(json.dumps(scanned,indent=2)+'\n')
rows=[]
for name,source in names.items():
 counts={k:sum(r['kind']==k for r in refs[name]) for k in ['definition','barrel','test','source_reference']}
 rows.append(dict(file=source,export=name,classification='POSSIBLE_DEAD' if counts['source_reference']==0 else 'UNKNOWN',reference_counts=json.dumps(counts),consumer_candidates=';'.join(sorted({r['path'] for r in refs[name] if r['kind']=='source_reference'})),evidence='audit/evidence/c34-export-references.json#'+name,remaining='Lexical only: resolve imports/aliases/member access/dynamic/external API and regression before deletion',action='RETAIN'))
with open('audit/export-audit.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
for r in rows: print(r['export'],r['classification'],r['reference_counts'])
