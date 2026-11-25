// Regression test for JuliaGiac/giac#4: a limit or series that fails with
// an error must not leave bit 3 of series_flags set.
//
// limit() and series() set bit 3 (atan does not rewrite its argument
// through tan) for the duration of the computation. When the computation
// threw, the flags were not restored, so for the rest of the session
// acot(cot(pi/90)) stopped simplifying: simplify(180*a/pi-2) no longer
// gave 0.
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include "giac.h"
// On MinGW, libintl.h (pulled in via giacintl.h) redefines fprintf/printf
// as macros; undefine them before including <cstdio>.
#undef fprintf
#undef printf
#include <cstdio>
#include <string>

using namespace giac;

// Evaluate s in ctx, swallowing any error: the failure is the point.
static void eval_ignoring_errors(const char *s, context *ctx) {
  try {
    gen g(s, ctx);
    eval(g, 1, ctx);
  } catch (const std::exception &) {
  }
}

static std::string eval_to_string(const char *s, context *ctx) {
  gen g(s, ctx);
  return eval(g, 1, ctx).print(ctx);
}

// Each of these fails with an error inside limit() or series().
static const char *failing[] = {
  // limit() itself throws (the reproduction from the issue)
  "limit(x^(b+1)/(b+1)*ln(x),x,0,1)",
  // a definite integral failing the same limit at an endpoint
  "integrate(x^b*ln(x),x,0,1)",
  // series() throws from its own expansion, not from a nested limit
  "series(floor(x),x,0,2)",
  "series(ln(ln(x)),x,0,2)",
};

int main() {
  int failures = 0;
  int total = sizeof(failing) / sizeof(failing[0]);

  for (int i = 0; i < total; ++i) {
    context ctx;
    int before = series_flags(&ctx);
    eval_ignoring_errors(failing[i], &ctx);
    int after = series_flags(&ctx);
    if (after != before) {
      std::fprintf(stderr,
                   "FAIL: after %s, series_flags = %d, expected %d\n",
                   failing[i], after, before);
      ++failures;
      continue;
    }
    std::string s =
        eval_to_string("simplify(180*acot(cot(pi/90))/pi-2)", &ctx);
    if (s != "0") {
      std::fprintf(stderr,
                   "FAIL: after %s, simplify(180*acot(cot(pi/90))/pi-2) "
                   "= %s, expected 0\n",
                   failing[i], s.c_str());
      ++failures;
    }
  }

  if (failures == 0) {
    std::printf("All %d tests passed.\n", total);
  } else {
    std::fprintf(stderr, "%d/%d tests failed.\n", failures, total);
  }
  return failures > 0 ? 1 : 0;
}
