var HTSQL = {};

HTSQL.And = function(a, b) {
  return a + ' & ' + b;
};

HTSQL.GE = function(a, b) {
  return a + '>=' + b;
};

HTSQL.LE = function(a, b) {
  return a + '<=' + b;
};

HTSQL.Between = function(attr, start, end) {
  return HTSQL.GE(attr, start) + ' & ' + HTSQL.LE(attr, end);
};

HTSQL.Quoted = function(string) {
  return "'" + string + "'";
};

HTSQL.Filter = function(filters) {
  if (!filters) {
    return '';
  }
  return `.filter(${filters})`;
};

HTSQL.SafeDivision = function(dividend, divisor) {
  return `if (${divisor} == 0, 0, ${dividend}/${divisor})`;
};

HTSQL.Sort = function(attr) {
  if (!attr) {
    return '';
  }
  return `.sort(${attr})`;
};

module.exports = HTSQL;
