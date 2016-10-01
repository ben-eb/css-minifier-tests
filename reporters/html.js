'use strict';

var sentence = require('underscore.string/toSentence');
var plur = require('plur');
var table = require('html-tableify');

var colours = {
    broken: '#f63123',
    crashed: '#f63123',
    'sub-optimal': '#f6c523',
};

function getColour (str) {
    if (colours[str]) {
        return '<span style="color: ' + colours[str] + '">' + str + '</span>';
    }
    return '<span style="color: #62f623">' + str + '</span>';
}

var minifiers;
var suites = [];

function onSuite (results, output) {
    var warnings = [];
    var htmlStr = '<h2>' + output.title + '</h2>';

    htmlStr += '<ul>\n' + Object.keys(results).sort().reduce(function (list, engine) {
        var warnable = function (e) {
            return e !== 'optimal' && e !== 'outstanding' && e !== 'crashed';
        };
        if (warnable(results[engine].result)) {
            warnings.push({
                engine: engine,
                result: results[engine].result,
                output: results[engine].output
            });
        }
        list += '<li>' + engine + ' ' + getColour(results[engine].result) + '</li>';
        return list;
    }, '') + '\n</ul>';

    warnings.reduce(function (list, warning) {
        var hasOutput = list.some(function (item) {
            return item.output === warning.output;
        });

        if (!hasOutput) {
            warning.engine = [warning.engine];
            list.push(warning);
        } else {
            for (var i = 0; i < list.length; i++) {
                if (list[i].output === warning.output) {
                    list[i].engine.push(warning.engine);
                }
            }
        }

        return list;
    }, []).forEach(function (warning) {
        htmlStr += '<p>' + sentence(warning.engine) +
                ' produced ' + ((warning.engine.length > 1) ? 'the same ' : '') +
                getColour(warning.result) + ' output:</p><pre><code>' +
                warning.output + '</code></pre>';
    });

    var optimal = output.optimal[0];

    var outputOptimal = optimal.length ? optimal : '<removed>';
    htmlStr += '<p>The expected optimal output is below:</p>' +
            '<pre><code>' + outputOptimal + '</code></pre>';
    suites.push(htmlStr);
};

function onEnd (results) {
    var totals = results.reduce(function (t, res) {
        Object.keys(res).forEach(function (engine) {
            if (!t[engine]) {
                t[engine] = {
                    outstanding: 0,
                    optimal: 0,
                    'sub-optimal': 0,
                    broken: 0,
                    crashed: 0
                };
            }
            t[engine][res[engine].result]++;
        });
        return t;
    }, {});

    var optimal = function (a, b) {
        var sortByOptimal = (
            (totals[b].outstanding + totals[b].optimal) -
            (totals[a].outstanding + totals[a].optimal)
        );
        if (sortByOptimal) {
            return sortByOptimal;
        }
        return (totals[a].crashed + totals[a].broken) -
            (totals[b].crashed + totals[b].broken);
    };

    var htmlStr = table(Object.keys(totals).sort(optimal).map(function (minifier) {
        var s = totals[minifier];
        return {
            engine: minifier,
            version: minifiers[minifier].version,
            optimal: s.outstanding + s.optimal,
            sub: s['sub-optimal'],
            broken: s.broken + s.crashed,
        };
    }), {
        headers: [{
            name: 'engine',
            align: 'left',
        }, {
            name: 'version',
            align: 'left',
        }, {
            title: 'optimal/outstanding',
            name: 'optimal',
        }, {
            title: 'sub-optimal',
            name: 'sub',
        }, {
            name: 'broken',
            title: 'broken/crashed'
        }],
    });

    console.log(
        '<!doctype html>\n',
        '<html>\n',
        '<head>\n',
            '<style>\n',
                'body { background: #33434d; color: #fff; font-family: sans-serif}',
                'h1, h2 { font-weight: normal }',
            '</style>\n',
        '</head>\n',
        '<body>',
        '<h1>Tests</h1>',
        suites.join('\n'),
        '<h1>Total</h1>',
        htmlStr,
        '<p>' +
            results.length +
            ' tests ran with ' +
            Object.keys(minifiers).length +
            plur(' compression engine', Object.keys(minifiers).length) + '.' +
        '</p>',
        '</body>\n',
        '</html>\n'
    );
};

module.exports = function getReporter (engines) {
    minifiers = engines;
    return {
        onSuite: onSuite,
        onEnd: onEnd,
    };
};
