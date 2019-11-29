var React = require("react");

var TooltipIcon = React.createClass({
  getDefaultProps: function() {
    return {
      tipPosition: "bottom",
      color: "#C1C1C1",
      size: "17px",
    };
  },

  render: function() {
    return (
      <a
        className={`pointer ${this.props.className}`}
        data-toggle="tooltip"
        title={this.props.tip}
        data-placement={this.props.tipPosition}
        style={{ color: this.props.color, fontSize: this.props.size, ...this.props.style }}
        data-animation={true}
      >
        <i className="fa fa-info-circle" />
      </a>
    );
  },
});

module.exports = TooltipIcon;
