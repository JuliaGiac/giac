// The giac-wasm module's own translation unit. It defines nothing: the module
// exports caseval, from libgiac (src/gen.cc), through -sEXPORTED_FUNCTIONS
// (npm/meson.build). Meson needs a source to link an executable.
