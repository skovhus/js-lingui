"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extract = extract;
exports.collect = collect;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _chalk = _interopRequireDefault(require("chalk"));

var _ora = _interopRequireDefault(require("ora"));

var R = _interopRequireWildcard(require("ramda"));

var _utils = require("./utils");

var extractors = _interopRequireWildcard(require("./extractors"));

/**
 * Merge origins for messages found in different places. All other attributes
 * should be the same (raise an error if defaults are different).
 */
function mergeMessage(msgId, prev, next) {
  if (prev.message && next.message && prev.message !== next.message) {
    throw new Error("Encountered different default translations for message ".concat(_chalk.default.yellow(msgId)) + "\n".concat(_chalk.default.yellow((0, _utils.prettyOrigin)(prev.origin)), " ").concat(prev.message) + "\n".concat(_chalk.default.yellow((0, _utils.prettyOrigin)(next.origin)), " ").concat(next.message));
  }

  return (0, _objectSpread2.default)({}, next, {
    message: prev.message || next.message,
    origin: R.concat(prev.origin, next.origin)
  });
}

function extract(srcPaths, targetPath) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var _options$ignore = options.ignore,
      ignore = _options$ignore === void 0 ? [] : _options$ignore,
      _options$verbose = options.verbose,
      verbose = _options$verbose === void 0 ? false : _options$verbose;
  var ignorePattern = ignore.length ? new RegExp(ignore.join("|"), "i") : null;
  srcPaths.forEach(function (srcFilename) {
    if (!_fs.default.existsSync(srcFilename) || ignorePattern && ignorePattern.test(srcFilename)) return;

    if (_fs.default.statSync(srcFilename).isDirectory()) {
      var subdirs = _fs.default.readdirSync(srcFilename).map(function (filename) {
        return _path.default.join(srcFilename, filename);
      });

      extract(subdirs, targetPath, options);
      return;
    }

    var extracted = R.values(extractors).some(function (ext) {
      if (!ext.match || !ext.match(srcFilename)) return false;
      var spinner;
      if (verbose) spinner = (0, _ora.default)().start(srcFilename);
      ext.extract(srcFilename, targetPath, options);
      if (verbose && spinner) spinner.succeed();
      return true;
    });
  });
}

function collect(buildDir) {
  return _fs.default.readdirSync(buildDir).map(function (filename) {
    var filepath = _path.default.join(buildDir, filename);

    if (_fs.default.lstatSync(filepath).isDirectory()) {
      return collect(filepath);
    }

    if (!filename.endsWith(".json")) return;

    try {
      return JSON.parse(_fs.default.readFileSync(filepath).toString());
    } catch (e) {
      return {};
    }
  }).filter(Boolean).reduce(function (catalog, messages) {
    return R.mergeWithKey(mergeMessage, catalog, messages);
  }, {});
}