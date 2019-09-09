"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _default = {
  catalogExtension: ".json",
  write: function write(filename, catalog) {
    _fs.default.writeFileSync(filename, JSON.stringify(catalog, null, 2));
  },
  read: function read(filename) {
    var raw = _fs.default.readFileSync(filename).toString();

    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Cannot read ".concat(filename, ": ").concat(e.message));
      return null;
    }
  }
};
exports.default = _default;