fill_quotas_table = function() {

   var uppmax_projects = $('#indexpage-js-import').data('uppmax_projects').split(',');
   $.each(uppmax_projects, function(i, project_id){
      var disk_usage, disk_avail, disk_usage_percent, disk_usage_class;
      var nobackup_usage, nobackup_avail, nobackup_usage_percent, nobackup_usage_class;
      var cpu_usage, cpu_avail, cpu_usage_percent, cpu_usage_class;
      var disk = $.getJSON('/api/v1/quotas/'+project_id, function(api_data) {
         $.each(api_data[0]["data"], function(i, point){
            disk_usage = (point.y / 1000000000000).toFixed(1);
            disk_avail = ((point.limit - point.y) / 1000000000000).toFixed(1);
            disk_usage_percent = (100 * (point.y / point.limit)).toFixed(1);
         });
         disk_usage_class = '';
         if(disk_usage_percent > 80){ disk_usage_class = 'q-warning'; }
         if(disk_usage_percent > 90){ disk_usage_class = 'q-danger'; }
         if(nobackup_usage_percent > 100){ nobackup_usage_percent = 100; }
      });
      
      var nobackup_disk = $.getJSON('/api/v1/quotas/'+project_id+'_nobackup', function(api_data) {
         var quota_percent;
         var current_quota;
         $.each(api_data[0]["data"], function(i, point){
            nobackup_usage = (point.y / 1000000000000).toFixed(1);
            nobackup_avail = ((point.limit - point.y) / 1000000000000).toFixed(1);
            nobackup_usage_percent = (100 * (point.y / point.limit)).toFixed(1);
         });
         nobackup_usage_class = '';
         if(nobackup_usage_percent > 80){ nobackup_usage_class = 'q-warning'; }
         if(nobackup_usage_percent > 90){ nobackup_usage_class = 'q-danger'; }
         if(nobackup_usage_percent > 100){ nobackup_usage_percent = 100; }
      });
      
      var cpu_hours = $.getJSON("/api/v1/cpu_hours/" + project_id, function(api_data) {
         var quota_percent;
         var current_quota;
         $.each(api_data[0]["data"], function(i, point){
            cpu_usage = (point.y / 1000).toFixed(1);
            cpu_avail = ((point.limit - point.y) / 1000).toFixed(1);
            cpu_usage_percent = (100 * (point.y / point.limit)).toFixed(1);
         });
         cpu_usage_class = '';
         if(cpu_usage_percent > 80){ cpu_usage_class = 'q-warning'; }
         if(cpu_usage_percent > 90){ cpu_usage_class = 'q-danger'; }
         if(cpu_usage_percent > 100){ cpu_usage_percent = 100; }
      });
      
      $.when(disk, nobackup_disk, cpu_hours).done(function(){
         var tr = '<tr>';
         tr += '<td><a href="quotas#'+project_id+'">' + project_id + '</a></td>';
         tr += '<td class="'+disk_usage_class+'"><div class="wrapper"><span class="val" style="width:'+disk_usage_percent+'%;"><span>'+disk_usage+' TB</span></span><span class="percent pull-right">'+disk_avail+' TB</span></div></td>';
         tr += '<td class="'+nobackup_usage_class+'"><div class="wrapper"><span class="val" style="width:'+nobackup_usage_percent+'%;"><span>'+nobackup_usage+' TB</span></span><span class="percent pull-right">'+nobackup_avail+' TB</span></div></td>';
         tr += '<td class="'+cpu_usage_class+'"><div class="wrapper"><span class="val" style="width:'+cpu_usage_percent+'%;"><span>'+cpu_usage+' K</span></span><span class="percent pull-right">'+cpu_avail+' K</span></div></td>';
         tr += '</tr>';
         $('#project_quotas tbody').append(tr);
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
