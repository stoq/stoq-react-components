import React from 'react';
import Row from 'components/row';
import Utils from 'utils';

let Summary;
/* Generates Summaries out of HTSQL queries
 *
 * Props:
 *
 * xs,sm,md,lg {Number[]} Bootstrap's grid columns for each Summary.Item
 * data {Object} The data to be displayed on the summary
 *
 * SubElements:
 *
 *  Summary.Item:
 *
 *  Props:
 *
 *  htsql {String} Which htsql query will this summary item be querying for
 *  label {String} Which label will be displayed on the item box
 *  sublabel {String} Like label, but small capped
 */
module.exports = Summary = React.createClass({

  getDefaultProps: function() {
    return {data: {}};
  },

  getHTSQL: function() {
    var attributes = [];
    this.props.children.forEach(item => {
      if (item.type !== Summary.Item)
        return;
      var value = item.props.getAttr('');
      attributes.push(`${value}:=${item.props.htsql}`);
      // Add the item's subhtsql if it has one
      if (item.props.subhtsql) {
        value = item.props.getAttr('sub');
        attributes.push(`${value}:=${item.props.subhtsql}`);
      }
    });
    return attributes.join(',');
  },

  getItem: function(item, prefix) {
    // Try to get the value from the directly set value on the item
    var value = item.props[prefix + 'value'];
    // Then try to get it from the indirect attr property
    value = value || this.props.data[item.props.getAttr(prefix)];
    // Finally, format the value if a formatter is provided
    value = item.props[prefix + 'formatter'] ? item.props[prefix + 'formatter'](value) : value;

    // Reduce the text size for subvalues
    var textStyle = prefix ? {fontSize: '10px'} : {};
    var numberStyle = prefix ? {fontSize: '14px'} : {};
    return <div>
      <span className="info-box-text" style={textStyle}>{item.props[prefix + 'label']}</span>
      <span className="info-box-number" style={numberStyle}>{value}</span>
    </div>;
  },

  getSummary: function(item) {
    var subItem = null;
    if (item.props.subValue || item.props.sublabel) {
      subItem = this.getItem(item, 'sub');
    }

    return <div className="info-box">
      <span className={"info-box-icon " + item.props.color}>
        <i className={item.props.icon}/>
      </span>
      <div className="info-box-content">
        {this.getItem(item, '')}
        {subItem}
      </div>
    </div>;
  },

  render: function() {
    return <Row className="dashboard" {...this.props}>
      {React.Children.map(this.props.children, function(item) {
        return this.getSummary(item);
      }, this)}
    </Row>;
  },
});

module.exports.Item = React.createClass({
  getDefaultProps: function() {
    return {
      getAttr: function(prefix) {
        var attr = this.attr || Utils.encode(this.htsql);
        return prefix + attr;
      },
    };
  },

  render: function() {},
});
