import React from 'react';
import moment from 'moment';

let Utils = {

  formatters: {
    alpha: function(value){
      if(!value) return "N/A";
      return value;
    },

    numeric: function(value) {
      value = parseFloat(value) || 0.0;
      if (value % 1 === 0) {
        return value.toLocaleString('pt-br');
      }
      let rounded = parseFloat(value).toFixed(3);
      return parseFloat(rounded).toLocaleString('pt-br');
    },

    currency: function(value) {
      value = parseFloat(value) || 0.0;
      let formattedValue = Math.abs(value).toLocaleString('pt-br', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      if (value < 0)
        return '-R$ ' + formattedValue;
      return 'R$ ' + formattedValue;
    },

    datetime: function(value) {
      if (!value) {
        return '';
      }
      return moment(value).format('L LTS');
    },

    date: function(value) {
      if (!value) {
        return '';
      }
      return moment(value).format('L');
    },

    phone: function(value) {
      if (!value) {
        return '';
      }
      let digits = value.length;
      if (digits === 3 || digits === 4) {
        return value;
      }
      else if (digits === 5) {
        return `${value.substring(0, 3)}-${value.substring(3)}`;
      }
      else if (digits === 7) {
        return `${value.substring(0, 3)}-${value.substring(3, 7)}`;
      }
      else if (digits === 8) {
        return `${value.substring(0, 4)}-${value.substring(4, 8)}`;
      }
      else if (digits === 9) {
        return `${value.substring(0, 5)}-${value.substring(5, 9)}`;
      }
      else if (digits === 10) {
        if (["0300", "0500", "0800", "0900"].indexOf(value.substring(0, 4)) != -1){
          return `${value.substring(0, 4)} ${value.substring(4, 7)}-${value.substring(7)}`;
        }
        return `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6, 10)}`;
      }
      else if (digits === 11) {
        if (["0300", "0500", "0800", "0900"].indexOf(value.substring(0, 4)) != -1){
          return `${value.substring(0, 4)} ${value.substring(4, 7)}-${value.substring(7)}`;
        }
        else if (value.substring(0, 1) === '0') {
          return `(${value.substring(1, 3)}) ${value.substring(3, 7)}-${value.substring(7, 11)}`;
        }
        else {
          return `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
        }
      }
      else if (digits === 12) {
        if (value.substring(0, 1) === '0'){
          value = value.substring(1);
        }
        return `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
      }

      return value;
    },

    percentage: function(value) {
      value = parseFloat(value) || 0.0;
      let formattedValue = Math.abs(value).toLocaleString('pt-br', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      if (value < 0)
        return '-' + formattedValue + ' %';
      return formattedValue + ' %';
    },

    bool: function(value) {
      if (value) {
        return React.createElement('i', {className: 'fa fa-check'}, null);
      }
      return <i className="fa fa-times low-opacity"/>;
    },

    invoice: number => number,
  },

  get: function(dictionary, keys) {
    keys = keys.split('.');
    var retval = dictionary;
    for (var i = 0; i < keys.length; i++) {
      retval = retval[keys[i]];
    }
    return retval;
  },

  colors: [
    '#4D5360',
    '#E67A77',
    '#D9DD81',
    '#79D1CF',
    '#95D7BB',

    // Tango palette
    '#c4a000',
    '#ce5c00',
    '#8f5902',
    '#4e9a06',
    '#204a87',
    '#5c3566',
    '#a40000',
    '#babdb6',
  ],

  highlights: [
    '#4D5360',
    '#E67A77',
    '#D9DD81',
    '#79D1CF',
    '#95D7BB',

    '#edd400',
    '#fcaf3e',
    '#e9b96e',
    '#8ae234',
    '#729fcf',
    '#ad7fa8',
    '#ef2929',
    '#eeeeec',
  ],

  getColor: function(i, highlight) {
    if (highlight === true) {
      return this.highlights[i];
    } else {
      return this.colors[i];
    }
  },

  /**
   * Returns all URL query string params
   */
  getParams: function() {
    var query = location.href.split('?')[1];
    return this.parseQuery(query);
  },

  parseQuery: function(querystring) {
    if (querystring === undefined) {
      return {};
    }

    var query = {};
    var vars = querystring.split("&");
    for (var i = 0; i < vars.length ; i++) {
      var pair = vars[i].split("=");
      if (pair.length < 2) {
        continue;
      }

      // Decodes the result string
      pair[1] = pair[1].replace(/\+/g, ' ');
      pair[1] = decodeURIComponent(pair[1]);
      query[pair[0]] = pair[1];
    }
    return query;
  },

  getDaterangeQuery: function(start, end) {
    return start.format('YYYY-MM-DD') + 'to' + end.format('YYYY-MM-DD');
  },

  parseDaterange: function(string) {
    if (!string) {
      return null;
    }
    var dates = string.split('to');
    return {
      start: dates[0] ? moment(dates[0]) : null,
      end: dates[1] ? moment(dates[1]) : null,
    };
  },

  getRandomString: function() {
    return Math.random().toString(32).split('.')[1];
  },

  generateDateSeries: function(start, end, increment, grouping) {
    if (start.isAfter(end))
      return [];
    var series = [start];
    while (!series[series.length - 1].isSameOrAfter(end, grouping)) {
      var last = moment(series[series.length - 1]);
      series.push(last.add(increment, grouping));
    }
    return series;
  },

  /* Encodes strings
   *
   * This is primarily used to build HTSQL attribute names by parsing their
   * raw query code. This will behave naively replacing invalid identifier
   * characters for two underscores when on DEBUG mode and performing a
   * base64 conversion on production
   *
   * @sa decode
   */
  encode: function(string) {
    return btoa(string).replace(/=/g, '');
  },

  /* Decodes strings
   *
   * Used to recover a previously encoded string with a StoqUtils.encode.
   *
   * @sa encode
   */
  decode: function(string) {
    return atob(string);
  },

  /* Escape HTSQL single quotes so that it does not crash HTSQL evaluation */
  escape: function(string) {
    return string && string.replace(/'/g, "''");
  },
};

/* Bind the formatters with their parent for getting access to it's properties */
Object.keys(Utils.formatters).forEach(function(key) {
  if (typeof Utils.formatters[key] === 'function') {
    Utils.formatters[key] = Utils.formatters[key].bind(Utils);
  }
});

module.exports = Utils;
