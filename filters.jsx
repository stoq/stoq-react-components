import React from 'react';
import moment from 'moment';
import _ from 'gettext';

/* <select><options/></select> in ReactJS */
module.exports.Select = React.createClass({
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
      return <select className="btn btn-default"><option>{ this.props.defaultLabel }</option></select>;
    }

    return <select className="btn btn-default" ref="select" onChange={this.onChange}
                   defaultValue={this.props.default} style={this.props.style}>
      {this._getOptions()}
    </select>;
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

    this.state.period[0].add(interval, macro_period).startOf(macro_period);
    this.state.period[1].add(interval, macro_period).endOf(macro_period);
    this.state.group = group;
    this.setState(this.state);
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
    this.state.period[index] = moment(event.date);
    this.setState(this.state);
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
    return {
      start,
      end,
      htsql: `between(date(${dateAttr}), '${start}', '${end}')`,
      group: this.state.group,
    };
  },

  getInitialState: function() {
    var group = 'day';
    var macro_group = this.macro_period[group];
    var period = this.props.defaultDate || [moment().startOf(macro_group), moment().endOf(macro_group)];
    return {
      period: period,
      group: group,
    };
  },

  componentDidMount: function() {
    var node = $(this.refs.datepicker);
    node.datepicker({
      autoclose: true,
      format: moment().localeData().longDateFormat('L').toLowerCase(),
      language: navigator.language,
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
    this.state.period[1] = moment(this.state.period[0]);
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
  _get_branch_options: function() {
    var options = [];
    if (this.props.allBranches) {
      options.push(<option key={0} value=''>{_("All branches")}</option>);
    }
    $.map(this.props.branches || {}, function(branch) {
      options.push(<option key={branch.id} value={branch.id}>{branch.fancy_name}</option>);
    });
    return options;
  },

  getBranchName: function() {
    var node = this.refs.branch;
    return $(node).find(':selected').text();
  },

  getQuery: function() {
    return {'branch': this.refs.branch.value};
  },

  getDefaultProps: function() {
    return {allBranches: true};
  },

  getInitialState: function() {
    return {branch: this.props.query ? this.props.query.branch : ''};
  },

  getHTQuery: function() {
    var value = this.refs.branch.value;
    return value && `${this.props.attr} == '${value}'`;
  },

  render: function() {
    return <select className="btn btn-default" filter-name="branch" ref='branch'
        defaultValue={this.state.branch} style={this.props.style} >
            {this._get_branch_options()}
        </select>;
  },
});
