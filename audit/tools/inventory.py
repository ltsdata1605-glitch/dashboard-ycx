"""Filesystem census: enumerate every entry, never follow symlinks, hash scoped files."""
import csv
import hashlib
import json
import os
from pathlib import Path
import subprocess
from collections import Counter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'audit'
OUTPUTS = ['file-inventory.csv', 'directory-inventory.csv', 'excluded-files.csv',
           'module-inventory.csv', 'coverage-ledger.csv', 'checkpoint-reconciliation.csv',
           'reconciliation.json', 'scan-input.json']


def write_csv(name, rows, fields):
    with (OUT / name).open('w', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)


def excluded(path):
    parts = Path(path).parts
    if parts[0] == '.git': return 'Git object database / metadata; not application source'
    if parts[:2] == ('.claude', 'worktrees'): return 'Other worktree snapshot; separate checkout, not current workspace source'
    if 'node_modules' in parts: return 'Third-party installed dependencies; inspect manifests instead'
    if parts[0] in ['archive', '_archive']: return 'Historical backup/checkpoint; not active source'
    if parts[0] == '.e2e-chrome-profile': return 'Private authenticated browser profile; metadata only'
    if parts[0] in ['dist', 'dist-ssr', 'test-results', 'playwright-report', 'blob-report', '.ui-baseline', '.anh-apple', '.playwright-mcp', '.firebase']:
        return 'Generated build/cache/test output; not source-review denominator'
    if parts[:2] == ('functions', 'lib'): return 'Compiled Cloud Functions output; source is functions/src'
    if parts[0] == 'audit' and (len(parts) < 2 or parts[1] != 'tools'):
        return 'Audit evidence/derived ledger; enumerated, hash omitted to avoid self-reference'
    if Path(path).name.startswith('.env') or Path(path).suffix in ['.pem', '.key'] or path == '.claude/settings.local.json':
        return 'Private local configuration; contents not read or published'
    if '__pycache__' in parts or Path(path).suffix in ['.pyc', '.tsbuildinfo']: return 'Generated compiler cache'
    if Path(path).name == '.DS_Store': return 'OS metadata'
    if Path(path).suffix == '.log': return 'Generated diagnostic log; not source, may contain private data'
    if parts[0] == 'scratch' and Path(path).suffix.lower() in ['.png','.jpg','.jpeg','.webp']:
        return 'Local screenshot artifact; not active application asset'
    return ''


def module(path):
    parts = Path(path).parts
    if len(parts) > 1 and parts[0] == 'features': return '/'.join(parts[:2])
    if path.startswith('components/shared/'): return 'components/shared'
    return parts[0] if len(parts) > 1 else 'root'


def category(path, reason):
    p = Path(path)
    if 'dependencies' in reason: return 'DEPENDENCY'
    if 'backup' in reason or 'worktree snapshot' in reason: return 'BACKUP'
    if 'Private' in reason: return 'SECRET_CONFIG'
    if reason: return 'GENERATED'
    if p.suffix in ['.md', '.txt', '.rst']: return 'DOCUMENTATION'
    if '.test.' in path or '.spec.' in path or path.startswith('tests/'): return 'TEST'
    if p.suffix in ['.css', '.scss']: return 'STYLE'
    if p.suffix in ['.json', '.yaml', '.yml', '.toml', '.rules'] or 'config.' in p.name or p.name.startswith('.'): return 'CONFIG'
    if 'scripts' in p.parts or p.suffix in ['.sh', '.py', '.cjs']: return 'SCRIPT'
    if p.suffix in ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html']: return 'SOURCE'
    if p.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.ttf', '.woff', '.woff2', '.mp4', '.pdf', '.gif']: return 'ASSET'
    return 'OTHER'


def enumerate_tree():
    files, dirs, errors = [], [], []
    def visit(directory):
        try:
            entries = sorted(os.scandir(directory), key=lambda e: e.name)
        except OSError as error:
            errors.append({'path':str(Path(directory).relative_to(ROOT)), 'error':str(error)})
            return
        for entry in entries:
            rel = str(Path(entry.path).relative_to(ROOT))
            if entry.is_dir(follow_symlinks=False):
                dirs.append(rel)
                visit(entry.path)
            else:
                files.append(rel)
    visit(ROOT)
    return files, dirs, errors


def main():
    for name in OUTPUTS:
        (OUT / name).touch(exist_ok=True)
    files, dirs, errors = enumerate_tree()
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0'))
    ignored_result = subprocess.run(['git', 'check-ignore', '--stdin', '-z'], cwd=ROOT,
                                    input=('\0'.join(files)+'\0').encode(), stdout=subprocess.PIPE)
    assert ignored_result.returncode in [0, 1]
    ignored = set(ignored_result.stdout.decode().split('\0'))
    old = {r['path']:r for r in csv.DictReader((OUT/'phase-0-read-ledger.csv').open())}
    rows = []
    for path in files:
        p = ROOT / path
        reason = excluded(path)
        try:
            stat = p.lstat()
            kind = 'SYMLINK' if p.is_symlink() else 'FILE'
            digest = ''
            if not reason:
                data = os.readlink(p).encode() if p.is_symlink() else p.read_bytes()
                digest = hashlib.sha256(data).hexdigest()
            reviewed = path in old and digest == old[path]['sha256']
            rows.append(dict(path=path, type=category(path, reason), kind=kind, size=stat.st_size,
                sha256=digest, module=module(path), purpose='By path/type; detailed intent review pending',
                entry_point_relationship='See entry-point-inventory.csv', import_export_relationship='See dependency-edges.csv / exports.csv',
                review_method='Phase 0 rules/config read' if reviewed else 'Enumeration; AST where supported; no deep review',
                audit_status='NOT_APPLICABLE' if reason else 'INVENTORIED',
                inventoried='YES', reviewed='PREFLIGHT_ONLY' if reviewed else 'NO', tested='NOT_MAPPED', verified='NO',
                findings='', change_status='UNASSESSED', verification_status='NOT_VERIFIED',
                git_state='TRACKED' if path in tracked else ('IGNORED' if path in ignored else 'UNTRACKED'),
                scope='EXCLUDED' if reason else 'INCLUDED', exclusion_reason=reason,
                notes=('Link target: '+os.readlink(p)+'; not traversed') if p.is_symlink() else ''))
        except OSError as error:
            errors.append({'path':path,'error':str(error)})
    fields=list(rows[0])
    write_csv('file-inventory.csv', rows, fields)
    write_csv('excluded-files.csv', [r for r in rows if r['scope']=='EXCLUDED'], ['path','type','size','exclusion_reason'])
    write_csv('coverage-ledger.csv', rows, ['path','scope','inventoried','reviewed','tested','verified','sha256','review_method'])
    write_csv('directory-inventory.csv', [dict(path=d,module=module(d+'/'),scope='EXCLUDED' if excluded(d) else 'INCLUDED',reason=excluded(d)) for d in dirs], ['path','module','scope','reason'])
    counts=Counter(r['module'] for r in rows if r['scope']=='INCLUDED')
    write_csv('module-inventory.csv', [dict(module=m,files=n,status='INVENTORIED',reviewed='NO',tested='NOT_MAPPED',verified='NO') for m,n in sorted(counts.items())], ['module','files','status','reviewed','tested','verified'])
    checkpoint=json.loads((OUT/'checkpoint.json').read_text())
    original=json.loads((Path(checkpoint['path'])/'manifest.json').read_text())
    reconciled=[]
    for item in original:
        p=ROOT/item['path']
        digest=hashlib.sha256(os.readlink(p).encode() if p.is_symlink() else p.read_bytes()).hexdigest() if p.exists() or p.is_symlink() else ''
        reconciled.append(dict(path=item['path'],before_sha256=item['sha256'],current_sha256=digest,status='UNCHANGED' if digest==item['sha256'] else ('MISSING' if not digest else 'CHANGED')))
    original_paths={r['path'] for r in original}
    for row in rows:
        if row['path'] not in original_paths:
            reconciled.append(dict(path=row['path'],before_sha256='',current_sha256=row['sha256'],status='ADDED_SINCE_CHECKPOINT' if row['scope']=='INCLUDED' or row['path'].startswith('audit/') else 'OUTSIDE_CHECKPOINT_SCOPE'))
    write_csv('checkpoint-reconciliation.csv',reconciled,['path','before_sha256','current_sha256','status'])
    again, dirs_again, errors_again=enumerate_tree()
    summary=dict(head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip(),
        total_files=len(files),total_directories=len(dirs),included_files=sum(r['scope']=='INCLUDED' for r in rows),excluded_files=sum(r['scope']=='EXCLUDED' for r in rows),
        checkpoint_entries=len(original),checkpoint_status=dict(Counter(r['status'] for r in reconciled)),
        paths_missing_from_ledger=sorted(set(files)-{r['path'] for r in rows}),
        paths_added_during_scan=sorted(set(again)-set(files)),paths_removed_during_scan=sorted(set(files)-set(again)),
        directories_changed=sorted(set(dirs)^set(dirs_again)),errors=errors+errors_again,
        included_by_type=dict(Counter(r['type'] for r in rows if r['scope']=='INCLUDED')))
    summary['file_reconciliation_pass']=not any(summary[k] for k in ['paths_missing_from_ledger','paths_added_during_scan','paths_removed_during_scan','directories_changed','errors'])
    summary['checkpoint_unchanged']=all(r['status']=='UNCHANGED' for r in reconciled[:len(original)])
    (OUT/'scan-input.json').write_text(json.dumps([r for r in rows if r['scope']=='INCLUDED'],ensure_ascii=False,indent=2)+'\n')
    (OUT/'reconciliation.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))


if __name__=='__main__': main()
