// A javascript for a page with a cumulative plot over all data produced
// over time.

// Connect and get data

var ws_uri = "ws://0.0.0.0:8888/websocket";
ws = new WebSocket(ws_uri);

ws.onmessage = function(e) {
  data = JSON.parse(e.data);
  $("#hero-title").text("Projects over time");
  var last_date = get_date(data[data.length - 1]);
  console.log(last_date);
  var last_date_string = last_date.getDate() + "/" + (last_date.getMonth() + 1) +
  ", " + last_date.getFullYear();
  var description = "Cumulative number of projects handled, over time. " +
  "By " + last_date_string + " we had done " +
  Math.round(data[data.length - 1]["projects"] / 1 ) +
  " projects in total.";
  $("#hero-description").text(description);
  draw(data);
};

ws.onopen = function(e) {
  ws.send("projects_over_time");
};

// Construct linear scales


// var data = d3.range(20).map(function(i) {
//   return {x: i / 19, y: (Math.sin(i / 3) + 1) / 2};
// });

function get_date(d) {
  return new Date(d.date);
}

function draw(data) {
  var w = 600,
      h = 150,
      p = 30,
      scaling_factor = 1,
      x = d3.time.scale().domain([get_date(data[0]), get_date(data[data.length - 1])]).range([0, w]),
      y = d3.scale.linear().domain([0, data[data.length - 1].projects / scaling_factor]).range([h, 0]);

  var vis = d3.select("#chart")
    .append("svg")
      .data([data])
      .attr("width", w + p * 2)
      .attr("height", h + p * 2)
      // .attr("viewBox", "0 0 1 1")
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
      .text("Projects");

      // Area graph
  vis.append("path")
      .attr("class", "area")
      .attr("d", d3.svg.area()
      .x(function(d) { return x(get_date(d)); })
      .y0(h)
      .y1(function(d) { return y(d.projects / scaling_factor); }));

      // Bordering line graph
  vis.append("path")
      .attr("class", "line")
      .attr("d", d3.svg.line()
      .x(function(d) { return x(get_date(d)); })
      .y(function(d) { return y(d.projects / scaling_factor); }));

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
