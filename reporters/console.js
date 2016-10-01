'use strict';

var chalk = require('chalk');
var sentence = require('underscore.string/toSentence');
var table = require('text-table');
var plur = require('plur');

var colours = {
    broken: 'red',
    crashed: 'red',
    'sub-optimal': 'yellow',
};

function getColour (str) {
    if (colours[str]) {
        return chalk[colours[str]](str);
    }
    return chalk.green(str);
}

function divider () {
    return console.log(chalk.gray(new Array(80).join('—')));
}

var minifiers;

function onSuite (results, output) {
    var warnings = [];
    console.log(chalk.underline('Testing ' + output.title));

    console.log(table(Object.keys(results).sort().map(function (engine) {
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
        return ['  ' + engine, getColour(results[engine].result)];
    })));

    if (!warnings.length) {
        return console.log();
    }

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
        console.log('\n',
            '',
            sentence(warning.engine),
            chalk.gray('produced' + ((warning.engine.length > 1) ? ' the same' : '')),
            getColour(warning.result),
            chalk.gray('output:'),
            '\n ', warning.output
        );
    });

    var optimal = output.optimal[0];

    var outputOptimal = optimal.length ? optimal : chalk.gray('<removed>');
    console.log(
        '\n ',
        chalk.gray('The expected'),
        getColour('optimal'),
        chalk.gray('output is below:'),
        '\n ', outputOptimal
    );
    console.log();
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

    divider();

    console.log(table(Object.keys(totals).sort(optimal).map(function (m, index) {
        var s = totals[m];
        return [
            '  ' + (index + 1) + '.',
            m + '@' + minifiers[m].version,
            chalk.green(s.outstanding + s.optimal), '·',
            chalk.yellow(s['sub-optimal']), '·',
            chalk.red(s.broken + s.crashed)
        ];
    })));

    divider();

    console.log(
        results.length +
        ' tests ran with ' +
        Object.keys(minifiers).length +
        plur(' compression engine', Object.keys(minifiers).length) + '.'
    );
};

module.exports = function getReporter (engines) {
    minifiers = engines;
    return {
        onSuite: onSuite,
        onEnd: onEnd,
    };
};
