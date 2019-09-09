"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _core = require("@babel/core");

var _babelPluginExtractMessages = _interopRequireDefault(require("@lingui/babel-plugin-extract-messages"));

var _detect = require("../detect");

var babelRe = /\.jsx?$/i;
var extractor = {
  match: function match(filename) {
    return babelRe.test(filename);
  },
  extract: function extract(filename, localeDir) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var _options$babelOptions = options.babelOptions,
        _babelOptions = _options$babelOptions === void 0 ? {} : _options$babelOptions;

    var _babelOptions$plugins = _babelOptions.plugins,
        plugins = _babelOptions$plugins === void 0 ? [] : _babelOptions$plugins,
        babelOptions = (0, _objectWithoutProperties2.default)(_babelOptions, ["plugins"]);
    var frameworkOptions = {};

    if (options.projectType === _detect.projectType.CRA) {
      frameworkOptions.presets = ["react-app"];
    }

    (0, _core.transformFileSync)(filename, (0, _objectSpread2.default)({}, babelOptions, {}, frameworkOptions, {
      plugins: ["macros", [_babelPluginExtractMessages.default, {
        localeDir: localeDir
      }]].concat((0, _toConsumableArray2.default)(plugins))
    }));
  }
};
var _default = extractor;
exports.default = _default;