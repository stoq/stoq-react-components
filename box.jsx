import React from "react";
import TooltipIcon from "./tooltip-icon";
import $ from "jquery";
import PropTypes from "prop-types";

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
    padding: PropTypes.bool,
    collapsible: PropTypes.bool,
    loading: PropTypes.bool,
    onUpdate: PropTypes.func,
  },

  /*
   *  Callbacks
   */

  onCollapseClick: function() {
    this.setState({ collapsed: !this.state.collapsed }, () => {
      if (this.state.collapsed) {
        $(this.refs.body).slideUp();
        return;
      }
      // Render some charts again if they're not properly built with the
      // box collapsed
      window.dispatchEvent(new Event("resize"));
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
    return <i className={this.props.icon} style={{ marginRight: "5px" }}></i>;
  },

  _getTitle: function() {
    if (!this.props.title) {
      return;
    }
    return (
      <div>
        {this._getIcon()}
        <h3 className="box-title">
          {this.props.title} <small>{this.props.subtitle}</small>
        </h3>
        <div className="pull-right">{this.props.customTitle}</div>
      </div>
    );
  },

  _getCollapseButton: function() {
    if (!this.props.collapsible) {
      return;
    }
    return (
      <div className="box-tools pull-right">
        <button
          ref="collapseButton"
          className="btn btn-default btn-sm"
          onClick={this.onCollapseClick}
        >
          <i className={"fa fa-" + (this.state.collapsed ? "plus" : "minus")}></i>
        </button>
      </div>
    );
  },

  _getOnUpdate: function() {
    if (!this.props.onUpdate) {
      return;
    }
    return (
      <div className="box-up pull-right">
        <button ref="updateButton" className="btn btn-default btn-sm" onClick={this.props.onUpdate}>
          <i className="fa fa-refresh"></i>
        </button>
      </div>
    );
  },

  _getTooltip: function() {
    if (!this.props.tooltip) return;
    return <TooltipIcon tip={this.props.tooltip} className="box-tools pull-right" />;
  },

  _getHeader: function() {
    if (!this.props.title && !this.props.icon && !this.props.collapsible && !this.props.onUpdate) {
      return null;
    }
    return (
      <div className="box-header">
        {this._getTitle()}
        {this._getCollapseButton()}
        {this._getOnUpdate()}
        {this._getTooltip()}
      </div>
    );
  },

  _getClass: function(klass) {
    return this.props[klass] ? "box-" + klass + " " : "";
  },

  /*
   * React Implementation
   */

  getInitialState: function() {
    return { collapsed: false };
  },

  getDefaultProps: function() {
    return {
      padding: false,
      collapsible: false,
      loading: true,
      className: "",
    };
  },

  componentDidMount: function() {
    this.props.collapsed && this.onCollapseClick();
  },

  render() {
    return (
      <div
        className={
          "box " + this._getClass("solid") + this._getClass("primary") + this.props.className
        }
        data-step={this.props.dataStep}
        data-intro={this.props.dataIntro}
        style={this.props.style}
      >
        {this._getHeader()}
        <div
          ref="body"
          className={"box-body " + (this.props.padding ? "" : "no-padding")}
          style={this.props.bodyStyle}
        >
          {this.props.children}
        </div>
        {this.props.loading && (
          <div className="overlay" style={{ backgroundColor: this.props.background }}>
            <i className="fa fa-refresh fa-spin" style={{ color: this.props.spinColor }} />
          </div>
        )}
      </div>
    );
  },
});

module.exports = Box;
