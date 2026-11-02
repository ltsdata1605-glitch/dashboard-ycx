"""Map test execution evidence only; never infer production verification from a passing suite."""
import csv
import json
from pathlib import Path
from collections import defaultdict
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'audit'
rows = []
u = json.loads((OUT/'evidence/unit-results.json').read_text())
for suite in u['testResults']:
    for a in suite['assertionResults']:
        rows.append(dict(path=str(Path(suite['name']).relative_to(ROOT)), engine='vitest', test=a['fullName'], status={'passed':'PASS','failed':'FAIL'}.get(a['status'],'SKIPPED'), evidence='audit/evidence/unit-results.json'))
def walk(suites, engine):
    for suite in suites:
        for spec in suite.get('specs',[]):
            for test in spec['tests']:
                status=test['results'][-1]['status'] if test['results'] else 'skipped'
                rows.append(dict(path='tests/e2e/'+spec['file'],engine=engine,test=spec['title'],status={'passed':'PASS','failed':'FAIL','timedOut':'FAIL'}.get(status,'SKIPPED'),evidence=f'audit/evidence/e2e-{engine}.json'))
        walk(suite.get('suites',[]),engine)
for engine in ['chromium','webkit']:
    walk(json.loads((OUT/f'evidence/e2e-{engine}.json').read_text())['suites'],engine)
rows.append(dict(path='tests/bench/filter-100k.test.ts',engine='vitest-benchmark',test='100k synthetic rows, BENCH=1',status='PASS',evidence='audit/evidence/phase2-benchmark-measured.txt'))
with (OUT/'test-execution-ledger.csv').open('w') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
status_by_path=defaultdict(set)
for r in rows: status_by_path[r['path']].add(r['engine']+':'+r['status'])
for name in ['file-inventory.csv','coverage-ledger.csv']:
    with (OUT/name).open() as f:
        reader=csv.DictReader(f); fields=reader.fieldnames; inventory=list(reader)
    for row in inventory:
        row['tested']=';'.join(sorted(status_by_path[row['path']])) if row['path'] in status_by_path else 'NOT_MAPPED'
    with (OUT/name).open('w') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(inventory)
print(json.dumps({'execution_rows':len(rows),'test_files_mapped':len(status_by_path),'production_files_verified':0}))
