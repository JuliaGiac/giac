#!/usr/bin/env bash
# Build giac-wasm: GMP and MPFR for wasm32, then libgiac and the ES module
# with Meson, into npm/dist/ (giac.mjs, giac.wasm).
#
# Needs Emscripten's emcc on PATH (source emsdk_env.sh first), and curl,
# make, pkg-config, meson and ninja.
#
# Environment:
#   BUILD_DIR  Meson build directory (default: builddir-wasm)
#   DEPS_DIR   where GMP and MPFR are downloaded, built and installed
#              (default: builddir-wasm-deps); kept between builds
#   JOBS       parallel jobs (default: number of CPUs)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$ROOT/builddir-wasm}"
DEPS_DIR="${DEPS_DIR:-$ROOT/builddir-wasm-deps}"
JOBS="${JOBS:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}"
PREFIX="$DEPS_DIR/prefix"

GMP_VERSION=6.3.0
GMP_SHA256=a3c2b80201b89e68616f4ad30bc66aee4927c3ce50e33929ca819d5c43538898
MPFR_VERSION=4.2.2
MPFR_SHA256=b67ba0383ef7e8a8563734e2e889ef5ec3c3b898a01d00fa0a6869ad81c6ce01

# Same flags as cross/emscripten-wasm32.ini, so C++ exceptions cross the libraries
WASM_CFLAGS="-Oz -fwasm-exceptions"

command -v emcc >/dev/null || { echo "emcc not found: source emsdk_env.sh first" >&2; exit 1; }
echo "Emscripten: $(emcc --version | head -n 1)"

sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }

# fetch NAME URL SHA256: download a tarball once, check it, unpack it
fetch() {
  local name="$1" url="$2" sum="$3" tarball="$DEPS_DIR/$(basename "$2")"
  mkdir -p "$DEPS_DIR"
  [ -f "$tarball" ] || curl -fsSL -o "$tarball" "$url"
  if [ "$(sha256 "$tarball")" != "$sum" ]; then
    echo "checksum mismatch for $tarball" >&2; rm -f "$tarball"; exit 1
  fi
  rm -rf "$DEPS_DIR/$name"
  tar -xf "$tarball" -C "$DEPS_DIR"
}

if [ ! -f "$PREFIX/lib/libgmp.a" ]; then
  echo "=== GMP $GMP_VERSION for wasm32 ==="
  fetch "gmp-$GMP_VERSION" "https://ftp.gnu.org/gnu/gmp/gmp-$GMP_VERSION.tar.xz" "$GMP_SHA256"
  (cd "$DEPS_DIR/gmp-$GMP_VERSION" &&
    emconfigure ./configure --host=none --disable-assembly --enable-cxx \
      --disable-shared --enable-static --prefix="$PREFIX" ABI=standard \
      CFLAGS="$WASM_CFLAGS" CXXFLAGS="$WASM_CFLAGS" >configure.log &&
    emmake make -j"$JOBS" >make.log && emmake make install >install.log)
fi

if [ ! -f "$PREFIX/lib/libmpfr.a" ]; then
  echo "=== MPFR $MPFR_VERSION for wasm32 ==="
  fetch "mpfr-$MPFR_VERSION" "https://ftp.gnu.org/gnu/mpfr/mpfr-$MPFR_VERSION.tar.xz" "$MPFR_SHA256"
  (cd "$DEPS_DIR/mpfr-$MPFR_VERSION" &&
    emconfigure ./configure --host=none --disable-shared --enable-static \
      --with-gmp="$PREFIX" --prefix="$PREFIX" CFLAGS="$WASM_CFLAGS" >configure.log &&
    emmake make -j"$JOBS" >make.log && emmake make install >install.log)
fi

# A second cross file pointing Meson at the wasm GMP and MPFR
LOCAL_INI="$DEPS_DIR/wasm-deps.ini"
cat >"$LOCAL_INI" <<EOF
[binaries]
pkg-config = '$(command -v pkg-config)'

[properties]
pkg_config_libdir = ['$PREFIX/lib/pkgconfig']
EOF

if [ ! -f "$BUILD_DIR/build.ninja" ]; then
  echo "=== Configure libgiac for wasm32 ==="
  # Only GMP and MPFR: every optional library is off
  meson setup "$BUILD_DIR" "$ROOT" --buildtype=minsize \
    --cross-file "$ROOT/cross/emscripten-wasm32.ini" --cross-file "$LOCAL_INI" \
    -Dgui=disabled -Djni=disabled -Dpari=disabled -Dntl=disabled -Dcocoa=disabled \
    -Dgsl=disabled -Dlapack=disabled -Decm=disabled -Dglpk=disabled -Dpng=disabled \
    -Dao=disabled -Dsamplerate=disabled -Dcurl=disabled -Dreadline=disabled \
    -Dgettext=disabled -Ddl=disabled -Dquickjs=disabled -Dlibbf=disabled \
    -Dmicropython=disabled
fi

echo "=== Build the giac-wasm module ==="
# ninja builds the module by its output file: the target shares its name, giac,
# with libgiac
ninja -C "$BUILD_DIR" -j "$JOBS" npm/giac.mjs

mkdir -p "$ROOT/npm/dist"
cp "$BUILD_DIR/npm/giac.mjs" "$BUILD_DIR/npm/giac.wasm" "$ROOT/npm/dist/"
cp "$ROOT/COPYING" "$ROOT/npm/LICENSE"
ls -l "$ROOT/npm/dist"
