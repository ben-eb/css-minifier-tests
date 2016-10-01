'use strict';

var fs = require('fs');
var path = require('path');
var suite = require('.');
var minifiers = require('css-minifiers');
var args = require('minimist')(process.argv.slice(2), {
    default: {
        reporter: 'console'
    }
});

function toInteger (str) {
    return parseInt(str, 10);
}

var tests = fs.readdirSync('./tests').map(function (dir) {
    return './tests/' + dir;
});

if (args.suites) {
    tests = tests.filter(function (test) {
        var suites = ('' + args.suites).split(',').map(toInteger);
        var testNumber = toInteger(path.basename(test).split('-')[0]);
        return ~suites.indexOf(testNumber);
    });
}

Object.keys(minifiers).forEach(function (key) {
    if (args.engines && !~args.engines.split(',').indexOf(key)) {
        delete minifiers[key];
    }
});

var reporter = require('./reporters/' + args.reporter)(minifiers);

suite({
    tests: tests,
    minifiers: minifiers,
    onSuite: reporter.onSuite,
    onEnd: reporter.onEnd
});
