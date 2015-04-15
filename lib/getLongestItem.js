'use strict';

module.exports = function getLongestItem (list) {
    return Math.max.apply(Math, list.map(function (item) {
        return item.length;
    }));
};
