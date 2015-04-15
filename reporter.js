'use strict';

var assign = require('object-assign');
var chalk = require('chalk');
var pad = require('underscore.string/rpad');
var sentence = require('underscore.string/toSentence');

function formatNumber (num, color) {
    var formatted = ('···' + num).slice(-3);
    return formatted.replace(/(·+)?(\d+?)/g, function (match, dot, count) {
        if (dot) {
            return chalk.gray(dot) + chalk[color](count);
        }
        return chalk[color](count);
    });
}

function divider () {
    return console.log(chalk.gray(new Array(80).join('—')));
}

module.exports = function (runner) {
    var suites = 0;
    var minifiers = runner.getMinifiers();
    var longestName = require('./lib/getLongestItem')(Object.keys(minifiers));
    var warnings = [];

    var stats = Object.keys(minifiers).reduce(function (memo, key) {
        memo[key] = {
            'outstanding': 0,
            'optimal': 0,
            'sub-optimal': 0,
            'broken': 0,
            'crashed': 0
        };
        return memo;
    }, {});

    console.log();

    runner.on('suite start', function (title) {
        suites++;
        console.log(chalk.underline(title));
    });

    runner.on('outstanding', function (options) {
        stats[options.engine].outstanding ++;
        console.log(' ', pad(options.engine, longestName), chalk.green('outstanding'));
    });

    runner.on('optimal', function (options) {
        stats[options.engine].optimal ++;
        console.log(' ', pad(options.engine, longestName), chalk.green('optimal'));
    });

    runner.on('sub-optimal', function (options) {
        stats[options.engine]['sub-optimal'] ++;
        warnings.push(assign({ type: chalk.yellow('sub-optimal') }, options));
        console.log(' ', pad(options.engine, longestName), chalk.yellow('sub-optimal'));
    });

    runner.on('broken', function (options) {
        stats[options.engine].broken ++;
        warnings.push(assign({ type: chalk.red('broken') }, options));
        console.log(' ', pad(options.engine, longestName), chalk.red('broken'));
    });

    runner.on('crashed', function (options) {
        stats[options.engine].crashed ++;
        console.log(' ', pad(options.engine, longestName), chalk.red('crashed'));
    });

    runner.on('suite end', function (optimal) {
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
                warning.type,
                chalk.gray('output:'));

            console.log(' ', warning.output);
        });
        var outputOptimal = optimal.length ? optimal : chalk.gray('<removed>');
        console.log(
            '\n ',
            chalk.gray('The expected'),
            chalk.green('optimal'),
            chalk.gray('output is below:'),
            '\n ', outputOptimal
        );
        warnings = [];
        return console.log();
    });

    var optimal = function (a, b) {
        var sortByOptimal = (
            (stats[b].outstanding + stats[b].optimal) -
            (stats[a].outstanding + stats[a].optimal)
        );
        if (sortByOptimal) {
            return sortByOptimal;
        }
        return (stats[a].crashed + stats[a].broken) -
            (stats[b].crashed + stats[b].broken);
    };

    runner.on('finished', function () {
        var count = Object.keys(minifiers).length;
        var tools = count === 1 ? 'compression tool.' : 'compression tools.';
        var tests = suites === 1 ? 'test ran with' : 'tests ran with';
        divider();
        Object.keys(stats).sort(optimal).forEach(function (m, index) {
            var s = stats[m];
            console.log(
                ' ', pad((index + 1) + '.', 3),
                pad(m + '@' + minifiers[m].version, longestName + 8),
                formatNumber(s.outstanding + s.optimal, 'green'), '·',
                formatNumber(s['sub-optimal'], 'yellow'), '·',
                formatNumber(s.broken + s.crashed, 'red')
            );
        });
        divider();
        console.log(
            chalk.green('Done.'),
            suites,
            tests,
            '' + count,
            tools
        );
    });
};
