# Modules: `node:module` API

<!--introduced_in=v12.20.0-->

<!-- YAML
added: v0.3.7
-->

## The `Module` object

* {Object}

Provides general utility methods when interacting with instances of
`Module`, the [`module`][] variable often seen in [CommonJS][] modules. Accessed
via `import 'node:module'` or `require('node:module')`.

### `module.builtinModules`

<!-- YAML
added:
  - v9.3.0
  - v8.10.0
  - v6.13.0
-->

* {string\[]}

A list of the names of all modules provided by Node.js. Can be used to verify
if a module is maintained by a third party or not.

`module` in this context isn't the same object that's provided
by the [module wrapper][]. To access it, require the `Module` module:

```mjs
// module.mjs
// In an ECMAScript module
import { builtinModules as builtin } from 'node:module';
```

```cjs
// module.cjs
// In a CommonJS module
const builtin = require('node:module').builtinModules;
```

### `module.createRequire(filename)`

<!-- YAML
added: v12.2.0
-->

* `filename` {string|URL} Filename to be used to construct the require
  function. Must be a file URL object, file URL string, or absolute path
  string.
* Returns: {require} Require function

```mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// sibling-module.js is a CommonJS module.
const siblingModule = require('./sibling-module');
```

### `module.isBuiltin(moduleName)`

<!-- YAML
added:
  - v18.6.0
  - v16.17.0
-->

* `moduleName` {string} name of the module
* Returns: {boolean} returns true if the module is builtin else returns false

```mjs
import { isBuiltin } from 'node:module';
isBuiltin('node:fs'); // true
isBuiltin('fs'); // true
isBuiltin('wss'); // false
```

### `module.register()`

<!-- YAML
added: REPLACEME
-->

In addition to using the `--experimental-loader` option in the CLI,
loaders can be registered programmatically using the
`module.register()` method.

```mjs
import { register } from 'node:module';

register('http-to-https', import.meta.url);

// Because this is a dynamic `import()`, the `http-to-https` hooks will run
// before importing `./my-app.mjs`.
await import('./my-app.mjs');
```

In the example above, we are registering the `http-to-https` loader,
but it will only be available for subsequently imported modules—in
this case, `my-app.mjs`. If the `await import('./my-app.mjs')` had
instead been a static `import './my-app.mjs'`, _the app would already
have been loaded_ before the `http-to-https` hooks were
registered. This is part of the design of ES modules, where static
imports are evaluated from the leaves of the tree first back to the
trunk. There can be static imports _within_ `my-app.mjs`, which
will not be evaluated until `my-app.mjs` is when it's dynamically
imported.

The `--experimental-loader` flag of the CLI can be used together
with the `register` function; the loaders registered with the
function will follow the same evaluation chain of loaders registered
within the CLI:

```console
node \
  --experimental-loader unpkg \
  --experimental-loader http-to-https \
  --experimental-loader cache-buster \
  entrypoint.mjs
```

```mjs
// entrypoint.mjs
import { URL } from 'node:url';
import { register } from 'node:module';

const loaderURL = new URL('./my-programmatically-loader.mjs', import.meta.url);

register(loaderURL);
await import('./my-app.mjs');
```

The `my-programmatic-loader.mjs` can leverage `unpkg`,
`http-to-https`, and `cache-buster` loaders.

It's also possible to use `register` more than once:

```mjs
// entrypoint.mjs
import { URL } from 'node:url';
import { register } from 'node:module';

register(new URL('./first-loader.mjs', import.meta.url));
register('./second-loader.mjs', import.meta.url);
await import('./my-app.mjs');
```

Both loaders (`first-loader.mjs` and `second-loader.mjs`) can use
all the resources provided by the loaders registered in the CLI. But
remember that they will only be available in the next imported
module (`my-app.mjs`). The evaluation order of the hooks when
importing `my-app.mjs` and consecutive modules in the example above
will be:

```console
resolve: second-loader.mjs
resolve: first-loader.mjs
resolve: cache-buster
resolve: http-to-https
resolve: unpkg
load: second-loader.mjs
load: first-loader.mjs
load: cache-buster
load: http-to-https
load: unpkg
globalPreload: second-loader.mjs
globalPreload: first-loader.mjs
globalPreload: cache-buster
globalPreload: http-to-https
globalPreload: unpkg
```

### `module.syncBuiltinESMExports()`

<!-- YAML
added: v12.12.0
-->

The `module.syncBuiltinESMExports()` method updates all the live bindings for
builtin [ES Modules][] to match the properties of the [CommonJS][] exports. It
does not add or remove exported names from the [ES Modules][].

```js
const fs = require('node:fs');
const assert = require('node:assert');
const { syncBuiltinESMExports } = require('node:module');

fs.readFile = newAPI;

delete fs.readFileSync;

function newAPI() {
  // ...
}

fs.newAPI = newAPI;

syncBuiltinESMExports();

import('node:fs').then((esmFS) => {
  // It syncs the existing readFile property with the new value
  assert.strictEqual(esmFS.readFile, newAPI);
  // readFileSync has been deleted from the required fs
  assert.strictEqual('readFileSync' in fs, false);
  // syncBuiltinESMExports() does not remove readFileSync from esmFS
  assert.strictEqual('readFileSync' in esmFS, true);
  // syncBuiltinESMExports() does not add names
  assert.strictEqual(esmFS.newAPI, undefined);
});
```

## Source map v3 support

<!-- YAML
added:
 - v13.7.0
 - v12.17.0
-->

> Stability: 1 - Experimental

Helpers for interacting with the source map cache. This cache is
populated when source map parsing is enabled and
[source map include directives][] are found in a modules' footer.

To enable source map parsing, Node.js must be run with the flag
[`--enable-source-maps`][], or with code coverage enabled by setting
[`NODE_V8_COVERAGE=dir`][].

```mjs
// module.mjs
// In an ECMAScript module
import { findSourceMap, SourceMap } from 'node:module';
```

```cjs
// module.cjs
// In a CommonJS module
const { findSourceMap, SourceMap } = require('node:module');
```

<!-- Anchors to make sure old links find a target -->

<a id="module_module_findsourcemap_path_error"></a>

### `module.findSourceMap(path)`

<!-- YAML
added:
 - v13.7.0
 - v12.17.0
-->

* `path` {string}
* Returns: {module.SourceMap|undefined} Returns `module.SourceMap` if a source
  map is found, `undefined` otherwise.

`path` is the resolved path for the file for which a corresponding source map
should be fetched.

### Class: `module.SourceMap`

<!-- YAML
added:
 - v13.7.0
 - v12.17.0
-->

#### `new SourceMap(payload)`

* `payload` {Object}

Creates a new `sourceMap` instance.

`payload` is an object with keys matching the [Source map v3 format][]:

* `file`: {string}
* `version`: {number}
* `sources`: {string\[]}
* `sourcesContent`: {string\[]}
* `names`: {string\[]}
* `mappings`: {string}
* `sourceRoot`: {string}

#### `sourceMap.payload`

* Returns: {Object}

Getter for the payload used to construct the [`SourceMap`][] instance.

#### `sourceMap.findEntry(lineNumber, columnNumber)`

* `lineNumber` {number}
* `columnNumber` {number}
* Returns: {Object}

Given a line number and column number in the generated source file, returns
an object representing the position in the original file. The object returned
consists of the following keys:

* generatedLine: {number}
* generatedColumn: {number}
* originalSource: {string}
* originalLine: {number}
* originalColumn: {number}
* name: {string}

[CommonJS]: modules.md
[ES Modules]: esm.md
[Source map v3 format]: https://sourcemaps.info/spec.html#h.mofvlxcwqzej
[`--enable-source-maps`]: cli.md#--enable-source-maps
[`NODE_V8_COVERAGE=dir`]: cli.md#node_v8_coveragedir
[`SourceMap`]: #class-modulesourcemap
[`module`]: modules.md#the-module-object
[module wrapper]: modules.md#the-module-wrapper
[source map include directives]: https://sourcemaps.info/spec.html#h.lmz475t4mvbx
