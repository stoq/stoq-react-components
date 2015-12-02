import React from 'react';
import Utils from 'utils';

/* Bootstrap's Module Tabs in React
 *
 * Props:
 *
 * customHeader {Boolean=true} Use AdminLTE's Boxed Tabs Style
 * padding {Boolean=false} Apply a little padding
 */
let Tabs = React.createClass({
  getDefaultProps: function() {
    return {
      customHeader: true,
    };
  },

  _getTab: function(ids, tab, index) {
    return <div key={index} id={ids[index]}
                className={ "tab-pane " + (tab.props.className || '') }>
              { tab.props.children }
            </div>;
  },

  click: function() {
    // Allow some charts to be rendered again when changing tabs
    window.dispatchEvent(new Event('resize'));
  },

  render: function() {
    // Generate random ids to be used by bootstrap's API
    var ids = this.props.children.map(function() {
      return Utils.getRandomString();
    });

    return <div className={this.props.customHeader ? 'nav-tabs-custom' : ''}>
  <ul className="nav nav-tabs">
    {this.props.children.map(function(tab, index) {
      return <li key={ index } className={ tab.props.className } onClick={this.click.bind(this, tab)}>
               <a data-toggle="tab" href={'#' + ids[index]}>
                 { tab.props.label }
               </a>
             </li>;
    }, this)}
  </ul>
  <div className={"tab-content" + (this.props.padding ? '' : ' no-padding')}>
    { this.props.children.map(this._getTab.bind(this, ids)) }
  </div>
</div>;
  },
});

Tabs.Tab = React.createClass({
  render: function() {},
});

module.exports = Tabs;
