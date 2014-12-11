/**
 *  Line Basic chart
 */
var $ = require('jquery');
var d3 = require('d3');
var Event = require('../../core/event');
var util = require('../../core/util');
/**
 *
 * Class Line Basic
 * @param {Object} config
 * {
 *   container:   {String|DomNode}
 *   color:       {Color Object}
 *   className:   {String}  css class name
 *   width:       {Number}
 *   height:      {Number}
 *   margin:      {Object}  {left, right, top, bottom}
 *   xTicks:      {Array}
 *   emptyMessage: {String}
 * }
 *
 */
function Line (container, config) {
  if (typeof container === 'string') {
    container = $(container);
  }
  this.container = container;

  var defaults = {};
  defaults.width = config.width || container.width() || 400;
  defaults.height = config.height || container.height() || 200;
  defaults.margin = config.margin || {top: 20, right: 20, bottom: 30, left: 50};
  defaults.max = config.max;
  defaults.min = config.min;
  defaults.yTickNum = config.yTickNum || 4;
  defaults.xTickValues = config.xTickValues || [];
  defaults.yTickValues = config.yTickValues || [];
  defaults.yValueFormat = config.yValueFormat || 'f';
  defaults.xAxisStyle = config.xAxisStyle || {'fill': 'none', 'stroke': '#000', 'shape-rendering': 'crispEdges'};
  defaults.yAxisStyle = config.yAxisStyle || {'fill': 'none', 'stroke': '#000', 'shape-rendering': 'crispEdges'};
  defaults.lineStyle = config.lineStyle || {'fill': 'none', 'stroke-width': '1.5px'};
  defaults.colorList = config.colorList || ['#ededed', '#d6e685', '#8cc665', '#44a340', '#1e6823'];
  defaults.getColor = config.getColor || function (num) {
    return defaults.colorList[num % defaults.colorList.length];
  };

  this.defaults = defaults;
}

Event.extend(Line, {
  bindEvent: function () {
  	;
  },
  empty: function (msg) {
    msg = msg || '暂无数据';
    this.container.html('<div class="chart-empty">' + msg + '</div>');
  },
  _getSVG: function () {
    var conf = this.defaults;
    var container = this.container;

    var svg = d3.select(container[0]).append("svg")
      .attr({
        'width': conf.width,
        'height': conf.height,
      });

    return svg;
  },
  // should add it to datavjs
  _unionArray: function (arrays) {
    if (arrays === []) {
      return [];
    }

    var array = d3.merge(arrays);
    var unionArray = [];
    $.each(array, function (i, el) {
      if ($.inArray(el, unionArray) === -1) {
        unionArray.push(el);
      }
    });

    return unionArray;
  },
  _getExtent: function (dataList) {
    var min = d3.min(dataList, function(data) { return d3.min(data, function(item) { return item.value; }); });
    var max = d3.max(dataList, function(data) { return d3.max(data, function(item) { return item.value; }); });

    return [min, max];
  },
  /**
   * render data
   * @public
   * @param  {[type]} data    [description]
   * @param  {[type]} callback [description]
   * @return {[type]}         [description]
   */
  render: function (source, callback) {
    if (!source || !source.length) {
      return this.empty(this.config.emptyMessage);
    }
    var dataList = source.map(function (item) {
      return item.data;
    });
    
    var svg = this._getSVG();
    var conf = this.defaults;
    var margin = conf.margin;
    var width = conf.width - margin.left - margin.right;
    var height = conf.height - margin.top - margin.bottom;
    var valueExtent = this._getExtent(dataList);
    var gridNum = conf.gridNum;
    var getColor = conf.getColor;
    var min = conf.min;
    min = min === undefined ? valueExtent[0] : min;
    var max = conf.max;
    max = max === undefined ? valueExtent[1] : max;

    var paper = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scale.ordinal()
        .rangeBands([0, width], 0.5, 0.2);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xTickValues = conf.xTickValues;
    if (xTickValues.length === 0) {
      var xValueList = [];
      for (var i = 0; i < dataList.length; i++) {
        xValueList.push(dataList[i].map(function(d) { return d.date; }));
      }

      xTickValues = this._unionArray(xValueList);
    }

    x.domain(xTickValues);
    y.domain([min, max]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

    var yTickValues = conf.yTickValues;
    var yTickNum = conf.yTickNum;
    if (yTickValues.length === 0) {
      var yStep = (max - min) / (yTickNum - 1);
      for (var i = 0; i < yTickNum; i++) {
        yTickValues.push(min + yStep * i);
      }
    }

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickValues(yTickValues)
        .tickFormat(d3.format(conf.yValueFormat))
        .orient('left');

    var xAxisNode = paper.append('g')
        .attr({
          'class': 'x axis',
          'transform': 'translate(0,' + height + ')'
        })
        .call(xAxis);

    xAxisNode.selectAll('.axis path, .axis line').style(conf.xAxisStyle);

    var yAxisNode = paper.append('g')
        .attr({ 'class': 'y axis' })
        .call(yAxis);

    yAxisNode.selectAll('.axis path, .axis line').style(conf.yAxisStyle);

    var line = d3.svg.line()
        .x(function(d) { return x(d.date) + x.rangeBand() / 2; })
        .y(function(d) { return y(d.value); });

    var lineGroup = paper.selectAll(".line_group")
      .data(dataList)
    .enter().append("g")
      .attr("class", "line_group");

    lineGroup.append('path')
      .attr({
        'class': 'line',
        'd': function (d) { return line(d); },
        'stroke': function (d, i) { return getColor(i); }
      })
      .style(conf.lineStyle);

    this.svg = svg;
    this.paper = paper;
    this.x = x;
    this.y = y;
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.xAxisNode = xAxisNode;
    this.yAxisNode = yAxisNode;
    this.lineGroup = lineGroup;

    callback = callback || function () {};
    callback();
  }
});

module.exports = Line;
