# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **giac-wasm, an npm package of Giac compiled to WebAssembly** (`npm/`),
  for browsers, Web Workers and Node.js, with nothing to compile at install:
  `loadGiac()` resolves to a session with `eval(input)` (the result as text,
  a `GiacError` on a GIAC error), `evalWithMessages(input)` (GIAC's
  messages apart from the result), `setTimeout(seconds)` (GIAC's time
  limit, 15 s by default) and `version`; TypeScript types included. Built
  with the Meson build and Emscripten by `just wasm` (GMP 6.3.0 and MPFR
  4.2.2, no other optional library), tested by `just wasm-test` and in CI
  (job "WebAssembly"), packed by `just wasm-pack`: 3.3 MB, 9.4 MB unpacked.
  2D plots come back as SVG; 3D plots are not supported.
- **giac-wasm releases**: a tag `giac-wasm-vX.Y.Z` builds, tests and publishes
  a GitHub Release with the npm tarball (installable by URL, without the npm
  registry), a zip of the same files and their SHA-256 sums
  (`wasm-release.yml`; `just wasm-pack` makes both archives).

### Fixed
- **Plots are well-formed SVG.** `src/mathml.cc` wrote the attribute after
  `baseProfile="tiny"` in the SVG header, and `stroke` after the `y2` of each
  grid line, without a space (`y2="1.1"stroke="cyan"`). Browsers read it as
  HTML, but an `<img>` of it or any XML tool rejected it. The spaces are back
  (the commented-out stream code had them). `tests/test_svg_attributes.cc`
  checks the SVG of ten kinds of plots.
- **Content MathML writes `<divide/>` with two operands.** `export_mathml`
  wrote a product with several factors in its numerator or denominator as one
  `<divide/>` of all of them: `(a/b)/c`, which GIAC holds as `a*inv(b)*inv(c)`,
  became `<divide/> a b c`, which MathML forbids (4.4.3.3: divide is binary)
  and readers refuse. A side with several factors is now their `<times/>`:
  `divide(a, times(b, c))`. `tests/test_mathml_divide.cc` checks eight cases
  (reported by the OpenMath.jl session: 62 of 1455 exported OSR expressions
  had such a divide).
- **A syntax error no longer quotes freed memory.** `set_lexer_string`
  (`src/input_lexer.ll`) pointed `currently_scanned` at a local string,
  destroyed when it returned, before the parse ran; the message
  `syntax error … at ; in <line>` then quoted whatever the allocator had left
  there, often bytes that are not UTF-8, and could crash. The scanned text now
  lives, per thread, as long as its scanner. `tests/test_parse_error_line.cc`
  checks that the message quotes the input line (the same change is in the
  generated `src/input_lexer.cc`).
- **The Emscripten build** (`cross/emscripten-wasm32.ini`) compiles and
  links. Under Emscripten libgiac is static only, without pthreads and with
  `HAVE_PTHREAD_H` undefined (`src/global.cc` declares `fork_mutex` under
  `HAVE_LIBPTHREAD` but locks it under `HAVE_PTHREAD_H`), and
  `src/emscripten_stubs.cc` defines `gettext`, `giac_gen_renderer` and
  `sigsuspend`, which the `EMCC2` sources expect from the Xcas web renderer
  and from libc. `src/graphe.cc` includes `<iterator>` for `std::inserter`
  (libc++ does not bring it in). The `EMCC2` code of `src/gen.cc` (SVG width)
  and `src/mathml.cc` no longer reads `window` where there is none (Node.js,
  Web Workers).
- Builds against PARI 2.19: `src/optimization.cc` writes `std::bitset`, since
  PARI 2.19's `paridecl.h` declares a C function `bitset(GEN, long)` that made
  the unqualified `bitset<32>` ambiguous under `using namespace std`.
- The 2.1.0 sync left out upstream's new `src/proba.cc` (covariance and PCA,
  multiple linear regression, Brownian motion and other stochastic
  processes, SDE schemes, Black-Scholes prices and Greeks, Monte Carlo): the
  Meson build now compiles it and installs `proba.h`, and upstream's `proba`
  check runs in the `check` suite. Before, `cov_matrix`, `pca`, `mlr`,
  `bs_price` and the others stayed unevaluated.
  Its decimal numbers are compared within a relative 1e-10
  (`tests/numdiff.py`): on macOS, Accelerate prints two `mlr` residuals with
  a different 12th digit than OpenBLAS does.
- The 2.1.0 sync brought back ten `micropython-1.12/ports/unix/` files that
  upstream kept while removing the rest of the directory; they are removed
  again (MicroPython is the `micropython` submodule).

### Changed
- **Based on upstream giac 2.1.0** (Bernard Parisse, published 2026-11-24),
  instead of 2.0.0: `main` holds the upstream tree (tags `upstream/2.0.0`,
  `upstream/2.1.0`) and was merged into `dev`. The Meson project version is
  now 2.1.0, so `version()` reports `giac 2.1.0`. Files `dev` does not carry
  (autotools build, platform packaging scripts, the Xcas GUI sources,
  `micropython-1.12/`, provided as a submodule) stay removed.
  `check/geo.out` takes 2.1.0's simpler results in this fork's output
  conventions (English names, display attributes and `a/(b*c)` printing of
  this build).

### Added
- `doubleval` Meson option (experimental, off by default): defines `DOUBLEVAL`
  in `config.h` so `gen` stores full 53-bit doubles instead of the 48 mantissa
  bits it keeps on 64-bit little-endian CPUs, where the low bits of an inline
  double hold the type tag. `first.h` no longer defines `SMARTPTR64` when
  `DOUBLEVAL` is set: the two layouts cannot be combined (see `src/gen.h`).
  Not usable on x86_64 yet: `icas` crashes in `check/testintegrate`, and
  `check/testcas` prints some complex results in polar form. `BUILDING.md` documents the precision
  of doubles, the option and these failures, with the commands to reproduce
  them.
- Web site at <https://juliagiac.github.io/giac/> (Hugo, in `site/`),
  presenting the upstream Giac/Xcas project by Bernard Parisse and Renée De
  Graeve and what this repository adds. Published from `dev` by
  `.github/workflows/pages.yml`; `just site-serve` and `just site-build`
  preview and build it locally.
  The site carries the JuliaGiac mark and favicon, and its title links to
  the site's own home page.

### Fixed
- **The same integral is right on every call again.** The gen type was
  stored on 8 bits (`GIAC_TYPE_ON_8BITS`, commit 64fdcef) to work around a
  Windows ABI mismatch between GIAC_jll and libgiac_julia_jll. That broke
  exact results on every platform: `integrate(1/(1-x^4+x^8),x)` was right on
  the first call and returned a wrong antiderivative on every later call
  (CASbench case F 14). The type is back on 5 bits, as upstream, which also
  gives doubles stored inside a gen back 3 mantissa bits (48 instead of 45).
  Regression test: `tests/test_integrate_repeat.cc`. The Windows ABI mismatch
  comes back and is to be fixed where it arises (same compiler for both
  libraries, or not reading the bitfield from the wrapper).
- A `limit` or `series` that fails with an error no longer leaves bit 3 of
  `series_flags` set for the rest of the session
  ([JuliaGiac/giac#4](https://github.com/JuliaGiac/giac/issues/4)). Both
  functions set the bit while they run, but restored the flags only on the
  normal return path. With the bit left set, `atan` stopped rewriting its
  argument through `tan`, so `simplify(180*acot(cot(pi/90))/pi-2)` no longer
  gave `0` after, e.g., `limit(x^(b+1)/(b+1)*ln(x),x,0,1)`,
  `integrate(x^b*ln(x),x,0,1)` or `series(floor(x),x,0,2)`. The flags are now
  restored before the error is rethrown. `limit` uses the fix planned
  upstream; `series` gets the same treatment. Regression test:
  `tests/test_series_flags.cc`.

## [0.2.2] - 2000-12

### Added
- Limit/series (MRV algorithm)
- Factorization over Z[i] and over algebraic extensions

## [0.2.1] - 2000-10-20

### Changed
- GNUified the build environment (autoconf/automake)

## [0.2] - 2000-09-22

### Added
- Optional support for NTL

## [0.1] - 2000-08-23

### Added
- Initial release
