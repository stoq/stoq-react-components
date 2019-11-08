import React from 'react';
import {gettext as _} from 'ttag';

import isIn from './utils/in';

import {Filter} from 'htsql';
import Utils from 'utils';
import Mixins from './mixins';

let  SORT_FUNC = {
  alpha: function(a, b) {
    a = a || '';
    b = b || '';
    return a.localeCompare(b);
  },
  numeric: function(a, b) {
    a = parseFloat(a) || 0;
    b = parseFloat(b) || 0;
    return a - b;
  },
  bool: function(a, b) {
    if (a === true && b === false) {
      return 1;
    }
    if (a === false && b === true) {
      return -1;
    }
    return 0;
  },

  ...Utils.sorters,
};

SORT_FUNC.id = SORT_FUNC.numeric;
SORT_FUNC.currency = SORT_FUNC.numeric;
SORT_FUNC.datetime = SORT_FUNC.alpha;
SORT_FUNC.date = SORT_FUNC.alpha;
SORT_FUNC.phone = SORT_FUNC.numeric;
SORT_FUNC.byte = SORT_FUNC.numeric;
SORT_FUNC.fromNow = SORT_FUNC.alpha;
SORT_FUNC.uuid = SORT_FUNC.alpha;
SORT_FUNC.link = SORT_FUNC.alpha;
SORT_FUNC.percentage = SORT_FUNC.numeric;

let SORT_OPOSITE = {
  '+': '-',
  '-': '+',
  '': '-',
};

/* HTSQL Queried Bootstrap Striped Tabled
 *
 * Props:
 *
 * data {Object[]} The data to be displayed on this table
 * htsql {Functin|String} Function or string that returns the htsql query to be
 *                        done.
 * htsql-extra-columns {String} Set of columns to be added on the query, even
 *                              if no Table.Column is related to it
 * hiddenColumns {String[]} List of columns that are being hidden
 * sortable {Boolean} Does this table accept sorting?
 * onSearch {Function} Change the `sortable` behavior to call the server for
 *                     a remote sorting. This is usually done when we have
 *                     paginated tables
 * blinkable {Boolean=false} This flag indicates if will have a blink animation
 *                         in that place
 * defaultOrderBy {String} Which order will this table be ordered by when no
 *                         explicit order_by attribute is required. This
 *                         attribute requires a '+' for ascending and a '-'
 *                         for descending order, followed by the Table.Column's
 *                         attr field (if you only use a htsql field, it is
 *                         recommended to defined a explicit attr field):
 *
 *                         example:
 *
 *                         // Using attr directly
 *                         <Table defaultOrderBy="-date">
 *                          <Table.Column attr="date"/>
 *                         </Table>
 *
 *                         // Using htsql+attr
 *                         <Table defaultOrderBy="-complex">
 *                          <Table.Column attr="complex" htsql="count(query)"/>
 *                         </Table>
 *
 * SubElements:
 *
 *  Table.Column:
 *
 *  -> Every <Table> must have at least two <Table.Column> children
 *
 *  Props:
 *
 *  label {String} What will be displayed on the <th> element of this column
 *  attr {String=encode(props.htsql)} What attr name will this column be
 *                                    looking for
 *  htsql {String=attr} What htsql query will this column be performing
 *  data-type {String=alpha} Which data-type is this column (date, datetime,
 *                           bool, ...). This is used to properly format the
 *                           column.
 *
 *                           Supported data-types will be located at the
 *                           project's 'Utils.formatters' object.
 *  formatter {Function} Optional formatter for the column, just in case none
 *                       of the 'data-type' ones suit the column.
 */

let Table;
module.exports = Table = React.createClass({
  mixins: [Mixins.Blinkable],

  /*
   *      Private API
   */

  /* Add a toggleable attribute 'expanded' to parent rows on Tree table  */
  _setupTree: function(data) {
    data.forEach(function(object) {
      if (object.children.length) {
        this._setupTree(object.children);
        object.expanded = true;
      }
    }, this);
  },

  _getCurrentOrder: function(props=this.props) {
    if (props.sortable && props.onSearch &&
            (props.orderBy || Utils.getParams().order_by)) {
      return props.orderBy || Utils.getParams().order_by || '';
    }
    return props.defaultOrderBy || '';
  },

  /*  Sort the 'data' list
   *
   *  It also sorts data's children if we are operating in Tree Table mode
   */
  _sort: function(data, sort_func) {
    var sorted = data.sort(sort_func);
    if (this.props.tree) {
      sorted.forEach(function(object) {
        this._sort(object.children, sort_func);
      }, this);
    }
    return sorted;
  },

  _sortLocally: function(direction, column) {
    var data = this.state.data;
    var sort_func = SORT_FUNC[column.formatter] || SORT_FUNC[column['data-type']];
    sort_func = sort_func || SORT_FUNC.alpha;

    data = this._sort(data, function(a, b) {
      var a_attr = a[column.getAttr()];
      var b_attr = b[column.getAttr()];
      if (direction === '+') {
        // Try the attributes first, but fall back to the object
        return sort_func(a_attr, b_attr);
      }
      return sort_func(b_attr, a_attr);
    }.bind(this));

    // Then update the current state
    this.setState({data});
  },

  /* This may add extra classes to the current props.className of the
   * column. For instance, when a column is numeric, we want to align it
   * to the right
   */
  _get_column_class: function(column) {
    var final_class = column.props.className,
        dataType = column.props['data-type'];
    if (['currency', 'phone', 'numeric'].indexOf(dataType) !== -1) {
      final_class += ' text-right';
    }
    return final_class;
  },

  _get_formatter: function(column, specified_formatter){
    var default_formatter = Utils.formatters[column.props['data-type']];
    var formatter = default_formatter;
    if (specified_formatter !== undefined) {
      if (typeof specified_formatter === 'string') {
        formatter = Utils.formatters[specified_formatter];
      } else if (typeof specified_formatter === 'function') {
        formatter = specified_formatter;
      }
    }
    return formatter;
  },

  /* Returns the formatted value for the column cell. This will use the
   * formatter provided by the column or a default formatter if none was
   * provided.
   */
  _format_value: function(column, value, object, row_index) {
    var default_formatter = Utils.formatters[column.props['data-type']];
    var formatter = this._get_formatter(column, column.props.formatter);

    return formatter(value, object, default_formatter, row_index, column.props['formatter-config']);
  },

  /* Returns the formatted value for the summary row cells. This will use the
   * formatter provided by the column or a default formatter if none was
   * provided.
   */
  _format_summary_value: function(column, value, object, row_index) {
    if (value == undefined) {
      return null;
    }
    var default_formatter = Utils.formatters[column.props['data-type']];
    var formatter = this._get_formatter(column, column.props.summaryFormatter);

    return formatter(value, object, default_formatter, row_index, column.props['formatter-config']);
  },

  _format_cards_value: function(column, value, object, row_index) {
    if (value == undefined) {
      return null;
    }
    var default_formatter = Utils.formatters[column.props['data-type']];
    var formatter = this._get_formatter(column, column.props.cardFormatter);

    return formatter(value, object, default_formatter, row_index, column.props['formatter-config']);
  },

  _getColumnSettings: function(column, props) {
    // direction should be undefined when sorting is disabled
    var direction = props.sortable && '';
    var currentOrder = this._getCurrentOrder(props);
    var sortAttr = column.props.sortAttr || column.props.getAttr();

    if (currentOrder.substr(1) === sortAttr) {
      direction = currentOrder.substr(0, 1);
    }

    // If the specific column does not allow sorting, disable it here
    if (!column.props.sortable) {
      direction = undefined;
    }

    return $.extend({}, column.props, {
      className: this._get_column_class(column),
      direction: direction,
      sortAttr,
    });
  },

  _getHeaderSettings: function(props) {
    var headers = [];
    this._getColumns().map(function(column){
      headers.push(this._getColumnSettings(column, props));
    }.bind(this));
    return headers;
  },

  /*  Returns a List of <span> corresponding to the indentation of the row
   *
   *  Returns list is <span> elements to indent a tree table row into it's
   *  correct position. Rows that have children should also display a
   *  interactive expander.
   *
   *  @param depth: The depth in the tree where the object is located
   *
   *  @param col_index: The index of the column that is being written. Only
   *   the first index should be affected by the padding
   *
   *  @param object: The object that is being iterated
   *
   */
  _get_padding: function(depth, col_index, object) {
    // Only this first column of the trees must have paddings
    if (col_index !== 0 || !this.props.tree) {
      return;
    }

    var paddings = [];
    // Add paddings according to the depth of the object
    for (var i = 0; i < depth; i++) {
      paddings.push(<span key={`${i}-${object.id}`} className="treegrid-indent"/>);
    }
    var expanded = '';
    if (object.children.length) {
      expanded = (object.expanded ? 'treegrid-expander-expanded' :
                                    'treegrid-expander-collapsed');
    }

    // The last indent is always a expander, however only expanders that
    // contain one of the classes above will become interactive
    paddings.push(<span key={`${i}-${object.id}`} className={`treegrid-expander ${expanded}`}
                        onClick={this._toggleRow.bind(this, object)}/>);
    return paddings;
  },

  _getColumns: function() {
    // ignore falsy children
    const nonFalsyChildren = this.props.children.filter(child => Boolean(child));
    let children = [];
    nonFalsyChildren.forEach((child) => {
      if (Array.isArray(child)) {
        children.push(...child);
      } else {
        children.push(child);
      }
    });
    return children;
  },

  /*  Returns a list of rows that a object contain
   *
   *  On normal tables, it simply maps the object's attributes into the
   *  column settings. On Tree tables, it also recusively returns the list of
   *  the object's children below it.
   *
   *  @param depth: The current depth of the rows (only used for tree creation)
   *  @param object: The object that will be used to build the row
   *  @param row_index: The index of the row (to be used as a React key)
   */
  _get_rows: function(object, row_index, objects, depth) {
    // TODO Change these lines for a default parameter on ES6 when possible
    if (!depth) {
      depth = 0;
    }
    // isNew sets if its a new modification AND will receive an animation
    var isNew = object._isNew && this.props.blinkable;
    var hidden_columns = this.props.hiddenColumns;
    const rowClass = (this.props.rowClass && this.props.rowClass(object)) || '';
    const className = `${(isNew ? 'new' : '')} ${rowClass}`;
    const onRowClick = () => this.props.onRowClick && this.props.onRowClick(object);
    const columns = this._getColumns();
    var rows = [<tr onClick={onRowClick} key={`${row_index}-${depth}`} className={className}>
        {columns.map(function(column, col_index) {
          if ((hidden_columns && hidden_columns.indexOf(column.props.getAttr()) != -1) ||
              !column.props.visible) {
            return null;
          }
          var raw_value = object[column.props.getAttr()];
          return <td className={this._get_column_class(column)}
                     key={`${row_index}-${col_index}-${depth}`}
                     data-value={raw_value}>
                      {this._get_padding(depth, col_index, object)}
                      {this._format_value(column, raw_value, object, row_index)}
                 </td>;
        }.bind(this))}
       </tr>];
    if (this.props.tree && object.expanded) {
      object.children.forEach((child, index, children) => {
        rows.push(this._get_rows(child, index, children, depth + 1));
      });
    }
    return rows;
  },

  /*
   *      Callbacks
   */

  /* Collapse or expand a tree row*/
  _toggleRow: function(object) {
    object.expanded = !object.expanded;
    this.setState({data: this.state.data});
  },

  /* Sort the table
   *
   * @param column: Which of the columns should be sorted
   *
   * Sort the table remotely when a 'onSearch' prop is provided (by
   * transfering the responsibility to a callback) or do it locally when no
   * 'onSearch' is provided.
   */
  _header_clicked: function(column, event, key) {
    if (!this.props.sortable || !column.sortable) {
      return;
    }
    // Invert the old direction
    var direction = SORT_OPOSITE[column.direction];
    this.forceOrderBy(column, direction);

    // If onSearch is provided, it means the sorting should be done remotely
    if (this.props.onSearch) {
      this.query = {order_by: direction + column.sortAttr};
      // Execute remote query
      this.props.onSearch(event, key, this.query,
                          this.state.headers.indexOf(column));
      return;
    }

    // Otherwise the sorting will be done locally
    this._sortLocally(direction, column);
  },

  /*
   *      Public API
   */

  /* Force the interface to be changed to a determined order by direction
   *
   * Note: this will not perform the orderBy operation itself, only update
   * the UI.
   */
  forceOrderBy: function(column, direction, callback) {
    if (typeof column === 'number') {
      column = this.state.headers[column];
    }

    // Reset all other columns sort direction to unsorted
    this.state.headers.forEach(function(object) {
      if (!object.sortable) {
        return;
      }
      object.direction = '';
    });
    column.direction = direction;
    this.setState({headers: this.state.headers}, callback);
  },

  getQuery: function() {
    if (!this.query) {
      return {};
    }

    return this.query;
  },

  /* Return the HTSQL attributes, joined by a ','
   *
   * @param extraColumns: true, if the 'htsql-extra-columns' should be
   *      included, false otherwise
   */
  getHTSQLAttributes: function(extraColumns) {
    extraColumns = extraColumns === undefined ? true : extraColumns;

    var attributes = [];
    // This are 'hidden' columns that the callsite might need (for
    // formatting or linking), but that should not be displayed as
    // columns in the table.
    if (this.props['htsql-extra-columns'] && extraColumns) {
      attributes.push(this.props['htsql-extra-columns']);
    }

    // For each column, collect the attributes that should be feched
    // from the database.
    const columns = this._getColumns();
    columns.forEach((column, index) => {
      if (!column.props.query) {
        return;
      }
      var htsql = column.props.htsql || column.props.attr;
      var attr = column.props.getAttr();
      var header = this.state.headers[index];
      var direction = (header && header.direction) || '';
      attributes.push(`${attr}:=${htsql}${direction}`);

      //Warn the developer if there is a column with filter true and no attr
      if (column.props.filter && !column.props.attr) {
        console.warn(`The column '${column.props.label}' is set to filter but has no property 'attr'`);
      }
    });

    return attributes.join(',');
  },

  /* Returns the HTSQL query containing only the table and the filter fields */
  getBaseHTSQL: function(filter) {
    let htsql = (typeof this.props.htsql) == 'function' ? this.props.htsql() : this.props.htsql;
    return `${htsql}${!this.props.filteredHTSQL ? Filter(filter) : ''}`;
  },

  /* Returns the table generated HTSQL
   *
   * @param filter: optional filter parameters that may be added to the query
   * @param extraColumns: Should be true if you want to include extra
   *      columns on the query, false otherwise. Defaults to true.
   *
   */
  getHTSQL: function(filter, extraColumns) {
    var limit = this.props.limit;
    var values = this.getHTSQLAttributes(extraColumns);
    var htsql = this.props.htsql;
    htsql = typeof htsql === 'function' ? htsql() : htsql;
    htsql = `${htsql}{${values}}`;
    if (filter) {
      htsql = `${htsql}.filter(${filter})`;
    }
    return (limit ? htsql + `.limit(${limit})` : htsql);
  },

  /*
   *      React
   */

  getInitialState: function() {
    return {
      headers: [],
      data: [],
    };
  },

  getDefaultProps: function() {
    return {
      query: {},
      tree: false,
    };
  },

  /* What happens when new modifications comes for the table
   *
   * The variable 'data' receive a valid data from the table: 'props.data' for
   * new modifications, 'this.state.data' for old state (no modifications),
   * '[]' for no data avaliable.
   * The function 'map' will turn the 'item' into an object using 'extend'
   * If the item is not in the previous state, its set like a new item (_isNew)
   *
   * If the property of item is blinkable an animation will appears with a
   * 800ms delay (using setTimeout function).
   */
  componentWillReceiveProps: function(props) {
    this.setState({headers: this._getHeaderSettings(props)});
    props.tree && this._setupTree(props.data);

    let data = props.data || this.state.data || [];
    data = data.map(function(item) {
      item = $.extend({}, item);
      return $.extend({
        _isNew: !isIn(this.state.data || [], item),
      }, item);
    }, this);

    this.setState({data}, () => {
      this.props.blinkable && this.blinkTimeout(() => {
        let data = this.state.data.map(function(item) {
          item._isNew = false;
          return item;
        });
        this.setState({data});
      }, 800);
    });
  },

  componentDidMount: function() {
    this.setState({
      headers: this._getHeaderSettings(this.props),
      data: this.props.data || [],
    });
  },

  componentDidUpdate: function() {
    // Enable popver on table component
    $('[data-toggle=popover]').popover({
      html: true,
      content: function() {
        return $(this).find('.popover-data').html().trim();
      },
    });
  },

  _emptyLines: function(rows, columns) {
    let emptyRows = [];
    for (let r = 0; r < rows; r++){
      let emptyColumns = [];
      for (let c = 0; c < columns; c++){
        emptyColumns.push(<td key={`empty-${r}-${c}`}>&nbsp;</td>);
      }
      emptyRows.push(<tr key={`empty-${r}`}>{emptyColumns}</tr>);
    }
    return emptyRows;
  },

  render: function(){
    var hasContent = this.state.data && this.state.data.length;
    const columns = this._getColumns();
    return <div className="table-responsive">
       <table className="table table-striped table-hover">
         <thead>
           <tr ref='tableHeader'>
            {this.state.headers.map(function(settings, index) {
              if ((this.props.hiddenColumns && this.props.hiddenColumns.indexOf(settings.getAttr()) != -1) ||
                  !settings.visible) {
                return null;
              }
              return <th
                ref={`${settings.label}Column`}
                key={index}
                // FIXME: There are 2 onClicks here
                {...Utils.only(settings, ['style', 'onClick'])}
                data-direction={settings.direction}
                onClick={this._header_clicked.bind(this, settings)}
              >
                <span data-toggle='tooltip' title={settings.description} data-delay='{"show":"500", "hide":"100"}'>{settings.label}</span>
              </th>;
            }.bind(this))}
           </tr>
         </thead>
         <tbody>
             {this.state.data.map(this._get_rows)}
             {this.props.pageSize && this._emptyLines(
               this.props.pageSize - this.state.data.length, this.props.children.length)}
             {this.props.cardsSummary && <tr className="">
               {columns.map(function(column, columnIndex) {
                  var columnConfig = this.props.cardsSummary[column.props.getAttr()];
                  var columnValue =
                    typeof columnConfig === 'function'
                    ? columnConfig(this.state.data, column.props.getAttr())
                    : columnConfig;
                 return <td key={columnIndex} className={this._get_column_class(column)}>
                            <b>{this._format_cards_value(column, columnValue, this.props.cardsSummary, columnIndex)}</b>
                         </td>;
               }.bind(this))}
             </tr>}
             {this.props.summaryData && <tr className="table-summary">
                {columns.map(function(column, columnIndex) {
                  var columnConfig = this.props.summaryData[column.props.getAttr()];
                  var columnValue =
                    typeof columnConfig === 'function'
                    ? columnConfig(this.state.data, column.props.getAttr())
                    : columnConfig;
                 return <td key={columnIndex} className={this._get_column_class(column)}>
                            <b>{this._format_summary_value(column, columnValue, this.props.summaryData, columnIndex)}</b>
                         </td>;
               }.bind(this))}
             </tr>}
         </tbody>
       </table>
      {(hasContent && ' ') || <div ref="noDataDiv" className="text-center"><b>{ _('Sem dados')}</b></div>}
    </div>;
  },
});

let sumColumn = function(data, columnName) {
  return data.reduce((acc, cur) => acc + (Number(cur[columnName]) || 0), 0);
};

let diffColumns = function(firstColumn, secondColumn) {
  return function(data) {
    return data.reduce((acc, cur) => {
      return acc + ((cur[firstColumn] || 0) - (cur[secondColumn] || 0));
    }, 0);
  };
};

let filteredColumns = function(rule) {
  return function(data, columnName) {
    return data.filter(rule).reduce((acc, cur) => acc + (Number(cur[columnName]) || 0), 0);
  };
};

module.exports.sumColumn = sumColumn;
module.exports.diffColumns = diffColumns;
module.exports.filteredColumns = filteredColumns;

Table.Column = React.createClass({
  getDefaultProps: function() {
    return {
      /* Data type to be considered when sorting the table */
      'data-type': 'alpha',

      /* Optional inline styles */
      style: {},

      /* Optional classes to be added */
      className: '',

      sortable: true,
      /* To be used when sorting, instead of props.attr */
      sortAttr: undefined,

      /* Formats a field that will be inserted in the <td> tag content */
      formatter: undefined,

      /* Indicates if the column should be queried on HTSQL or not */
      query: true,

      /* This option is for the case the column shouldn't be visible, but it
       * must appear in the search filters */
      visible: true,

      getAttr: function() {
        return this.attr || Utils.encode(this.htsql);
      },
    };
  },

  render: function() {
    // The column is just for metadata. Real rendering is done in the
    // Table component
    return null;
  },
});
