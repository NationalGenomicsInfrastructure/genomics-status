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
  var colspan = $('#pools_table > thead > tr:first > th').length + 1; // adding the first column
  $("#pools_table_body").html('<tr><td colspan="'+colspan+'" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/qpcr_pools', function(data) {
    $("#pools_table_body").empty();
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
              to_return = to_return + '<thead><tr class="darkth"><th>Sample</th><th>Well</th><th>Waiting (in days)</th></tr></thead>';
              $.each(pools['samples'], function(pool, sample){
                var wait = getDaysAndDateLabel(sample['queue_time'], 'date')[0];
                to_return = to_return +
                '<tr>'+
                  '<td>'+sample['name']+'</td>'+
                  '<td>'+sample['well']+'</td>'+
                  '<td>'+wait+'</td>'+
                '</tr>';
                //use avg_wait_calc as a counter
                avg_wait_calc = avg_wait_calc + wait;
                });
                to_return = to_return +'</table></span>';
              return to_return;
          }));
          tbl_row.append($('<td>').html(function(){
            var to_return = '';
            $.each( pools['projects'], function(pid, pobj){
              to_return = to_return + '<div class="mult-pools-margin"><a class="text-decoration-none" href="/project/'+pid+'">'+pobj['name']+' ('+pid+') </a></div>'
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
            $.each( pools['sequencing_platforms'], function(i, seq_platform){
              to_return = to_return + '<div class="mult-pools-margin">'+ seq_platform +'</div>'
            });
            return to_return;
          }));
          tbl_row.append($('<td>').html(function(){
            var to_return = '';
            $.each( pools['flowcells'], function(i, flowcell){
              to_return = to_return + '<div class="mult-pools-margin">'+ flowcell +'</div>'
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
          //get average wait time for all samples in a pool.
          avg_wait_calc = avg_wait_calc/pools['samples'].length;
          var daysAndLabel = getDaysAndDateLabel(avg_wait_calc, 'label');
          tbl_row.append($('<td>').html('<span class="alert alert-'+daysAndLabel[1]+' p-1">'+(avg_wait_calc).toFixed(1)+'</span>'));
          tbl_row.append($('<td>').html(function(){
            var to_return = '';
            $.each( pools['projects'], function(pid, pobj){
              let note = pobj['latest_running_note'];
              let ndate = undefined;
              for (date_key in note) { ndate = date_key; break; }
              notedate = new Date(ndate);
              to_return = to_return + '<div class="card running-note-card">' +
              '<div class="card-header">'+
              note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
              ' - '+ generate_category_label(note[ndate]['categories']) +
            '</div><div class="card-body">'+make_markdown(note[ndate]['note'])+'</pre></div></div>';
            });
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
                '<tr class="group"><td colspan="'+$('#pools_table > thead > tr:first > th').length + 1+'">'+group+'</td></tr>'
            );
            last = group;
          }
        });
      }
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#pools_table_filter').addClass('form-inline float-right');
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
      $('#pools_table').find('tr').find('.fa').removeClass(reqText[$('.expand-all').text()][2]);
      $('.expand-all').find('.fa').addClass(reqText[$('.expand-all').text()][3]);
      $('#pools_table').find('tr').find('.fa').addClass(reqText[$('.expand-all').text()][3]);
      $('#pools_table').find('tr').find('table').css('visibility', reqText[$('.expand-all').text()][1]);
      $('.expand-all').contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(reqText[$('.expand-all').text()][0]);
    });
    $(".dt-buttons > .buttons-copy").prepend("<span class='mr-1 fa fa-copy'>");
    $(".dt-buttons > .buttons-excel").prepend("<span class='mr-1 fa fa-file-excel'>");
}

$('body').on('click', '.group', function(event) {
  $($("#pools_table").DataTable().column(0).header()).trigger("click")
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
