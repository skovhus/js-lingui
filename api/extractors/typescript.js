"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _fs = _interopRequireDefault(require("fs"));

var _core = require("@babel/core");

var _babelPluginExtractMessages = _interopRequireDefault(require("@lingui/babel-plugin-extract-messages"));

var ts = _interopRequireWildcard(require("typescript"));

var _detect = require("../detect");

var typescriptRe = /(^.?|\.[^d]|[^.]d|[^.][^d])\.tsx?$/i;
var extractor = {
  match: function match(filename) {
    return typescriptRe.test(filename);
  },
  extract: function extract(filename, localeDir) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var content = _fs.default.readFileSync(filename, "utf8");

    var isTsx = filename.endsWith(".tsx"); // pass jsx to babel untouched

    var jsx = isTsx ? ts.JsxEmit.Preserve : ts.JsxEmit.None;
    var stripped = ts.transpileModule(content, {
      compilerOptions: {
        filename: filename,
        jsx: jsx,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2016,
        // use ES2015 or ES2016 to preserve tagged template literal
        allowSyntheticDefaultImports: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs
      }
    });
    var frameworkOptions = {};

    if (options.projectType === _detect.projectType.CRA) {
      frameworkOptions.presets = ["react-app"];
    }

    var _options$babelOptions = options.babelOptions,
        babelOptions = _options$babelOptions === void 0 ? {} : _options$babelOptions;
    var plugins = ["macros", [_babelPluginExtractMessages.default, {
      localeDir: localeDir
    }]].concat((0, _toConsumableArray2.default)(babelOptions.plugins || []));

    if (isTsx) {
      plugins.unshift(require.resolve("babel-plugin-syntax-jsx"));
    }

    (0, _core.transform)(stripped.outputText, (0, _objectSpread2.default)({}, babelOptions, {}, frameworkOptions, {
      filename: filename,
      plugins: plugins
    }));
  }
};
var _default = extractor;
exports.default = _default;