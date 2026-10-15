"""Exercise expansion and missing-asset cases against the reusable builder."""
import copy
import json
from pathlib import Path
from build import load_modules
from guidebook import Guidebook

repo = Path(__file__).resolve().parents[3]
qa = repo / 'output/guidebook/scenarios'
qa.mkdir(parents=True, exist_ok=True)
source = repo / 'docs/guidebook/content/piket.json'
original = load_modules([source], repo)[0]
missing = copy.deepcopy(original)
missing['groups'][0]['tasks'][0]['figures'][0]['path'] = 'output/missing-guidebook-screenshot.png'
bad = qa / 'missing.json'; bad.write_text(json.dumps(missing), encoding='utf-8')
try:
    load_modules([bad], repo)
except FileNotFoundError as error:
    assert 'Missing screenshot' in str(error)
else:
    raise AssertionError('Missing screenshot must fail before authoring')
try:
    load_modules([source, source], repo)
except ValueError as error:
    assert 'Duplicate module ID' in str(error)
else:
    raise AssertionError('Duplicate module IDs must fail')
inserted = copy.deepcopy(original)
inserted['id'] = 'expansion'
inserted['title'] = 'Modul contoh uji ekspansi'
inserted['groups'] = inserted['groups'][:1]
inserted['groups'][0]['tasks'] = inserted['groups'][0]['tasks'][:1]
book = Guidebook(repo)
book.front_matter([inserted, original]); book.introduction()
book.module(inserted); book.module(original); book.general_issues()
book.save(qa / 'expansion.docx')
print('PASS: missing asset and duplicate module rejected; expansion fixture built')
