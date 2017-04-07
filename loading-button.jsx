import React from 'react';

import Utils from './utils';

var LoadingButton = React.createClass({
  render: function() {
    return <button {...Utils.only(this.props, ['onClick', 'style', 'title', 'type'])} disabled={this.props.loading || this.props.disabled}>
      {this.props.loading ? <i className="fa fa-refresh fa-spin"/>  : this.props.children}
    </button>;
  },
});

module.exports = LoadingButton;
