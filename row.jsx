import React from 'react';


/* Handles Bootstrap's <div class="row"></div> in a easier way
 *
 * // React
 * <Row md={[6, 6]}>
 *  <Foo/>
 *  <Bar/>
 * </Row>
 *
 * // Result
 * <div class="row">
 *  <div>
 *    <Foo></Foo>
 *  </div>
 *  <div>
 *  </div>
 *    <Bar></Bar>
 *  </div>
 * </div>
 *
 * Props:
 *
 * xs {Number[]} What are the respective xs attributes for the children
 * sm {Number[]} What are the respective sm attributes for the children
 * md {Number[]} What are the respective md attributes for the children
 * lg {Number[]} What are the respective lg attributes for the children
 */
export default class Row extends React.Component {
  /*
   *  Private API
   */

  _getClass(index) {
    var sizes = ['xs', 'sm', 'md', 'lg'];
    var classNames = '';
    sizes.forEach(function(size) {
      if (!this.props[size]) {
        return;
      }
      classNames += 'col-' + size  + '-' + this.props[size][index] + ' ';
    }.bind(this));
    return classNames;
  }

  /*
   * React
   */

  static defaultProps: {className: ''}

  render() {
    return <div className={"row " + this.props.className}>
      {React.Children.map(this.props.children, function(child, index) {
        return <div className={this._getClass(index)}>{child}</div>;
      }.bind(this))}
    </div>;
  }
}
