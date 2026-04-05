#!/bin/bash
# Minify shared assets and push to GitHub Pages
set -e

cd "$(dirname "$0")"

echo "Minifying CSS..."
npx clean-css-cli astral-rift/assets/shared.css -o astral-rift/assets/shared.min.css

echo "Minifying JS..."
npx terser astral-rift/assets/shared.js -o astral-rift/assets/shared.min.js -c -m

echo "CSS: $(wc -c < astral-rift/assets/shared.css | tr -d ' ')B → $(wc -c < astral-rift/assets/shared.min.css | tr -d ' ')B"
echo "JS:  $(wc -c < astral-rift/assets/shared.js | tr -d ' ')B → $(wc -c < astral-rift/assets/shared.min.js | tr -d ' ')B"

git add -A
git status --short

echo ""
read -p "Commit message: " msg
git commit -m "$msg

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push

echo "Done."
