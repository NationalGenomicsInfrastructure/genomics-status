// A javascript for a page with a cumulative plot over all data produced
// over time.

// Get data

function get_sizes_over_time() {

  ws.onmessage = function(e) {
    data = JSON.parse(e.data);

    $("#hero-title").text("Basepairs over time");

    var last_date = get_date(data[data.length - 1]);
    var last_date_string = last_date.getDate() + "/" + (last_date.getMonth() + 1) +
    ", " + last_date.getFullYear();

    var description = "Cumulative amount of basepairs produced, over time.";
    var summary = "By " + last_date_string + " we had recorded generating " +
    Math.round(data[data.length - 1]["size"] / 10000000000) / 100 +
    " Tbp in total.";

    $("#hero-description").text(description);
    $("#hero-summary").text(summary);
    draw_sizes(data);
  };

  send_message("total_over_time");

}

function get_date(d) {
  return new Date(d.date);
}

function draw_sizes(data) {
  var w = 600,
      h = 150,
      p = 30,
      scaling_factor = 1000000000000,
      x = d3.time.scale().domain([get_date(data[0]), get_date(data[data.length - 1])]).range([0, w]),
      y = d3.scale.linear().domain([0, data[data.length - 1].size / scaling_factor]).range([h, 0]);

  d3.select("#chart > svg")
    .remove();

  var vis = d3.select("#chart")
    .append("svg")
      .data([data])
      .attr("width", w + p * 2)
      .attr("height", h + p * 2)
    .append("g")
      .attr("transform", "translate(" + p + "," + p + ")");

      // Grid rules
  var rules = vis.selectAll("g.rule")
      .data(x.ticks(10))
    .enter().append("g")
      .attr("class", "rule");

  rules.append("line")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", 0)
      .attr("y2", h - 1);

  rules.append("line")
      .data(y.ticks(5))
      .attr("y1", y)
      .attr("y2", y)
      .attr("x1", 0)
      .attr("x2", w);

      // Label
  var y_label = vis.append("text")
      .attr("class", "label")
      .attr("dy", -5)
      .attr("dx", -18)
      .attr("transform", "translate(0,0")
      .text("Terabasepairs");

      // Bordering line graph
  var flat_line = d3.svg.line()
      .x(function(d) { return x(get_date(d)); })
      .y(h);
  
  var line = d3.svg.line()
      .x(function(d) { return x(get_date(d)); })
      .y(function(d) { return y(d.size / scaling_factor); });

  vis.append("path")
      .attr("class", "line")
      .attr("d", flat_line);

  d3.selectAll("path.line").transition()
      .duration(200)
      .attr("d", line);

      // Area graph
  var flat_area = d3.svg.area()
      .x(function(d) {return x(get_date(d)); })
      .y0(h)
      .y1(h);

  var area = d3.svg.area()
      .x(function(d) { return x(get_date(d)); })
      .y0(h)
      .y1(function(d) { return y(d.size / scaling_factor); });

  vis.append("path")
      .attr("class", "area")
      .attr("d", flat_area);

  d3.selectAll("path.area").transition()
      .duration(200)
      .attr("d", area);

      // x axis
  var x_axis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(d3.time.format("%b"))
    .tickSize(1);

  vis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")")
      .call(x_axis);

      //y axis
  var y_axis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(1);

  vis.append("g")
    .attr("class", "y axis")
    .call(y_axis);
}
