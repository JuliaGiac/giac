// Regression test: the same integral must get a correct antiderivative on
// every call, not only the first one.
//
// With the gen type stored on 8 bits (GIAC_TYPE_ON_8BITS, commit 64fdcef),
// integrate(1/(1-x^4+x^8),x) was right on the first call and returned a
// different, wrong antiderivative on every later call (residual F'-f about
// 1.33 at x=0.21). With upstream's 5-bit type field both calls are right.
// Found by the CASbench integration benchmark (case F 14).
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include "giac.h"
// On MinGW, libintl.h (pulled in via giacintl.h) redefines fprintf/printf
// as macros; undefine them before including <cstdio>.
#undef fprintf
#undef printf
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <string>

using namespace giac;

static std::string eval_to_string(const std::string &s, context *ctx) {
  gen g(s, ctx);
  return eval(g, 1, ctx).print(ctx);
}

// |F'(x) - f(x)| at x = 0.21
static double residual(const std::string &F, const std::string &f,
                       context *ctx) {
  std::string r = eval_to_string(
      "evalf(abs(subst(diff(" + F + ",x)-(" + f + "),x=0.21)))", ctx);
  return std::atof(r.c_str());
}

int main() {
  context ctx;
  eval_to_string("threads:=1", &ctx);
  const std::string f = "1/(1-x^4+x^8)";
  int failures = 0;
  std::string first;
  for (int call = 1; call <= 3; ++call) {
    std::string F = eval_to_string("integrate(" + f + ",x)", &ctx);
    double r = residual(F, f, &ctx);
    if (!(r < 1e-9)) {
      std::fprintf(stderr, "FAIL: call %d of integrate(%s,x): residual %g\n",
                   call, f.c_str(), r);
      ++failures;
    }
    if (call == 1) {
      first = F;
    } else if (F != first) {
      std::fprintf(stderr, "FAIL: call %d returned another antiderivative\n",
                   call);
      ++failures;
    }
  }
  if (failures == 0)
    std::printf("All 3 calls gave the same, correct antiderivative.\n");
  return failures > 0 ? 1 : 0;
}
