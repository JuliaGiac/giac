// A syntax error quotes the line it occurred in ("... at ) in <line>"). The line
// came from a pointer into a string that set_lexer_string destroyed on return,
// before the parse ran: the message held freed memory, often bytes that are not
// UTF-8. It must quote the input line itself.
#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include "gen.h"
#undef fprintf
#undef printf
#include <cstdio>
#include <sstream>
#include <string>

int main() {
  // syntax errors GIAC does not repair (a missing ")" it would add), short and long
  const char * inputs[] = {
    "f(x):=x^2+;",
    "a_rather_long_identifier_name:=x^2+;",
    "g(x):=x^2+*3+a_rather_long_identifier_name",
  };
  int failures = 0;
  for (const char * input : inputs) {
    giac::context ctx;
    std::ostringstream log;
    giac::logptr(&log, &ctx);
    giac::gen g(input, &ctx);
    std::string err = giac::parser_error(&ctx);
    // the quoted line, after " in ", must be the input (the lexer may add spaces)
    std::size_t at = err.find(" in ");
    std::string quoted = at == std::string::npos ? std::string() : err.substr(at + 4);
    std::string compact, expected;
    for (char c : quoted) if (c != ' ' && c != '\n') compact += c;
    for (const char * p = input; *p; ++p) if (*p != ' ') expected += *p;
    if (err.empty() || compact.compare(0, expected.size(), expected) != 0) {
      std::fprintf(stderr, "FAIL %s\n  error: %s\n", input, err.c_str());
      ++failures;
    } else {
      std::printf("ok   %s\n", input);
    }
  }
  return failures == 0 ? 0 : 1;
}
