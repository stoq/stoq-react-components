import React from 'react';

import isIn from './utils/in';

import {Filter} from 'htsql';
import Utils from 'utils';
import _ from 'gettext';

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
};

SORT_FUNC.id = SORT_FUNC.numeric;
SORT_FUNC.currency = SORT_FUNC.numeric;
SORT_FUNC.datetime = SORT_FUNC.alpha;
SORT_FUNC.date = SORT_FUNC.alpha;
SORT_FUNC.phone = SORT_FUNC.numeric;

let SORT_OPOSITE = {
  '+': '-',
  '-': '+',
  '':  '+',
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
export default Table = React.createClass({

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
    if (props.sortable && props.onSearch && Utils.getParams().order_by) {
      return Utils.getParams().order_by;
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
    var sort_func = SORT_FUNC[column['data-type']];
    data = this._sort(data, function(a, b) {
      var a_attr = a[column.getAttr()];
      var b_attr = b[column.getAttr()];
      if (direction === '+') {
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

  /* Returns the formatted value for the column cell. This will use the
   * formatter provided by the column or a default formatter if none was
   * provided.
   */
  _format_value: function(column, value, object) {
    var default_formatter = Utils.formatters[column.props['data-type']];
    var formatter = default_formatter;
    if (column.props.formatter !== undefined) {
      formatter = column.props.formatter;
    }

    return formatter(value, object, default_formatter);
  },

  _getColumnSettings: function(column, props) {
    // direction should be undefined when sorting is disabled
    var direction = props.sortable && '';
    var currentOrder = this._getCurrentOrder(props);
    var sortAttr = column.props.sortAttr || column.props.getAttr();
    if (currentOrder.indexOf(sortAttr) !== -1) {
      direction = currentOrder.substr(0, 1);
    }
    return $.extend({}, column.props, {
      className: this._get_column_class(column),
      direction: direction,
      sortAttr,
    });
  },

  _getHeaderSettings: function(props) {
    var headers = [];
    props.children.map(function(column) {
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
    var rows = [<tr key={`${row_index}-${depth}`} className={isNew ? 'new' : ''}>
        {this.props.children.map(function(column, col_index) {
          if (hidden_columns && hidden_columns.indexOf(column.props.getAttr()) != -1) {
            return null;
          }
          var raw_value = object[column.props.getAttr()];
          return <td className={this._get_column_class(column)}
                     key={`${row_index}-${col_index}-${depth}`}
                     data-value={raw_value}>
                      {this._get_padding(depth, col_index, object)}
                      {this._format_value(column, raw_value, object)}
                 </td>;
        }.bind(this))}
       </tr>];
    if (this.props.tree && object.expanded) {
      object.children.forEach(function(child, index, children) {
        rows.push(this._get_rows(child, index, children, depth + 1));
      }, this);
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
    if (!this.props.sortable) {
      return;
    }
    // Invert the old direction
    var direction = SORT_OPOSITE[column.direction];
    this.forceOrderBy(column, direction);

    // If onSearch is provided, it means the sorting should be done remotely
    if (this.props.onSearch) {
      var query = {order_by: direction + column.sortAttr};
      // Execute remote query
      this.props.onSearch(event, key, query,
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
      object.direction = '';
    });
    column.direction = direction;
    this.setState({headers: this.state.headers}, callback);
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
    this.props.children.forEach((column, index) => {
      if (!column.props.query) {
        return;
      }
      var htsql = column.props.htsql || column.props.attr;
      var attr = column.props.getAttr();
      var header = this.state.headers[index];
      var direction = (header && header.direction) || '';
      attributes.push(`${attr}:=${htsql}${direction}`);
    });

    return attributes.join(',');
  },

  /* Returns the HTSQL query containing only the table and the filter fields */
  getBaseHTSQL: function(filter) {
    return `${this.props.htsql}${Filter(filter)}`;
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
    this.props.tree && this._setupTree(props.data);

    let data = props.data || this.state.data || [];
    data = data.map(function(item) {
      item = $.extend({}, item);
      return $.extend({
        _isNew: !isIn(this.state.data || [], item),
      }, item);
    }, this);

    this.setState({data}, () => {
      this.props.blinkable && setTimeout(() => {
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
      content: function() {
        return $(this).find('.popover-data').text().trim();
      },
    });
  },

  render: function(){
    var hasContent = this.state.data && this.state.data.length;
    return <div className="table-responsive">
       <table className="table table-striped table-hover">
         <thead>
           <tr>
            {this.state.headers.map(function(settings, index) {
              if (this.props.hiddenColumns && this.props.hiddenColumns.indexOf(settings.getAttr()) != -1) {
                return null;
              }
              return <th key={index} {...settings} data-direction={settings.direction}
                         onClick={this._header_clicked.bind(this, settings)} >
                {settings.label}
              </th>;
            }.bind(this))}
           </tr>
         </thead>
         <tbody>
             {this.state.data.map(this._get_rows)}
         </tbody>
       </table>
      {(hasContent && ' ') || <div className="text-center"><b>{ _('No Data')}</b></div>}
    </div>;
  },
});

Table.Column = React.createClass({
  getDefaultProps: function() {
    return {
      /* Data type to be considered when sorting the table */
      'data-type': 'alpha',

      /* Optional inline styles */
      style: {},

      /* Optional classes to be added */
      className: '',
      sortable: false,
      /* To be used when sorting, instead of props.attr */
      sortAttr: undefined,

      /* Formats a field that will be inserted in the <td> tag content */
      formatter: undefined,
      /* Indicates if the column should be queried on HTSQL or not */
      query: true,

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
