import React from "react";
import Utils from "utils";
import equals from "./utils/equals";
import moment from "moment";
import Chart from "./node_modules/chart.js";

Chart.controllers.DateLine = Chart.controllers.line.extend({
  name: "DateLine",

  draw: function() {
    Chart.controllers.line.prototype.draw.apply(this, arguments);
    // XXX Workaround to avoid sundays being highlighted when grouping
    // is not done by day.
    if (this.chart.options.formatLabel != "date") {
      return;
    }

    var chart = this.chart;
    var ctx = chart.chart.ctx;

    var xAxis = chart.scales["x-axis-0"];
    var yAxis = chart.scales["y-axis-0"];

    xAxis.tickMoments.forEach((tick, index) => {
      if (tick.day() === chart.options.weekStart) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xAxis.getPixelForValue(tick, index), yAxis.top);
        ctx.strokeStyle = "rgba(77,83,96,0.3)";
        ctx.lineTo(xAxis.getPixelForValue(tick, index), yAxis.bottom);
        ctx.stroke();
        ctx.restore();
      }
    });
  },
});

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
    return { formatLabel: "date", weekStart: 0 };
  },

  _labelFormats: {
    hour: "hour",
    day: "date",
    month: "month",
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
    let { start, end, group } = {
      // The time scale positions the values according to it's unix timestamp,
      // we want to show these data right above the labels.
      start: props.group === "month" ? props.start.startOf("month") : props.start.startOf("day"),
      end: props.group === "month" ? props.end.endOf("month") : props.end.endOf("day"),
      group: props.group || "month",
    };

    // ChartJS API formatted data
    let data = {
      labels: [],
      datasets: [
        {
          borderColor: "rgba(77,83,96,0.8)",
          borderWidth: 2,
          backgroundColor: "rgba(77,83,96,0.1)",
          strokeColor: "rgba(77,83,96,0.8)",
          pointBorderColor: "white",
          pointBackgroundColor: "rgba(77,83,96,0.8)",
          pointRadius: 4,
          pointHoverRadius: 5,
          data: [],
        },
      ],
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

    // Finally, build the chart
    let ctx = this.refs.canvas.getContext("2d");
    this.chart = new Chart(ctx, {
      type: "DateLine",
      data: data,
      options: {
        //Add option to choose the day the week starts
        weekStart: this.props.weekStart,
        //chart.js options
        formatLabel: this._labelFormats[group],
        legend: false,
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              type: "time",
              position: "bottom",
              time: {
                unit: group,
                displayFormats: {
                  day: "D",
                  month: "M",
                  hour: "H",
                },
              },
            },
          ],
          yAxes: [
            {
              position: "left",
              ticks: {
                suggestedMin: 0,
                suggestedMax: 10,
              },
            },
          ],
        },
        tooltips: {
          callbacks: {
            // Use the formatter given from props
            label: function(tooltipItems) {
              var formatter =
                typeof props.yFormatter === "function"
                  ? props.yFormatter
                  : Utils.formatters[props.yFormatter || "numeric"];
              return formatter(tooltipItems.yLabel);
            },
            // The xlabel will be hidden, showing only it's value
            title: function() {
              return "";
            },
          },
          mode: "x-axis",
          bodyFontSize: 15,
        },
      },
    });
  },

  /*
   * HTSQL
   */

  getHTSQL: function() {
    var htsql = this.props.htsql;
    htsql = typeof htsql === "function" ? htsql() : htsql;
    return htsql;
  },

  /*
   * React
   */

  componentDidUpdate: function(previous) {
    const isSame =
      this.props.start.startOf("day").isSame(previous.start.startOf("day")) &&
      this.props.end.startOf("day").isSame(previous.end.startOf("day"));
    if (!equals(this.props, previous) || !isSame) {
      this._setupChart(this.props);
    }
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
