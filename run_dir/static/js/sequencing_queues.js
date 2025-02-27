/*
File: sequencing_queues.js
URL: /static/js/sequencing_queues.js
Powers /sequencing_queues - template is run_dir/design/sequencing_queues.html
*/

$(document).ready(function() {
    // Load the data
    load_table();
});
// Initialize sorting and searching javascript plugin

function load_table() {
  $("#queues_table_body").html('<tr><td colspan="15" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/sequencing_queues', function(data) {
    $("#queues_table_body").empty();
    $.each(data, function(flow, projects) {
      if(!($.isEmptyObject(projects))){
        $.each(projects, function(project, prinfo){
          var tbl_row = $('<tr>');
          tbl_row.append($('<td>').html(flow));
          tbl_row.append($('<td>').html('<a class="text-decoration-none" href="/project/'+project+'">'+prinfo['name']+' ('+project+') </a>'));
          var plates = [];
          var pools = [];
          var queuetimes = [];
          var pool_conc = [];
          var qpcrconc = [];
          $.each(prinfo['plates'], function(plate, values){
            var plate_value = '<div class="mult-pools-margin">'+plate+'</div>';
            $.each(values['pools'], function(index, pool){
              var pool_value = '<div class="mult-pools-margin">'+pool['name'];
              if (pool['is_rerun']){
                pool_value = pool_value + ' <span class="alert alert-warning sentenceCase p-1">Rerun</span>';
              }
              pool_value = pool_value + '</div>';
              pools.push(pool_value)
            })
            plates.push(plate_value);
            var daysAndLabel = getDaysAndDateLabel(values['queue_time'], 'both');
            queuetimes.push('<div class="mult-pools-margin"><span class="alert alert-'+daysAndLabel[1]+' p-1">'+daysAndLabel[0]+'</span></div>');
            qpcrconc.push('<div class="mult-pools-margin">'+values['conc_qpcr']+'</div>');
            pool_conc.push('<div class="mult-pools-margin">'+values['conc_pool']+'</div>');
          });
          tbl_row.append($('<td>').html(pools));
          tbl_row.append($('<td>').html(plates));
          tbl_row.append($('<td>').html(queuetimes));
          tbl_row.append($('<td>').html(prinfo['proj_queue_date']));
          tbl_row.append($('<td>').html(prinfo['sequencing_platform']));
          tbl_row.append($('<td>').html(prinfo['flowcell']));
          tbl_row.append($('<td>').html(prinfo['flowcell_option']));
          tbl_row.append($('<td>').html(prinfo['lanes']));
          tbl_row.append($('<td>').html(prinfo['setup']));
          tbl_row.append($('<td>').html(prinfo['final_loading_conc']));
          tbl_row.append($('<td>').html(qpcrconc));
          tbl_row.append($('<td>').html(pool_conc));
          tbl_row.append($('<td>').html(prinfo['librarytype']));
          $("#queues_table_body").append(tbl_row);
        })
      }
    })
    init_listjs();
  })
}

function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#queues_table tfoot th').each( function () {
      var title = $('#queues_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    var table = $('#queues_table').DataTable({
      "columnDefs": [
          { "visible": false, "targets": 0 }
      ],
      "paging":false,
      "info":false,
      "order": [],
      dom: 'Bfrti',
      buttons: [
        {
          extend: 'copy',
          className: 'btn btn-outline-dark mb-3',
          messageTop: null,
          title: null,
        },
        {
          extend: 'excel',
          className: 'btn btn-outline-dark mb-3',
          messageTop: null,
          title: null,
        }
      ],
      "drawCallback": function ( settings ) {
        var api = this.api();
        var rows = api.rows( {page:'current'} ).nodes();
        var last=null;
        api.column(0, {page:'current'} ).data().each( function ( group, i ) {
          if ( last !== group ) {
            $(rows).eq( i ).before(
                '<tr class="group"><td colspan="14">'+group+'</td></tr>'
            );
            last = group;
          }
        });
      }
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#queues_table_filter').addClass('form-inline float-right');
    $("#queues_table_filter").appendTo("h1");
    $('#queues_table_filter label input').appendTo($('#queues_table_filter'));
    $('#queues_table_filter label').remove();
    $("#queues_table_filter input").attr("placeholder", "Search..");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        } );
    } );

    $(".dt-buttons > .buttons-copy").prepend("<span class='mr-1 fa fa-copy'>");
    $(".dt-buttons > .buttons-excel").prepend("<span class='mr-1 fa fa-file-excel'>");
}

$('body').on('click', '.group', function(event) {
  $($("#queues_table").DataTable().column(0).header()).trigger("click")
});

function getDaysAndDateLabel(date, option){
  var number_of_days = 0;
  var label = '';
  if( option=='date' || option=='both' ){
    //calculate number of days from given date to current date
    number_of_days = Math.floor(Math.abs(new Date() - new Date(date))/(1000*86400));
  }
  if (option=='label' || option=='both') {
    if (option=='label'){
      number_of_days = date;
    }
    if (number_of_days < 7){
      label =  'success';
    }
    else if (number_of_days >= 7 && number_of_days < 14) {
      label = 'warning';
    }
    else {
      label = 'danger';
    }
  }
   return [number_of_days, label];
}
