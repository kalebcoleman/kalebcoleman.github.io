#!/usr/bin/env bash
# Render resume/resume.html to static/resume.pdf with headless Chrome (needs the Carlito font installed).
set -euo pipefail
cd "$(dirname "$0")"
chrome="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"
"$chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=../static/resume.pdf "file://$PWD/resume.html"
