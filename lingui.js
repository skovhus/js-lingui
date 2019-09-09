#!/usr/bin/env node
"use strict";

var _utils = require("./api/utils");

var program = require("commander");

var version;

try {
  version = require("./package.json").version;
} catch (e) {
  version = "dev";
}

program.version(version).command("init", "Install all required packages").command("extract [files...]", "Extracts messages from source files").command("compile", "Compile message catalogs").parse(process.argv);
(0, _utils.helpMisspelledCommand)(process.argv[2], program.commands);