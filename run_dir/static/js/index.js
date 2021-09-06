fill_updates_table = function(){
    // Get the most recent updates
    $.getJSON("/api/v1/last_updated?items=15", function(data) {
      var tbl_body = "";
      $.each(data, function(k1, summary) {
            var link = '';
            var linkend = '';
            if(summary[2] == 'Project information'){
                link = '<a class="text-decoration-none" href="/project/'+summary[1]+'">';
                linkend = '</a>';
            } else if(summary[2] == 'Flowcell information'){
                link = '<a class="text-decoration-none" href="/flowcells/'+summary[1]+'">';
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

function fill_prioprojs_table() {
  //Get projects that have been waiting the longest
  $.getJSON("api/v1/prio_projects", function(data) {
      $("#prio_projs_table_body").empty();
      $.each(data, function(num, project){
          check_value = Math.abs(project[2])
          switch(project[1]){
              case 'days_recep_ctrl':
                  day_color = check_value>7 ? check_value>14 ? 'text-danger': 'text-warning' :'text-success';
                  $(".recep").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_prep_start':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-warning' :'text-success';
                  $(".prep_start").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_prep':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-warning' :'text-success';
                  $(".in_prep").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_seq_start':
                  day_color = check_value>7 ? check_value>14 ? 'text-danger': 'text-warning' :'text-success';
                  $(".seq_start").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_seq':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-warning' : 'text-success';
                  $(".in_seq").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_analysis':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-warning' : 'text-success';
                  $(".analysis").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_data_delivery':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-warning' : 'text-success';
                  $(".to_delivery").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
              case 'days_close':
                  day_color = check_value>10 ? check_value>19 ? 'text-danger': 'text-warning' : 'text-success';
                  $(".close").append('<tr><td>'+'Project: '+'<a href="/project/'+project[0]+'">'+project[0]+'</a>'+', days waiting: '+'<span class="'+day_color+'">'+check_value+'</span></td></tr>');
                  break;
          }
      });
  });
}

$(document).ready(function(){
    fill_updates_table();
    fill_prioprojs_table();
});
