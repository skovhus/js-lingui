"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compile = compile;
exports.createCompiledCatalog = createCompiledCatalog;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var t = _interopRequireWildcard(require("@babel/types"));

var _messageformatParser = require("messageformat-parser");

var _parser = require("@babel/parser");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _makePlural = _interopRequireDefault(require("make-plural"));

var _ramda = _interopRequireDefault(require("ramda"));

var _pseudoLocalize = _interopRequireDefault(require("./pseudoLocalize"));

var isString = function isString(s) {
  return typeof s === "string";
};

function compile(message) {
  var tokens;

  try {
    tokens = (0, _messageformatParser.parse)(message);
  } catch (e) {
    throw new Error("Can't parse message. Please check correct syntax: \"".concat(message, "\""));
  }

  var ast = processTokens(tokens);
  if (isString(ast)) return t.stringLiteral(ast);
  return ast;
}

function processTokens(tokens) {
  if (!tokens.filter(function (token) {
    return !isString(token);
  }).length) {
    return tokens.join("");
  }

  return t.arrayExpression(tokens.map(function (token) {
    if (isString(token)) {
      return t.stringLiteral(token); // # in plural case
    } else if (token.type === "octothorpe") {
      return t.stringLiteral("#"); // simple argument
    } else if (token.type === "argument") {
      return t.arrayExpression([t.stringLiteral(token.arg)]); // argument with custom format (date, number)
    } else if (token.type === "function") {
      var _params = [t.stringLiteral(token.arg), t.stringLiteral(token.key)];
      var format = token.params[0];

      if (format) {
        _params.push(t.stringLiteral(format));
      }

      return t.arrayExpression(_params);
    } // complex argument with cases


    var formatProps = [];

    if (token.offset) {
      formatProps.push(t.objectProperty(t.identifier("offset"), t.numericLiteral(parseInt(token.offset))));
    }

    token.cases.forEach(function (item) {
      var inlineTokens = processTokens(item.tokens);
      formatProps.push(t.objectProperty(t.identifier(item.key), isString(inlineTokens) ? t.stringLiteral(inlineTokens) : inlineTokens));
    });
    var params = [t.stringLiteral(token.arg), t.stringLiteral(token.type), t.objectExpression(formatProps)];
    return t.arrayExpression(params);
  }));
}

function buildExportStatement(expression) {
  var namespace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "cjs";

  if (namespace === "es") {
    return t.exportDefaultDeclaration(expression);
  } else {
    var exportExpression = null;
    var matches = namespace.match(/^(window|global)\.([^.\s]+)$/);

    if (namespace === "cjs") {
      exportExpression = t.memberExpression(t.identifier("module"), t.identifier("exports"));
    } else if (matches) {
      exportExpression = t.memberExpression(t.identifier(matches[1]), t.identifier(matches[2]));
    } else {
      throw new Error("Invalid namespace param: \"".concat(namespace, "\""));
    }

    return t.expressionStatement(t.assignmentExpression("=", exportExpression, expression));
  }
}

function createCompiledCatalog(locale, messages, _ref) {
  var _ref$strict = _ref.strict,
      strict = _ref$strict === void 0 ? false : _ref$strict,
      _ref$namespace = _ref.namespace,
      namespace = _ref$namespace === void 0 ? "cjs" : _ref$namespace,
      pseudoLocale = _ref.pseudoLocale;

  var _locale$split = locale.split(/[_-]/),
      _locale$split2 = (0, _slicedToArray2.default)(_locale$split, 1),
      language = _locale$split2[0];

  var pluralRules = _makePlural.default[language];

  if (locale === pseudoLocale) {
    pluralRules = _makePlural.default["en"];
  }

  var compiledMessages = _ramda.default.keys(messages).map(function (key) {
    var translation = messages[key] || (!strict ? key : "");

    if (locale === pseudoLocale) {
      translation = (0, _pseudoLocalize.default)(translation);
    }

    return t.objectProperty(t.stringLiteral(key), compile(translation));
  });

  var localeData = [t.objectProperty(t.stringLiteral("plurals"), (0, _parser.parseExpression)(pluralRules.toString()))];
  var ast = buildExportStatement(t.objectExpression([// language data
  t.objectProperty(t.identifier("localeData"), t.objectExpression(localeData)), // messages
  t.objectProperty(t.identifier("messages"), t.objectExpression(compiledMessages))]), namespace);
  return "/* eslint-disable */" + (0, _generator.default)(ast, {
    minified: true
  }).code;
}