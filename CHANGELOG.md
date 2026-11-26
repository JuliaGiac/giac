# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- The 2.1.0 sync left out upstream's new `src/proba.cc` (covariance and PCA,
  multiple linear regression, Brownian motion and other stochastic
  processes, SDE schemes, Black-Scholes prices and Greeks, Monte Carlo): the
  Meson build now compiles it and installs `proba.h`, and upstream's `proba`
  check runs in the `check` suite. Before, `cov_matrix`, `pca`, `mlr`,
  `bs_price` and the others stayed unevaluated.
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
