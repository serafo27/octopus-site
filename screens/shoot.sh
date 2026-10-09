#!/bin/sh
# Screenshots of Octopus's real UI with the demo workspace, into docs/assets/screens/.
# Needs ../octopus with its node_modules, and Google Chrome. From octopus-site: sh screens/shoot.sh [scene…]
set -e
cd "$(dirname "$0")/.."
OCTOPUS_DIR=${OCTOPUS_DIR:-../octopus}
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
ln -sfn "$(cd "$OCTOPUS_DIR" && pwd)/node_modules" screens/node_modules
node "$OCTOPUS_DIR/node_modules/vite/bin/vite.js" --config screens/vite.config.mjs &
VITE=$!
trap 'kill $VITE' EXIT
until curl -s localhost:1430 >/dev/null; do sleep 1; done
mkdir -p screens/out
# Warm-up: Vite discovers the lazily loaded editors' dependencies on first use and reloads the page
# to bundle them, which would leave a scene half drawn. Load each scene once before shooting.
for scene in ${*:-git notebook database docs extensions}; do
  "$CHROME" --headless=new --virtual-time-budget=10000 --dump-dom "http://localhost:1430/?scene=$scene" >/dev/null 2>&1
done
SCENES=${*:-"board task terminals docs git notebook database sessions otherapps extensions priorities"}
for scene in $SCENES; do
  "$CHROME" --headless=new --hide-scrollbars --run-all-compositor-stages-before-draw --window-size=1440,900 --force-device-scale-factor=2 \
    --virtual-time-budget=25000 --screenshot="screens/out/$scene.png" "http://localhost:1430/?scene=$scene" 2>/dev/null
  echo "screens/out/$scene.png"
done

# For the site: every scene whole, and the crops the sections show (screens/crop.py).
python3 screens/crop.py
du -ch docs/assets/screens/*.webp | tail -1
