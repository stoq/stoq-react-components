import PropTypes from "prop-types";
import React from "react";

import Utils from "utils";

import Pager from "./pager";

// React 16 dont suppoort mixins
// this lib is a partial port of mixins.jsx
// with high order components (decorators)
// that can be used in new components as a
// replacement of some of the behaviors provided by
// ths old mixins

export const withPagination = Table => {
  return class PaginatedTable extends Table {
    constructor(props) {
      // we want to keep methods of the wrapped class (example: getHTSQL)
      super(props);
    }

    static propTypes = {
      itemsTotal: PropTypes.number.isRequired,
      pageSize: PropTypes.number,
    };

    static defaultProps = {
      pageSize: 10,
    };

    getOffset = () => {
      return (this._getPage() - 1) * this.props.pageSize;
    };

    getPageSize = () => {
      return this.props.pageSize;
    };

    _getPage = () => {
      return parseInt(Utils.getParams().page) || 1;
    };

    state = {
      currentPage: this._getPage(),
    };

    render = () => {
      const { itemsTotal, onPageChange, pageSize, ...tableProps } = this.props;
      const paginationData = {
        page_count: Math.ceil(itemsTotal / pageSize),
        page: this.state.currentPage,
        page_size: pageSize,
        total: itemsTotal,
      };
      const _onPageChange = page => {
        this.setState({ currentPage: page }, onPageChange && onPageChange(page));
      };
      return (
        <div>
          <Table {...tableProps} ref="table" pageSize={pageSize} />
          <Pager table={this.refs.table} meta={paginationData} onPageChange={_onPageChange} />
        </div>
      );
    };
  };
};
