---
title: giac
---

## Giac, by Bernard Parisse and Renée De Graeve

[Giac](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html) is a
free computer algebra system for symbolic and numeric computation, written in
C++. It is developed by **Bernard Parisse** and **Renée De Graeve** at the
[Institut Fourier](https://www-fourier.univ-grenoble-alpes.fr/) (CNRS UMR
5582), Université Grenoble Alpes. Giac is the kernel of
[Xcas](https://xcas.univ-grenoble-alpes.fr/), its graphical interface. It is
released under the GPL, version 3 or later, with a commercial dual license
available on request from the authors.

The authors publish releases, binaries and documentation:

- [Giac/Xcas home page](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html)
- [Xcas project](https://xcas.univ-grenoble-alpes.fr/) and its
  [documentation](https://xcas.univ-grenoble-alpes.fr/documentation/EN.html)
- [Source tarballs](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac/)
- [Xcas forum](https://xcas.univ-grenoble-alpes.fr/forum/), for questions
  about Giac itself

**This site is not the Giac project.** For Giac, start from the links above.

## This repository

[JuliaGiac/giac](https://github.com/JuliaGiac/giac) holds the upstream sources
with a [Meson](https://mesonbuild.com/) build, on the
[`dev`](https://github.com/JuliaGiac/giac/tree/dev) branch. The Meson build
lets [BinaryBuilder](https://binarybuilder.org/) cross-compile libgiac for
every platform Julia supports: the
[GIAC_jll](https://github.com/JuliaPackaging/Yggdrasil/tree/master/G/GIAC)
binaries are built from it. The `main` branch is the original upstream tree.

The Meson build is AI-generated. Fixes to Giac found here are proposed
upstream.

```sh
meson setup builddir
meson compile -C builddir
meson test -C builddir --suite unit
```

Prerequisites, build options and per-platform notes are in
[BUILDING.md](https://github.com/JuliaGiac/giac/blob/dev/BUILDING.md).
Problems with the Meson build go to the
[issue tracker](https://github.com/JuliaGiac/giac/issues).

## Part of JuliaGiac

This repository is one layer of [JuliaGiac](https://juliagiac.github.io/),
which brings Giac to Julia through
[libgiac-julia-wrapper](https://juliagiac.github.io/libgiac-julia-wrapper/)
and [Giac.jl](https://juliagiac.github.io/Giac.jl/).
