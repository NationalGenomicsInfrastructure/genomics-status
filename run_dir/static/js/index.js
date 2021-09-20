fill_updates_table = function(){
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
          var day_color = '';
          var stat_color = '';
          var status = '';
          switch(project[1]){
              case 'days_recep_ctrl':
                  day_color = check_value>7 ? check_value>14 ? 'text-danger': 'text-orange' :'text-success';
                  stat_color = 'text-recep';
                  status = 'In reception control';
                  break;
              case 'days_prep_start':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' :'text-success';
                  stat_color = 'text-prep-start';
                  status = 'To prep';
                  break;
              case 'days_prep':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' :'text-success';
                  stat_color = 'text-prep';
                  status = 'In prep';
                  break;
              case 'days_seq_start':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' :'text-success';
                  stat_color = 'text_seq_start';
                  status = 'To sequencing';
                  break;
              case 'days_seq':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' : 'text-success';
                  stat_color = 'text-seq';
                  status = 'In sequencing';
                  break;
              case 'days_analysis':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' : 'text-success';
                  stat_color = 'text-analysis';
                  status = 'In analysis';
                  break;
              case 'days_data_delivery':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' : 'text-success';
                  stat_color = 'text-delivery';
                  status = 'In delivery';
                  break;
              case 'days_close':
                  day_color = check_value>7 ? check_value>10 ? 'text-danger': 'text-orange' : 'text-success';
                  stat_color = 'text-close';
                  status = 'To close';
                  break;
          }
          id_name = project[0].replace('(','').replace(')','').split(' ');
          proj_id = id_name[1];
          var tbl_row = '<tr>'+'<td>'+'<a href="/project/'+proj_id+'">'+project[0]+'</a></td>'+
                        '<td>'+'<span class="'+stat_color+'">'+status+'</span></td>'+
                        '<td>'+'<span class="'+day_color+'">'+check_value+'</span></td></tr>';
          $("#prio_projs_table_body").append(tbl_row);
      });
      init_listjs();
  });
}

function init_listjs() {
    var table = $('#prio_projs_table').DataTable({
      "paging":false,
      "destroy": true,
      "info":false,
      "order": [[ 2, "desc" ]]
    });
    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#prio_projs_table_filter').addClass('form-inline float-right');
    $("#prio_projs_table_filter").appendTo("h1");
    $('#prio_projs_table_filter label input').appendTo($('#prio_projs_table_filter'));
    $('#prio_projs_table_filter label').remove();
    $("#prio_projs_table_filter input").attr("placeholder", "Search..");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        });
    });
}

$('body').on('click', '.group', function(event) {
  $($("#prio_projs_table").DataTable().column(0).header()).trigger("click")
});

$(document).ready(function(){
    fill_updates_table();
    fill_prioprojs_table();
});
