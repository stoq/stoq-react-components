import React from "react";
import Chart from "chart.js";
import equals from "./utils/equals";
import Box from "./box";
import Row from "./row";
import Utils from "utils";
import { gettext as _ } from "ttag";

// Create an array of tooltips
// We can't use the chart tooltip because there is only one tooltip per chart
Chart.pluginService.register({
  beforeRender: function(chart) {
    chart.pluginTooltips = [];
    chart.config.data.datasets.forEach(function(dataset, i) {
      chart.getDatasetMeta(i).data.forEach(function(sector) {
        chart.pluginTooltips.push(
          new Chart.Tooltip(
            {
              _chart: chart.chart,
              _chartInstance: chart,
              _data: chart.data,
              _options: chart.options.tooltips,
              _active: [sector],
            },
            chart
          )
        );
      });
    });
  },
});

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

let Pie = React.createClass({
  getInitialState: function() {
    return {
      chartData: [], // Formatted data, has only label and value indexes
      chart: null, // The ChartJS Pie object
      data: [], // The raw data used on the Pie
    };
  },

  /* Parse input data to generate a chart friendly structured data
   *
   * It will also instantiate a ChartJS Pie
   */
  _setupPie: function(props) {
    // If we already have a chart built, destroy it
    if (this.chart) {
      this.chart.destroy();
    }
    let labelAttr = props.labelAttr;
    let valueAttr = props.valueAttr;
    let data = props.data;
    var chartData = [];
    // Remove data whose values are falsy (0, undefined, null...)
    data = data.filter(object => {
      return object[valueAttr];
    });
    // Descending sort
    data.sort((a, b) => {
      return b[valueAttr] - a[valueAttr];
    });

    // Get the sum of all values in the data array to calculate
    // the percentage for each category in the chart.
    var total = data.reduce((sum, object) => {
      return sum + object[valueAttr];
    }, 0);

    data.forEach((object, index) => {
      if (index < 9) {
        // Format the greater elements
        chartData.push({
          label: object[labelAttr],
          value: object[valueAttr],
          percentValue: (object[valueAttr] / total) * 100,
          color: Utils.getColor(index),
          highlight: Utils.getColor(index, true),
        });
        return;
      }
      // Accumulate other element in a bundled element
      var last = chartData.length - 1;
      chartData[last].label = _("Others");
      chartData[last].value += object[valueAttr];
      chartData[last].percentValue = (chartData[last].value / total) * 100;
    });

    let labels = [];
    let values = [];
    let percents = [];
    let colors = [];
    let highlights = [];
    chartData.forEach(point => {
      labels.push(point.label);
      values.push(point.value);
      percents.push(point.percentValue);
      colors.push(point.color);
      highlights.push(point.highlight);
    });

    var formatter = Utils.formatters[this.props.dataType];
    // Build the chart
    var context = this.refs.canvas.getContext("2d");
    var chart = new Chart(context, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            hoverBackgroundColor: highlights,
          },
        ],
      },
      options: {
        legend: false,
        maintainAspectRatio: false,
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              let value = data.datasets[0].data[tooltipItem.index];
              return `${formatter(value)} (${Utils.formatters.percentage((value / total) * 100)})`;
            },
            title: function(tooltipItem, data) {
              return data.labels[tooltipItem.index];
            },
          },
        },
      },
    });

    this.setState({ chartData, chart, data });
  },

  /*
   *  Callbacks
   */

  _showTooltip: function(index) {
    // Turn on tooltips
    let chart = this.state.chart;
    chart.options.tooltips.enabled = true;
    let tooltip = chart.pluginTooltips[index];
    tooltip.initialize();
    tooltip.update();
    tooltip.transition().draw();
  },

  _hideTooltip: function() {
    let chart = this.state.chart;
    chart.update(0);
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
   *  Rendering
   */
  /* Displays the chart legend */
  _getLegend: function(object, index) {
    var style = { backgroundColor: object.color };
    return (
      <div
        key={index}
        onMouseOver={this._showTooltip.bind(this, index)}
        onMouseOut={this._hideTooltip.bind(this, index)}
      >
        <span className="color" style={style}></span>
        {object.label}
      </div>
    );
  },

  /*
   *  React
   */

  componentWillReceiveProps: function(next) {
    if (!equals(this.props, next)) {
      this._setupPie(next);
    }
  },

  componentDidMount: function() {
    this.props.data && this._setupPie(this.props);
  },

  componentWillUnmount: function() {
    this.state.chart && this.state.chart.destroy();
  },

  render: function() {
    return (
      <Box
        padding={true}
        title={this.props.title}
        icon={this.props.icon}
        loading={this.props.loading}
      >
        <Row lg={[7, 5]}>
          <div style={{ height: "300px" }}>
            <canvas ref="canvas" width="300" height="300"></canvas>
          </div>
          <div className="legend">{this.state.chartData.map(this._getLegend, this)}</div>
        </Row>
      </Box>
    );
  },
});

module.exports = Pie;
