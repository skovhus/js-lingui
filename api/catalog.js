"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCatalogs = getCatalogs;
exports.getCatalogForFile = getCatalogForFile;
exports.orderByMessageId = orderByMessageId;
exports.orderByOrigin = orderByOrigin;
exports.cleanObsolete = exports.Catalog = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _os = _interopRequireDefault(require("os"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _path = _interopRequireDefault(require("path"));

var R = _interopRequireWildcard(require("ramda"));

var _chalk = _interopRequireDefault(require("chalk"));

var _glob = _interopRequireDefault(require("glob"));

var _minimatch = _interopRequireDefault(require("minimatch"));

var _formats = _interopRequireDefault(require("./formats"));

var _extractors = _interopRequireDefault(require("./extractors"));

var _utils = require("./utils");

var NAME = "{name}";
var LOCALE = "{locale}";

var Catalog =
/*#__PURE__*/
function () {
  function Catalog(_ref, config) {
    var name = _ref.name,
        path = _ref.path,
        include = _ref.include,
        _ref$exclude = _ref.exclude,
        exclude = _ref$exclude === void 0 ? [] : _ref$exclude;
    (0, _classCallCheck2.default)(this, Catalog);
    (0, _defineProperty2.default)(this, "name", void 0);
    (0, _defineProperty2.default)(this, "path", void 0);
    (0, _defineProperty2.default)(this, "include", void 0);
    (0, _defineProperty2.default)(this, "exclude", void 0);
    (0, _defineProperty2.default)(this, "config", void 0);
    (0, _defineProperty2.default)(this, "format", void 0);
    this.name = name;
    this.path = path;
    this.include = include;
    this.exclude = [this.localeDir].concat((0, _toConsumableArray2.default)(exclude));
    this.config = config;
    this.format = (0, _formats.default)(config.format);
  }

  (0, _createClass2.default)(Catalog, [{
    key: "make",
    value: function make(options) {
      var nextCatalog = this.collect(options);
      var prevCatalogs = this.readAll();
      var catalogs = this.merge(prevCatalogs, nextCatalog, {
        overwrite: options.overwrite
      }); // Map over all locales and post-process each catalog

      var cleanAndSort = R.map(R.pipe( // Clean obsolete messages
      options.clean ? cleanObsolete : R.identity, // Sort messages
      this.config.orderBy === 'messageId' ? orderByMessageId : orderByOrigin));
      this.writeAll(cleanAndSort(catalogs));
    }
    /**
     * Collect messages from source paths. Return a raw message catalog as JSON.
     */

  }, {
    key: "collect",
    value: function collect(options) {
      var _this = this;

      var tmpDir = _path.default.join(_os.default.tmpdir(), "lingui-".concat(process.pid));

      if (_fsExtra.default.existsSync(tmpDir)) {
        (0, _utils.removeDirectory)(tmpDir, true);
      } else {
        _fsExtra.default.mkdirSync(tmpDir);
      }

      try {
        this.sourcePaths.forEach(function (filename) {
          return (0, _extractors.default)(filename, tmpDir, {
            verbose: options.verbose,
            babelOptions: _this.config.extractBabelOptions,
            projectType: options.projectType
          });
        });
        return function traverse(directory) {
          return _fsExtra.default.readdirSync(directory).map(function (filename) {
            var filepath = _path.default.join(directory, filename);

            if (_fsExtra.default.lstatSync(filepath).isDirectory()) {
              return traverse(filepath);
            }

            if (!filename.endsWith(".json")) return;

            try {
              return JSON.parse(_fsExtra.default.readFileSync(filepath).toString());
            } catch (e) {}
          }).filter(Boolean).reduce(function (catalog, messages) {
            return R.mergeWithKey(mergeOrigins, catalog, messages);
          }, {});
        }(tmpDir);
      } catch (e) {
        throw e;
      } finally {
        (0, _utils.removeDirectory)(tmpDir);
      }
    }
  }, {
    key: "merge",
    value: function merge(prevCatalogs, nextCatalog, options) {
      var _this2 = this;

      var nextKeys = R.keys(nextCatalog).map(String);
      return R.mapObjIndexed(function (prevCatalog, locale) {
        var prevKeys = R.keys(prevCatalog).map(String);
        var newKeys = R.difference(nextKeys, prevKeys);
        var mergeKeys = R.intersection(nextKeys, prevKeys);
        var obsoleteKeys = R.difference(prevKeys, nextKeys); // Initialize new catalog with new keys

        var newMessages = R.mapObjIndexed(function (message, key) {
          return (0, _objectSpread2.default)({
            translation: _this2.config.sourceLocale === locale ? message.message || key : ""
          }, message);
        }, R.pick(newKeys, nextCatalog)); // Merge translations from previous catalog

        var mergedMessages = mergeKeys.map(function (key) {
          var updateFromDefaults = _this2.config.sourceLocale === locale && (prevCatalog[key].translation === prevCatalog[key].message || options.overwrite);
          var translation = updateFromDefaults ? nextCatalog[key].message : prevCatalog[key].translation;
          return (0, _defineProperty2.default)({}, key, (0, _objectSpread2.default)({
            translation: translation
          }, R.omit(["obsolete, translation"], nextCatalog[key])));
        }); // Mark all remaining translations as obsolete

        var obsoleteMessages = obsoleteKeys.map(function (key) {
          return (0, _defineProperty2.default)({}, key, (0, _objectSpread2.default)({}, prevCatalog[key], {
            obsolete: true
          }));
        });
        return R.mergeAll([newMessages].concat((0, _toConsumableArray2.default)(mergedMessages), (0, _toConsumableArray2.default)(obsoleteMessages)));
      }, prevCatalogs);
    }
  }, {
    key: "getTranslations",
    value: function getTranslations(locale, options) {
      var _this3 = this;

      var catalogs = this.readAll();
      return R.mapObjIndexed(function (value, key) {
        return _this3.getTranslation(catalogs, locale, key, options);
      }, catalogs[locale]);
    }
  }, {
    key: "getTranslation",
    value: function getTranslation(catalogs, locale, key, _ref4) {
      var fallbackLocale = _ref4.fallbackLocale,
          sourceLocale = _ref4.sourceLocale;

      var getTranslation = function getTranslation(locale) {
        return catalogs[locale][key].translation;
      };

      return (// Get translation in target locale
        getTranslation(locale) || // Get translation in fallbackLocale (if any)
        fallbackLocale && getTranslation(fallbackLocale) || // Get message default
        catalogs[locale][key].defaults || // If sourceLocale is either target locale of fallback one, use key
        sourceLocale && sourceLocale === locale && key || sourceLocale && fallbackLocale && sourceLocale === fallbackLocale && key || // Otherwise no translation is available
        undefined
      );
    }
  }, {
    key: "write",
    value: function write(locale, messages) {
      var filename = this.path.replace(LOCALE, locale) + this.format.catalogExtension;
      var created = !_fsExtra.default.existsSync(filename);

      var basedir = _path.default.dirname(filename);

      if (!_fsExtra.default.existsSync(basedir)) {
        _fsExtra.default.mkdirpSync(basedir);
      }

      this.format.write(filename, messages, {
        locale: locale
      });
      return [created, filename];
    }
  }, {
    key: "writeAll",
    value: function writeAll(catalogs) {
      var _this4 = this;

      this.locales.forEach(function (locale) {
        return _this4.write(locale, catalogs[locale]);
      });
    }
  }, {
    key: "writeCompiled",
    value: function writeCompiled(locale, compiledCatalog) {
      var filename = this.path.replace(LOCALE, locale) + ".js";

      var basedir = _path.default.dirname(filename);

      if (!_fsExtra.default.existsSync(basedir)) {
        _fsExtra.default.mkdirpSync(basedir);
      }

      _fsExtra.default.writeFileSync(filename, compiledCatalog);

      return filename;
    }
  }, {
    key: "read",
    value: function read(locale) {
      // Read files using previous format, if available
      var sourceFormat = this.config.prevFormat ? (0, _formats.default)(this.config.prevFormat) : this.format;
      var filename = this.path.replace(LOCALE, locale) + sourceFormat.catalogExtension;
      if (!_fsExtra.default.existsSync(filename)) return null;
      return sourceFormat.read(filename);
    }
  }, {
    key: "readAll",
    value: function readAll() {
      var _this5 = this;

      return R.mergeAll(this.locales.map(function (locale) {
        return (0, _defineProperty2.default)({}, locale, _this5.read(locale));
      }));
    }
  }, {
    key: "sourcePaths",
    get: function get() {
      var includeGlob = this.include.map(function (includePath) {
        return _path.default.join(includePath, "**", "*.*");
      });
      var patterns = includeGlob.length > 1 ? "{".concat(includeGlob.join("|")) : includeGlob[0];
      return _glob.default.sync(patterns, {
        ignore: this.exclude
      });
    }
  }, {
    key: "localeDir",
    get: function get() {
      var localePatternIndex = this.path.indexOf("{locale}");

      if (localePatternIndex === -1) {
        throw Error("Invalid catalog path: {locale} variable is missing");
      }

      return this.path.substr(0, localePatternIndex);
    }
  }, {
    key: "locales",
    get: function get() {
      return this.config.locales;
    }
  }]);
  return Catalog;
}();
/**
 * Parse `config.catalogs` and return a list of configured Catalog instances.
 */


exports.Catalog = Catalog;

function getCatalogs(config) {
  var catalogsConfig = config.catalogs;
  var catalogs = [];
  catalogsConfig.forEach(function (catalog) {
    // Validate that `catalogPath` doesn't end with trailing slash
    if (catalog.path.endsWith(_path.default.sep)) {
      var extension = (0, _formats.default)(config.format).catalogExtension;
      var correctPath = catalog.path.slice(0, -1);
      var examplePath = correctPath.replace(LOCALE, // Show example using one of configured locales (if any)
      (config.locales || [])[0] || "en") + extension;
      throw new Error( // prettier-ignore
      "Remove trailing slash from \"".concat(catalog.path, "\". Catalog path isn't a directory,") + " but translation file without extension. For example, catalog path \"".concat(correctPath, "\"") + " results in translation file \"".concat(examplePath, "\"."));
    }

    var include = ensureArray(catalog.include).map(function (path) {
      return normalizeRelativePath(path);
    });
    var exclude = ensureArray(catalog.exclude).map(function (path) {
      return normalizeRelativePath(path);
    }); // catalogPath without {name} pattern -> always refers to a single catalog

    if (!catalog.path.includes(NAME)) {
      // Validate that sourcePaths doesn't use {name} pattern either
      var invalidSource = include.filter(function (path) {
        return path.includes(NAME);
      })[0];

      if (invalidSource !== undefined) {
        throw new Error("Catalog with path \"".concat(catalog.path, "\" doesn't have a {name} pattern") + " in it, but one of source directories uses it: \"".concat(invalidSource, "\".") + " Either add {name} pattern to \"".concat(catalog.path, "\" or remove it") + " from all source directories.");
      } // catalog name is the last directory of catalogPath.
      // If the last part is {locale}, then catalog doesn't have an explicit name


      var name = function () {
        var _name = catalog.path.split(_path.default.sep).slice(-1)[0];
        return _name !== LOCALE ? _name : null;
      }();

      catalogs.push(new Catalog({
        name: name,
        path: normalizeRelativePath(catalog.path),
        include: include,
        exclude: exclude
      }, config));
      return;
    }

    var patterns = include.map(function (path) {
      return path.replace(NAME, "*");
    });

    var candidates = _glob.default.sync(patterns.length > 1 ? "{".concat(patterns.join(",")) : patterns[0], {
      ignore: exclude
    });

    candidates.forEach(function (catalogDir) {
      var name = _path.default.basename(catalogDir);

      catalogs.push(new Catalog({
        name: name,
        path: normalizeRelativePath(catalog.path.replace(NAME, name)),
        include: include.map(function (path) {
          return path.replace(NAME, name);
        }),
        exclude: exclude.map(function (path) {
          return path.replace(NAME, name);
        })
      }, config));
    });
  });
  return catalogs;
}

function getCatalogForFile(file, catalogs) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = catalogs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _catalog = _step.value;
      var regexp = new RegExp(_minimatch.default // convert glob pattern to regexp
      .makeRe(_catalog.path + _catalog.format.catalogExtension) // convert it back to string, so we can replace {locale} with regexp pattern
      .toString() // remove regexp delimiters
      .slice(1, -1).replace("\\{locale\\}", "([^/.]+)"));
      var match = regexp.exec(file);
      if (!match) continue;
      return {
        locale: match[1],
        catalog: _catalog
      };
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return null;
}
/**
 * Merge origins for messages found in different places. All other attributes
 * should be the same (raise an error if defaults are different).
 */


function mergeOrigins(msgId, prev, next) {
  if (prev.defaults !== next.defaults) {
    throw new Error("Encountered different defaults for message ".concat(_chalk.default.yellow(msgId)) + "\n".concat(_chalk.default.yellow((0, _utils.prettyOrigin)(prev.origin)), " ").concat(prev.defaults) + "\n".concat(_chalk.default.yellow((0, _utils.prettyOrigin)(next.origin)), " ").concat(next.defaults));
  }

  return (0, _objectSpread2.default)({}, next, {
    origin: R.concat(prev.origin, next.origin)
  });
}
/**
 * Ensure that value is always array. If not, turn it into an array of one element.
 */


var ensureArray = function ensureArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
};
/**
 * Remove ./ at the beginning: ./relative  => relative
 *                             relative    => relative
 * Preserve directories:       ./relative/ => relative/
 * Preserve absolute paths:    /absolute/path => /absolute/path
 */


function normalizeRelativePath(sourcePath) {
  // absolute path, do nothing
  if (sourcePath.startsWith("/")) return sourcePath; // preserve trailing slash for directories

  var isDir = sourcePath.endsWith("/");
  return _path.default.relative(process.cwd(), _path.default.resolve(sourcePath)) + (isDir ? "/" : "");
}

var cleanObsolete = R.filter(function (message) {
  return !message.obsolete;
});
/**
 * Object keys are in the same order as they were created
 * https://stackoverflow.com/a/31102605/1535540
 */

exports.cleanObsolete = cleanObsolete;

function orderByMessageId(messages) {
  var orderedMessages = {};
  Object.keys(messages).sort().forEach(function (key) {
    orderedMessages[key] = messages[key];
  });
  return orderedMessages;
}

function orderByOrigin(messages) {
  function getFirstOrigin(messageKey) {
    var sortedOrigins = messages[messageKey].origin.sort(function (a, b) {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });
    return sortedOrigins[0];
  }

  return Object.keys(messages).sort(function (a, b) {
    var _getFirstOrigin = getFirstOrigin(a),
        _getFirstOrigin2 = (0, _slicedToArray2.default)(_getFirstOrigin, 2),
        aFile = _getFirstOrigin2[0],
        aLineNumber = _getFirstOrigin2[1];

    var _getFirstOrigin3 = getFirstOrigin(b),
        _getFirstOrigin4 = (0, _slicedToArray2.default)(_getFirstOrigin3, 2),
        bFile = _getFirstOrigin4[0],
        bLineNumber = _getFirstOrigin4[1];

    if (aFile < bFile) return -1;
    if (aFile > bFile) return 1;
    if (aLineNumber < bLineNumber) return -1;
    if (aLineNumber > bLineNumber) return 1;
    return 0;
  }).reduce(function (acc, key) {
    acc[key] = messages[key];
    return acc;
  }, {});
}