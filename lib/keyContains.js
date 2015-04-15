'use strict';

module.exports = function keyContains(object, str) {
    return Object.keys(object).reduce(function (memo, key) {
        if (~key.indexOf(str)) {
            memo.push(object[key]);
        }
        return memo;
    }, []);
};
