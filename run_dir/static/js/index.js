
$(document).ready(function(){
    // 
    var uppmax_projects_string = $('#indexpage-js-import').data('uppmax_projects');
    // make a normal array from string
    // but there must be a better way
    var uppmax_projects = uppmax_projects_string.split(',');
    console.log(uppmax_projects);
 

    // for (var i in uppmax_projects) {
    $.each(uppmax_projects, function(i, project_id){
        //var project_id = uppmax_projects[i];


        console.log(project_id);   
         // Load the data
        $.getJSON("/api/v1/quotas/" + project_id, function(api_data) {
            console.log(project_id); // here is the error
            // Massage the data
            var raw_data = api_data[0]["data"];
            var plot_data = [];
            var max_value = 0;
            $.each(raw_data, function(i, d){
                d.y /= 1000000000000;
                d.limit /= 1000000000000;
                plot_data.push(d.y);
                // plot_data.push([d.x * 1000, d.y]);
                if(max_value < d.y) { max_value = d.y; }
            });

            var tr = '<tr>';
            tr += '<td>' + project_id + '</td>';
            tr += '<td id=' + project_id +' data-sparkline=' + plot_data + '></td>';
            tr += '</tr>';
            $('#project_quotas tbody').append(tr);

            console.log(plot_data);   
    /**
     * Create a constructor for sparklines that takes some sensible defaults and merges in the individual
     * chart options. This function is also available from the jQuery plugin as $(element).highcharts('SparkLine').
     */
    Highcharts.SparkLine = function (options, callback) {
        var defaultOptions = {
            chart: {
                renderTo: (options.chart && options.chart.renderTo) || this,
                backgroundColor: null,
                borderWidth: 0,
                type: 'area',
                margin: [2, 0, 2, 0],
                width: 120,
                height: 20,
                style: {
                    overflow: 'visible'
                },
                skipClone: true
            },
            title: {
                text: ''
            },
            credits: {
                enabled: false
            },
            xAxis: {
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                },
                startOnTick: false,
                endOnTick: false,
                tickPositions: []
            },
            yAxis: {
                endOnTick: false,
                startOnTick: false,
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                },
                tickPositions: [0]
            },
            legend: {
                enabled: false
            },
            tooltip: {
                backgroundColor: null,
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                hideDelay: 0,
                shared: true,
                padding: 0,
                positioner: function (w, h, point) {
                    return { x: point.plotX - w / 2, y: point.plotY - h};
                }
            },
            plotOptions: {
                series: {
                    animation: false,
                    lineWidth: 1,
                    shadow: false,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    marker: {
                        radius: 1,
                        states: {
                            hover: {
                                radius: 2
                            }
                        }
                    },
                    fillOpacity: 0.25
                },
                column: {
                    negativeColor: '#910000',
                    borderColor: 'silver'
                }
            }
        };
        options = Highcharts.merge(defaultOptions, options);

        return new Highcharts.Chart(options, callback);
    };

    var start = +new Date(),
        $tds = $("td[data-sparkline]"),
        fullLen = $tds.length,
        n = 0;

    // Creating 153 sparkline charts is quite fast in modern browsers, but IE8 and mobile
    // can take some seconds, so we split the input into chunks and apply them in timeouts
    // in order avoid locking up the browser process and allow interaction.
    function doChunk() {
        var time = +new Date(),
            i,
            len = $tds.length,
            $td,
            stringdata,
            arr,
            data,
            chart;

        for (i = 0; i < len; i += 1) {
            $td = $($tds[i]);
            // stringdata = $td.data('sparkline');
            // arr = [16.074, 19.321, 19.457, 18.021]; //stringdata.split('; ');
            // data = $.map(arr[0].split(', '), parseFloat);
            // chart = {};

            // if (arr[1]) {
            //     chart.type = arr[1];
            // }
            data = plot_data; //[16.074, 19.321, 19.457, 18.021];
            $td.highcharts('SparkLine', {
                series: [{
                    data: data,
                    pointStart: 1
                }],
                tooltip: {
                    headerFormat: '<span style="font-size: 10px">' + $td.parent().find('th').html() + ', Q{point.x}:</span><br/>',
                    pointFormat: '<b>{point.y}.000</b> USD'
                },
                chart: chart
            });
        }
    }
    doChunk();

});

        //    // Plot the data
        //     $('#storage_plot_' + project_id).highcharts({
        //         chart: {
        //             type: 'area',
        //             zoomType:'x'
        //         },
        //         title: { text: "Storage Usage Over Time: " + project_id },
        //         legend: { enabled: false },
        //         xAxis: {
        //             title: { text: 'Date' },
        //             type: 'datetime'
        //         },
        //         yAxis: {
        //             min: 0,
        //             max: max_value,
        //             title: { text: 'Storage' },
        //             labels: {
        //                 formatter: function () {
        //                     return this.value + 'Tb';
        //                 }
        //             }
        //         },
        //         tooltip: {
        //             pointFormat: '<strong>{ser ies.name}</strong>: {point.y:,.2f} Tb',
        //         },
        //         series: [
        //           {
        //             name: project_id,
        //             data: plot_data
        //           },
        //           {
        //             name: project_id + ' Quota',
        //             data: limit_data,
        //             dashStyle: 'Dash',
        //             color: 'red',
        //             type: 'line',
        //             marker: {
        //                 enabled: false
        //             }
        //           }
        //         ]
        //     });
        // });
    // end for
    // }
    });
});