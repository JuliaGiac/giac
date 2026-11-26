# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
