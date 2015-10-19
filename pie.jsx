import React from 'react';
import Chart from 'chart.js';
import Box from 'components/box';
import Row from 'components/row';
import Utils from 'utils';
import _ from 'gettext';

/* ChartJS Pie Chart
 *
 * Props:
 *
 * dataType {String} DataType to be used when formatting values
 * labelAttr {String|Number} which attr name will the label be returned by
 * valueAttr {String|Number} which attr name will the values be returned by
 * data {Array} The array containing the values and labels, organized like:
 *              [{labelAttr: moment(...), valueAttr: 9318}, ...]
 */
export default class Pie extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      chartData: [], // Formatted data, has only label and value indexes
      chart: null,   // The ChartJS Pie object
      data: [],      // The raw data used on the Pie
    };
  }

  /* Parse input data to generate a chart friendly structured data
   *
   * It will also instantiate a ChartJS Pie
   */
  _setupPie(data, labelAttr, valueAttr) {
    // If we already have a chart built, destroy it
    if (this.state.chart) {
      this.state.chart.destroy();
    }

    var chartData = [];

    // Remove data whose values are falsy (0, undefined, null...)
    data = data.filter((object) => {return object[valueAttr];});
    // Descending sort
    data.sort((a, b) => {
      return b[valueAttr] - a[valueAttr];
    });

    // Get the sum of all values in the data array to calculate
    // the percentage for each category in the chart.
    var total = data.reduce((sum, object) => {
      return sum + object[valueAttr];
    }, 0);

    this.setState({total});

    data.forEach((object, index) => {
      if (index < 9) {
        // Format the greater elements
        chartData.push({
          label: object[labelAttr],
          value: object[valueAttr],
          percentValue: object[valueAttr] / total * 100,
          color: Utils.get_color(index),
          highlight: Utils.get_color(index, true),
        });
        return;
      }
      // Accumulate other element in a bundled element
      var last = chartData.length - 1;
      chartData[last].label = _('Others');
      chartData[last].value += object[valueAttr];
      chartData[last].percentValue = chartData[last].value / total * 100;
    });

    // Build the chart
    var context = this.refs.canvas.getContext('2d');
    var chart = new Chart(context).Pie(chartData, {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      tooltipTemplate: this._formatTooltip.bind(this),
    });

    this.setState({chartData, chart, data});
  }

  /*
   *  Callbacks
   */

  _showTooltip(index) {
    this.state.chart.showTooltip([this.state.chart.segments[index]]);
  }

  _hideTooltip() {
    this.state.chart.showTooltip([]);
  }

  /*
   * HTSQL
   */

  getHTSQL() {
    var htsql = this.props.htsql;
    htsql = typeof htsql === 'function' ? htsql() : htsql;
    return htsql;
  }

  /*
   *  Rendering
   */

  _formatTooltip(options) {
    var formatter = Utils.formatters[this.props.dataType];
    return `${options.label}: ${formatter(options.value)} (${Utils.formatters.percentage(options.value/this.state.total * 100)})`;
  }

  /* Displays the chart legend */
  _getLegend(object, index) {
    var style = {backgroundColor: object.color};
    return <div key={index} onMouseOver={this._showTooltip.bind(this, index)}
                onMouseOut={this._hideTooltip.bind(this)}>
             <span className="color" style={style}></span>
             { object.label }
           </div>;
  }

  /*
   *  React
   */

  componentWillReceiveProps(props) {
    this._setupPie(props.data, props.labelAttr, props.valueAttr);
  }

  componentWillUnmount() {
    this.state.chart && this.state.chart.destroy();
  }

  render() {
    return <Box padding={true} title={this.props.title} icon={this.props.icon} loading={this.props.loading}>
        <Row lg={[7, 5]}>
          <div style={{height: '300px'}}>
            <canvas ref="canvas" width="300" height="300"></canvas>
          </div>
          <div className="legend">
            { this.state.chartData.map(this._getLegend, this) }
          </div>
        </Row>
    </Box>;
  }
}
