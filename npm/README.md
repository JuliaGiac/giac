# giac-wasm

[Giac](https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html), the
computer algebra system of Xcas, compiled to WebAssembly: symbolic
computation in browsers, Web Workers and Node.js, with nothing to compile at
install.

It is built from the [JuliaGiac fork of Giac](https://github.com/JuliaGiac/giac)
with its Meson build and Emscripten. It bundles Giac 2.1.0 with GMP and MPFR; its version, 200.100.0, encodes
Giac's (see [Versions](#versions)).

```js
import { loadGiac } from 'giac-wasm';

const giac = await loadGiac();
giac.eval('factor(x^4-1)');            // '(x-1)*(x+1)*(x^2+1)'
giac.eval('integrate(1/(1+x^2),x)');   // 'atan(x)'
giac.eval('evalf(pi,30)');             // '3.14159265358979323846264338328'
giac.eval('latex(x^2/2)');             // '"\\frac{x^{2}}{2}"'
giac.eval('plot(sin(x),x)');           // an SVG image, as a GIAC string
```

## Installing

From the npm registry:

```bash
npm install giac-wasm
```

Without it, from a [GitHub Release](https://github.com/JuliaGiac/giac/releases)
of the giac repository (tags `giac-wasm-vX.Y.Z`), which has the npm tarball and
a zip of the same files:

```bash
npm install https://github.com/JuliaGiac/giac/releases/download/giac-wasm-v200.100.0/giac-wasm-200.100.0.tgz
```

In a page, without installing anything, from
[s-celles/giac-wasm](https://s-celles.github.io/giac-wasm/), which serves
every release (with CORS, and `giac.wasm` as `application/wasm`):

```html
<script type="module">
  import { loadGiac } from 'https://s-celles.github.io/giac-wasm/200.100.0/src/index.mjs';
  const giac = await loadGiac();
  console.log(giac.eval('factor(x^4-1)'));
</script>
```

Or unzip `giac-wasm-X.Y.Z.zip` on your own server and import its
`src/index.mjs`: `giac.wasm` is found next to `dist/giac.mjs`. The server must
send `.wasm` files as `application/wasm`.

## Versions

giac-wasm X00.Y00.Z00 is Giac X.Y.Z, as for GIAC_jll: giac-wasm 200.100.0
bundles Giac 2.1.0. The last two digits count the builds of the same Giac
(200.100.1, 200.100.2, …: build or JavaScript fixes), so Giac 2.1.1 will be
200.100.100. `giac.version` gives the version of Giac itself. The major
version follows Giac, so a change to the JavaScript API is announced in the
changelog, not by the version number.

## API

### `loadGiac(options?)`

Loads Giac in a new WebAssembly instance and resolves to its session. Each
instance has its own variables and assumptions.

Options:

- `timeout`: the time limit of each evaluation, in seconds (default 15).
- `onMessage(line)`: receives GIAC's messages (warnings, notes on the method
  used) during `eval`. Without it they are dropped.
- `locateFile(path, prefix)`, `wasmBinary`: passed to the Emscripten module,
  to say where `giac.wasm` is or to give its bytes. A bundler that does not
  resolve `new URL('giac.wasm', import.meta.url)` needs one of them; the
  file is exported as `giac-wasm/giac.wasm`.

### `giac.eval(input)`

Evaluates `input`, a string in Giac's language, and returns the result as
text, as Giac prints it: strings keep their quotes, lists may print as
`list[...]`. Variables, functions and assumptions stay in the session:

```js
giac.eval('f(x):=x^2+1');
giac.eval('f(3)');                     // '10'
giac.eval('assume(a>0)');
giac.eval('sqrt(a^2)');                // 'a'
```

Exact results come alone, not followed by an approximation.

### `giac.evalWithMessages(input)`

Returns `{ result, messages }`, Giac's messages apart from the result:

```js
giac.evalWithMessages('sqrt(');
// { result: 'seq[]', messages: ['Warning adding 1 ) at end of input'] }
```

### `giac.setTimeout(seconds)`

Sets the time limit of each evaluation, with `0 < seconds < 1440`. Past it,
the evaluation throws a `GiacError` ("User interrupt").

### `giac.version`

The version of Giac, as `'2.1.0'`.

### `GiacError`

An evaluation Giac reports as an error throws a `GiacError`, with `message`
(Giac's text), `input` and `messages`. A 3D plot throws one too: there is no
3D renderer.

## Running Giac off the main thread: `giac-wasm/worker`

An evaluation is synchronous: on a page's main thread, it blocks the page
while it runs. `createGiacWorker` runs Giac in a worker instead (a module Web
Worker in browsers, `worker_threads` in Node.js) and gives promises:

```js
import { createGiacWorker } from 'giac-wasm/worker';

const w = createGiacWorker({ timeout: 15 });
await w.ready;                                  // { version: '2.1.0' }
await w.eval('factor(x^4-1)');                  // '(x-1)*(x+1)*(x^2+1)'
await w.evalWithMessages('integrate(abs(x),x)');
// { result: '1/2*x^2*sign(x)', messages: ['Warning, integration of abs or sign assumes …', 'Check [abs(x)]'] }
```

- **The result and GIAC's messages, always.** `evalWithMessages` resolves to
  `{ result, messages }`. A rejection is a `GiacError` whose `messages` hold
  what GIAC said, also when the time limit stopped it. `eval` gives the
  messages to the `onMessage` option.
- **Calls can be made at once.** Calls sent before Giac has loaded wait for
  it. GIAC runs one evaluation at a time: calls are answered in order, each
  with its own result.
- **`setTimeout(seconds)`** sets GIAC's time limit.
- **`interrupt()` is the hard stop.** A few of GIAC's evaluators never check
  the time limit (an infinitely recursive definition, for one). `interrupt()`
  terminates the worker, rejects the pending calls with a `GiacError`, and
  starts a fresh session: its variables are gone, the time limit is kept.
- **`terminate()`** stops it for good.

It needs no SharedArrayBuffer and no `eval`, so it works under a strict
Content Security Policy (`script-src 'self' 'wasm-unsafe-eval'`,
`worker-src 'self'`). The worker's script, `src/worker-entry.mjs`, is found
next to `src/worker.mjs`; pass `workerUrl` if a bundler moves it.

## Limits of this version

- No PARI, NTL, GSL or LAPACK: what Giac does with them is either done by its
  own algorithms or not available.
- No threads, so no SharedArrayBuffer and no cross-origin isolation needed.
- No 3D plots; 2D plots come back as SVG.
- Messages are not translated.

## Building

From the root of the [giac repository](https://github.com/JuliaGiac/giac),
with [emsdk](https://emscripten.org/docs/getting_started/downloads.html)
activated:

```bash
source /path/to/emsdk/emsdk_env.sh
just wasm        # GMP, MPFR, libgiac and the module, into npm/dist/
just wasm-test   # the tests, with Node.js
just wasm-pack   # npm/giac-wasm-<version>.tgz and .zip
```

See `BUILDING.md` for details.

## License

Giac is © Bernard Parisse and Renée De Graeve, Institut Fourier, Université
Grenoble Alpes, and is distributed under the GNU General Public License,
version 3 or later; so is this package (see `LICENSE`). GMP and MPFR, linked
in, are under the GNU LGPL, version 3 or later.
