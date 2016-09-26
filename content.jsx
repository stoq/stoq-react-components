import React from 'react';
import $ from 'jquery';
import Utils from 'utils';
import Moment from 'moment';

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
    let pageTitle = Utils.getValue(this.props.title);
    let pageSubtitle = Utils.getValue(this.props.subtitle);
    let filterLabel = '';
    if (this.props.hasDateFilter) {
      let dateParts = this.props.filterDate.split('to');
      if (dateParts.length == 2) {
        // Advanced date filter
        filterLabel = ` - filtrado no período ${Moment(dateParts[0]).format('DD/MM/YYYY')} a
                        ${Moment(dateParts[1]).format('DD/MM/YYYY')}`;
      } else {
        let day = Moment(this.props.filterDate).format('D');
        let month = Moment(this.props.filterDate).format('MMMM');
        let year = Moment(this.props.filterDate).format('Y');
        let group = {
          day: 'dia ' + day + ' de ' + month + ' de ' + year,
          month: 'mês de ' + month + ' de ' + year,
          year: 'ano de ' + year,
        };
        filterLabel = ` - filtrado pelo ${group[this.props.filterGroup]}`;
      }
    }
    $('title').text(`${title} - ${pageTitle} ${pageSubtitle}`);
    return <section className="content-header">
      <h1 className="page-title">
        <div style={{display: 'inline-block'}} data-step={this.props.dataStep} data-intro={this.props.dataIntro}>
          { this.props.title }&nbsp;
          <small className="hidden-xs">
            { this.props.subtitle }
            { filterLabel }
          </small>
        </div>
        { this.props.children }
        { this.props.refresh &&
        <button id="refresh-button" className="btn btn-default pull-right" onClick={this.props.refresh}>
            <i className="fa fa-refresh"/>
        </button>}
      </h1>
    </section>;
  }
};
