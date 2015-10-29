var equals = require('./equals');

/* Verifies if the row is in the array
 *
 * @param array: Is where will be looked for the second param
 * @param row: We want to know if this param (normally a row from a table) match
 * with the data from an array.
 * Returns true if they matched.
 *
 */

module.exports = function (array, row) {
  return array.some(function(object) {
    return equals(row, object);
  });
};
