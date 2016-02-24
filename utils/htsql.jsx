var HTSQL = {

  // These methods are used by both projects
  Filter: function(filters) {
    if (!filters) {
      return '';
    }
    return `.filter(${filters})`;
  },

  Sort: function(attr) {
    if (!attr) {
      return '';
    }
    return `.sort(${attr})`;
  },

  contains: function(attr, value) {
    if (!value) {
      return '';
    }

    return attr.map(function(attr) {
      return `contains(${attr}, '${value}')`;
    }).join(' | ');
  },

};

module.exports = HTSQL;
