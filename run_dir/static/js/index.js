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
          project_library = project[0].split('|');
          library = project_library[1];
          name_id = project_library[0];
          name_proj_id = project_library[0].replace('(','').replace(')','').split(' ');
          var tbl_row = '<tr>'+'<td>'+'<a href="/project/'+name_proj_id[1]+'">'+name_id+'</a></td>'+
                        '<td>'+library+'</td>'+
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
      "order": [[ 3, "desc" ]],
      "searching": false
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

function plot_sum_data(){
  $.getJSON("/api/v1/sensorpush", function(data) {
    var frig_series = [];
    var freez_series = [];
    $.each(data, function(id, sensordata){
      var timedata = sensordata.samples;
      var sensname = sensordata.sensor_name;
      for (i in timedata) {
        timedata[i][0] = Date.parse(timedata[i][0]);
        date = new Date()
        date.setTime(timedata[i][0])
      }
      if (sensname.startsWith('K') || sensname == 'Test F36'){
        var dp_frig = {
          name: sensname,
          data: timedata,
          lineWidth: 1
        };
        frig_series.push(dp_frig);
      }
      else if (sensname.startsWith('F') || sensname == 'TestF35'){
        var dp_freez = {
          name: sensname,
          data: timedata,
          lineWidth: 1
        };
        freez_series.push(dp_freez);
      }
    });

    $('#fridge_sum_plot').highcharts({
      chart: {
            zoomType: 'x',
            backgroundColor: null
      },
      title: 'All refrigerators',
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
            color: '#fdffd4',
            from: 2,
            width: 10,
            to: -17.78
          }]
      },
      legend: {
          title: {
              text: 'Click to hide:',
              align: 'center'
          }
      },
      series: frig_series
    });

    $('#freezer_sum_plot').highcharts({
      chart: {
            zoomType: 'x',
            backgroundColor: null
       },
      title: 'All freezers',
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
            color: '#fdffd4',
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
      series: freez_series
    });
 });
 // Add a loading spinner and delay to match the loading
 $('#loading_spinner').delay(2500).hide(function(){
   $('#fridge_sum_plot').show();
   $('#freezer_sum_plot').show();
 });
}

$(document).ready(function(){
    fill_updates_table();
    fill_prioprojs_table();
    plot_sum_data();
});
