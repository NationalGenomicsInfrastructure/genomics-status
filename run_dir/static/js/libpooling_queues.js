/*
File: libpooling_queues.js
URL: /static/js/libpooling_queues.js
Powers /libpooling_queues - template is run_dir/design/libpooling_queues.html
*/

$(document).ready(function() {
    // Load the data
    load_table();
});
// Initialize sorting and searching javascript plugin

function load_table() {
  var colspan = $('#libpools_table > thead > tr:first > th').length + 1; // adding the first column
  $("#libpools_table_body").html('<tr><td colspan="'+colspan+'" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/libpooling_queues', function(data) {
    $("#libpools_table_body").empty();
    $.each(data, function(flow, containers) {
      if(!($.isEmptyObject(containers))){
        $.each(containers, function(container, pools){
          var avg_wait_calc = 0;
          var tbl_row = $('<tr>');
          tbl_row.append($('<td>').html(flow));
          tbl_row.append($('<td class="expand-proj">').html(function() {
              var to_return = '<span class="fa fa-plus-square" aria-hidden="true"></span>';
              to_return = to_return + container + ' <span class="badge bg-secondary">'+pools['samples'].length+'</span>';
              to_return = to_return + '<BR><span> \
              <table cellpadding="5" border="0" style="visibility:collapse;margin-bottom:0px;margin-top:5px;" align="right">';
              to_return = to_return + '<thead><tr class="darkth"><th>Sample</th></tr></thead>';
              $.each(pools['samples'], function(pool, sample){
                to_return = to_return +
                '<tr>'+
                  '<td>'+sample['name']+'</td>'+
                '</tr>';
                });
                to_return = to_return +'</table></span>';
              return to_return;
          }));
          tbl_row.append($('<td>').html(function(){
            var to_return = '';
            $.each( pools['projects'], function(pid, pname){
              to_return = to_return + '<div class="mult-pools-margin"><a class="text-decoration-none" href="/project/'+pid+'">'+pname+' ('+pid+') </a></div>'
            });
            return to_return;
          }));
          tbl_row.append($('<td>').html(function(){
            var to_return = '';
            $.each( pools['library_types'], function(i, library_type){
              to_return = to_return + '<div class="mult-pools-margin">'+ library_type +'</div>'
            });
            return to_return;
          }));
          tbl_row.append($('<td>').html(function(){
            var to_return = '';
            $.each( pools['proj_queue_dates'], function(i, queued_date){
              to_return = to_return + '<div class="mult-pools-margin">'+ queued_date +'</div>'
            });
            return to_return;
          }));
          $("#libpools_table_body").append(tbl_row);
        })
      }
    })
    init_listjs();
  })
}

function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#libpools_table tfoot th').each( function () {
      var title = $('#libpools_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    var table = $('#libpools_table').DataTable({
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
                '<tr class="group"><td colspan="'+$('#libpools_table > thead > tr:first > th').length + 1+'">'+group+'</td></tr>'
            );
            last = group;
          }
        });
      }
    });

    $(".dt-buttons > .buttons-copy").prepend("<span class='mr-1 fa fa-copy'>");
    $(".dt-buttons > .buttons-excel").prepend("<span class='mr-1 fa fa-file-excel'>");

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#libpools_table_filter').addClass('form-inline float-right');
    $("#libpools_table_filter").appendTo("h1");
    $('#libpools_table_filter label input').appendTo($('#libpools_table_filter'));
    $('#libpools_table_filter label').remove();
    $("#libpools_table_filter input").attr("placeholder", "Search..");
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
        $(this).find('.fa').toggleClass('fa-plus-square fa-minus-square');
        $(this).parent().find('table').css('visibility', 'visible');
      }
      else {
        $(this).find('.fa').toggleClass('fa-minus-square fa-plus-square');
        $(this).parent().find('table').css('visibility', 'collapse');
      }
    });
    $('.expand-all').on('click', function () {
      var reqText = {'Expand All': ['Collapse All', 'visible', 'fa-plus-square', 'fa-minus-square'],
                      'Collapse All': ['Expand All', 'collapse', 'fa-minus-square', 'fa-plus-square']};
      $('.expand-all').find('.fa').removeClass(reqText[$('.expand-all').text()][2]);
      $('#libpools_table').find('tr').find('.fa').removeClass(reqText[$('.expand-all').text()][2]);
      $('.expand-all').find('.fa').addClass(reqText[$('.expand-all').text()][3]);
      $('#libpools_table').find('tr').find('.fa').addClass(reqText[$('.expand-all').text()][3]);
      $('#libpools_table').find('tr').find('table').css('visibility', reqText[$('.expand-all').text()][1]);
      $('.expand-all').contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(reqText[$('.expand-all').text()][0]);
    });
}

$('body').on('click', '.group', function(event) {
  $($("#libpools_table").DataTable().column(0).header()).trigger("click")
});
