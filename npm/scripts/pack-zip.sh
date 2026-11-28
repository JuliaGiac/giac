#!/usr/bin/env bash
# Pack giac-wasm, built by build.sh, into npm/giac-wasm-<version>.zip: the
# package's files in a giac-wasm-<version>/ folder, the same layout as the
# npm tarball, for downloading or serving from any web server (the
# s-celles/giac-wasm Pages serve each release this way).
set -euo pipefail

NPM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$NPM_DIR"

for f in dist/giac.mjs dist/giac.wasm LICENSE; do
  [ -f "$f" ] || { echo "$f is missing: run build.sh (just wasm) first" >&2; exit 1; }
done

VERSION="$(node -p "require('./package.json').version")"
NAME="giac-wasm-$VERSION"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# the files package.json lists, plus package.json itself
node -e "for (const f of require('./package.json').files) console.log(f)" |
  while read -r f; do
    mkdir -p "$STAGE/$NAME/$(dirname "$f")"
    cp "$f" "$STAGE/$NAME/$f"
  done
cp package.json "$STAGE/$NAME/"

rm -f "$NPM_DIR/$NAME.zip"
(cd "$STAGE" && zip -qr -X "$NPM_DIR/$NAME.zip" "$NAME")
echo "$NPM_DIR/$NAME.zip"
