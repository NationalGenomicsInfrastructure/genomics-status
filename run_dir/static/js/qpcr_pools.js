/*
File: qpcr_pools.js
URL: /static/js/qpcr_pools.js
Powers /qpcr_pools - template is run_dir/design/qpcr_pools.html
*/

$(document).ready(function() {
    // Load the data
    load_table();
});
// Initialize sorting and searching javascript plugin

function load_table() {
  $("#pools_table_body").html('<tr><td colspan="2" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/qpcr_pools', function(data) {
    $("#pools_table_body").empty();
    $.each(data, function(flow, containers) {
      if(!($.isEmptyObject(containers))){
        $.each(containers, function(container, pools){
          var tbl_row = $('<tr class="qpcr-container">');
          tbl_row.append($('<td>').html(flow));
          tbl_row.append($('<td>').html(function() {
              var to_return = '<span class="glyphicon glyphicon-plus-sign expand-proj" aria-hidden="true"></span>';
              to_return = to_return + container + ' ('+pools.length+')';
              to_return = to_return + '<span> \
              <table cellpadding="5" border="0" style="visibility:collapse;margin-bottom:0px;margin-top:5px;" class="table">';
              to_return = to_return + '<thead><tr><th>Sample</th><th>Well</th><th>Waiting</th></tr></thead>';
              $.each(pools, function(pool, sample){
                to_return = to_return +
                '<tr>'+
                  '<td>'+sample['name']+'</td>'+
                  '<td>'+sample['well']+'</td>'+
                  '<td>'+ Math.floor(Math.abs(new Date() - new Date(sample['queue_time']))/(1000*86400)) +'</td>'+
                '</tr>';
                });
                to_return = to_return +'</table></span>';
              return to_return;
          }));
          $("#pools_table_body").append(tbl_row);
        })
      }
    })
    init_listjs();
  })
}

function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#pools_table tfoot th').each( function () {
      var title = $('#pools_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    var table = $('#pools_table').DataTable({
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
                '<tr class="group"><td colspan="3">'+group+'</td></tr>'
            );
            last = group;
          }
        });
      }
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#pools_table_filter').addClass('form-inline pull-right');
    $("#pools_table_filter").appendTo("h1");
    $('#pools_table_filter label input').appendTo($('#pools_table_filter'));
    $('#pools_table_filter label').remove();
    $("#pools_table_filter input").attr("placeholder", "Search..");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        } );
    } );
    $('.expand-proj').on('click', function () {
      if($(this).parent().find('table').css('visibility')=='collapse'){
        $(this).toggleClass('glypicon-plus-sign glyphicon-minus-sign');
        $(this).parent().find('table').css('visibility', 'visible');
      }
      else {
        $(this).toggleClass('glyphicon-minus-sign glypicon-plus-sign');
        $(this).parent().find('table').css('visibility', 'collapse');
      }
    });
}

$('body').on('click', '.group', function(event) {
  $($("#samples_table").DataTable().column(0).header()).trigger("click")
});
