import React from 'react';
import Box from 'components/box';
import Brazil from './maps/brazil';
import d3 from 'd3';
import topojson from 'topojson';
import $ from 'jquery';
import _ from 'gettext';
import Mixins from './mixins';

let Maps = {};

class Scale extends React.Component {
  getMarker() {
    var percent = (this.props.current / this.props.max) * 100;
    return <div className="scale-marker" style={{left: percent + '%'}}></div>;
  }

  getNumber() {
    var percent = (this.props.current / this.props.max) * 100;
    return <div className="scale-number" style={{left: percent + '%'}}>
      { this.props.current }
    </div>;
  }

  render() {
    return <div className="map-scale">
      <div className="scale"/>
      <div className="map-max">{ this.props.max }</div>
      <div className="map-min">0</div>
      { this.getMarker() }
      { this.getNumber() }
    </div>;
  }
}

Maps.Brazil = React.createClass({
  attr: 'last_seen',

  mixins: [Mixins.EventsMixin],

  getInitialState: function() {
    return {
      max: 0,
      current: 0,
    };
  },

  getHTSQL: function(query) {
    // TODO Implement a generic way of doing this
    return `users_by_state := /db_instance.filter(!invalid & ${query.htsql}) ^ state {
      state, users := count(^)
    }`;
  },

  componentWillReceiveProps: function(props) {
    this.drawMap(props);
  },

  componentDidMount: function() {
    // Each time the window is resized, the map should be resized
    this.on(window, 'resize', () => this.drawMap(this.props));
  },

  componentWillUnmount: function() {
    this.off(window, 'resize');
    this.svg && this.svg.remove();
  },

  drawMap: function(props) {
    if (!props.data) {
      return;
    }

    // If there was a previous map, remove it to leave space for the new.
    this.svg && this.svg.remove();

    var element = this.refs.container;
    var data = {};
    props.data.forEach(object => {
      data[object.state] = object.users;
    });

    // Determine the ideal width for the element
    var width = $(element).width() * 0.8;
    var height = width;

    // Create the color interpolation function between 0 and the maximum
    var max = -Infinity;
    Object.keys(data).forEach(function(key) {
      max = Math.max(data[key], max);
    });
    this.setState({max});
    var color = d3.scale.linear().domain([0, max]).range(['#ECECEC', '#1E824C']);

    // Convert our TopoJSON representation to a GeoJSON representation
    var GeoJSON = topojson.feature(Brazil, Brazil.objects.states);

    // Reference: http://stackoverflow.com/a/14691788
    // Center the map on the SVG tag by creating a unit projection
    var projection = d3.geo.mercator()
                       .scale(1)
                       .translate([0, 0]);

    // Create a path generator.
    var path = d3.geo.path()
                 .projection(projection);

    // Compute the bounds of a feature of interest, then derive scale & translate.
    var b = path.bounds(GeoJSON);
    var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
    var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    // Update the projection to use computed scale & translate.
    projection.scale(s).translate(t);
    path = path.projection(projection);

    // Finally, create our SVG element to display the map
    var svg = d3.select(element).append('svg')
                .attr('width', width)
                .attr('height', height);

    // And put our data into it
    svg.selectAll('path').data(GeoJSON.features).enter().append("path")
       .style('fill', function(object) {
         if (data[object.properties.state] === undefined) {
           return;
         }
         return color(data[object.properties.state]);
       })
       .attr('d', path)
       .attr('id', object => object.properties.state)
       .attr('class', 'state')
       .on('mouseover', object => {
         this.setState({current: data[object.properties.state] || 0});
       });
    this.svg = svg;
  },

  /*
   * React
   */

  render: function() {
    return <Box padding={true} title={_("New Users Location")} icon="fa fa-globe" loading={this.props.loading}>
      <div ref="container" className="map"/>
      <div style={{padding: '1em'}}>
        <Scale max={this.state.max} current={this.state.current}/>
      </div>
    </Box>;
  },
});

export default Maps;
