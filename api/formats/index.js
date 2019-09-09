"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFormat;

var _lingui = _interopRequireDefault(require("./lingui"));

var _minimal = _interopRequireDefault(require("./minimal"));

var _po = _interopRequireDefault(require("./po"));

var formats = {
  lingui: _lingui.default,
  minimal: _minimal.default,
  po: _po.default
};

function getFormat(name) {
  var format = formats[name];

  if (!format) {
    throw new Error("Unknown format \"".concat(name, "\". Use one of following: ").concat(Object.keys(formats).join(", ")));
  }

  return format;
}