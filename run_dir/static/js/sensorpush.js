// Hard-coded lists of expected sensors, I guess this would be more suitable in a config file somewhere.
const EXPECTED_FRIDGES = ['K01 A3730', 'K02 A3711', 'K10 A3571', 'K04 A3590'];
const EXPECTED_FREEZERS = ['F29 A3590', 'F25 A3590', 'F07 A3711', "F26 A3330", "F39 Clean Room", "F21 A3590", "F18 A3711", "F17 A3590", "F08 A3590", "F38 A3590", "F22 A3590", "F31 A3590", "F35 A3590", "F24 A3590", "F37 A3730", "F30 A3590", "F32 A3571", "F36 A3590", "F33 A3730", "F34 A3730", "F13 A3590", "F19 A3711"];

// Store chart instances for cleanup
var chartInstances = {};

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

function plot_chart(title, plot_data, limit_lower, limit_upper, min_temp, max_temp, min_limit_lower, max_limit_upper, div_id) {
    // Get timestamp for 4 months ago
    var d = new Date();
    d.setMonth(d.getMonth() - 4);
    d.setHours(0,0,0);
    var minTime = d.getTime();

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

    // Convert data format for Chart.js (array of {x, y} objects)
    var temp_data = plot_data.map(d => ({ x: d[0], y: d[1] }));
    var upper_limit_data = limit_upper.map(d => ({ x: d[0], y: d[1] }));
    var lower_limit_data = limit_lower.map(d => ({ x: d[0], y: d[1] }));

    // Get canvas context
    var canvas_id = div_id.replace('sensorpush_', 'sensorpush_canvas_');
    var ctx = document.getElementById(canvas_id).getContext('2d');

    // Destroy existing chart if it exists
    if (chartInstances[div_id]) {
        chartInstances[div_id].destroy();
    }

    // Create Chart.js chart
    chartInstances[div_id] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Temperature',
                    data: temp_data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'Upper Limit',
                    data: upper_limit_data,
                    borderColor: 'red',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    borderDash: [5, 5]
                },
                {
                    label: 'Lower Limit',
                    data: lower_limit_data,
                    borderColor: 'blue',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' C';
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    min: minTime,
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    min: y_min,
                    max: y_max,
                    title: {
                        display: true,
                        text: 'Temperature (C)'
                    }
                }
            }
        }
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
            if (sensname.startsWith('F')) {
            freez_series.push(dp_var);
                found_freezers.push(sensname);
            }
            else if (sensname.startsWith('K')) {
            frig_series.push(dp_var);
                found_fridges.push(sensname);
            }
        });

        // Display sensor status on webpage
        // Group freezers by text after first space
        var freezer_groups = {};
        EXPECTED_FREEZERS.forEach(function (freezer) {
            var space_index = freezer.indexOf(' ');
            var group_name = space_index > -1 ? freezer.substring(space_index + 1) : 'Other';
            if (!freezer_groups[group_name]) {
                freezer_groups[group_name] = [];
            }
            freezer_groups[group_name].push(freezer);
        });

        // Create columns for each group
        var freezer_html = '';
        var group_names = Object.keys(freezer_groups).sort();
        group_names.forEach(function (group_name) {
            freezer_html += '<div class="col-md-' + (12 / Math.max(group_names.length, 1)) + '">';
            freezer_html += '<h6 class="text-muted mb-2">' + group_name + '</h6>';
            freezer_html += '<ul class="list-unstyled mb-0">';
            freezer_groups[group_name].forEach(function (freezer) {
                var is_active = found_freezers.includes(freezer);
                var status_class = is_active ? 'text-success' : 'text-danger';
                var status_icon = is_active ? 'fa-check-circle' : 'fa-times-circle';
                var status_text = is_active ? 'ACTIVE' : 'MISSING';
                freezer_html += '<li class="' + status_class + ' mb-2">' +
                    '<i class="fas ' + status_icon + ' mr-2"></i>' +
                    '<strong>' + freezer + '</strong>: ' + status_text +
                    '</li>';
            });
            freezer_html += '</ul></div>';
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

        // Convert data format for Chart.js
        var frig_datasets = frig_series.map(function (series) {
            return {
                label: series.name,
                data: series.data.map(d => ({ x: d[0], y: d[1] })),
                borderWidth: 1,
                pointRadius: 1,
                pointHoverRadius: 3
            };
        });

        var freez_datasets = freez_series.map(function (series) {
            return {
                label: series.name,
                data: series.data.map(d => ({ x: d[0], y: d[1] })),
                borderWidth: 1,
                pointRadius: 1,
                pointHoverRadius: 3
            };
        });

        // Destroy existing charts if they exist
        if (chartInstances['fridge_sum']) {
            chartInstances['fridge_sum'].destroy();
        }
        if (chartInstances['freezer_sum']) {
            chartInstances['freezer_sum'].destroy();
        }

        // Create fridge summary chart
        var fridge_ctx = document.getElementById('fridge_sum_canvas').getContext('2d');
        chartInstances['fridge_sum'] = new Chart(fridge_ctx, {
            type: 'line',
            data: {
                datasets: frig_datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'All refrigerators'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        onClick: function (e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const chart = legend.chart;
                            const meta = chart.getDatasetMeta(index);
                            meta.hidden = !meta.hidden;
                            chart.update();
                        },
                        labels: {
                            generateLabels: function (chart) {
                                const datasets = chart.data.datasets;
                                return datasets.map((dataset, i) => ({
                                    text: dataset.label,
                                    fillStyle: dataset.borderColor,
                                    hidden: !chart.isDatasetVisible(i),
                                    lineCap: dataset.borderCapStyle,
                                    lineDash: dataset.borderDash,
                                    lineDashOffset: dataset.borderDashOffset,
                                    lineJoin: dataset.borderJoinStyle,
                                    lineWidth: dataset.borderWidth,
                                    strokeStyle: dataset.borderColor,
                                    datasetIndex: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' C';
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: 'ctrl'
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        time: {
                            unit: 'hour'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (C) of refrigerators'
                        }
                    }
                }
            }
        });

        // Create freezer summary chart
        var freezer_ctx = document.getElementById('freezer_sum_canvas').getContext('2d');
        chartInstances['freezer_sum'] = new Chart(freezer_ctx, {
            type: 'line',
            data: {
                datasets: freez_datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'All freezers'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        onClick: function (e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const chart = legend.chart;
                            const meta = chart.getDatasetMeta(index);
                            meta.hidden = !meta.hidden;
                            chart.update();
                        },
                        labels: {
                            generateLabels: function (chart) {
                                const datasets = chart.data.datasets;
                                return datasets.map((dataset, i) => ({
                                    text: dataset.label,
                                    fillStyle: dataset.borderColor,
                                    hidden: !chart.isDatasetVisible(i),
                                    lineCap: dataset.borderCapStyle,
                                    lineDash: dataset.borderDash,
                                    lineDashOffset: dataset.borderDashOffset,
                                    lineJoin: dataset.borderJoinStyle,
                                    lineWidth: dataset.borderWidth,
                                    strokeStyle: dataset.borderColor,
                                    datasetIndex: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' C';
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: 'ctrl'
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        time: {
                            unit: 'hour'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (C) of freezers'
                        }
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