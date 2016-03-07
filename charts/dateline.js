var Chart = require('chart.js');

var DateLine = Chart.types.Line.extend({

  name: 'DateLine',

  dates: null,

  defaults: {
    formatLabel: 'date',
  },

  buildScale: function(labels) {
    this.dates = [];
    $.each(labels, function(index, label) {
      this.dates.push(label);
      labels[index] = label[this.options.formatLabel]();

      // Fixes Date.getMonth's deviation from the actual month number
      if (this.options.formatLabel === 'month') {
        labels[index] += 1;
      }

    }.bind(this));

    Chart.types.Line.prototype.buildScale.apply(this, arguments);
  },

  draw: function() {
    Chart.types.Line.prototype.draw.apply(this, arguments);

    // XXX Workaround to avoid sundays being highlighted when grouping
    // is not done by day.
    if (this.options.formatLabel != 'date') {
      return;
    }

    var ctx = this.chart.ctx;
    $.each(this.scale.xLabels, function(index) {
      if (this.dates[index].day() !== 0) {
        return true;
      }

      var linePos = this.scale.calculateX(
          index - (this.scale.offsetGridLines ? 0.5 : 0)) +
          Chart.helpers.aliasPixel(this.scale.lineWidth);

      ctx.beginPath();
      ctx.lineWidth = this.scale.gridLineWidth;
      ctx.strokeStyle = this.scale.gridLineColor;
      ctx.lineWidth = this.scale.gridLineWidth * 2;

      ctx.moveTo(linePos, this.scale.endPoint);
      ctx.lineTo(linePos, this.scale.startPoint - 3);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }.bind(this));
  },
});

module.exports = DateLine;
