import React from 'react';
import Utils from 'utils';
import moment from 'moment';
import Chart from 'chart.js';

// Inject DateLine ChartJS component on ChartJS object
require('./charts/dateline');

/* ChartJS's DateLine Chart
 *
 * Displays a line chart that will highlight each sunday with a slightly
 * thicker vertical line.
 *
 * Props:
 *
 * start {Moment} Chart start date
 * end {Moment} Chart end date
 * labelAttr {String} which attr name will the label be returned by
 * valueAttr {String} which attr name will the values be returned by
 * data {Array} The array containing the values and labels, organized like:
 *              [{labelAttr: moment(...), valueAttr: 9318}, ...]
 * group {String=['hour', 'day', 'month']} Which grouping will the chart be
 *                                         organized by
 */
let DateLineChart = React.createClass({
  getDefaultProps: function() {
    // The MomentJS function to be used on the label
    return {formatLabel: 'date'};
  },

  _labelFormats: {
    hour: 'hour',
    day: 'date',
    month: 'month',
  },

  _setupChart: function(props) {
    // If the chart is already created, destroy it to leave space for the
    // updated one
    if (this.chart) {
      this.chart.destroy();
    }

    // The chart boundaries
    // Default value for group is 'month', to avoid next-to infinite loops
    // errors when no default group is provided.
    let {start, end, group} = {
      start: props.start.startOf('day'),
      end: props.end.endOf('day'),
      group: props.group || 'month',
    };

    // ChartJS API formatted data
    let data = {
      labels: [],
      datasets: [{
        fillColor: "rgba(77,83,96,0.1)",
        strokeColor: "rgba(77,83,96,0.8)",
        pointColor: "rgba(77,83,96,1)",
        pointStrokeColor: "#fff",
        pointHighlightStroke: "#fff",
        pointHighlightFill: "rgba(77,83,96,1)",
        data: [],
      }],
    };

    // Fill empty spaces on incoming data by merging a generated date series
    // with the incoming data and insert them into the chart.
    let rawData = props.data.slice();
    let chartData = Utils.generateDateSeries(start, end, 1, group);
    chartData.forEach(date => {
      let value = 0;

      // As we expect the rawData to be ordered ascending, the only
      // possible match will always be the first object in the rawData
      let object = rawData[0];
      if (object && date.isSame(object[props.labelAttr], group)) {
        value = object[props.valueAttr];
        rawData.splice(0, 1);
      }

      data.labels.push(date);
      if (date.isAfter(moment())) {
        return;
      }
      data.datasets[0].data.push(value);
    });

    // Format the Y coordinate according to the received datatype
    let formatter = function(object) {
      let formatter = Utils.formatters[props.dataType];
      return formatter ? formatter(object.value) : object.value;
    };

    // Finally, build the chart
    let ctx = this.refs.canvas.getContext('2d');
    this.chart = new Chart(ctx).DateLine(data, {
      animation: false,
      responsive: true,
      formatLabel: this._labelFormats[group],
      scaleLabel: formatter,
      tooltipTemplate: formatter,
      bezierCurveTension: 0.2,
      maintainAspectRatio: false,
      pointHitDetectionRadius: 3,
    });
  },

  /*
   * HTSQL
   */

  getHTSQL: function() {
    var htsql = this.props.htsql;
    htsql = typeof htsql === 'function' ? htsql() : htsql;
    return htsql;
  },

  /*
   * React
   */

  componentWillReceiveProps: function(props) {
    this._setupChart(props);
  },

  componentDidMount: function() {
    this.props.data && this._setupChart(this.props);
  },

  componentWillUnmount: function() {
    this.chart && this.chart.destroy();
  },

  render: function() {
    return <canvas className="chart" ref="canvas"></canvas>;
  },
});

module.exports = DateLineChart;
