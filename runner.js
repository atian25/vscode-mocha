'use strict';

const
  escapeRegExp = require('escape-regexp'),
  MochaShim = require('./mochashim'),
  path = require('path'),
  vscode = require('vscode');

function Runner() {
  this.tests = [];
  this.lastRunResult = null;
}

Runner.prototype.loadTestFiles = function () {
  return MochaShim.findTests(vscode.workspace.rootPath)
    .then(tests => {
      this.tests = tests;

      return tests;
    });
};

Runner.prototype._runMocha = function (testFiles, grep) {
  return MochaShim.runTests(dedupeStrings(testFiles), grep)
    .then(result => {
      this.lastRunResult = result;

      const numFailed = (result.failed || []).length;

      numFailed && vscode.window.showWarningMessage(`There are ${numFailed} failed test${numFailed > 1 ? 's': ''}.`);
    },
    err => {
      console.error(err);
      throw err;
    });
};

Runner.prototype.runAll = function () {
  return this._runMocha(this.tests.map(test => test.file));
};

Runner.prototype.runWithGrep = function (grep) {
  return this._runMocha(this.tests.map(test => test.file), grep);
};

Runner.prototype.runTest = function (test) {
  return this._runMocha([ test.file ], `^${escapeRegExp(test.fullName)}$`);
};

Runner.prototype.runFailed = function () {
  const failed = ((this.lastRunResult || {}).failed || []);

  if (!failed.length) {
    vscode.window.showWarningMessage(`No tests failed in last run.`);

    return new Promise(resolve => resolve());
  } else {
    return this._runMocha(
      dedupeStrings(failed.map(test => test.file)),
      `^${failed.map(test => `(${escapeRegExp(test.fullName)})`).join('|')}$`
    )
  }
};

function dedupeStrings(array) {
  const keys = {};

  array.forEach(key => { keys[key] = 0; });

  return Object.keys(keys);
}

module.exports = Runner;
