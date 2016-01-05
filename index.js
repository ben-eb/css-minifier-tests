'use strict';

var fs = require('fs');
var path = require('path');
var keyContains = require('./lib/keyContains');
var humanize = require('underscore.string/humanize');

function noop () {}

module.exports = function (options) {
    var tests = options.tests;
    var minifiers = options.minifiers;
    var onSuite = options.onSuite || noop;
    var onEnd = options.onEnd || noop;

    var suites = [];
    var testNames = [];
    tests.forEach(function (test) {
        suites.push(new Promise(function (resolve) {
            var opts = fs.readdirSync(test).reduce(function (config, item) {
                if (~item.indexOf('.css')) {
                    var file = fs.readFileSync(path.join(test, item), 'utf-8');
                    config[path.basename(item, '.css')] = file;
                }
                return config;
            }, {});

            var output = {
                fixture: opts.fixture,
                optimal: keyContains(opts, 'optimal'),
                broken: keyContains(opts, 'broken'),
                outstanding: keyContains(opts, 'outstanding'),
                title: humanize(path.basename(test))
            };

            testNames.push(output.title);

            var promises = [];
            var results = {};

            Object.keys(minifiers).forEach(function (minifier) {
                promises.push(minifiers[minifier](opts.fixture).then(function (css) {
                    var grade = function (key) {
                        return typeof key !== 'undefined' && ~key.indexOf(css);
                    };

                    results[minifier] = {result: 'sub-optimal', output: css};

                    if (grade(output.outstanding)) {
                        results[minifier].result = 'outstanding';
                    } else if (grade(output.optimal)) {
                        results[minifier].result = 'optimal';
                    } else if (grade(output.broken)) {
                        results[minifier].result = 'broken';
                    }
                }, function (err) {
                    results[minifier] = {result: 'crashed', err: err};
                }).then(function () {
                    return results;
                }));
            });

            var getResults = function () {
                return resolve(results);
            };

            Promise.all(promises).then(function () {
                onSuite(results, output);
            }).then(getResults).catch(getResults);
        }));
    });

    Promise.all(suites).then(function (results) {
        onEnd(results, testNames);
    });
};
