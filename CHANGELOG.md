# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
