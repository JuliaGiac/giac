// SVG written by gen2svg must be well-formed XML: an attribute value is
// followed by a space, "/" or ">", never directly by the next attribute
// (`y2="1.1"stroke="cyan"`). Browsers accept the latter as HTML, but it is
// not XML: an <img> of it, or any XML tool, rejects it.
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include "giac.h"
#undef fprintf
#undef printf
#include <cstdio>
#include <fstream>
#include <string>

// The first place where a closing quote of an attribute value is directly
// followed by something else than a space, "/", ">" or "?", or npos.
static std::size_t first_glued_attribute(const std::string & s, std::size_t start = 0) {
  bool in_tag = false;
  char quote = 0;
  for (std::size_t i = start; i < s.size(); ++i) {
    char c = s[i];
    if (quote) {
      if (c == quote) {
        quote = 0;
        char n = i + 1 < s.size() ? s[i + 1] : ' ';
        if (!(n == ' ' || n == '\n' || n == '\t' || n == '/' || n == '>' || n == '?'))
          return i;
      }
      continue;
    }
    if (c == '<') in_tag = true;
    else if (c == '>') in_tag = false;
    else if (in_tag && (c == '"' || c == '\'') && i > 0 && s[i - 1] == '=') quote = c;
  }
  return std::string::npos;
}

int main(int argc, char ** argv) {
  // with a directory as argument, also write each SVG there (to check it with an XML parser)
  const char * dump = argc > 1 ? argv[1] : nullptr;
  int n = 0;
  const char * plots[] = {
    "plot(sin(x),x)",
    "plot(x^2,x=-2..2)",
    "plotfunc(x^3-x,x)",
    "circle(0,1)",
    "point(1,2)",
    "segment(0,1+i)",
    "plotparam([cos(t),sin(t)],t)",
    "plotpolar(1+cos(t),t)",
    "polygon(0,1,i)",
    "legend(1+i,\"label\")",
  };
  int failures = 0;
  for (const char * p : plots) {
    giac::context ctx;
    giac::gen g(p, &ctx);
    g = giac::eval(g, 1, &ctx);
    std::string svg = giac::gen2svg(g, &ctx, true);
    if (dump) std::ofstream(std::string(dump) + "/plot" + std::to_string(n++) + ".svg") << svg;
    std::size_t at = first_glued_attribute(svg);
    if (svg.empty() || at != std::string::npos) {
      std::size_t from = at == std::string::npos ? 0 : (at > 40 ? at - 40 : 0);
      std::fprintf(stderr, "FAIL %s\n", p);
      // every glued place, so that all the printers at fault show at once
      for (std::size_t k = 0; at != std::string::npos && k < 12; ++k) {
        from = at > 30 ? at - 30 : 0;
        std::fprintf(stderr, "  near: %s<<HERE>>%s\n", svg.substr(from, at + 1 - from).c_str(),
                     svg.substr(at + 1, 25).c_str());
        at = first_glued_attribute(svg, at + 1);
      }
      ++failures;
    } else {
      std::printf("ok   %s\n", p);
    }
  }
  return failures == 0 ? 0 : 1;
}
