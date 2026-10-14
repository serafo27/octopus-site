#!/bin/sh
# The site's social preview: screens/og.html → docs/assets/og.png (1200×630). From octopus-site: sh screens/og.sh
set -eu
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
here=$(cd "$(dirname "$0")" && pwd)
"$CHROME" --headless=new --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=5000 \
  --window-size=1200,630 --screenshot="$here/../docs/assets/og.png" "file://$here/og.html" >/dev/null 2>&1
echo "docs/assets/og.png"
