import React from 'react';
import Utils from 'utils';

/* Auto Querying htsql object
 *
 * Automatically generates the query attribute for a HTSQL element and handle
 * content displaying - everything in one single element.
 *
 * This Item is highly correlated to the HTSQLDetailsMixin, for more details,
 * about it, refer to its `get` method.
 *
 * Props:
 *
 * data The data to be displayed
 * htsql {String=props.attr} Which query will the item be looking for
 * attr = {String=Utils.encode(props.htsql)} Which attribute name should the
 *                                           htsql return for this element
 */
export default class HTSQLItem extends React.Component {
  static propTypes: {
    data: React.PropTypes.any,
    htsql: React.PropTypes.string,
    attr: React.PropTypes.string,
  }

  resolveItem(item) {
    if (typeof item === 'object') {
      return this.resolve(item);
    }
    return item;
  }

  /* Provide backwards compatibility for React 0.13 object displaying behavior
   *
   * React 0.13.x displayed each object attribute when inserting it into the
   * DOM. This method recursively searches for objects inside a `{}` object
   * or array and returns an array of with elementary attributes that React
   * 0.14.x can display.
   *
   * @param {Array|Object} object - The object to be converted into elementary
   *                                types
   *
   * example:
   *
   * // object = [{foo: 2}, [{bar: 3}]];
   * this.resolve(object) // => [[2], [[3]]] -> React displays it as "2 3"
   */
  resolve(object) {
    if (Array.isArray(object)) {
      return object.map(this.resolveItem, this);
    }
    return Object.keys(object).map(key => this.resolveItem(object[key]));
  }

  getAttr() {
    return this.props.attr || Utils.encode(this.props.htsql);
  }

  getHTSQL() {
    return `${this.getAttr()}:=${this.props.htsql}`;
  }

  render() {
    let value = this.props.data[this.getAttr()];
    if (typeof value === 'object') {
      value = this.resolve(value);
    }
    value = this.props.formatter ? this.props.formatter(value) : value;
    return <span style={{display: 'inherit'}}>{value}</span>;
  }
}
