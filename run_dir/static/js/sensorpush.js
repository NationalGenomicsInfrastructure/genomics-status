// when generate javascript in the template, strings are escaped.
// need to unescape them again to execute js
function date_parse(data) {
  for (let i in data) {
      data[i][0] = Date.parse(data[i][0]);
      // Could potentially be removed, I think I added it when trying to get UTC conversion to work
      date = new Date()
      date.setTime(data[i][0])
  }
  return data;
}
/* Can't get this to work, potentially version incompatibilities?
Highcharts.setOptions({
    time: {
        timezone: 'Europe/Stockholm'
    }
});
*/

function plot_chart(title, plot_data, limit_lower, limit_upper, min_temp, max_temp, min_limit_lower, max_limit_upper, div_id) {
    // Get timestamp for 2 months ago
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0,0,0);
    d = d.getTime();

    if (min_limit_lower !== null) {
        y_min = Math.min(min_limit_lower, min_temp) - 1
    } else {
        y_min = min_temp -1
    }

    if (max_limit_upper !== null) {
        y_max = Math.max(max_limit_upper, max_temp) + 1
    } else {
        y_max = max_temp + 1
    }


    $('#'+div_id).highcharts({
        chart: {
            zoomType: 'x',
            backgroundColor: null
        },
        title: { text: title },
        legend: { enabled: false },
        xAxis: {
            title: { text: 'Date' },
            type: 'datetime',
            min: d,
        },
        yAxis: {
            min: y_min,
            max: y_max,
            title: { text: 'Temperature (C)' },
        },
        tooltip: {
            pointFormat: '<strong>{series.name}</strong>: {point.y:,.2f} C',
        },
        series: [
            {
                name: 'Temperature',
                data: plot_data
            },
            {
                name: 'Upper Limit',
                data: limit_upper,
                marker: {
                    enabled: false
                },
                color: 'red'
            },
            {
                name: 'Lower limit',
                data: limit_lower,
                marker: {
                    enabled: false
                },
                color: 'blue'
            }
        ]
    });
};
