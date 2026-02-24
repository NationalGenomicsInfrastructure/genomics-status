// Hard-coded lists of expected sensors
const EXPECTED_FREEZERS = ['TestF35', 'K06 A3590', 'F29 A3590'];
const EXPECTED_FRIDGES = ['Test F36'];

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
/* Can't get this to work, potentially version incompatibilities? maybe remove this?
Highcharts.setOptions({
    time: {
        timezone: 'Europe/Stockholm'
    }
});
*/

function plot_chart(title, plot_data, limit_lower, limit_upper, min_temp, max_temp, min_limit_lower, max_limit_upper, div_id) {
    // Get timestamp for 3 months ago
    var d = new Date();
    d.setMonth(d.getMonth() - 3);
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


function plot_sum_data(){
    $.getJSON("/api/v1/sensorpush", {'start_days_ago': 1}, function(data) {
        var frig_series = [];
        var freez_series = [];
        var found_freezers = [];
        var found_fridges = [];

        $.each(data, function(id, sensordata){
            var timedata = sensordata.samples;
            var sensname = sensordata.sensor_name;
            for (i in timedata) {
            timedata[i][0] = Date.parse(timedata[i][0]);
            }
            var dp_var = {
                name: sensname,
                data: timedata,
                lineWidth: 1
            };
            if (sensname.startsWith('F') || sensname == 'TestF35' || sensname == 'K06 A3590'){
            freez_series.push(dp_var);
                found_freezers.push(sensname);
            }
            else if (sensname.startsWith('K') || sensname == 'Test F36'){
            frig_series.push(dp_var);
                found_fridges.push(sensname);
            }
        });

        // Display sensor status on webpage
        var freezer_html = '';
        EXPECTED_FREEZERS.forEach(function (freezer) {
            var is_active = found_freezers.includes(freezer);
            var status_class = is_active ? 'text-success' : 'text-danger';
            var status_icon = is_active ? 'fa-check-circle' : 'fa-times-circle';
            var status_text = is_active ? 'ACTIVE' : 'MISSING';
            freezer_html += '<li class="' + status_class + ' mb-2">' +
                '<i class="fas ' + status_icon + ' mr-2"></i>' +
                '<strong>' + freezer + '</strong>: ' + status_text +
                '</li>';
        });
        $('#freezer_status_list').html(freezer_html);

        var fridge_html = '';
        EXPECTED_FRIDGES.forEach(function (fridge) {
            var is_active = found_fridges.includes(fridge);
            var status_class = is_active ? 'text-success' : 'text-danger';
            var status_icon = is_active ? 'fa-check-circle' : 'fa-times-circle';
            var status_text = is_active ? 'ACTIVE' : 'MISSING';
            fridge_html += '<li class="' + status_class + ' mb-2">' +
                '<i class="fas ' + status_icon + ' mr-2"></i>' +
                '<strong>' + fridge + '</strong>: ' + status_text +
                '</li>';
        });
        $('#fridge_status_list').html(fridge_html);

        $('#fridge_sum_plot').highcharts({
            chart: {
                zoomType: 'x',
                backgroundColor: null
            },
            title: {
                text: 'All refrigerators'
            },
            xAxis: {
                title: { text: 'Date' },
                type: 'datetime'
            },
            yAxis: {
                title: { text: 'Temperature (C) of refrigerators' },
                tooltip: {
                    pointFormat: '<strong>{series.name}</strong>: {point.y:,.2f} C',
                },
                plotBands: [{
                color: '#f0f0f0',
                from: 8,
                width: 10,
                to: 2
                }]
            },
            legend: {
                title: {
                    text: 'Click to hide:',
                    align: 'center'
                }
            },
            series: frig_series,
            plotOptions: {
            series: {
                marker: {
                    enabledThreshold: 10
                }
            }
            }
        });

        $('#freezer_sum_plot').highcharts({
            chart: {
                zoomType: 'x',
                backgroundColor: null
            },
            title: {
                text: 'All freezers'
            },
            xAxis: {
                title: { text: 'Date' },
                type: 'datetime'
            },
            yAxis: {
                title: { text: 'Temperature (C) of freezers' },
                tooltip: {
                    pointFormat: '<strong>{series.name}</strong>: {point.y:,.2f} C',
                },
                plotBands: [{
                color: '#f0f0f0',
                from: -10, 
                width: 10, 
                to: -33
                }]
            },
            legend: {
                title: {
                    text: 'Click to hide:',
                    align: 'center'
                }
            },
            series: freez_series,
            plotOptions: {
            series: {
                marker: {
                    enabledThreshold: 10
                }
            }
            }
        });

        $('#loading_spinner').hide(function(){
            $('#fridge_sum_plot').show();
            $('#freezer_sum_plot').show();
        });
    });
};