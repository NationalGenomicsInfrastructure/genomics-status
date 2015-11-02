$(document).ready(function(){
    // Highlight plots if clicked from the navigation
    $('body').on('click', '.quota-nav li a', function(){
       var target = $(this).attr('href');
       $('.highlighted').removeClass('highlighted');
       $(target).addClass('highlighted');
    });



    // Find the differe UPPMAX Projects
    $.getJSON('/api/v1/uppmax_projects', function(uppmax_quotas) {
        // if nobackup - skip
        // get quota
        // get nobackup quota
        // get cpu hours

        $.each(uppmax_quotas, function(i, project_id) {
            // if project id is <project_id>_nobackup -> skip
            if (project_id.indexOf("nobackup") > -1) {
                return true; // = continue;
            }

            // add project to navigation panel
            $('.quota-nav:last').append('<li><a href="#'+project_id+'">'+project_id+'</a></li>');
            // create html for project_id
            $("#plots").append('\
            <div class="row" id=' + project_id + '> \
                <h2>' + project_id + '</h2> \
                <div class="col-md-4" id="quota_' + project_id + '"></div> \
                <div class="col-md-4" id="quota_' + project_id + '_nobackup"></div> \
                <div class="col-md-4" id="cpu_' + project_id + '"></div> \
            </div>');

            // fill the data html
            get_disk_quota(project_id);
            get_disk_quota(project_id+'_nobackup');
            get_cpu_hours(project_id);

        });


    });
});

function get_disk_quota(project_id) {
    $.getJSON("/api/v1/quotas/" + project_id, function(api_data) {
        // Massage the data
        var raw_data = api_data[0]["data"];
        var plot_data = [];
        var max_value = 0;
        var quota_percent;
        var current_quota;
        var limit_data = [];
        $.each(raw_data, function(i, point){
            point.y /= 1000000000000;
            point.limit /= 1000000000000;
            current_quota = point.limit
            quota_percent = (100 * point.y / point.limit).toFixed(2);
            plot_data.push([point.x * 1000, point.y]);
            limit_data.push([point.x * 1000, point.limit]);
            if(max_value < point.y) { max_value = point.y; }
            if(max_value < point.limit) { max_value = point.limit; }
        });
        // Plot the data

        $('#quota_'+project_id).highcharts({
            chart: {
                zoomType: 'x',
                backgroundColor: null
            },
            title: { text: "Storage Usage Over Time: " + project_id },
            legend: { enabled: false },
            xAxis: {
                title: { text: 'Date' },
                type: 'datetime'
            },
            yAxis: {
                min: 0,
                max: max_value,
                title: { text: 'Storage (Tb)' },
            },
            tooltip: {
                pointFormat: '<strong>{series.name}</strong>: {point.y:,.2f} Tb',
            },
            series: [
                {
                    name: project_id,
                    data: plot_data,
                    type: 'area'
                },
                {
                    name: project_id + ' Quota',
                    data: limit_data,
                    dashStyle: 'Dash',
                    color: 'red',
                    type: 'line',
                    marker: {
                        enabled: false
                    }
                }
            ]
        });


    });
}
function get_cpu_hours(project_id) {
    $.getJSON("/api/v1/cpu_hours/" + project_id, function(api_data) {
        // Massage the data
        var raw_data = api_data[0]["data"];
        var plot_data = [];
        var max_value = 0;
        var quota_percent;
        var current_quota;
        var limit_data = [];
        $.each(raw_data, function(i, point){
            current_quota = point.limit
            quota_percent = (100 * point.y / point.limit).toFixed(0);
            // JS times work in milliseconds, multiply by 1000
            plot_data.push([point.x * 1000, point.y]);
            limit_data.push([point.x * 1000, point.limit]);
            if(max_value < point.y) { max_value = point.y; }
            if(max_value < point.limit) { max_value = point.limit; }
        });
        // Plot the data

        $('#cpu_'+project_id).highcharts({
            chart: {
                zoomType: 'x',
                backgroundColor: null
            },
            title: { text: "CPU Hours Usage Over Time: " + project_id },
            legend: { enabled: false },
            xAxis: {
                title: { text: 'Date' },
                type: 'datetime'
            },
            yAxis: {
                min: 0,
                max: max_value,
                title: { text: 'CPU Hours' },
            },
            tooltip: {
                pointFormat: '<strong>{series.name}</strong>: {point.y:,.0f} h/month',
            },
            series: [
                {
                    name: project_id,
                    data: plot_data,
                    type: 'area'
                },
                {
                    name: project_id + ' CPU Limit',
                    data: limit_data,
                    dashStyle: 'Dash',
                    color: 'red',
                    type: 'line',
                    marker: {
                        enabled: false
                    }
                }
            ]
        });


    });

}