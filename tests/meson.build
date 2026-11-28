# ── Unit tests (link against libgiac, no GUI needed) ──────────────────────────

test_deps = [libgiac_dep]

# On MSYS2/MinGW, printf/fprintf redirect through libintl
if host_machine.system() == 'windows'
  intl_test_dep = cc.find_library('intl', required: false)
  if intl_test_dep.found()
    test_deps += intl_test_dep
  endif
endif

test_caseval = executable('test_caseval',
  'test_caseval.cc',
  include_directories: [giac_inc, config_inc],
  dependencies: test_deps,
  cpp_args: giac_common_args,
)

test('caseval', test_caseval, suite: 'unit', timeout: 60)

# Regression test for JuliaGiac/giac#4 (series_flags left set by a failed
# limit or series)
test_series_flags = executable('test_series_flags',
  'test_series_flags.cc',
  include_directories: [giac_inc, config_inc],
  dependencies: test_deps,
  cpp_args: giac_common_args,
)

test('series_flags', test_series_flags, suite: 'unit', timeout: 60)

# Regression test: the same integral must be right on every call (CASbench
# case F 14, wrong from the second call on with GIAC_TYPE_ON_8BITS)
test_integrate_repeat = executable('test_integrate_repeat',
  'test_integrate_repeat.cc',
  include_directories: [giac_inc, config_inc],
  dependencies: test_deps,
  cpp_args: giac_common_args,
)

test('integrate_repeat', test_integrate_repeat, suite: 'unit', timeout: 60)

# The tolerant comparison used by the checks in approx_checks (src/meson.build)
test_parse_error_line = executable('test_parse_error_line',
  'test_parse_error_line.cc',
  include_directories: [giac_inc, config_inc],
  dependencies: test_deps,
  cpp_args: giac_common_args,
)

test('parse_error_line', test_parse_error_line, suite: 'unit', timeout: 60)

test_svg_attributes = executable('test_svg_attributes',
  'test_svg_attributes.cc',
  include_directories: [giac_inc, config_inc],
  dependencies: test_deps,
  cpp_args: giac_common_args,
)

test('svg_attributes', test_svg_attributes, suite: 'unit', timeout: 60)

test_mathml_divide = executable('test_mathml_divide',
  'test_mathml_divide.cc',
  include_directories: [giac_inc, config_inc],
  dependencies: test_deps,
  cpp_args: giac_common_args,
)

test('mathml_divide', test_mathml_divide, suite: 'unit', timeout: 60)

test('numdiff', check_python, args: [numdiff, '--self-test'], suite: 'unit', timeout: 30)
