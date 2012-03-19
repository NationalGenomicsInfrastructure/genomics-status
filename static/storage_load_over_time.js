// A javascript for a oage with a bar plot over the data storage load where
// the sequences are saved during sequencing over time.

// Get data

function get_storage_load_over_time() {

    ws.onmessage = function(e) {
        data = JSON.parse(e.data);

        $("#hero-title").text("Storage load");

        var description = "Total occupied space on the storage at a given time.";
        var summary = "";

        $("#hero-description").text(description);
        $("#hero-summary").text(summary);
        draw_storage_load(data);
    };

    send_message("storage_load_over_time");
}

get_size = function(d) {return d["size"] / 10000000000; };

function draw_storage_load(data) {
  var w = 600,
      h = 150,
      p = 30,
      x = d3.time.scale().domain([get_date(data[0]), get_date(data[data.length - 1])]).range([0, w]),
      y = d3.scale.linear().domain([0, d3.max(data, get_size)]).range([h, 0]);

  d3.select("#chart > svg")
    .remove();

  var vis = d3.select("#chart")
    .append("svg")
      .attr("width", w + p * 2)
      .attr("height", h + p * 2)
    .append("g")
      .attr("transform", "translate(" + p + "," + p + ")");

      // Bar plot
  vis.selectAll("rect")
      .data(data)
    .enter().append("rect")
      .attr("x", function(d) {return x(get_date(d)); })
      .attr("y", function(d) {return y(get_size(d)); })
      .attr("width", 1)
      .attr("height", function(d) {return h - y(get_size(d)); })
      .attr("class", "bar");

      // X axis
  var x_axis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(d3.time.format("%b"))
    .tickSize(1);

  vis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")")
      .call(x_axis);

      // Y axis
  var y_axis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickSize(1);

  vis.append("g")
    .attr("class", "y axis")
    .call(y_axis);

}
