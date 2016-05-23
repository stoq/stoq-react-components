import React from 'react';
import moment from 'moment';
import $ from 'jquery';
import _ from 'gettext';
require('bootstrap-datepicker');

import Utils from 'utils';
import {Select} from './filters';

/* Query operations for numeric data type */
var NUMERIC_QUERY_OPERATIONS = {
  '>': (attr, value) => `${attr} > ${value}`,
  '<': (attr, value) => `${attr} < ${value}`,
  '=': (attr, value) => `${attr} == ${value}`,
  '~': (attr, value) => {
    var values = value.split('and');
    return `between(${attr}, ${values[0]}, ${values[1]})`;
  },
};

/* Which operand should be used for each data-type */
var QUERY_OPERATION = {
  alpha: (attr, value) => `${attr}~'${value}'`,
  select: (attr, value) => {
    if (value === '__null__')
      return `${attr}==null`;

    return `${attr}=='${value}'`;
  },
  invoice: (attr, value) => `str(${attr})~'${value}'`,
  date: (attr, value) => {
    var dates = value.split('to');
    return `between(date(${attr}), '${dates[0]}', '${dates[1]}')`;
  },
  numeric: (attr, value) => {
    let operation = value[0];
    return NUMERIC_QUERY_OPERATIONS[operation](attr, value.substring(1));
  },
  uuid: (attr, value) => `${attr}='${value}'`,
};

QUERY_OPERATION.datetime = QUERY_OPERATION.date;
QUERY_OPERATION.currency = QUERY_OPERATION.numeric;
QUERY_OPERATION.percentage = QUERY_OPERATION.numeric;
QUERY_OPERATION.link = QUERY_OPERATION.alpha;

/* Returns a getter for the input filter of a given type */
var getInputFilter = function(type) {
  return function(settings, index) {
    return <div className="input-group">
           <label htmlFor={'filter-' + index} className="input-group-addon">
             {settings.label}
           </label>
           <input id={'filter-' + index} type={type} className="input-sm form-control"
               onChange={this.setValue.bind(this, index)} value={settings.value}
               onKeyUp={this.searchKeyUp}/>
           <span className="input-group-btn">
             <button className="btn btn-sm remove-filter" ref={`${settings.getAttr()}FilterRemoveButton`}
                     onClick={this.setVisible.bind(this, index, false)}>
               <i className="fa fa-remove"></i>
             </button>
           </span>
    </div>;
  };
};

/* SearchBar widget to be used by HTSQLListMixins
 *
 * Props:
 *
 * table {Table} Table Element related to this SearchBar
 * onSearch {Function} Callback that queries the server for the given filters
 * toggleColumn {Function} Callback that will be called once a column hide/show
 *                         should be toggled. Refer to HTSQLListMixin for more
 *                         detailed information
 * defaultHTSQLFilter {Function} Returns the filter that will be applied when
 *                               using the default filter on SearchBar
 */
let SearchBar;
module.exports = SearchBar = React.createClass({

  getInitialState: function() {
    return {
      filters: [],
      search: '',
    };
  },

  /*
   *  Public API
   */

  /* Build the filter list based on a given table
   *
   * @param table: The table to be used to setup the filters
   *
   * @param callback: The function to be called after the state has been set
   */
  setupFilters: function(table, callback) {
    // Build the filter list based on table this search bar is related to
    this.setState({
      filters: this._get_filters(table),
      search: Utils.getParams().q,
    }, callback);
  },

  /* Update the filters visibility according to the URL parameters
   *
   * Hides or show filters according to their appearance in the URL
   */
  updateFilters: function() {
    var query = Utils.getParams();
    var filters = this.state.filters.map(function(filter) {
      filter.visible = query.hasOwnProperty(filter.attr);
      return filter;
    });
    this.setState({filters: filters});
  },

  getDefaultFilterHTQuery: function() {
    var search = Utils.escape(this.state.search);
    if (search)
      return this.props.defaultHTSQLFilter(search);
  },

  getAttributesFiltersHTQuery: function() {
    var queries = [];
    this.state.filters.forEach(filter => {
      // Don't search filters that are not visible
      if (!filter.visible || !filter.value) {
        return;
      }

      var attr = filter.htsql || filter.attr;
      var operation = QUERY_OPERATION[filter.type];
      queries.push(`${operation(attr, Utils.escape(filter.value))}`);
    });
    return queries;
  },

  getHTQuery: function() {
    var queries = [];
    // Add default search query if provided
    var defaultFilter = this.getDefaultFilterHTQuery();
    defaultFilter && queries.push(defaultFilter);
    // Add attributes filters query
    queries = queries.concat(this.getAttributesFiltersHTQuery());

    return queries.join('&');
  },

  getQuery: function() {
    var search = {q: this.state.search};
    this.state.filters.forEach(function(filter) {
      // Don't search filters that are not visible
      if (!filter.visible) {
        return;
      }
      search[filter.attr] = filter.value;
    });
    return search;
  },

  /*
   *  Private API
   */

  _get_filters: function(table) {
    var query = Utils.getParams();
    var filters = [];
    React.Children.map(table.props.children, function(column) {
      // If the column does not require any filter, skip it.
      if (!column.props.filter) {
        return;
      }
      // If a filter is required, create it
      var filter = $.extend({
        type: column.props['filter-settings'] ? 'select' : column.props['data-type'],
      }, column.props, column.props['filter-settings']);
      // Only after getting the properties from the column and the
      // settings, we may set composite properties
      filter.attr = filter.getAttr();
      filter.value = query[filter.attr] || filter.defaultValue;
      filter.visible = query.hasOwnProperty(filter.attr);

      filters.push(filter);
    });
    return filters;
  },

  _export: function(format) {
    // Extract the colum definitions to be sent to the server
    var col_defs = this.props.table.props.children.map(function(column) {
      return {
        attr: column.props.sortAttr || column.props.attr,
        header: column.props.label,
      };
    });
    var query = {
      col_defs: JSON.stringify(col_defs),
      filename: this.props.exportFileName + '.' + format,
      file_format: format,
    };
    this.props.onExport(query);
  },

  _changeColumnVisibility: function(column) {
    this.props.toggleColumn(column);
  },

  _getExportButton: function() {
    if (!this.props.onExport) {
      return null;
    }
    return <div className="input-group-btn">
             <button name="export-file" className="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Export to file">
                 <i className="fa fa-file-excel-o"/>
             </button>
             <ul className="dropdown-menu pull-right">
               <li><a onClick={this._export.bind(this, 'csv')}>CSV</a></li>
               <li><a onClick={this._export.bind(this, 'xls')}>XLS</a></li>
             </ul>
           </div>;
  },

  _getColumnsButton: function() {
    var table = this.props.table;
    if (table === undefined) {
      return;
    }
    return <div className="input-group-btn">
             <button name="toggle-columns" className="btn btn-default dropdown-toggle" data-toggle="dropdown" title={_("Show/Hide columns")}>
                 <i className="fa fa-fw fa-columns"/>
             </button>
             <ul className="dropdown-menu">
               {table.props.children.map(function(column, index) {
                 var iconClass = '';
                 if (table.props.hiddenColumns.indexOf(column.props.getAttr()) === -1)
                   iconClass = 'fa fa-fw fa-check-square-o';
                 else
                   iconClass = 'fa fa-fw fa-square-o';
                 return <li key={index}>
                          <a data-column-type={column.props.label} ref={`${column.props.getAttr()}ColumnToggle`} onClick={this._changeColumnVisibility.bind(this, column)}>
                              <i className={iconClass}/>{column.props.label}</a>
                        </li>;
               }.bind(this))}
             </ul>
           </div>;
  },

  /*
   *  Callbacks
   */

  setVisible: function(index, visible) {
    var filters = this.state.filters;
    filters[index].visible = visible;
    this.setState({filters: filters});
    !visible && this.searchClicked();
  },

  setValue: function(index, event, value) {
    var filters = this.state.filters;
    filters[index].value = value || event.target.value;
    this.setState({filters: filters});
  },

  setDaterange: function(index, daterange) {
    var filters = this.state.filters;
    filters[index].value = Utils.getDaterangeQuery(daterange.start,
                                                     daterange.end);
    this.setState({filters: filters});
  },

  searchKeyUp: function(event) {
    // Activate search when <Enter> is pressed
    if (event.which === 13) {
      this.searchClicked();
    }
  },

  searchChanged: function(event) {
    this.setState({search: event.target.value});
  },

  searchClicked: function(event, key) {
    this.props.onSearch(event, key, this.getQuery());
  },

  searchBtnStyle: function () {
    if (!this.props.onExport)
      return {borderRadius: '0px 3px 3px 0px'};
    return {borderRadius: '0px 0px 0px 0px'};
  },

  /*
   *  Filter Defining functions
   */

  get_select__filter: function(settings, index) {
    return <div className="input-group">
             <label htmlFor={'filter-' + index} className="input-group-addon">
               {settings.label}
             </label>
             <span className="input-group-btn">
               <select id={'filter-' + index} className="btn btn-sm" onChange={this.setValue.bind(this, index)}
                       value={settings.value}>
                 {settings.options.map(function(option) {
                   return <option key={option.value} value={option.value}>{option.label}</option>;
                 })}
               </select>
             </span>
             <span className="input-group-btn">
               <button className="btn btn-sm remove-filter" ref={`${settings.getAttr()}FilterRemoveButton`}
                       onClick={this.setVisible.bind(this, index, false)}>
                 <i className="fa fa-remove"></i>
               </button>
             </span>
           </div>;
  },

  get_link__filter: getInputFilter('text'),

  get_invoice__filter: getInputFilter('text'),

  get_alpha__filter: getInputFilter('text'),

  get_uuid__filter: getInputFilter('text'),

  get_date__filter: function(settings, index) {
    var daterange = Utils.parseDaterange(settings.value);
    return <SearchBar.DateFilter label={settings.label} onChangeDate={this.setDaterange.bind(this, index)}
                                 defaultDaterange={daterange} onRemoveClicked={this.setVisible.bind(this, index, false)}/>;
  },

  get_datetime__filter: function() {
    return this.get_date__filter.apply(this, arguments);
  },

  get_numeric__filter: function(settings, index) {
    return <SearchBar.NumericFilter label={settings.label} onRemoveClicked={this.setVisible.bind(this, index, false)} onKeyUp={this.searchKeyUp}
                                    filterIndex={index} filter={this.state.filters[index]} setValue={this.setValue}/>;
  },

  get_currency__filter: function() {
    return this.get_numeric__filter.apply(this, arguments);
  },

  get_percentage__filter: function() {
    return this.get_numeric__filter.apply(this, arguments);
  },

  /*
   *  React implementation
   */

  render: function() {
    return <div>
               <div className="input-group">
                 { this._getColumnsButton() }
                 { this.state.filters.length > 0 && (
                   <span className="input-group-btn">
                     <button name="filters" className="btn btn-default btn-search-filters dropdown-toggle" data-toggle="dropdown" title={_("Filters")}
                             style={{borderRadius: '0', borderRight: '0'}}>
                       <i className="fa fa-fw fa-filter"></i>
                     </button>
                     <ul className="dropdown-menu">
                       {this.state.filters.map(function(filter, index) {
                         return <li key={index}>
                                   <a data-filter-type={filter.type} onClick={this.setVisible.bind(this, index, true)}
                                      ref={`${filter.getAttr()}FilterToggleButton`}>
                                     {filter.label}
                                   </a>
                                 </li>;
                       }.bind(this))}
                     </ul>
                   </span>
                   )
                 }
                 <input type="search" className="form-control" placeholder="Search..."
                        value={this.state.search} onChange={this.searchChanged}
                        onKeyUp={this.searchKeyUp}/>
                 <span className="input-group-btn">
                   <button type="search" className="btn btn-primary" ref='searchButton' onClick={this.searchClicked} style={this.searchBtnStyle()}>
                     {_('Search')}
                   </button>
                 </span>
               { this._getExportButton() }
               </div>
             {this.state.filters.map(function(filter, index) {
               // Render the filter based on the specified type
               var component_func = this['get_' + filter.type + '__filter'];
               return <div className={"filter-item " + (filter.visible ? '' : 'hidden')} key={index}
                           ref={`${filter.getAttr()}Filter`} data-attr={filter.getAttr()}>
                          { component_func.call(this, filter, index) }
                      </div>;
             }.bind(this))}
           </div>;
  },
});

SearchBar.DateFilter = React.createClass({

  changeDate: function(key, event) {
    var stateChange = {};
    stateChange[key] = moment(event.date || event.originalEvent.date);
    this.setState(stateChange, function() {
      this.props.onChangeDate(this.state);
    }.bind(this));
  },

  /*
   *  React implementation
   */

  /* Initialize DateRangePicker Plugin and setup changeDate events */
  componentDidMount: function() {
    $(this.refs.datepicker).datepicker({
      autoclose: true,
      format: moment().localeData().longDateFormat('L').toLowerCase(),
      language: navigator.language,
      orientation: 'bottom',
    });
    // Setup event handling
    $(this.refs.start).on('changeDate', this.changeDate.bind(this, 'start'));
    $(this.refs.end).on('changeDate', this.changeDate.bind(this, 'end'));
    // Update the interface with the state
    $(this.refs.start).datepicker('update', this.state.start.format('L'));
    $(this.refs.end).datepicker('update', this.state.end.format('L'));
    // The top level picker must be updated so that its inferface
    // remains consistent with the start and end pickers.
    $(this.refs.datepicker).datepicker('updateDates');
    // Trigger it for the first time so that search bar know's the default
    // value
    this.props.onChangeDate(this.state);
  },

  getInitialState: function() {
    return this.props.defaultDaterange || {start: moment(), end: moment()};
  },

  render: function() {
    return <div ref="datepicker" className="input-daterange input-group">
             <label className="input-group-addon">
               { this.props.label }
             </label>
             <input ref="start" type="text" className="input-sm form-control" name="start"/>
             <span className="input-group-addon"> - </span>
             <input ref="end" type="text" className="input-sm form-control" name="end"/>
             <span className="input-group-btn">
               <button className="btn btn-sm remove-filter" onClick={this.props.onRemoveClicked}>
                 <i className="fa fa-remove"></i>
               </button>
             </span>
           </div>;
  },
});

SearchBar.NumericFilter = React.createClass({

  componentDidMount: function() {
    let value = this.props.filter.value;
    if (!value)
      return;
    var operation = value[0];
    if (operation == '~') {
      let values = value.substring(1).split('and');
      this.refs.first.value = values[0];
      this.refs.second.value = values[1];
    }
    else
      this.refs.first.value = value.substring(1);
  },

  getInitialState: function() {
    let operation = this.props.filter.value ? this.props.filter.value[0] : '=';
    return {operation};
  },

  _setOperation: function(operation) {
    this.setState({operation}, this._setValue);
  },

  _setValue: function() {
    this.props.setValue(
      this.props.filterIndex, null,
      this.state.operation + this.refs.first.value + (this.state.operation == '~' ? `and${this.refs.second.value}` : ''));
  },

  render: function() {
    let options = [
      {label: _('Equals to'), value: '='},
      {label: _('Greater than'), value: '>'},
      {label: _('Lower Than'), value: '<'},
      {label: _('Between'), value: '~'},
    ];
    return <div ref="numeric-filter" className="input-daterange input-group">
      <label className="input-group-addon">
        { this.props.label }
      </label>
      <span className='input-group-btn'>
        <Select className='btn btn-sm' options={options} valueAttr='value' labelAttr='label'
                onChange={this._setOperation} default={this.state.operation}/>
      </span>
      <input ref="first" type="number" defaultValue={0} className="input-sm form-control" name="first" onChange={this._setValue}
             onKeyUp={this.props.onKeyUp}/>
      {this.state.operation == '~' && [
        <span key={0} className="input-group-addon">{_('And')}</span>,
        <input key={1} ref="second" type="number" defaultValue={0} className="input-sm form-control" name="second" onChange={this._setValue}
               onKeyUp={this.props.onKeyUp}/>,
      ]}
      <span className="input-group-btn">
        <button className="btn btn-sm remove-filter" onClick={this.props.onRemoveClicked}>
          <i className="fa fa-remove"></i>
        </button>
      </span>
    </div>;
  },
});
