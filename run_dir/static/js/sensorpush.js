// Expected sensors lists are now loaded from gs_configs database and passed via the template
// See sensorpush.html for EXPECTED_FRIDGES and EXPECTED_FREEZERS variables

// Store chart instances for cleanup
var chartInstances = {};

// Check for warnings in the last 24 hours and display them
function check_and_display_warnings(sensor_24h_data) {
    // Handle null, undefined, or empty data
    if (!sensor_24h_data || typeof sensor_24h_data !== 'object') {
        return;
    }
    
    var has_warnings = false;
    var warnings_high = [];
    var warnings_low = [];
    
    for (var sensor in sensor_24h_data) {
        if (!sensor_24h_data[sensor]) continue;
        
        if (sensor_24h_data[sensor]['intervals_higher'] && sensor_24h_data[sensor]['intervals_higher'].length > 0) {
            has_warnings = true;
            warnings_high.push({
                sensor: sensor,
                name: sensor_24h_data[sensor]['sensor_name']
            });
        }
        if (sensor_24h_data[sensor]['intervals_lower'] && sensor_24h_data[sensor]['intervals_lower'].length > 0) {
            has_warnings = true;
            warnings_low.push({
                sensor: sensor,
                name: sensor_24h_data[sensor]['sensor_name']
            });
        }
    }
    
    // Display warnings if any exist
    if (has_warnings) {
        warnings_high.forEach(function(item) {
            $('#warnings_high_list').append(
                '<h5><a href="#header_sensor_' + item.sensor + '">' + item.name + '</a> (too high)</h5>'
            );
        });
        warnings_low.forEach(function(item) {
            $('#warnings_low_list').append(
                '<h5><a href="#header_sensor_' + item.sensor + '">' + item.name + '</a> (too low)</h5>'
            );
        });
        $('#warnings_24h').show();
    }
}

// Configure timezone for all charts (Stockholm time)
const TIMEZONE = 'Europe/Stockholm';

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
                    pointRadius: 1,
                    pointHoverRadius: 4,
                    spanGaps: 86400000, // Don't connect points if gap is > 1 day (in milliseconds)
                    segment: {
                        borderColor: ctx => {
                            // Check if this segment spans more than 1 day
                            const dataIndex = ctx.p0DataIndex;
                            if (dataIndex < temp_data.length - 1) {
                                const timeDiff = temp_data[dataIndex + 1].x - temp_data[dataIndex].x;
                                // If gap is larger than 1 day, make the line transparent
                                if (timeDiff > 86400000) {
                                    return 'transparent';
                                }
                            }
                            return 'rgb(75, 192, 192)';
                        }
                    }
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
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
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
                        },
                        title: function (context) {
                            // Format the tooltip title with Stockholm timezone
                            const luxonDate = luxon.DateTime.fromMillis(context[0].parsed.x).setZone(TIMEZONE);
                            return luxonDate.toFormat('MMM d, yyyy HH:mm');
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: null
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
                        text: 'Date (Stockholm Time)'
                    },
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM d'
                        },
                        timezone: TIMEZONE
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
        var all_sensors = [];
        var hasData = data && Object.keys(data).length > 0;

        // Process data if available
        if (hasData) {
            $.each(data, function (id, sensordata) {
                // Skip if sensordata is invalid or missing required fields
                if (!sensordata || !sensordata.samples || !sensordata.sensor_name) {
                    return true; // Continue to next iteration
                }

                var timedata = sensordata.samples;
                var sensname = sensordata.sensor_name;
                all_sensors.push(sensname);
            
                // Skip if timedata is empty
                if (!timedata || timedata.length === 0) {
                    return true; // Continue to next iteration
                }

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
                }
                else if (sensname.startsWith('K')) {
                    frig_series.push(dp_var);
                }
            });
        }

        // Display sensor status on webpage (always, even if no data)
        // Group freezers by text after first space
        // Ensure ACTIVE_SENSORS is defined and is an array
        var activeSensors = (typeof ACTIVE_SENSORS !== 'undefined' && Array.isArray(ACTIVE_SENSORS)) ? ACTIVE_SENSORS : [];
        
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
        // Use ACTIVE_SENSORS from backend (recent data ~2.4 hours) to determine status
        var freezer_html = '';
        var group_names = Object.keys(freezer_groups).sort();
        group_names.forEach(function (group_name) {
            freezer_html += '<div class="col-md-' + (12 / Math.max(group_names.length, 1)) + '">';
            freezer_html += '<h6 class="text-muted mb-2">' + group_name + '</h6>';
            freezer_html += '<ul class="list-unstyled mb-0">';
            freezer_groups[group_name].forEach(function (freezer) {
                var is_active = activeSensors.includes(freezer);
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
            var is_active = activeSensors.includes(fridge);
            var status_class = is_active ? 'text-success' : 'text-danger';
            var status_icon = is_active ? 'fa-check-circle' : 'fa-times-circle';
            var status_text = is_active ? 'ACTIVE' : 'MISSING';
            fridge_html += '<li class="' + status_class + ' mb-2">' +
                '<i class="fas ' + status_icon + ' mr-2"></i>' +
                '<strong>' + fridge + '</strong>: ' + status_text +
                '</li>';
        });
        $('#fridge_status_list').html(fridge_html);

        // Find and display unknown sensors
        // Check against all sensors from the 4-month data (passed via all_sensors in 24h API)
        var all_expected = EXPECTED_FREEZERS.concat(EXPECTED_FRIDGES);
        var unknown_sensors = activeSensors.filter(function (sensor) {
            return !all_expected.includes(sensor);
        });

        if (unknown_sensors.length > 0) {
            $('#unknown_sensors_section').show();
            var unknown_html = '';
            unknown_sensors.forEach(function (sensor) {
                unknown_html += '<li class="text-warning mb-2">' +
                    '<i class="fas fa-question-circle mr-2"></i>' +
                    '<strong>' + sensor + '</strong>' +
                    '</li>';
            });
            $('#unknown_status_list').html(unknown_html);
        } else {
            $('#unknown_sensors_section').hide();
        }

        // Only create plots if there's data available
        if (hasData && (freez_series.length > 0 || frig_series.length > 0)) {
            // Group freezers by room for plotting
            var freezer_by_room = {};
            freez_series.forEach(function (series) {
                var space_index = series.name.indexOf(' ');
                var room = space_index > -1 ? series.name.substring(space_index + 1) : 'Other';
                if (!freezer_by_room[room]) {
                    freezer_by_room[room] = [];
                }
                var dataset_data = series.data.map(d => ({ x: d[0], y: d[1] }));
                freezer_by_room[room].push({
                    label: series.name,
                    data: dataset_data,
                    borderWidth: 1,
                    pointRadius: 1,
                    pointHoverRadius: 3,
                    spanGaps: 86400000,
                    segment: {
                        borderColor: ctx => {
                            const dataIndex = ctx.p0DataIndex;
                            if (dataIndex < dataset_data.length - 1) {
                                const timeDiff = dataset_data[dataIndex + 1].x - dataset_data[dataIndex].x;
                                if (timeDiff > 86400000) {
                                    return 'transparent';
                                }
                            }
                            return undefined;
                        }
                    }
                });
            });

            // Keep all fridges in a single dataset
            var fridge_datasets = frig_series.map(function (series) {
                var dataset_data = series.data.map(d => ({ x: d[0], y: d[1] }));
                return {
                    label: series.name,
                    data: dataset_data,
                    borderWidth: 1,
                    pointRadius: 1,
                    pointHoverRadius: 3,
                    spanGaps: 86400000,
                    segment: {
                        borderColor: ctx => {
                            const dataIndex = ctx.p0DataIndex;
                            if (dataIndex < dataset_data.length - 1) {
                                const timeDiff = dataset_data[dataIndex + 1].x - dataset_data[dataIndex].x;
                                if (timeDiff > 86400000) {
                                    return 'transparent';
                                }
                            }
                            return undefined;
                        }
                    }
                };
            });

            // Destroy all existing summary chart instances
            Object.keys(chartInstances).forEach(function (key) {
                if (key.startsWith('summary_')) {
                    chartInstances[key].destroy();
                    delete chartInstances[key];
                }
            });

            // Clear and rebuild the container
            var container = $('#summary_plots_container');
            container.empty();

            // Function to create a chart for a room
            function createRoomChart(room, datasets, type) {
                var chart_id = 'summary_' + type + '_' + room.replace(/\s+/g, '_');
                var canvas_id = chart_id + '_canvas';

                // Create the HTML structure
                var col = $('<div class="col-lg-6 mb-4"></div>');
                var plot_div = $('<div id="' + chart_id + '"></div>');
                var canvas = $('<canvas id="' + canvas_id + '"></canvas>');
                plot_div.append(canvas);
                col.append(plot_div);
                container.append(col);

                // Create the chart
                var ctx = document.getElementById(canvas_id).getContext('2d');
                var chart_title = room.startsWith('All ') ? room : (type === 'freezer' ? 'Freezers' : 'Fridges') + ' - ' + room;

                chartInstances[chart_id] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        interaction: {
                            mode: 'nearest',
                            axis: 'x',
                            intersect: false
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: chart_title
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
                                    modifierKey: null
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
                                    text: 'Date (Stockholm Time)'
                                },
                                time: {
                                    unit: 'hour',
                                    displayFormats: {
                                        hour: 'MMM d HH:mm'
                                    },
                                    timezone: TIMEZONE
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Temperature (C)'
                                }
                            }
                        }
                    }
                });
            }

            // Create single fridge chart with all fridges
            if (fridge_datasets.length > 0) {
                createRoomChart('All Refrigerators', fridge_datasets, 'fridge');
            }

            // Create charts for each freezer room
            var freezer_rooms = Object.keys(freezer_by_room).sort();
            freezer_rooms.forEach(function (room) {
                createRoomChart(room, freezer_by_room[room], 'freezer');
            });
        } else {
            // No data available - display message in plots container
            var container = $('#summary_plots_container');
            container.empty();
            container.html('<div class="col-12 text-center"><p class="text-muted">No data available for the last 24 hours</p></div>');
        }

        $('#loading_spinner').hide();
    }).fail(function(jqxhr, textStatus, error) {
        console.error('Error fetching sensor data:', textStatus, error);
        $('#loading_spinner').hide();
        $('#summary_plots_container').html('<div class="col-12 text-center"><div class="alert alert-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Error loading sensor data. Please try again later.</div></div>');
    });
};