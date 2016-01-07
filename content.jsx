import React from 'react';
import $ from 'jquery';

/* AdminLTE Content to be displayed
 *
 * Props:
 *
 * children Anything that should be displayed
 */
module.exports = class Content extends React.Component {
  static propTypes: {
    children: React.PropTypes.any.isRequired,
  };

  render() {
    return <section className='content'>{this.props.children}</section>;
  }
};

/* AdminLTE Header
 *
 * Props:
 *
 * title {String} Title of the view
 * subtitle {String} small title (displayed by the side of props.title)
 * children Anything that should be displayed on the title's body
 */
module.exports.Header = class Header extends React.Component {
  static propTypes: {
    title: React.PropTypes.string,
    subtitle: React.PropTypes.string,
  };

  render() {
    let title = $('title').html().split('-')[0];
    $('title').text(`${title} - ${this.props.title} ${this.props.subtitle || ''}`);
    return <section className="content-header">
      <h1 className="page-title">
        <div style={{display: 'inline-block'}} data-step={this.props.dataStep} data-intro={this.props.dataIntro}>
          { this.props.title } <small>{ this.props.subtitle }</small>
        </div>
        { this.props.children }
      </h1>
    </section>;
  }
};
