# giac-wasm: libgiac linked into an ES module, giac.mjs and giac.wasm, which
# npm/src/index.mjs loads. Built with `just wasm` (npm/scripts/build.sh).

giac_wasm_pre_js = files('src/pre.js')

executable('giac',
  files('src/main.cc'),
  dependencies: libgiac_dep,
  name_suffix: 'mjs',
  link_depends: giac_wasm_pre_js,
  link_args: [
    '-Oz', '-fwasm-exceptions',
    # caseval is GIAC's text-in, text-out entry point (src/gen.cc)
    '-sEXPORTED_FUNCTIONS=_caseval',
    '-sEXPORTED_RUNTIME_METHODS=cwrap',
    # a factory function, `createGiacModule`, exported by an ES module
    '-sMODULARIZE=1', '-sEXPORT_ES6=1', '-sEXPORT_NAME=createGiacModule',
    '-sENVIRONMENT=web,worker,node',
    '-sALLOW_MEMORY_GROWTH=1', '-sINITIAL_MEMORY=64MB',
    # GIAC recurses deeply (parser, evaluator, polynomial arithmetic)
    '-sSTACK_SIZE=8MB',
    '--pre-js', meson.current_source_dir() / 'src' / 'pre.js',
  ],
  install: false,
)
