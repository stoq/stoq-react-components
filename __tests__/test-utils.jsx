jest.dontMock('../utils.jsx');

var moment = require('moment');
var Utils = require('../utils.jsx');

describe('Formatters', () => {

  it('Formats alphanumeric values correctly', () => {
    expect(Utils.formatters.alpha('Test String 123')).toBe('Test String 123');
    expect(Utils.formatters.alpha()).toBe('N/A');
  });

  it('Formats datetime values correctly', () => {
    expect(Utils.formatters.datetime('2001-01-01 01:01:01.554378')).toBe('01/01/2001 1:01:01 AM');
    expect(Utils.formatters.datetime('2001-01-01 01')).toBe('01/01/2001 1:00:00 AM');
  });

  it('Formats date values correctly', () => {
    expect(Utils.formatters.date('2001-01-01 01:01:01.554378')).toBe('01/01/2001');
    expect(Utils.formatters.date('2005-01-01 01')).toBe('01/01/2005');
  });

  it('Formats phone values correctly', () => {
    expect(Utils.formatters.phone()).toBe('');
    expect(Utils.formatters.phone('999')).toBe('999');
    expect(Utils.formatters.phone('99999')).toBe('999-99');
    expect(Utils.formatters.phone('9999999')).toBe('999-9999');
    expect(Utils.formatters.phone('99999999')).toBe('9999-9999');
    expect(Utils.formatters.phone('999999999')).toBe('99999-9999');
    expect(Utils.formatters.phone('0800999999')).toBe('0800 999-999');
    expect(Utils.formatters.phone('9999999999')).toBe('(99) 9999-9999');
    expect(Utils.formatters.phone('08009999999')).toBe('0800 999-9999');
    expect(Utils.formatters.phone('09999999999')).toBe('(99) 9999-9999');
    expect(Utils.formatters.phone('99999999999')).toBe('(99) 99999-9999');
    expect(Utils.formatters.phone('099999999999')).toBe('(99) 99999-9999');
    expect(Utils.formatters.phone('999999999999')).toBe('(99) 99999-9999');
    expect(Utils.formatters.phone('99999999999999')).toBe('99999999999999');
  });

  it('Formats boolean values correctly', () => {
    expect(Utils.formatters.bool(true).props.className).toContain('fa-check');
    expect(Utils.formatters.bool(false).props.className).toContain('fa-times');
  });

  // TODO: Test numeric, currency and percentage formatters
});

describe('Utils Methods', () => {

  it('Parses query string into object', () => {
    var queryString = 'param1=1&param2=test';
    expect(Utils.parseQuery(queryString)).toEqual({param1: '1', param2: 'test'});
    expect(Utils.parseQuery()).toEqual({});
  });

  it('Returns url params as object', () => {
    // We can't change location.href directly since jsdom@8:
    //
    // https://github.com/facebook/jest/issues/890
    Object.defineProperty(window.location, 'href', {
      writable: true,
      value: "http://localhost:9999?param1=1&param2=test",
    });

    expect(Utils.getParams()).toEqual({param1: '1', param2: 'test'});
  });

  it('Builds daterange query', () => {
    expect(Utils.getDaterangeQuery(moment('01012001', 'DDMMYYYY'), moment('02022001', 'DDMMYYYY'))).toBe('2001-01-01to2001-02-02');
  });

  it('Builds date object based on daterange query', () => {
    expect(Utils.parseDaterange('2001-01-01to2001-02-02')).toEqual({start: moment('2001-01-01'), end: moment('2001-02-02')});
    expect(Utils.parseDaterange('')).toBeNull();
  });

  it('Generates date series', () => {
    // Grouping by day
    var series = Utils.generateDateSeries(moment('01012001', 'DDMMYYYY'), moment('08012001', 'DDMMYYYY'), 1,  'day');
    var allDatesCorrect = series.every((date, index) => {
      return date.format('D/MM/YYYY') == `${index+1}/01/2001`;
    });
    expect(allDatesCorrect).toBeTruthy();

    // Grouping by month
    series = Utils.generateDateSeries(moment('01012001', 'DDMMYYYY'), moment('01052001', 'DDMMYYYY'), 1,  'month');
    allDatesCorrect = series.every((date, index) => {
      return date.format('DD/M/YYYY') == `01/${index+1}/2001`;
    });
    expect(allDatesCorrect).toBeTruthy();

    // Grouping by year, 2 years interval
    series = Utils.generateDateSeries(moment('01012000', 'DDMMYYYY'), moment('01012008', 'DDMMYYYY'), 2,  'year');
    allDatesCorrect = series.every((date, index) => {
      return date.format('DD/MM/YYYY') == `01/01/200${index*2}`;
    });
    expect(allDatesCorrect).toBeTruthy();

    // If end date is before the start date, the series array must be empty
    series = Utils.generateDateSeries(moment('01012004', 'DDMMYYYY'), moment('01012002', 'DDMMYYYY'), 2,  'year');
    expect(series.length).toBe(0);
  });

  it('Encodes strings properly', () => {
    expect(Utils.encode('test.name')).toBe('_90ae965a7ff2dc8d1fa3bbf03572199c');
  });

  it('Get colors and highlights correctly', () => {
    expect(Utils.getColor(5, false)).toBe('#c4a000');
    expect(Utils.getColor(5, true)).toBe('#edd400');
  });
});

