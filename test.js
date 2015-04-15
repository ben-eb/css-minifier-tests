'use strict';

var fs = require('fs');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var humanize = require('underscore.string/humanize');
var path = require('path');
var assign = require('object-assign');
var keyContains = require('./lib/keyContains');
var args = require('minimist')(process.argv.slice(2));

function TestSuite (options) {
    this.minifiers = options.minifiers;
    EventEmitter.call(this);
}

inherits(TestSuite, EventEmitter);

TestSuite.prototype.getMinifiers = function () {
    return this.minifiers;
};

TestSuite.prototype.runTest = function (options) {
    var parsed;

    try {
        parsed = options.fn(options.fixture);
    } catch (e) {
        this.emit('crashed', { engine: options.engine, error: e });
        return;
    }

    var status = {
        engine: options.engine,
        output: parsed
    };

    var grade = function (key) {
        return typeof key !== 'undefined' && key.indexOf(parsed) > -1;
    };

    if (grade(options.outstanding)) {
        this.emit('outstanding', status);
    } else if (grade(options.optimal)) {
        this.emit('optimal', status);
    } else if (grade(options.broken)) {
        this.emit('broken', status);
    } else {
        this.emit('sub-optimal', status);
    }

    return;
};

TestSuite.prototype.runSuite = function (options) {
    var suiteName = humanize('Testing ' + options.title);
    var minifiers = this.getMinifiers();
    this.emit('suite start', suiteName);
    Object.keys(minifiers).forEach(function (m) {
        this.runTest({
            engine: m,
            fn: minifiers[m],
            fixture: options.fixture,
            optimal: keyContains(options, 'optimal'),
            broken: keyContains(options, 'broken'),
            outstanding: keyContains(options, 'outstanding')
        });
    }, this);
    this.emit('suite end', options.optimal);
};

var minifiers = require('css-minifiers');

Object.keys(minifiers).forEach(function (key) {
    if (args.engines && !~args.engines.split(',').indexOf(key)) {
        delete minifiers[key];
    }
});

var testSuite = new TestSuite({minifiers: minifiers});

require('./reporter')(testSuite);

var tests = fs.readdirSync('./tests').map(function (dir) {
    return './tests/' + dir;
});

function toInteger (str) {
    return parseInt(str, 10);
}

if (args.suites) {
    tests = tests.filter(function (test) {
        var suites = ('' + args.suites).split(',').map(toInteger);
        var testNumber = toInteger(path.basename(test).split('-')[0]);
        return ~suites.indexOf(testNumber);
    });
}

tests.forEach(function (test) {
    testSuite.runSuite(assign({
        title: path.basename(test)
    }, fs.readdirSync(test).reduce(function (config, item) {
        if (~item.indexOf('.css')) {
            var file = fs.readFileSync(path.join(test, item), 'utf-8');
            config[path.basename(item, '.css')] = file;
        }
        return config;
    }, {})));
});

testSuite.emit('finished');
