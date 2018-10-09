import React from 'react';
import ReactDOM from 'react-dom';
import {gettext as _} from 'ttag';

import Utils from 'utils';

/* A paginated Table pager
 *
 * Props:
 *
 * meta {Object} Table Metadata used to properly distribute Pager's pages
 *               it should strictly be in the following pattern:
 *               {
 *                 page_count: <total number of pages>,
 *                 total: <total number of rows>,
 *                 page: <current page number>,
 *                 page_size: <number of elements per page>,
 *               }
 * table {React.Component} The table component related to this pager. It is
 *                         used to extract the table's width and adjust Pager's
 *                         width accondingly.
 */
let Pager = React.createClass({

  /*
   *
   */
  getInitialState: function() {
    return {
      width: 0,
      pageWidth: 35,
      headWidth: 240,
    };
  },

  getDefaultProps: function() {
    return {onPageChange: undefined};
  },

  /*
   *  Private
   */

  _addPage: function(label, index, alternate_label) {
    var query = $.param($.extend({}, Utils.getParams(), {page: index}));
    var page;
    alternate_label = alternate_label || label;
    if (index !== null) {
      page = <li key={label} ><a className="page_navigation"
               href={location.hash.split('?')[0] + '?' + query}
               onClick={this._pageClicked.bind(this, index)}
               ref={this._pages.length}>
        <span className="hidden-xs">{ label }</span>
        <span className="visible-xs">{ alternate_label }</span>
      </a></li>;
    }
    else {
      page = <li key={label}><span className="disabled" ref={this._pages.length}>
        <span className="hidden-xs">{ label }</span>
        <span className="visible-xs">{ alternate_label }</span>
      </span></li>;
    }
    this._pages.push(page);
  },

  _pageClicked: function(page, event) {
    if (this.props.onPageChange !== undefined) {
      event.preventDefault();
      this.props.onPageChange(page);
    }
  },

  _updateDimention: function() {
    // Reset the 'need' to update the pager dimensions
    this.sizeAdjusted = false;

    // Update the table size
    var table = this.props.table;
    this.setState({
      width: (table && $(ReactDOM.findDOMNode(table)).width()) || 0,
    }, function() {
      // Then update the pager dimensions
      this.updateDimensions();
    });
  },

  /*
   * React
   */

  componentDidMount: function() {
    window.addEventListener("resize", this._updateDimention);
    let table = this.props.table;
    this.setState({
      width: (table && $(ReactDOM.findDOMNode(table)).outerWidth()) || 0,
    });
  },

  componentWillReceiveProps: function(props) {
    let table = props.table || this.props.table;
    this.setState({
      width: (table && $(ReactDOM.findDOMNode(table)).outerWidth()) || 0,
    });
  },

  componentDidUpdate: function() {
    if (!this.updating) {
      this.updateDimensions();
    }

    // Wait a while before setting `updating` to `false`, this will prevent
    // `updateDimensions` method to be called a LOT of times
    setTimeout(() => {
      this.updating = false;
    }, 1000);
  },

  updateDimensions: function(callback) {
    let hasPages = this._pages && this._pages.length;
    if (!hasPages) {
      return;
    }

    // Calculate the width of the largest page on the line
    let page = this.refs[this._pages.length - 3];
    let pageWidth = $(page).outerWidth();

    // Dont update if the actual pageWidth is equal to this.state.pageWidth
    // because pagers within tabs that are not visible don't actually have
    // width, causing infinite loops or stack overflows
    if (pageWidth === this.state.pageWidth || pageWidth === 0) {
      return;
    }

    // Calculate the pagination 'headers' width
    let headWidth = 0;
    [0, 1, this._pages.length - 1, this._pages.length - 2].forEach(index => {
      headWidth += $(this.refs[index]).outerWidth();
    });

    // XXX: Not actually the best solution, but the easiest one for now.
    //      This component should be refactored whenever possible.
    // Set updating flag as true, this will prevent this method being called on
    // an infinite recursion.
    this.updating = true;

    this.setState({
      headWidth,
      pageWidth: pageWidth || this.state.pageWidth,
    }, callback);
  },

  componentWillUnmount: function() {
    window.removeEventListener("resize", this._updateDimention);
  },

  render: function() {
    if (this.props.meta === undefined || this.props.table === undefined) {
      return null;
    }

    let meta = this.props.meta;
    let pagination_width = this.state.width,
        page_width = this.state.pageWidth,
        head_width = this.state.headWidth,
        pagination_size = (((pagination_width - head_width) / page_width) - 1),
        _before = Math.floor(pagination_size / 2),
        _after = _before,
        _to_show = _before + _after;

  // Tha var 'page' is updated by -1, this certifies that the URL was passed
  // with the correct number page AND the offset will be started in 0 for
  // page 1, 10 for page 2, etc (when 'page' multplies 'getPageSize')

    if (meta.page - _before <= 0) {
      _before = meta.page - 1;
      _after = _to_show - _before;
    }
    else if (meta.page + _after >= meta.page_count) {
      _after = meta.page_count - meta.page;
      _before = _to_show - _after;
    }

    this._pages = [];
    this._addPage(_('Primeira'), 1, '<<');
    this._addPage(_('Anterior'), (meta.page > 1) ? meta.page - 1 : null, '<');

    for (let i = _before; i > 0; i--)
      if (meta.page - i > 0)
        this._addPage(meta.page - i, meta.page - i);

    this._pages.push(<li key={meta.page} className="active">
      <span ref={this._pages.length}>{ meta.page }</span>
    </li>);

    for (let i = 1; i <= _after; i++)
      if (meta.page + i <= meta.page_count)
        this._addPage(meta.page + i, meta.page + i);

    this._addPage(_('Próxima'), (meta.page < meta.page_count) ? meta.page + 1 : null, '>');
    this._addPage(_('Última'), meta.page_count ? meta.page_count : 1, '>>');

    return <div className="list_pager clearfix">
      <ul className="pagination no-margin">{ this._pages }</ul>
    </div>;
  },
});

module.exports = Pager;
