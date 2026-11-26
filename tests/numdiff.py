#!/usr/bin/env python3
"""Compare a check's output with its reference, numbers within a tolerance.

    numdiff.py OUTPUT REFERENCE [--rtol R] [--atol A]
    numdiff.py --self-test

Like `diff OUTPUT REFERENCE`, except that decimal numbers (with a point or
an exponent) may differ by `atol + rtol * max(|a|, |b|)` (defaults 1e-12 and
1e-10). Everything else, integers included, must be identical. Used for
checks whose last printed digit depends on the BLAS/LAPACK of the platform
(Accelerate on macOS, OpenBLAS elsewhere). Exit status 0 if the files agree,
1 otherwise, with the differing lines printed.
"""
import re
import sys

# A decimal number: digits with a point and/or an exponent. Plain integers
# stay text, so that exact results are still compared exactly.
NUMBER = re.compile(r"[-+]?(?:\d+\.\d*|\.\d+|\d+(?=[eE]))(?:[eE][-+]?\d+)?")


def split(line):
    """Text pieces and decimal numbers of a line, alternating (text first)."""
    parts = NUMBER.split(line)
    numbers = [float(x) for x in NUMBER.findall(line)]
    return parts, numbers


def lines_agree(a, b, rtol, atol):
    if a == b:
        return True
    pa, na = split(a)
    pb, nb = split(b)
    if pa != pb or len(na) != len(nb):
        return False
    return all(abs(x - y) <= atol + rtol * max(abs(x), abs(y)) for x, y in zip(na, nb))


def compare(out_lines, ref_lines, rtol=1e-10, atol=1e-12):
    """The (line number, output, reference) of every line that disagrees."""
    bad = []
    n = max(len(out_lines), len(ref_lines))
    for i in range(n):
        a = out_lines[i] if i < len(out_lines) else None
        b = ref_lines[i] if i < len(ref_lines) else None
        if a is None or b is None or not lines_agree(a, b, rtol, atol):
            bad.append((i + 1, a, b))
    return bad


def self_test():
    ok = [
        ("x=1.0", "x=1.0"),
        ("[-0.459715388685,2]", "[-0.459715388684,2]"),   # last digit, macOS vs OpenBLAS
        ("1.5e-20", "1.6e-20"),                           # below atol
    ]
    bad = [
        ("[-0.4597,2]", "[-0.4598,2]"),   # beyond rtol
        ("[1,2]", "[1,3]"),               # integers are exact
        ("cov_matrix(x)", "x"),           # text is exact
        ("1.0,2.0", "1.0"),               # number count
    ]
    failures = [p for p in ok if compare([p[0]], [p[1]])]
    failures += [p for p in bad if not compare([p[0]], [p[1]])]
    if compare(["a", "b"], ["a"]) == []:
        failures.append(("missing line", ""))
    for f in failures:
        print("self-test failed:", f, file=sys.stderr)
    return 1 if failures else 0


def main(argv):
    if argv == ["--self-test"]:
        return self_test()
    args, opts = [], {"--rtol": 1e-10, "--atol": 1e-12}
    it = iter(argv)
    for a in it:
        if a in opts:
            opts[a] = float(next(it))
        else:
            args.append(a)
    if len(args) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    with open(args[0], encoding="utf-8") as f:
        out = f.read().splitlines()
    with open(args[1], encoding="utf-8") as f:
        ref = f.read().splitlines()
    bad = compare(out, ref, opts["--rtol"], opts["--atol"])
    for i, a, b in bad:
        print(f"{i}c{i}\n< {a}\n---\n> {b}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
