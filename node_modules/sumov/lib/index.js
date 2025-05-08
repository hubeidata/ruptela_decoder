'use strict';

/**
 * Checks if value is a number
 * 
 * Additional check for "is not an object",
 * because arrays like [1] can pass as numbers
 * 
 * @param {Number} value
 * @returns {Boolean}
 */
function isNumber(value) {
    return isFinite(value) &&
            !isNaN(parseFloat(value)) &&
            !isObject(value);
}

/**
 * Checks if value is an object
 * 
 * @param {Object} value
 * @returns {Boolean}
 */
function isObject(value) {
    return value === Object(value);
}

/**
 * Recursive function that computes the sum
 * of all numeric values in an object
 * 
 * @param {Object} object
 * @param {Integer} depth
 * @param {Integer} level
 * @returns {Number}
 */
function sumObjectValues(object, depth, level = 1) {
    let sum = 0;
    for (const i in object) {
        const value = object[i];
        if (isNumber(value)) {
            sum += parseFloat(value);
        } else if (isObject(value) && (depth < 1 || depth > level)) {
            sum += sumObjectValues(value, depth, ++level);
            --level;
        }
    }
    return sum;
}

/**
 * Computes the sum of all numeric values in an object
 * 
 * @param {Object} object
 * @param {Integer} depth
 * @returns {Number}
 * @example
 *
 * sumov({a: 2, b: ["2", null, [], {a: {a: -1.0}}], c: {quick: "maths"}});
 * // => 3
 * 
 * //sum up to 2 levels
 * sumov({a: 2, b: ["2", null, [], {a: {a: -1.0}}], c: {quick: "maths"}}, 2);
 * // => 4
 */
function sumov(object, depth = 0) {
    if (isNumber(object)) {
        return parseFloat(object);
    } else if (isObject(object) && Number.isInteger(depth)) {
        return sumObjectValues(object, depth);
    }
    return 0;
}

/**
 * Expose function
 */
module.exports = sumov;