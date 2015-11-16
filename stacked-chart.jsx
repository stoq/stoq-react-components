import React from 'react';
import d3 from 'd3';
import nv from 'nvd3';
import moment from 'moment';

import equals from './utils/equals';
import Utils from 'utils';

import Mixins from './mixins';

let StackedChart = React.createClass({
  mixins: [Mixins.EventsMixin],

  componentWillReceiveProps: function(props) {
    // Avoid drawing anythin if there's no data
    if (!props.data || !Object.keys(props.data).length) {
      return;
    }

    if (this.svg) {
      this.svg.selectAll("*").remove();
      this.off(window, 'resize');
    }

    var data = [];
    var dates = Utils.generateDateSeries(props.start, props.end, 1, 'month');
    Object.keys(props.data).forEach(key => {
      // XXX The need to have this display: {y: 0 ...} might be a bug on
      // the last release of the nvd3 library.
      var set = {key, values: [], display: {y: 0, 'y0': 0}};
      var array = props.data[key];

      // Fill empty dates between the series of each data, as nvd3
      // stackedAreaChart requires all data arrays to have the same
      // length
      dates.forEach(date => {
        var values;

        var object = array[0];
        if (object && date.isSame(object[this.props.x], 'month')) {
          // NVD3 requires unix milliseconds, so we should convert it
          // to UTC before converting it to unix milliseconds.
          values = [date.utc().unix() * 1000, object[this.props.y]];
          array.splice(0, 1);
        } else {
          values = [date.utc().unix() * 1000, 0];
        }
        set.values.push(values);
      });
      data.push(set);
    });

    // Keeps the highest key on the top
    data = data.sort(this.props.sortFunc || props.sortFunc || function(a, b) {
      return parseFloat(a.key) - parseFloat(b.key);
    });

    // Only really draw the chart if the given data is different
    if (equals(data, this.data)) {
      return;
    }
    this.data = data;

    nv.addGraph(() => {
      var chart =  nv.models.stackedAreaChart()
                     .margin({right: 100})
                     .x(v => v[0])
                     .y(v => v[1])
                     .useInteractiveGuideline(true)
                     .rightAlignYAxis(true)
                     .showControls(true);
      // When displaying the data on the tooltip, we parse the unix
      // timestamp as UTC
      chart.xAxis.tickFormat(d => moment.utc(new Date(d)).format('YYYY-MM'));
      chart.yAxis.tickFormat(d3.format(',.2f'));

      this.svg = d3.select(this.refs.chart)
        .style('width', '100%')
        .style('height', '300px')
        .datum(data).call(chart);
      this.on(window, 'resize', chart.update);
      return chart;
    });
  },

  componentWillUnmount: function() {
    this.off(window, 'resize');
    this.svg && this.svg.remove();
  },

  render: function() {
    return <div><svg ref="chart"></svg></div>;
  },
});

export default StackedChart;
