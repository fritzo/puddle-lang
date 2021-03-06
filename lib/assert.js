'use strict';

var _ = require('lodash');

var TOL = 1e-8;

/** @constructor */
var AssertException = function (message) {
    this.message = message || '(unspecified)';
};

AssertException.prototype.toString = function () {
    return 'Assertion Failed: ' + this.message;
};

var assert = function (condition, message) {
    if (!condition) {
        throw new AssertException(message);
    }
};

assert.Exception = AssertException;

assert.equal = function (actual, expected, message) {
    assert(_.isEqual(actual, expected),
        (message || '') +
        '\n  actual = ' + JSON.stringify(actual) +
        '\n  expected = ' + JSON.stringify(expected));
};

assert.close = function (x, y, message) {
    message = message || 'Not close:';
    assert.equal(typeof x, typeof y);
    if (_.isNumber(x)) {
        assert(Math.abs(x - y) < TOL,
            message +
            '\n  actual = ' + JSON.stringify(x) +
            '\n  expected = ' + JSON.stringify(y));
    } else if (_.isArray(x)) {
        assert.equal(x.length, y.length, message + ' lengths differ');
        _.each(x, function (actual, pos) {
            var expected = y[pos];
            assert.close(actual, expected, message + ' [' + pos + ']');
        });
    } else if (_.isObject(x)) {
        assert.equal(_.keys(x).sort(), _.keys(y).sort(), ' keys differ');
        _.each(x, function (actual, key) {
            var expected = y[key];
            assert.close(actual, expected, message + ' [' + key + ']');
        });
    } else {
        assert.equal(x, y, message);
    }
};

assert.forward = function (fwd, pairs) {
    pairs.forEach(function (pair, lineno) {
        try {
            assert.equal(fwd(pair[0]), pair[1]);
        } catch (e) {
            e.message += '\nforward example ' + (1 + lineno);
            throw e;
        }
    });
};

assert.backward = function (bwd, pairs) {
    pairs.forEach(function (pair, lineno) {
        try {
            assert.equal(bwd(pair[1]), pair[0]);
        } catch (e) {
            e.message += '\nbackward example ' + (1 + lineno);
            throw e;
        }
    });
};

assert.inverses = function (fwd, bwd, items) {
    items.forEach(function (item, lineno) {
        try {
            assert.equal(bwd(fwd(item)), item);
        } catch (e) {
            e.message += '\ninverses example ' + (1 + lineno);
            throw e;
        }
    });
};

assert.injects = function (fwd, items) {
    var seen = {};
    items.forEach(function (item) {
        var result = fwd(item);
        assert(
            !_.has(seen, result),
            'duplicate result:' +
            '\n  ' + JSON.stringify(seen[result]) +
            '\n  ' + JSON.stringify(item) +
            '\nboth map to ' +
            '\n  ' + result);
        seen[result] = item;
    });
};

module.exports = assert;
