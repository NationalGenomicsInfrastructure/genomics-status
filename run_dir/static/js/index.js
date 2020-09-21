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
    fill_updates_table();
});
