"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fs = _interopRequireDefault(require("fs"));

var R = _interopRequireWildcard(require("ramda"));

var _commander = _interopRequireDefault(require("commander"));

var _makePlural = _interopRequireDefault(require("make-plural"));

var _conf = require("@lingui/conf");

var _catalog = require("./api/catalog");

var _compile = require("./api/compile");

var _help = require("./api/help");

var noMessages = R.pipe(R.map(R.isEmpty), R.values, R.all(R.equals(true)));

function command(config, options) {
  var catalogs = (0, _catalog.getCatalogs)(config);

  if (noMessages(catalogs)) {
    console.error("Nothing to compile, message catalogs are empty!\n");
    console.error("(use \"".concat(_chalk.default.yellow((0, _help.helpRun)("extract")), "\" to extract messages from source files)"));
    return false;
  }

  console.error("Compiling message catalogs…");
  config.locales.forEach(function (locale) {
    var _locale$split = locale.split(/[_-]/),
        _locale$split2 = (0, _slicedToArray2.default)(_locale$split, 1),
        language = _locale$split2[0];

    if (locale !== config.pseudoLocale && !_makePlural.default[language]) {
      console.log(_chalk.default.red("Error: Invalid locale ".concat(_chalk.default.bold(locale), " (missing plural rules)!")));
      console.error();
      process.exit(1);
    }

    catalogs.forEach(function (catalog) {
      var messages = catalog.getTranslations(locale, {
        fallbackLocale: config.fallbackLocale,
        sourceLocale: config.sourceLocale
      });

      if (!options.allowEmpty) {
        var missing = R.values(messages);

        if (missing.some(R.isNil)) {
          console.error(_chalk.default.red("Error: Failed to compile catalog for locale ".concat(_chalk.default.bold(locale), "!")));

          if (options.verbose) {
            console.error(_chalk.default.red("Missing translations:"));
            missing.forEach(function (msgId) {
              return console.log(msgId);
            });
          } else {
            console.error(_chalk.default.red("Missing ".concat(missing.length, " translation(s)")));
          }

          console.error();
          process.exit();
        }
      }

      var compiledCatalog = (0, _compile.createCompiledCatalog)(locale, messages, {
        strict: false,
        namespace: options.namespace || config.compileNamespace,
        pseudoLocale: config.pseudoLocale
      });
      var compiledPath = catalog.writeCompiled(locale, compiledCatalog);

      if (options.typescript) {
        var typescriptPath = compiledPath.replace(/\.js$/, "") + ".d.ts";

        _fs.default.writeFileSync(typescriptPath, "import { Catalog } from '@lingui/core';\ndeclare const catalog: Catalog;\nexport = catalog;\n");
      }

      options.verbose && console.error(_chalk.default.green("".concat(locale, " \u21D2 ").concat(compiledPath)));
    });
  });
  return true;
}

if (require.main === module) {
  _commander.default.description("Add compile message catalogs and add language data (plurals) to compiled bundle.").option("--config <path>", "Path to the config file").option("--strict", "Disable defaults for missing translations").option("--verbose", "Verbose output").option("--format <format>", "Format of message catalog").option("--typescript", "Create Typescript definition for compiled bundle").option("--namespace <namespace>", "Specify namespace for compiled bundle. Ex: cjs(default) -> module.exports, window.test -> window.test").on("--help", function () {
    console.log("\n  Examples:\n");
    console.log("    # Compile translations and use defaults or message IDs for missing translations");
    console.log("    $ ".concat((0, _help.helpRun)("compile")));
    console.log("");
    console.log("    # Compile translations but fail when there're missing");
    console.log("    # translations (don't replace missing translations with");
    console.log("    # default messages or message IDs)");
    console.log("    $ ".concat((0, _help.helpRun)("compile --strict")));
  }).parse(process.argv);

  var config = (0, _conf.getConfig)({
    configPath: _commander.default.config
  });

  if (_commander.default.format) {
    var msg = "--format option is deprecated and will be removed in @lingui/cli@3.0.0." + " Please set format in configuration https://lingui.js.org/ref/conf.html#format";
    console.warn(msg);
    config.format = _commander.default.format;
  }

  var results = command(config, {
    verbose: _commander.default.verbose || false,
    allowEmpty: !_commander.default.strict,
    typescript: _commander.default.typescript || false,
    namespace: _commander.default.namespace // we want this to be undefined if user does not specify so default can be used

  });

  if (!results) {
    process.exit(1);
  }

  console.log("Done!");
}