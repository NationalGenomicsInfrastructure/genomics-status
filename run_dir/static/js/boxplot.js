
// Returns a function to compute the interquartile range.
function iqr(k) {
  return function(d) {
    var q1 = d.quartiles[0],
        q3 = d.quartiles[2],
        iqr = (q3 - q1) * k,
        i = -1,
        j = d.length;
    while (d[++i] < q1 - iqr);
    while (d[--j] > q3 + iqr);
    return [i, j];
  };
}

// Inspired by http://informationandvisualization.de/blog/box-plot
function boxChart() {
  var width = 1,
      height = 1,
      duration = 0,
      domain = null,
      value = Number,
      whiskers = boxWhiskers,
      quartiles = boxQuartiles,
      tickFormat = null;

  // For each small multiple
  function chart(selection) {
    selection.each(function(d, i) {
      ld = d[i].map(value).sort(d3.ascending);
      console.log(d)
      var n = ld.length,
          min = ld[0],
          max = ld[n - 1];

      // Compute quartiles. Must return exactly 3 elements.
      var quartileData = ld.quartiles = quartiles(ld);

      // Compute whiskers. Must return exactly 2 elements, or null.
      var whiskerIndices = whiskers && whiskers.call(this, ld, i),
          whiskerData = whiskerIndices && whiskerIndices.map(function(i) { return ld[i]; });

      // Compute outliers. If no whiskers are specified, all data are "outliers".
      // We compute the outliers as indices, so that we can join across transitions!
      var outlierIndices = whiskerIndices
          ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
          : d3.range(n);

      // Compute the new y-scale.
      var y1 = d3.scale.linear()
          .domain(domain && domain.call(this, ld, i) || [min, max])
          .range([width, 0]);

      // Retrieve the old y-scale, if this is an update.
      var y0 = this.__chart__ || d3.scale.linear()
          .domain([0, Infinity])
          .range(y1.range());

      // Stash the new scale.
      this.__chart__ = y1;

      // Select the svg element if it exists.
      var svg = d3.select(this).selectAll("svg").data(d)

      // Or, create skeletal chart.
      svg.enter().append("svg").append("g")

      var g = svg.select("g")

      // Note: the box, median, and box tick elements are fixed in number,
      // so we only have to handle enter and update. In contrast, the outliers
      // and other elements are variable, so we need to exit them! Variable
      // elements also fade in and out.

      // Update center line: the vertical line spanning the whiskers.
      var center = g.selectAll("line.center")
          .data(whiskerData ? [whiskerData] : []);

      center.enter().insert("line", "rect")
          .attr("class", "center")
          .attr("y1", height / 2)
          .attr("x1", function(d) { return y0(d[0]); })
          .attr("y2", height / 2)
          .attr("x2", function(d) { return y0(d[1]); })
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("x1", function(d) { return y1(d[0]); })
          .attr("x2", function(d) { return y1(d[1]); });

      center.transition()
          .duration(duration)
          .style("opacity", 1)
          .attr("x1", function(d) { return y1(d[0]); })
          .attr("x2", function(d) { return y1(d[1]); });

      center.exit().transition()
          .duration(duration)
          .style("opacity", 1e-6)
          .attr("x1", function(d) { return y1(d[0]); })
          .attr("x2", function(d) { return y1(d[1]); })
          .remove();

      // Update innerquartile box.
      var chart = g.selectAll("rect.chart")
          .data([quartileData]);

      chart.enter().append("rect")
          .attr("class", "chart")
          .attr("y", 0)
          .attr("x", function(d) { return y0(d[2]); })
          .attr("height", height)
          .attr("width", function(d) { return y0(d[0]) - y0(d[2]); })
        .transition()
          .duration(duration)
          .attr("x", function(d) { return y1(d[2]); })
          .attr("width", function(d) { return y1(d[0]) - y1(d[2]); });

      chart.transition()
          .duration(duration)
          .attr("x", function(d) { return y1(d[2]); })
          .attr("width", function(d) { return y1(d[0]) - y1(d[2]); });

      // Update median line.
      var medianLine = g.selectAll("line.median")
          .data([quartileData[1]]);

      medianLine.enter().append("line")
          .attr("class", "median")
          .attr("y1", 0)
          .attr("x1", y0)
          .attr("y2", height)
          .attr("x2", y0)
        .transition()
          .duration(duration)
          .attr("x1", y1)
          .attr("x2", y1);

      medianLine.transition()
          .duration(duration)
          .attr("x1", y1)
          .attr("x2", y1);

      // Update whiskers.
      var whisker = g.selectAll("line.whisker")
          .data(whiskerData || []);

      whisker.enter().insert("line", "circle")
          .attr("class", "whisker")
          .attr("y1", 0)
          .attr("x1", y0)
          .attr("y2", height)
          .attr("x2", y0)
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("x1", y1)
          .attr("x2", y1)
          .style("opacity", 1);

      whisker.transition()
          .duration(duration)
          .attr("x1", y1)
          .attr("x2", y1)
          .style("opacity", 1);

      whisker.exit().transition()
          .duration(duration)
          .attr("x1", y1)
          .attr("x2", y1)
          .style("opacity", 1e-6)
          .remove();

      // Update outliers.
      var outlier = g.selectAll("circle.outlier")
          .data(outlierIndices, Number);

      outlier.enter().insert("circle", "text")
          .attr("class", "outlier")
          .attr("r", 5)
          .attr("cy", height / 2)
          .attr("cx", function(i) { return y0(ld[i]); })
          .style("opacity", 1e-6)
        .transition()
          .duration(duration)
          .attr("cx", function(i) { return y1(ld[i]); })
          .style("opacity", 1);

      outlier.transition()
          .duration(duration)
          .attr("cx", function(i) { return y1(ld[i]); })
          .style("opacity", 1);

      outlier.exit().transition()
          .duration(duration)
          .attr("cx", function(i) { return y1(ld[i]); })
          .style("opacity", 1e-6)
          .remove();
    });
    d3.timer.flush();
  }

  chart.width = function(x) {
    if (!arguments.length) return width;
    width = x;
    return chart;
  };

  chart.height = function(x) {
    if (!arguments.length) return height;
    height = x;
    return chart;
  };

  chart.tickFormat = function(x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return chart;
  };

  chart.duration = function(x) {
    if (!arguments.length) return duration;
    duration = x;
    return chart;
  };

  chart.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x === null ? x : d3.functor(x);
    return chart;
  };

  chart.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return chart;
  };

  chart.whiskers = function(x) {
    if (!arguments.length) return whiskers;
    whiskers = x;
    return chart;
  };

  chart.quartiles = function(x) {
    if (!arguments.length) return quartiles;
    quartiles = x;
    return chart;
  };

  return chart;
}

function boxWhiskers(d) {
  return [0, d.length - 1];
}

function boxQuartiles(d) {
  return [
    d3.quantile(d, 0.25),
    d3.quantile(d, 0.5),
    d3.quantile(d, 0.75)
  ];
}
