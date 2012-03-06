// String helper thing
String.prototype.format = function() {
  var args = arguments;
   return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined' ? args[number]
      : match
    ;
  });
};

// Some example data

var data = [];
for (counter=0; counter < 24; counter++) {
   data.push({
  "date": "2011-12-{0}".format(counter),
  "machine": "SN167",
  "project": "0302_AD07L0ACXX",
  "size": "{0}000000".format(counter % 5)
  });
}


// var data = [log1, log2, log3, log4];

// Construct linear scales

var w = 20,
   h = 300;

var x = d3.scale.linear()
   .domain([0, 1])
   .range([0, w]);

var y = d3.scale.linear()
   .domain([0, 5000000])
   .rangeRound([0, h]);

// Construct SVG container

var chart = d3.select("article").append("svg")
    .attr("class", "chart")
    .attr("width", w * data.length - 1)
    .attr("height", h);

// Add a line to indicate where the graph is

 chart.append("line")
     .attr("x1", 0)
     .attr("x2", w * data.length)
     .attr("y1", h - 0.5)
     .attr("y2", h - 0.5)
     .style("stroke", "#000");

// Draw graph
// init_draw();

// Drawing functions

function init_draw() {

    chart.selectAll("rect")
        .data(data)
      .enter().insert("rect", "line")
        .attr("x", function(d, i) { return x(i) - 0.5; })
        .attr("y", h)
        .attr("width", w);

   // Update
   chart.selectAll("rect")
       .data(data)
     .transition()
       .duration(400)
       .attr("y", function(d) { return h - y(d.size) - 0.5; })
       .attr("height", function(d) { return y(d.size); });
 
 }

function redraw() {

    var rect = chart.selectAll("rect")
        .data(data, function(d) { return d.date; });
  
    rect.enter().insert("rect", "line")
        .attr("x", function(d, i) { return x(i + 1) - 0.5; })
        .attr("y", function(d) { return h - y(d.size) - 0.5; })
        .attr("width", w)
       .attr("height", function(d) { return y(d.size); })
     .transition()
       .duration(300)
       .attr("x", function(d, i) { return x(i) - 0.5; });
 
    rect.transition()
        .duration(300)
        .attr("x", function(d, i) { return x(i) - 0.5; });
  
    rect.exit().transition()
        .duration(300)
        .attr("x", function(d, i) { return x(i - 1) - 0.5; })
        .remove();
 
 }