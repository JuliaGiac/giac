// Prepended to giac.mjs by Emscripten (--pre-js), inside the module's scope.
//
// The EMCC2 sources read a global `UI` object, the interface of Xcas for the
// web. This one, local to the module, keeps a page's own `UI` untouched and
// sets what a library wants:
// - add_evalf: 0, results are not followed by "=" and their approximation;
// - disable3d: -1, a 3D plot answers "gl3d_not_supported" (no WebGL renderer);
// - js_bigint: 0, integers come back as text;
// - Datestart: the origin of GIAC's millisecond clock.
var UI = { add_evalf: 0, disable3d: -1, js_bigint: 0, Datestart: Date.now() };
