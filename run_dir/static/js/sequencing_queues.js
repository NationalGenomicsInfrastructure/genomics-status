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
  $("#queues_table_body").html('<tr><td colspan="10" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/sequencing_queues', function(data) {
    $("#queues_table_body").empty();
    $.each(data, function(flow, projects) {
      if(!($.isEmptyObject(projects))){
        $.each(projects, function(project, prinfo){
          var tbl_row = $('<tr>');
          tbl_row.append($('<td>').html(flow));
          tbl_row.append($('<td>').html('<a href="/project/'+project+'">'+prinfo['name']+' ('+project+') </a>'));
          var plates = [];
          var queuetimes = [];
          var qpcrconc = [];
          $.each(prinfo['plates'], function(plate, values){
            plates.push(plate+'<br>');
            queuetimes.push(Math.floor(Math.abs(new Date() - new Date(values['queue_time']))/(1000*86400)) + '<br>');
            qpcrconc.push(values['conc_pool_qpcr']+'<br>');
          });
          tbl_row.append($('<td>').html(plates));
          tbl_row.append($('<td>').html(queuetimes));
          tbl_row.append($('<td>').html(prinfo['runmode']));
          tbl_row.append($('<td>').html(prinfo['lanes']));
          tbl_row.append($('<td>').html(prinfo['setup']));
          tbl_row.append($('<td>').html(prinfo['final_loading_conc']));
          tbl_row.append($('<td>').html(qpcrconc));
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
      "drawCallback": function ( settings ) {
        var api = this.api();
        var rows = api.rows( {page:'current'} ).nodes();
        var last=null;
        api.column(0, {page:'current'} ).data().each( function ( group, i ) {
          if ( last !== group ) {
            $(rows).eq( i ).before(
                '<tr class="group"><td colspan="10">'+group+'</td></tr>'
            );
            last = group;
          }
        });
      }
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#queues_table_filter').addClass('form-inline pull-right');
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
}
