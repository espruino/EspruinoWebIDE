"use strict";
(function () {
  var defaultLintHints = {
    // JSHint Default Configuration File (as on JSHint website)
    // See http://jshint.com/docs/ for more details

    maxerr: 50,           // {int} Maximum error before stopping

    // Enforcing
    bitwise: true,        // true: Prohibit bitwise operators (&, |, ^, etc.)
    camelcase: false,     // true: Identifiers must be in camelCase
    curly: true,          // true: Require {} for every new block or scope
    eqeqeq: true,         // true: Require triple equals (===) for comparison
    forin: true,          // true: Require filtering for..in loops with obj.hasOwnProperty()
    freeze: true,         // true: prohibits overwriting prototypes of native objects such as Array, Date etc.
    immed: false,         // true: Require immediate invocations to be wrapped in parens e.g. `(function () { } ());`
    latedef: false,       // true: Require variables/functions to be defined before being used
    newcap: false,        // true: Require capitalization of all constructor functions e.g. `new F()`
    noarg: true,          // true: Prohibit use of `arguments.caller` and `arguments.callee`
    noempty: true,        // true: Prohibit use of empty blocks
    nonbsp: true,         // true: Prohibit `non-breaking whitespace` characters.
    nonew: false,         // true: Prohibit use of constructors for side-effects (without assignment)
    plusplus: false,      // true: Prohibit use of `++` and `--`
    quotmark: false,      // Quotation mark consistency: false - do nothing (default), true - ensure whatever is used is consistent, 'single' - require single quotes, 'double' - require double quotes
    undef: true,          // true: Require all non-global variables to be declared (prevents global leaks)
    unused: true,         // Unused variables: true - all variables and last function parameter, 'vars' - all variables only, 'strict' - all variables and all function parameters
    strict: true,         // true: Requires all functions run in ES5 Strict Mode
    maxparams: false,     // {int} Max number of formal params allowed per function
    maxdepth: false,      // {int} Max depth of nested blocks (within functions)
    maxstatements: false, // {int} Max number statements per function
    maxcomplexity: false, // {int} Max cyclomatic complexity per function
    maxlen: false,        // {int} Max number of characters per line
    varstmt: false,       // true: Disallow any var statements. Only `let` and `const` are allowed.

    // Relaxing
    asi: false,           // true: Tolerate Automatic Semicolon Insertion (no semicolons)
    boss: false,          // true: Tolerate assignments where comparisons would be expected
    debug: false,         // true: Allow debugger statements e.g. browser breakpoints.
    eqnull: false,        // true: Tolerate use of `== null`
    esversion: 5,         // {int} Specify the ECMAScript version to which the code must adhere.
    moz: false,           // true: Allow Mozilla specific syntax (extends and overrides esnext features) (ex: `for each`, multiple try/catch, function expression…)
    evil: false,          // true: Tolerate use of `eval` and `new Function()`
    expr: false,          // true: Tolerate `ExpressionStatement` as Programs
    funcscope: false,     // true: Tolerate defining variables inside control statements
    globalstrict: false,  // true: Allow global `use strict` (also enables 'strict')
    iterator: false,      // true: Tolerate using the `__iterator__` property
    lastsemic: false,     // true: Tolerate omitting a semicolon for the last statement of a 1-line block
    laxbreak: false,      // true: Tolerate possibly unsafe line breakings
    laxcomma: false,      // true: Tolerate comma-first style coding
    loopfunc: false,      // true: Tolerate functions being defined in loops
    multistr: false,      // true: Tolerate multi-line strings
    noyield: false,       // true: Tolerate generator functions with no yield statement in them.
    notypeof: false,      // true: Tolerate invalid typeof operator values
    proto: false,         // true: Tolerate using the `__proto__` property
    scripturl: false,     // true: Tolerate script-targeted URLs
    shadow: false,        // true: Allows re-define variables later in code e.g. `var x=1; x=2;`
    sub: false,           // true: Tolerate using `[]` notation when it can still be expressed in dot notation
    supernew: false,      // true: Tolerate `new function () { ... };` and `new Object;`
    validthis: false,     // true: Tolerate using this in a non-constructor function

    // Environments
    browser: true,        // Web Browser (window, document, etc)
    browserify: false,    // Browserify (node.js code in the browser)
    couch: false,         // CouchDB
    devel: true,          // Development/debugging (alert, confirm, etc)
    dojo: false,          // Dojo Toolkit
    jasmine: false,       // Jasmine
    jquery: false,        // jQuery
    mocha: true,          // Mocha
    mootools: false,      // MooTools
    node: false,          // Node.js
    nonstandard: false,   // Widely adopted globals (escape, unescape, etc)
    phantom: false,       // PhantomJS
    prototypejs: false,   // Prototype and Scriptaculous
    qunit: false,         // QUnit
    rhino: false,         // Rhino
    shelljs: false,       // ShellJS
    typed: false,         // Globals for typed array constructions
    worker: false,        // Web Workers
    wsh: false,           // Windows Scripting Host
    yui: false,           // Yahoo User Interface

    // Custom Globals
    globals: {}           // additional predefined global variables
  };

  var defaultLintFlags = {
    ...defaultLintHints,
    esversion: 6,     // Enable ES6 for literals, arrow fns, binary
    forin: false,
    immed: true,
    evil: true,
    laxbreak: true,
    laxcomma: true,
    asi: true,
    boss: true,
    debug: true,
    curly: false,
    strict: 'implied',
    bitwise: false,
    browser: false,
    mocha: false,
    module: true,
    node: true,
    unused: false,
    undef: false,
  };

  function init() {
    var codeMirror = Espruino.Core.EditorJavaScript.getCodeMirror();

    if (codeMirror) {
      function getURL(url, c) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", url, true);
        xhr.send();
        xhr.onreadystatechange = function () {
          if (xhr.readyState != 4) return;
          if (xhr.status < 400) return c(null, xhr.responseText);
          var e = new Error(xhr.responseText || "No response");
          e.status = xhr.status;
          c(e);
        };
      }

      codeMirror.setOption('lint', (Espruino.Config.DISABLE_CODE_HINTS) ? false : defaultLintFlags);

      getURL(/*"http://ternjs.net/defs/ecma5.json"*/"data/espruino.json", function (err, code) {
        if (err) throw new Error("Request for ecma5.json failed: " + err);
        var codeGlobals = Object.keys(JSON.parse(code)).slice(1);

        if (codeGlobals) {
          defaultLintFlags = {
            ...defaultLintFlags,
            unused: true,
            undef: true,
            globals: {
              ...codeGlobals.reduce((globals, item) => {
                globals[item] = false;
                return globals;
              }, {}),
              g: false,
            },
          }
          codeMirror.setOption('lint', (Espruino.Config.DISABLE_CODE_HINTS) ? false : defaultLintFlags);
        }
      });

      Espruino.Core.Config.add("DISABLE_CODE_HINTS", {
        section: "General",
        name: "Disable Code Lint",
        description: "Disable code linting in the editor. BE CAREFUL - they're there " +
          "for a reason. If your code is creating warnings then it may well not work " +
          "on Espruino! (needs a restart to take effect)",
        type: "boolean",
        defaultValue: false,
        onChange: function (newValue) {
          codeMirror.setOption('lint', (Espruino.Config.DISABLE_CODE_HINTS) ? false : defaultLintFlags);
        }
      });
    }
  }

  Espruino.Plugins.Lint = {
    init: init,
  };
}());