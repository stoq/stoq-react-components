import React from "react";
import Pager from "./pager";
import Utils from "utils";

/* Independent Paged Table Component
 *
 * This component has been widely used on HTSQLDetails views when there's a lot
 * of information to be displayed on a single table
 *
 * Props:
 *
 * hasSearchBar {Boolean=true} Does this PagedTable component displays a searchBar?
 * loading {Boolean=false} Is this PagedTabled in loading state?
 * table {Table} The Table component related to this PagedTable container
 * onPageChange {Function} Callback fired when a page change is requested
 */
let PagedTable = React.createClass({
  getSearch() {
    return this.refs.filter ? Utils.escape(this.refs.filter.value) : "";
  },

  getDefaultProps: function() {
    return {
      hasSearchBar: true,
    };
  },

  render() {
    return (
      <div className="position-relative">
        {this.props.hasSearchBar && (
          <form onSubmit={this.props.onSearch}>
            <div className="input-group">
              <input ref="filter" className="input-sm form-control" />
              <span className="input-group-btn">
                <button type="submit" className="btn btn-primary btn-sm">
                  Buscar
                </button>
              </span>
            </div>
          </form>
        )}
        {this.props.children}
        <Pager
          meta={this.props.meta}
          table={this.props.table}
          onPageChange={this.props.onPageChange}
        />
        {this.props.loading && (
          <div className="overlay">
            <i className="fa fa-refresh fa-spin" />
          </div>
        )}
      </div>
    );
  },
});

module.exports = PagedTable;
