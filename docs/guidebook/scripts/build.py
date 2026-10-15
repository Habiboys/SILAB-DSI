"""Build a guidebook from role/task module data without accessing application data."""
import argparse
import json
from pathlib import Path
from guidebook import Guidebook


def load_modules(paths, root):
    modules = []
    ids = set()
    for path in paths:
        data = json.loads(Path(path).read_text(encoding='utf-8'))
        for key in ['id', 'title', 'introduction', 'flow', 'prerequisites', 'access', 'groups', 'issues', 'evidence', 'limitations']:
            if not data.get(key): raise ValueError(f'{path}: missing {key}')
        if data['id'] in ids: raise ValueError('Duplicate module ID: ' + data['id'])
        ids.add(data['id'])
        task_ids = set(); figure_ids = set()
        for group in data['groups']:
            for task in group['tasks']:
                for key in ['id', 'title', 'summary', 'before', 'steps', 'success']:
                    if not task.get(key): raise ValueError(f'{path}: task missing {key}')
                if task['id'] in task_ids: raise ValueError('Duplicate task ID: ' + task['id'])
                task_ids.add(task['id'])
                for fig in task.get('figures', []):
                    if fig['id'] in figure_ids: raise ValueError('Duplicate figure ID: ' + fig['id'])
                    figure_ids.add(fig['id'])
                    if not 1 <= fig['after_step'] <= len(task['steps']): raise ValueError('Invalid after_step: ' + fig['id'])
                    if not (root / fig['path']).is_file(): raise FileNotFoundError('Missing screenshot: ' + fig['path'])
        modules.append(data)
    for path in ['public/images/lab.png', 'public/images/silab2.png', 'output/absensi-piket/login.png']:
        if not (root / path).is_file(): raise FileNotFoundError('Missing shared asset: ' + path)
    return modules


def main():
    repo = Path(__file__).resolve().parents[3]
    parser = argparse.ArgumentParser()
    parser.add_argument('--modules', nargs='+', type=Path, default=[repo / 'docs/guidebook/content/piket.json', repo / 'docs/guidebook/content/inventaris.json', repo / 'docs/guidebook/content/keuangan.json', repo / 'docs/guidebook/content/praktikum.json', repo / 'docs/guidebook/content/kepengurusan.json', repo / 'docs/guidebook/content/kuesioner.json'])
    parser.add_argument('--output', type=Path, default=repo / 'output/guidebook/Panduan SILAB sampai Modul Kuesioner.docx')
    parser.add_argument('--assets-root', type=Path, default=repo)
    args = parser.parse_args()
    modules = load_modules(args.modules, args.assets_root)
    book = Guidebook(args.assets_root)
    book.front_matter(modules)
    book.introduction()
    for data in modules: book.module(data)
    book.general_issues()
    book.save(args.output)
    print(args.output)


if __name__ == '__main__': main()
