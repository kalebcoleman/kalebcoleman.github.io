"""Render the existing Flask/Jinja portfolio as a GitHub Pages site."""
import argparse
import shutil
from html import escape
from pathlib import Path
from app import app

ROOT = Path(__file__).resolve().parent
PAGES = ('home', 'projects', 'skills', 'experience', 'contact')

def build(output: Path, base: str):
    base = '/' + base.strip('/') if base.strip('/') else ''
    output.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'static', output / 'static', dirs_exist_ok=True)
    def static_url(endpoint, **values):
        if endpoint == 'static':
            return f"{base}/static/{values['filename']}" + (f"?v={values['v']}" if 'v' in values else '')
        if endpoint == 'resume':
            return f'{base}/static/resume.pdf'
        if endpoint in PAGES:
            return f'{base}/{endpoint}/'
        raise ValueError(f'Unmapped endpoint: {endpoint}')
    previous = app.jinja_env.globals['url_for']
    app.jinja_env.globals['url_for'] = static_url
    try:
        with app.test_request_context('/'):
            for page in PAGES:
                target = output / page / 'index.html'
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(app.view_functions[page](), encoding='utf-8')
            (output / 'index.html').write_text(app.view_functions['home'](), encoding='utf-8')
    finally:
        app.jinja_env.globals['url_for'] = previous
    aliases = {'1': 'home', '2': 'projects', '3': 'projects', '4': 'experience', '5': 'projects', 'resume': 'resume'}
    for alias, endpoint in aliases.items():
        url = escape(static_url(endpoint), quote=True)
        target = output / alias / 'index.html'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><title>Kaleb Coleman</title><meta http-equiv="refresh" content="0; url={url}"><link rel="canonical" href="{url}"><a href="{url}">Continue</a></html>')
    (output / '.nojekyll').touch()
    print(f'Built {output} with base path {base or "/"}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    parser.add_argument('--base-path', default='/portfolio')
    args = parser.parse_args()
    build(args.output, args.base_path)
