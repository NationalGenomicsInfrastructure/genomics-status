fill_quotas_table = function() {

   var uppmax_projects_string = $('#indexpage-js-import').data('uppmax_projects');
    // make a normal array from string
    // but there must be a better way
    var uppmax_projects = uppmax_projects_string.split(',');
    $.each(uppmax_projects, function(i, project_id){
        $('#project_quotas tbody').append('<tr><td>' + project_id + '</td><td id="sparkline_quota_' + project_id + '" class="plot-column"></td></tr>');
         // Load the data
        $.getJSON("/api/v1/quotas/" + project_id, function(api_data) {
            // Massage the data
            var raw_data = api_data[0]["data"];
            var plot_data = [];
            var max_value = 0;
            var quota_percent;
            var current_quota;
            $.each(raw_data, function(i, point){
                point.y /= 1000000000000;
                point.limit /= 1000000000000;
                current_quota = point.limit
                quota_percent = (100 * point.y / point.limit).toFixed(1); 
                plot_data.push([point.x * 1000, point.y, point.percent]);
                if(max_value < point.y) { max_value = point.y; }
            });
            if (quota_percent > 90.0) {
                $('#sparkline_quota_'+project_id).parent().addClass('danger');
            } else if (quota_percent > 80.0) {
                $('#sparkline_quota_'+project_id).parent().addClass('warning');
            }
            $('#sparkline_quota_'+project_id).highcharts({
                chart: {
                    type: 'area',
                    margin: [0, 0, 0, 0],
                    backgroundColor: null
                },
                title:{
                    text:''
                },
                credits:{
                    enabled: false
                },
                 xAxis:{
                    labels:{
                        enabled: false
                    },
                    type: 'datetime',
                    minorGridLineWidth: 0
                },
                yAxis:{
                    endOnTick:false,
                    labels:{
                        enabled:false
                    },
                    title: '',
                    gridLineWidth: 1,
                    max: current_quota

                },
                legend:{
                    enabled:false
                },
                series: [{
                    data: plot_data,
                    pointStart: 1,
                }],
                tooltip: {
                    pointFormatter: function(){
                        var pcnt = (this.y / current_quota) * 100;
                        return '<strong>Quota ' + project_id + '</strong>: '+this.y.toFixed(2)+' Tb ('+pcnt.toFixed(2)+'%)';
                    },
                    hideDelay: 0
                }
            });
        });
    });
}

fill_updates_table = function(){
    // Get the most recent updates
    $.getJSON("/api/v1/last_updated?items=15", function(data) {
      var tbl_body = "";
      $.each(data, function(k1, summary) {
            var link = '';
            var linkend = '';
            if(summary[2] == 'Project information'){
                link = '<a href="/project/'+summary[1]+'">';
                linkend = '</a>';
            } else if(summary[2] == 'Flowcell information'){
                link = '<a href="/flowcells/'+summary[1]+'">';
                linkend = '</a>';
            } else if(summary[2] == 'Sample information'){
                link = '<a href="/samples/'+summary[1]+'">';
                linkend = '</a>';
            }
            tbl_row = '<tr>';
        tbl_row += '<td>' + link + summary[2] + linkend + '</td>';
        tbl_row += '<td>' + link + summary[1] + linkend + '</td>';
        tbl_row += '<td>' + link + moment(summary[0]).format('HH:mm, MMM Do YYYY') + linkend + '</td>';
        tbl_row += '</tr>';
        $("#update_table").append(tbl_row);
      })
    });

    // Find out when the update scripts will next run
    $.getJSON('/api/v1/last_psul', function(data){
        var status = data['st']
        if(data['status'] == 'Success'){
            var timestring = '';
            if(data['hours'] == 0 && data['minutes'] <= 2){
              timestring = 'The script to pull information from the LIMS is running now.';
            } else {
              if(data['hours'] > 0){
                  timestring = data['hours']+' hours';
              } else if(data['minutes'] > 0){
                  timestring = data['minutes']+' minutes';
              } else if(data['seconds'] > 0){
                  timestring = data['seconds']+' seconds';
              }
              var text = 'The script to pull information from the LIMS last ran '+timestring+' ago.';
            }
            $('#updated-status').html(text);
        } else {
            console.log('Last PSUL update check failed. Returned "'+data['status']+'"');
        }
    });
};
    

$(document).ready(function(){
    fill_quotas_table();
    fill_updates_table();
});
