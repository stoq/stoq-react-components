/* Return the type of the param
 *
 * If the type is an Array return a string that says 'array'
 * If param is null return a string that says 'null'
 * Else return the type of the param
 */
function typeOf(duck) {
  if (Array.isArray(duck)) {
    return 'array';
  }
  if (duck === null) {
    return 'null';
  }
  return typeof duck;
}

/* Returns true if object a includes object b properties
 *
 * Compare all attributes from object A with object B, if all attr are equals
 * so both objects are too
 */
function objectIncludes(a, b) {
  return Object.keys(b).every(function(key) {
    if (key[0] === '_') {
      return true;
    }
    return equals(a[key], b[key]);
  });
}

function objectEquals(a, b) {
  return objectIncludes(a, b) && objectIncludes(b, a);
}

function arrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  // compare all elements of array A with all elements of array B
  return a.every(function(aAttr, index) {
    return equals(aAttr, b[index]);
  });
}

// Compare if all attributes from A and B are equals
function equals(a, b) {
  // Compare if types between attributes are equals
  if (typeOf(a) !== typeOf(b)) {
    return false;
  }
  // Compare if both are arrays and if they are equals
  // If dont, compare if both are objects and if they are equals
  else if (typeOf(a) === 'array') {
    return arrayEquals(a, b);
  } else if (typeOf(a) === 'object') {
    return objectEquals(a, b);
  }
  // Return true if attr are equals and false if they are not
  return a === b;
}

module.exports = equals;
