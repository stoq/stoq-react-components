import React from 'react';

var LoadingButton = React.createClass({
  render: function() {
    return <button disabled={this.props.loading || this.props.disabled}>
      {this.props.loading ? <i className="fa fa-refresh fa-spin"/>  : this.props.children}
    </button>;
  },
});

module.exports = LoadingButton;
