import React from 'react';
import $ from 'jquery';

/* AdminLTE Box Widget https://almsaeedstudio.com/themes/AdminLTE/pages/widgets.html
 *
 * Props:
 *
 * padding {Boolean=false} Applies a padding between the box and its content
 * collapsible {Boolean=false} Allow the box to be collapsed
 * collapsed {Boolean=false} Should the box be initially collapsed?
 * loading {Boolean=true} Displays box loading animation
 */
let Box = React.createClass({
  propTypes: {
    padding: React.PropTypes.bool,
    collapsible: React.PropTypes.bool,
    loading: React.PropTypes.bool,
    onUpdate: React.PropTypes.func,
  },

  /*
   *  Callbacks
   */

  onCollapseClick: function() {
    this.setState({collapsed: !this.state.collapsed}, () => {
      if (this.state.collapsed) {
        $(this.refs.body).slideUp();
        return;
      }
      // Render some charts again if they're not properly built with the
      // box collapsed
      window.dispatchEvent(new Event('resize'));
      $(this.refs.body).slideDown();
    });
  },

  /*
   *  Private API
   */

  _getIcon: function() {
    if (!this.props.icon) {
      return;
    }
    return <i className={this.props.icon}></i>;
  },

  _getTitle: function() {
    if (!this.props.title) {
      return;
    }
    return <h3 className="box-title">{ this.props.title }</h3>;
  },

  _getCollapseButton: function() {
    if (!this.props.collapsible) {
      return;
    }
    return <div className="box-tools pull-right">
      <button ref="collapseButton" className="btn btn-default btn-sm" onClick={this.onCollapseClick}>
        <i className={"fa fa-" + (this.state.collapsed ? 'plus' : 'minus')}></i>
      </button>
    </div>;
  },

  _getOnUpdate: function() {
    if (!this.props.onUpdate) {
      return;
    }
    return <div className="box-up pull-right">
        <button ref="updateButton" className="btn btn-default btn-sm"
                onClick={this.props.onUpdate}>
        <i className="fa fa-refresh"></i>
      </button>
    </div>;
  },

  _getHeader: function() {
    if (!this.props.title && !this.props.icon && !this.props.collapsible && !this.props.onUpdate) {
      return null;
    }
    return <div className="box-header">
             {this._getIcon()}
             {this._getTitle()}
             {this._getCollapseButton()}
             {this._getOnUpdate()}
           </div>;
  },

  _getClass: function(klass) {
    return this.props[klass] ? ('box-' + klass + ' ') : '';
  },

  /*
   * React Implementation
   */

  getInitialState: function() {
    return {collapsed: false};
  },

  getDefaultProps: function() {
    return {
      padding: false,
      collapsible: false,
      loading: true,
    };
  },

  componentDidMount: function() {
    this.props.collapsed && this.onCollapseClick();
  },

  render() {
    return <div className={"box " + this._getClass('solid') + this._getClass('primary')}
                data-step={this.props.dataStep} data-intro={this.props.dataIntro}>
      { this._getHeader() }
      <div ref="body" className={ "box-body " + (this.props.padding ? '' : 'no-padding') }>
        { this.props.children }
      </div>
      {this.props.loading && <div className="overlay">
        <i className="fa fa-refresh fa-spin"/>
      </div>}
    </div>;
  },
});

module.exports = Box;
