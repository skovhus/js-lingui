"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var R = _interopRequireWildcard(require("ramda"));

var serialize = R.map(function (message) {
  return message.translation || "";
});
var deserialize = R.map(function (translation) {
  return {
    translation: translation,
    obsolete: false,
    message: null,
    origin: []
  };
});
var _default = {
  catalogExtension: ".json",
  write: function write(filename, catalog) {
    var messages = serialize(catalog);

    _fs.default.writeFileSync(filename, JSON.stringify(messages, null, 2));
  },
  read: function read(filename) {
    var raw = _fs.default.readFileSync(filename).toString();

    try {
      var rawCatalog = JSON.parse(raw);
      return deserialize(rawCatalog);
    } catch (e) {
      console.error("Cannot read ".concat(filename, ": ").concat(e.message));
      return null;
    }
  }
};
exports.default = _default;