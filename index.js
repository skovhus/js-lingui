"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfig = getConfig;
exports.replaceRootDir = replaceRootDir;
exports.fallbackLanguageMigration = fallbackLanguageMigration;
exports.catalogMigration = catalogMigration;
exports.configValidation = exports.defaultConfig = void 0;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _chalk = _interopRequireDefault(require("chalk"));

var _cosmiconfig = _interopRequireDefault(require("cosmiconfig"));

var _jestValidate = require("jest-validate");

var defaultConfig = {
  catalogs: [{
    path: _path.default.join("<rootDir>", "locale", "{locale}", "messages"),
    include: ["<rootDir>"],
    exclude: ["*/node_modules/*"]
  }],
  compileNamespace: "cjs",
  extractBabelOptions: {
    plugins: [],
    presets: []
  },
  fallbackLocale: "",
  format: "po",
  locales: [],
  orderBy: "messageId",
  pseudoLocale: "",
  rootDir: ".",
  runtimeConfigModule: ["@lingui/core", "i18n"],
  sourceLocale: ""
};
exports.defaultConfig = defaultConfig;

function configExists(path) {
  return path && _fs.default.existsSync(path);
}

function getConfig() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      cwd = _ref.cwd,
      configPath = _ref.configPath,
      _ref$skipValidation = _ref.skipValidation,
      skipValidation = _ref$skipValidation === void 0 ? false : _ref$skipValidation;

  var defaultRootDir = cwd || process.cwd();
  var configExplorer = (0, _cosmiconfig.default)("lingui");
  var result = configExists(configPath) ? configExplorer.loadSync(configPath) : configExplorer.searchSync(defaultRootDir);
  var userConfig = result ? result.config : {};
  var config = (0, _objectSpread2.default)({}, defaultConfig, {
    rootDir: result ? _path.default.dirname(result.filepath) : defaultRootDir
  }, userConfig);

  if (!skipValidation) {
    (0, _jestValidate.validate)(config, configValidation);
    return pipe( // List config migrations from oldest to newest
    fallbackLanguageMigration, catalogMigration, // Custom validation
    validateLocales, // `replaceRootDir` should always be the last
    function (config) {
      return replaceRootDir(config, config.rootDir);
    })(config);
  } else {
    return replaceRootDir(config, config.rootDir);
  }
}

var exampleConfig = (0, _objectSpread2.default)({}, defaultConfig, {
  extractBabelOptions: {
    extends: "babelconfig.js",
    rootMode: "rootmode",
    plugins: ["plugin"],
    presets: ["preset"]
  }
});
var deprecatedConfig = {
  fallbackLanguage: function fallbackLanguage(config) {
    return " Option ".concat(_chalk.default.bold("fallbackLanguage"), " was replaced by ").concat(_chalk.default.bold("fallbackLocale"), "\n\n    @lingui/cli now treats your current configuration as:\n    {\n      ").concat(_chalk.default.bold('"fallbackLocale"'), ": ").concat(_chalk.default.bold("\"".concat(config.fallbackLanguage, "\"")), "\n    }\n\n    Please update your configuration.\n    ");
  },
  localeDir: function localeDir(config) {
    return " Option ".concat(_chalk.default.bold("localeDir"), " is deprecated. Configure source paths using ").concat(_chalk.default.bold("catalogs"), " instead.\n\n    @lingui/cli now treats your current configuration as:\n\n    {\n      ").concat(_chalk.default.bold('"catalogs"'), ": ").concat(JSON.stringify(catalogMigration(config).catalogs, null, 2), "\n    }\n\n    Please update your configuration.\n    ");
  },
  srcPathDirs: function srcPathDirs(config) {
    return " Option ".concat(_chalk.default.bold("srcPathDirs"), " is deprecated. Configure source paths using ").concat(_chalk.default.bold("catalogs"), " instead.\n\n    @lingui/cli now treats your current configuration as:\n\n    {\n      ").concat(_chalk.default.bold('"catalogs"'), ": ").concat(JSON.stringify(catalogMigration(config).catalogs, null, 2), "\n    }\n\n    Please update your configuration.\n    ");
  },
  srcPathIgnorePatterns: function srcPathIgnorePatterns(config) {
    return " Option ".concat(_chalk.default.bold("srcPathIgnorePatterns"), " is deprecated. Configure excluded source paths using ").concat(_chalk.default.bold("catalogs"), " instead.\n\n    @lingui/cli now treats your current configuration as:\n\n    {\n      ").concat(_chalk.default.bold('"catalogs"'), ": ").concat(JSON.stringify(catalogMigration(config).catalogs, null, 2), "\n    }\n\n    Please update your configuration.\n    ");
  }
};
var configValidation = {
  exampleConfig: exampleConfig,
  deprecatedConfig: deprecatedConfig,
  comment: "Documentation: https://lingui.js.org/ref/conf.html"
};
exports.configValidation = configValidation;

function validateLocales(config) {
  if (!Array.isArray(config.locales) || !config.locales.length) {
    console.error("No locales defined!\n");
    console.error("Add ".concat(_chalk.default.yellow("'locales'"), " to your configuration. See ").concat(_chalk.default.underline("https://lingui.js.org/ref/conf.html#locales")));
  }

  return config;
}

function replaceRootDir(config, rootDir) {
  return function replaceDeep(value, rootDir) {
    var replace = function replace(s) {
      return s.replace("<rootDir>", rootDir);
    };

    if (value == null) {
      return value;
    } else if (typeof value === "string") {
      return replace(value);
    } else if (Array.isArray(value)) {
      return value.map(function (item) {
        return replaceDeep(item, rootDir);
      });
    } else if ((0, _typeof2.default)(value) === "object") {
      Object.keys(value).forEach(function (key) {
        var newKey = replaceDeep(key, rootDir);
        value[newKey] = replaceDeep(value[key], rootDir);
        if (key !== newKey) delete value[key];
      });
    }

    return value;
  }(config, rootDir);
}
/**
 * Replace fallbackLanguage with fallbackLocale
 *
 * Released in lingui-conf 0.9
 * Remove anytime after 3.x
 */


function fallbackLanguageMigration(config) {
  var fallbackLocale = config.fallbackLocale,
      fallbackLanguage = config.fallbackLanguage,
      newConfig = (0, _objectWithoutProperties2.default)(config, ["fallbackLocale", "fallbackLanguage"]);
  return (0, _objectSpread2.default)({}, newConfig, {
    fallbackLocale: fallbackLocale || fallbackLanguage || ""
  });
}
/**
 * Replace localeDir, srcPathDirs and srcPathIgnorePatterns with catalogs
 *
 * Released in @lingui/conf 3.0
 * Remove anytime after 4.x
 */


function catalogMigration(config) {
  var localeDir = config.localeDir,
      srcPathDirs = config.srcPathDirs,
      srcPathIgnorePatterns = config.srcPathIgnorePatterns,
      newConfig = (0, _objectWithoutProperties2.default)(config, ["localeDir", "srcPathDirs", "srcPathIgnorePatterns"]);

  if (localeDir || srcPathDirs || srcPathIgnorePatterns) {
    // Replace missing values with default ones
    if (localeDir === undefined) localeDir = _path.default.join("<rootDir>", "locale", "{locale}", "messages");
    if (srcPathDirs === undefined) srcPathDirs = ["<rootDir>"];
    if (srcPathIgnorePatterns === undefined) srcPathIgnorePatterns = ["*/node_modules/*"];
    var newLocaleDir = localeDir;

    if (localeDir.slice(-1) !== _path.default.sep) {
      newLocaleDir += "/";
    }

    if (!Array.isArray(newConfig.catalogs)) {
      newConfig.catalogs = [];
    }

    newConfig.catalogs.push({
      path: _path.default.join(newLocaleDir, "{locale}", "messages"),
      include: srcPathDirs,
      exclude: srcPathIgnorePatterns
    });
  }

  return newConfig;
}

var pipe = function pipe() {
  for (var _len = arguments.length, functions = new Array(_len), _key = 0; _key < _len; _key++) {
    functions[_key] = arguments[_key];
  }

  return function (args) {
    return functions.reduce(function (arg, fn) {
      return fn(arg);
    }, args);
  };
};