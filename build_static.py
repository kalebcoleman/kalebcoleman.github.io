"""Render the existing Flask/Jinja portfolio as a GitHub Pages site."""
import argparse
import shutil
from html import escape
from pathlib import Path
from app import app

ROOT = Path(__file__).resolve().parent
PAGES = ('home', 'projects', 'skills', 'experience', 'contact')
# The site used to be served from /portfolio/. Old links keep working through
# redirect pages under this prefix plus a 404 page that strips it.
LEGACY_PREFIX = 'portfolio'
# Files that were linked directly at their old /portfolio/static/ address (from READMEs
# and the résumé); copies keep those links working without JavaScript.
LEGACY_FILES = ('resume.pdf', 'nau-capstone-poster.pdf')


def redirect_page(url: str) -> str:
    url = escape(url, quote=True)
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Kaleb Coleman</title>'
        f'<meta http-equiv="refresh" content="0; url={url}"><link rel="canonical" href="{url}">'
        f'<a href="{url}">Continue</a></html>'
    )


def not_found_page(base: str) -> str:
    home = escape(f'{base}/', quote=True)
    legacy = f'{base}/{LEGACY_PREFIX}'
    return (
        '<!doctype html><html lang="en"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="robots" content="noindex"><title>Kaleb Coleman | Page not found</title>'
        '<script>(function(){var old=' + repr(legacy) + ';var p=location.pathname;'
        'if(p===old||p.indexOf(old+"/")===0){location.replace(' + repr(base) + '+(p.slice(old.length)||"/")+location.search+location.hash);}})();</script>'
        '<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem">'
        '<h1>Page not found</h1>'
        f'<p>This page does not exist. <a href="{home}">Go to the portfolio home page</a>.</p></body></html>'
    )


def build(output: Path, base: str):
    base = '/' + base.strip('/') if base.strip('/') else ''
    output.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / 'static', output / 'static', dirs_exist_ok=True)
    # Browsers and crawlers ask for /favicon.ico at the site root.
    shutil.copyfile(ROOT / 'static' / 'favicon.ico', output / 'favicon.ico')
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
        target = output / alias / 'index.html'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(redirect_page(static_url(endpoint)), encoding='utf-8')
    if base.strip('/') != LEGACY_PREFIX:
        # Old /portfolio/... page links redirect to the same page at the new root.
        legacy = output / LEGACY_PREFIX
        legacy_targets = {'': f'{base}/', **{f'{page}/': static_url(page) for page in PAGES},
                          **{f'{alias}/': static_url(endpoint) for alias, endpoint in aliases.items()}}
        for path, url in legacy_targets.items():
            target = legacy / path / 'index.html'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(redirect_page(url), encoding='utf-8')
        for name in LEGACY_FILES:
            target = legacy / 'static' / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / 'static' / name, target)
        # Anything else under /portfolio/ (other static files, for example) falls through to
        # 404.html, which forwards the browser to the same path without the prefix.
        (output / '404.html').write_text(not_found_page(base), encoding='utf-8')
    (output / '.nojekyll').touch()
    print(f'Built {output} with base path {base or "/"}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    parser.add_argument('--base-path', default='/', help="URL prefix the site is served from; '/' for kalebcoleman.github.io")
    args = parser.parse_args()
    build(args.output, args.base_path)
