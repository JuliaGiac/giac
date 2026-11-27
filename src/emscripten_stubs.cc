// Definitions an Emscripten build of libgiac needs and does not get elsewhere.
//
// Under EMCC2 the sources expect gettext and giac_gen_renderer from opengl.cc,
// the WebGL renderer of Xcas for the web, which this build does not compile;
// Emscripten's libc has no sigsuspend. Each is reached only on paths that do
// not run in a wasm module: messages are not translated, 3D plots are not
// rendered (2D plots come back as SVG), and the fork-based plot child that
// waits on sigsuspend is never started, as fork fails under Emscripten.
//
// This file is part of the JuliaGiac fork of Giac and, like Giac, is
// distributed under the GNU General Public License, version 3 or later.

#include "giacPCH.h"
#include "giac.h"
#include <cerrno>
#include <csignal>

const char * gettext(const char * s) { return s; }

namespace giac {
  // -1: no renderer, so caseval answers "gl3d -1" for a 3D plot
  int giac_gen_renderer(const gen &, GIAC_CONTEXT) { return -1; }
}

extern "C" int sigsuspend(const sigset_t *) {
  errno = EINTR;
  return -1;
}
