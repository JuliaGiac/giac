// Content MathML: <divide/> is binary (MathML 2.0, 4.4.3.3). A product with
// several factors in its numerator or denominator, such as (a/b)/c, which GIAC
// holds as a*inv(b)*inv(c), was written as one <divide/> of all of them.
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include "giac.h"
#undef fprintf
#undef printf
#include <cstdio>
#include <string>
#include <vector>

// operand count of every <apply><divide/>…</apply> in a content MathML string
static std::vector<int> divide_arities(const std::string & s) {
  std::vector<int> arities;
  std::size_t p = 0;
  while ((p = s.find("<divide/>", p)) != std::string::npos) {
    std::size_t i = p + 9;
    int depth = 0, operands = 0;
    while (i < s.size()) {
      if (s.compare(i, 2, "</") == 0) {
        if (depth == 0) break;                 // the </apply> of this divide
        --depth;
        if (depth == 0) ++operands;
        i = s.find('>', i) + 1;
      } else if (s[i] == '<') {
        std::size_t e = s.find('>', i);
        bool self = s[e - 1] == '/';
        if (!self) ++depth;
        else if (depth == 0) ++operands;
        i = e + 1;
      } else ++i;
    }
    arities.push_back(operands);
    p += 9;
  }
  return arities;
}

int main() {
  const char * inputs[] = {"(a/b)/c", "((a/b)/c)/d", "x/2/y", "a*x/b", "a*x/(b*y)", "a/(b*c)", "a/b", "1/(b*c)"};
  int failures = 0;
  for (const char * in : inputs) {
    giac::context ctx;
    std::string expr = std::string("export_mathml(") + in + ",content)";
    giac::gen g = giac::eval(giac::gen(expr, &ctx), 1, &ctx);
    std::string s = g.type == giac::_STRNG ? *g._STRNGptr : g.print(&ctx);
    bool ok = true;
    for (int n : divide_arities(s)) ok = ok && n == 2;
    if (!ok || s.find("<divide/>") == std::string::npos) {
      std::fprintf(stderr, "FAIL %s\n  %s\n", in, s.c_str());
      ++failures;
    } else {
      std::printf("ok   %s\n", in);
    }
  }
  return failures == 0 ? 0 : 1;
}
