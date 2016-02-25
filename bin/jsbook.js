#!/usr/bin/env node

var program = require('commander');
var jsbook = require('../index.js');

program.version('0.1');

program
  .command('help')
  .description('show help')
  .action(function () {
      program.outputHelp();
  });

program
  .command('build')
  .description('convert pdf files to html books')
  .action(function () {
      jsbook.build(false, false);
  });

program
  .command('html')
  .description('rebuild html books')
  .action(function () {
      jsbook.build(false, true);
  });

program
  .command('whtml')
  .description('rebuild html books in current working directory')
  .action(function () {
      jsbook.build(true, true);
  });

program
  .command('apdf <apdf>')
  .description('build a pdf file to html book in current working directory')
  .action(function (apdf) {
      jsbook.build(false, false, false, apdf);
  });

program.parse(process.argv);
