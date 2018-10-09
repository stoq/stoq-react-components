import React from 'react';
import moment from 'moment';
import {gettext as _} from 'ttag';
import Utils from 'utils';
import $ from 'jquery';

// Expose jQuery to the global scope so that bootstrap datepicker's locale
// can find it
window.jQuery = $;
require('bootstrap-datepicker');
require('bootstrap-datepicker/js/locales/bootstrap-datepicker.pt-BR');

/* <select><options/></select> in ReactJS */
var Select = React.createClass({
  _getOptions: function() {
    return this.props.options.map(function(option, index) {
      return <option key={index} value={option[this.props.valueAttr]}>
        {option[this.props.labelAttr]}
      </option>;
    }, this);
  },

  onChange: function() {
    var onChange = this.props.onChange;
    onChange && onChange(this.refs.select.value);
  },

  getDefaultProps: function() {
    return {
      options: [],
      valueAttr: 2,
      labelAttr: 1,
    };
  },

  render: function() {
    if (!this.props.options.length) {
      return <select ref='select' className="btn btn-default"><option>{ this.props.defaultLabel }</option></select>;
    }

    return <select className={this.props.className || "btn btn-default"} ref="select" onChange={this.onChange}
                   defaultValue={this.props.default} style={this.props.style}>
      {this._getOptions()}
    </select>;
  },
});

module.exports.Select = Select;

/* Single Day Filter
 *
 * Accepted Props:
 *   attr: A string to be used as a key to the date value
 *   style: custom style for the filter
 */
module.exports.DayFilter = React.createClass({
  getQuery: function() {
    var query = {};
    query[this.props.attr] = this.state.date.format('YYYY-MM-DD');
    return query;
  },

  updatePicker: function() {
    var date = this.state.date;
    this.datepicker.datepicker('update', date.toDate());
  },

  /*
   *  Callbacks
   */

  onDateIncrement: function(increment) {
    return () => {
      var date = this.state.date.add(increment, 'days');
      this.setState({date: moment(date)}, this.updatePicker);
    };
  },

  onDateChange: function(event) {
    this.setState({date: moment(event.date)}, this.updatePicker);
  },

  /*
   *  React implementation
   */

  componentDidMount: function() {
    this.datepicker = $(this.refs.datepicker);
    this.datepicker.datepicker({
      orientation: 'bottom',
      autoclose: true,
      language: 'pt-BR',
    });
    this.datepicker.on('changeDate', this.onDateChange);
    this.updatePicker();
  },

  getInitialState: function() {
    return {date: moment()};
  },

  render: function() {
    return <div className="btn-group" style={this.props.style}>
      <button className="btn btn-default" onClick={this.onDateIncrement(-1)}>
        <i className="fa fa-chevron-left"></i>
      </button>
      <button ref="datepicker" className="btn btn-default" style={{'minWidth': '15em'}}>
        {this.state.date.format('LL')}
      </button>
      <button className="btn btn-default" onClick={this.onDateIncrement(1)}>
        <i className="fa fa-chevron-right"></i>
      </button>
    </div>;
  },
});

/* Single Date Filter
 *
 * Accepted Props:
 *   date: A date to initialize the filter
 *   group: Which grouping (day, month or year) should the calendar display
 *   onChange: Date being changed callback
 *   getFormat: Change the default formatter to the filter's text
 */
module.exports.DateFilter = React.createClass({
  trigger: true,

  viewModes: {
    day: 0,
    month: 1,
    year: 2,
  },

  formats: {
    day: 'DD MMMM YYYY',
    month: 'MMMM YYYY',
    year: 'YYYY',
  },

  /* Called when the user has manually changed the datepicker date
   *
   * @param {Event} event The boostrap-datepicker date changed event.
   */
  onDateChange: function(event) {
    this.trigger && this.setDateText(moment(event.dates[0]));
  },

  /* Reset the datepicker, setting new values for `group` and `date`
   *
   * @param {String=this.props.group} group Which group should the datepicker
   *                                        display (day, month or year).
   * @param {Date=now} date Which should be the default date displayed on
   *                        the datepicker
   */
  reset: function(group=this.props.group, date=new Date()) {
    // Detach previously added event handlers and remove the previous datepicker
    this.button.datepicker({
      orientation: 'bottom',
      language: 'pt-BR',
    }).off('changeDate', this.onDateChange);
    this.button.datepicker('destroy');

    // Initialize a new datepicker
    this.button.datepicker({
      orientation: 'bottom',
      language: navigator.language,
      autoclose: true,
      minViewMode: this.viewModes[group],
    });

    // Set the default date
    this.setDate(date, group);

    // Setup onChange callback
    this.button.datepicker().on('changeDate', this.onDateChange);
  },

  /* Default label formatter to the text exhibited on the button
   *
   * @param {Date} date The date that will be formatted
   */
  format: function(date, group) {
    return date.format(this.formats[group]);
  },

  /* Change the displayed date on the <button>
   *
   * This method updates the text displayed on this component `render` method
   *
   * @param {Date} date Which date should be displayed?
   * @param {String=this.props.group} group Which group is the date displayed
   *                                        on? Could be `day` (11 February 2016),
   *                                        `month` (February 2016) or year
   *                                        (2016)
   * @param {Boolean} trigger Should this date change be triggered on upper
   *                          level components?
   */
  setDateText: function(date, group=this.props.group, trigger=true) {
    date = moment(date);
    let format = this.props.getFormat || this.format;
    this.setState({text: format(date, group)}, () => {
      trigger && this.props.onChange && this.props.onChange(date);
    });
  },

  /* Change the datepicker date
   *
   * @param {Date} date - The date to be set
   * @param {String} group - The group (day, month, year) in which the
   *                         displayed text should be formatted.
   */
  setDate: function(date, group=this.props.group) {
    // During this date change, prevent any kind of `onChange` trigger
    this.trigger = false;
    this.button.datepicker('setDate', date);
    this.trigger = true;

    // Change the button appearance to show selected date text
    this.setDateText(this.getDate(), group, false);
  },

  /* Returns the currently selected date
   *
   * @returns Current selected date
   */
  getDate: function() {
    let date = moment(this.button.datepicker('getDate'));
    // This avoid wrong date due to summer time events.
    if (date.hour() !== 0) {
      date = date.add(1, 'hour');
    }
    return date;
  },

  /*
   * React
   */

  componentDidMount: function() {
    // Grab the button element
    this.button = $(this.refs.datepicker);
    // and initialize it
    this.reset(this.props.group, this.props.defaultDate);
  },

  componentWillReceiveProps: function(next) {
    // If the current group has changed, datepicker text should be changed,
    // along with bootstrap-datepicker `minViewMode`, so we need to reset the
    // component.
    if (this.props.group !== next.group) {
      return this.reset(next.group, next.date && next.date.toDate());
    }

    // Also make sure to update the current date if it differs from the one
    // provided via props
    let currentDate = this.button.datepicker('getDate');
    if (next.date && !next.date.isSame(currentDate, next.group)) {
      this.setDateText(next.date, next.group, false);
    }
  },

  getInitialState: function() {
    return {};
  },

  getDefaultProps: function() {
    return {
      group: 'day',
    };
  },

  render: function() {
    return <button ref="datepicker" className="btn btn-primary">
      { this.state.text }
    </button>;
  },
});

/* Daterange query with start, end and grouping options */
module.exports.DaterangeFilter = React.createClass({
  macro_period: {
    'hour': 'day',
    'day': 'month',
    'month': 'year',
  },

  /** Sets the Bootstrap Datepicker's internal dates and display their value
   *
   * Updates the Bootstrap Datepicker plugin internal dates with the
   * values of the 'period' Array, then display the corrects dates and
   * range between the selected start and end dates.
   */
  _update_picker: function() {
    $(this.refs.start).datepicker('update', this.state.period[0].format('L'));
    $(this.refs.end).datepicker('update', this.state.period[1].format('L'));
  },

  /** Adds the given group period to start and end dates
   *
   * @param interval: Determine how many days will be added
   *
   * Based on which group is selected, days, months or years are
   * added to the current start and end dates.
   */
  period_change: function(interval) {
    var group = this.refs.group.value;
    var macro_period = this.macro_period[group];
    var period = this.state.period;

    period[0].add(interval, macro_period).startOf(macro_period);
    period[1].add(interval, macro_period).endOf(macro_period);
    this.setState({period, group});
    //this._trigger_period();
  },

  /** Sets start or end date based on the given index
   *
   * @param index: Must be 0, in case the start date must be modified or
   *               1 for the end date to be modified. This represents the
   *               'period' array index of the date.
   *
   * This will also update the view's interface (along with datepicker's
   * internal start and end dates) and trigger the 'changed' event on
   * this view.
   */

  set_date: function(index, event) {
    var period = this.state.period;
    period[index] = moment(event.date);
    this.setState({period});
  },

  getQuery: function() {
    return {
      start: this.state.period[0].format('YYYY-MM-DD'),
      end: this.state.period[1].format('YYYY-MM-DD'),
      group: this.state.group,
    };
  },

  getHTQuery: function(dateAttr=this.props.attr) {
    var start = this.state.period[0].format('YYYY-MM-DD');
    var end = this.state.period[1].format('YYYY-MM-DD');
    localStorage.filterStart = start;
    localStorage.filterEnd = end;
    localStorage.filterGroup = this.state.group;
    return {
      start,
      end,
      htsql: `between(date(${dateAttr}), '${start}', '${end}')`,
      group: this.state.group,
    };
  },

  getInitialState: function() {
    var queryParams = Utils.getParams();
    var group = queryParams.group || localStorage.filterGroup || 'day';
    var macro_group = this.macro_period[group];

    var period = [];
    if (queryParams.start)
      period = [moment(queryParams.start), moment(queryParams.end)];
    else if (localStorage.filterStart) {
      period = [moment(localStorage.filterStart), moment(localStorage.filterEnd)];
      period = period.map(function(date) {
        if (!date.isValid()) {
          // Returns today's day and clear the cache if the date is invalid
          localStorage.filterStart = localStorage.filterEnd = "";
          return moment();
        }
        return date;
      });
    } else
      period = [moment().startOf(macro_group), moment().endOf(macro_group)];

    return {
      period: period,
      group: group,
    };
  },

  componentDidMount: function() {
    var node = $(this.refs.datepicker);
    node.datepicker({
      orientation: 'bottom',
      autoclose: true,
      format: moment().localeData().longDateFormat('L').toLowerCase(),
      language: 'pt-BR',
    });

    // Bootstrap datepicker uses jquery events.
    $(this.refs.start).on('changeDate', this.set_date.bind(this, 0));
    $(this.refs.end).on('changeDate', this.set_date.bind(this, 1));
    this._update_picker();
  },

  componentDidUpdate: function() {
    this._update_picker();
  },

  group_changed: function() {
    var period = this.state.period;
    period[1] = moment(period[0]);
    this.setState({period});
    this.period_change(0);
  },

  render: function() {
    return <div ref="datepicker" className="input-group input-daterange custom-datepicker"
                style={{display: "inline-table", ...this.props.style}}>
      <span className="input-group-btn">
        <button onClick={this.period_change.bind(this, -1)} className="btn btn-default">
          <i className="fa fa-chevron-left"></i>
        </button>
      </span>
      <span className="input-group-btn">
          <select ref="group" className="btn btn-default" filter-name="group"
                  defaultValue={this.state.group} onChange={this.group_changed}>
          <option value="hour">{_("Day")}</option>
          <option value="day">{_("Month")}</option>
          <option value="month">{_("Year")}</option>
        </select>
      </span>
      <input type="text" className="input-default form-control" ref="start" style={{borderLeft: "0"}} />
      <span className="input-group-addon"> - </span>
      <input type="text" className="input-default form-control" ref="end" />
      <span className="input-group-btn">
        <button onClick={this.period_change.bind(this, 1)} className="btn btn-default">
          <i className="fa fa-chevron-right"></i>
        </button>
      </span>
    </div>;
  },
});

module.exports.BranchFilter = React.createClass({
  _getBranchOptions: function() {
    var options = [];
    this.props.allBranches && options.push({label: _("All branches"), value: ''});
    $.map(this.props.branches || {}, function(branch) {
      options.push({label: branch.fancy_name, value: branch.id});
    });
    return options;
  },

  getBranchName: function() {
    var node = this.refs.branch.refs.select;
    return $(node).find(':selected').text();
  },

  getQuery: function() {
    return {'branch': this.refs.branch.refs.select.value};
  },

  getDefaultProps: function() {
    return {allBranches: true};
  },

  getInitialState: function() {
    var queryParams = Utils.getParams();
    return {branch: queryParams.branch || localStorage.filterBranch || ''};
  },

  getHTQuery: function(branchAttr=this.props.attr) {
    var value = this.refs.branch.refs.select.value;
    if (localStorage.filterBranch)
      value = localStorage.filterBranch;
    return value && `${branchAttr} == '${value}'`;
  },

  /*
   * Callbacks
   */

  onChange: function(event) {
    let selected = this.refs.branch.refs.select.value;
    localStorage.filterBranch = selected;
    this.props.onChange && this.props.onChange(event, selected);
  },

  /*
   * React
   */

  render: function() {
    return <Select options={this._getBranchOptions()} valueAttr='value' labelAttr='label'
                   default={this.state.branch} ref='branch' style={this.props.style}
                   onChange={this.onChange}/>;
  },
});
