"""Run reviewed local quality gates, preserve logs and each exit code."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import subprocess
import sys
import time
import datetime
import fcntl

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'audit'
COMMANDS = {
    'typecheck': ['npm', 'run', 'typecheck'],
    'typecheck-functions': ['npm', 'run', 'typecheck:functions'],
    'eslint': ['npm', 'run', 'lint:eslint'],
    'ratchet': ['npm', 'run', 'lint:ratchet:ci'],
    'unit': ['npm', 'run', 'test:unit', '--', '--reporter=default', '--reporter=json', '--outputFile=audit/evidence/unit-results.json'],
    'build': ['npm', 'run', 'build'],
    'build-functions': ['npm', 'run', 'build', '--prefix', 'functions'],
    'budget': ['npm', 'run', 'check:budget'],
}


def run(name):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tick = time.monotonic()
    log = OUT / 'evidence' / ('phase2-' + name + '.txt')
    with log.open('w') as stream:
        result = subprocess.run(COMMANDS[name], cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT)
    return dict(name=name, command=COMMANDS[name], started_utc=started,
                exit_code=result.returncode, status='PASS' if result.returncode == 0 else 'FAIL',
                seconds=round(time.monotonic()-tick, 2), log=str(log.relative_to(ROOT)))


if __name__ == '__main__':
    names = sys.argv[1:]
    assert names and all(n in COMMANDS for n in names)
    results_path = OUT / 'phase-2-results.json'
    with ThreadPoolExecutor(max_workers=2) as pool:
        for result in pool.map(run, names):
            with results_path.open('r+') as stream:
                fcntl.flock(stream, fcntl.LOCK_EX)
                results = json.load(stream)
                results.append(result)
                stream.seek(0)
                json.dump(results, stream, indent=2)
                stream.write('\n')
                stream.truncate()
            print(json.dumps(result), flush=True)
