"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = command;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _chalk = _interopRequireDefault(require("chalk"));

var _commander = _interopRequireDefault(require("commander"));

var _conf = require("@lingui/conf");

var _catalog = require("./api/catalog");

var _detect = require("./api/detect");

var _help = require("./api/help");

function command(config, options) {
  // `react-app` babel plugin used by CRA requires either BABEL_ENV or NODE_ENV to be
  // set. We're setting it here, because lingui macros are going to use them as well.
  if (!process.env.BABEL_ENV && !process.env.NODE_ENV) {
    process.env.BABEL_ENV = "development";
  } // We need macros to keep imports, so extract-messages plugin know what componets
  // to collect. Users usually use both BABEN_ENV and NODE_ENV, so it's probably
  // safer to introduce a new env variable. LINGUI_EXTRACT=1 during `lingui extract`


  process.env.LINGUI_EXTRACT = "1";
  options.verbose && console.error("Extracting messages from source files…");
  var catalogs = (0, _catalog.getCatalogs)(config);
  catalogs.forEach(function (catalog) {
    catalog.make((0, _objectSpread2.default)({}, options, {
      projectType: (0, _detect.detect)() // const pseudoLocale = config.pseudoLocale
      // if (pseudoLocale) {
      //   catalog.addLocale(pseudoLocale)
      // }

    }));
  }); // console.log("Catalog statistics:")
  // printStats(config, catalogs)
  // console.log()

  console.error("(use \"".concat(_chalk.default.yellow((0, _help.helpRun)("extract")), "\" to update catalogs with new messages)"));
  console.error("(use \"".concat(_chalk.default.yellow((0, _help.helpRun)("compile")), "\" to compile catalogs for production)"));
  return true;
}

if (require.main === module) {
  _commander.default.option("--config <path>", "Path to the config file").option("--overwrite", "Overwrite translations for source locale").option("--clean", "Remove obsolete translations").option("--verbose", "Verbose output").option("--convert-from <format>", "Convert from previous format of message catalogs") // Obsolete options
  .option("--babelOptions", "Babel options passed to transform/extract plugins").option("--format <format>", "Format of message catalogs").parse(process.argv);

  var config = (0, _conf.getConfig)({
    configPath: _commander.default.config
  });
  var hasErrors = false;

  if (_commander.default.format) {
    hasErrors = true;
    var msg = "--format option is deprecated." + " Please set format in configuration https://lingui.js.org/ref/conf.html#format";
    console.error(msg);
    console.error();
  }

  if (_commander.default.babelOptions) {
    hasErrors = true;

    var _msg = "--babelOptions option is deprecated." + " Please set extractBabelOptions in configuration https://lingui.js.org/ref/conf.html#extractBabelOptions";

    console.error(_msg);
    console.error();
  }

  var prevFormat = _commander.default.convertFrom;

  if (prevFormat && config.format === prevFormat) {
    hasErrors = true;
    console.error("Trying to migrate message catalog to the same format");
    console.error("Set ".concat(_chalk.default.bold("new"), " format in LinguiJS configuration\n") + " and ".concat(_chalk.default.bold("previous"), " format using --convert-from option."));
    console.log();
    console.log("Example: Convert from lingui format to minimal");
    console.log(_chalk.default.yellow((0, _help.helpRun)("extract --convert-from lingui")));
    process.exit(1);
  }

  if (hasErrors) process.exit(1);
  var result = command(config, {
    verbose: _commander.default.verbose || false,
    clean: _commander.default.clean || false,
    overwrite: _commander.default.overwrite || false,
    prevFormat: prevFormat
  });
  if (!result) process.exit(1);
}