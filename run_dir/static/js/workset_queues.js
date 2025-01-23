/*
File: workset_queues.js
URL: /static/js/workset_queues.js
Powers /workset_queues - template is run_dir/design/workset_queues.html
*/

$(document).ready(function() {
    // Load the data
    load_table();
});
var sumGroups = {};
function load_table() {
  $("#samples_table_body").html('<tr><td colspan="8" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/workset_queues', function(data) {
    $("#samples_table_body").empty();
    var size = 0;
    undefined_fields=[];
    $.each(data, function(key, value) {
      if(!($.isEmptyObject(value))){
        sumGroups[key] = 0;
        $.each(value, function(project, projval){
          var has_requeued = 'No';
          var tbl_row = $('<tr>');
          tbl_row.append($('<td>').html(key));
          tbl_row.append($('<td class="expand-proj">').html(function() {
            var to_return = '<span class="fa fa-plus-circle" aria-hidden="true"></span>';
            to_return = to_return + '<a class="text-decoration-none" href="/project/'+project+'">'+projval['pname']+' ('+project+') </a>';
            to_return = to_return + '<span style="float:right; padding-right:50px;"><table border="0" style="visibility:collapse;">';
            to_return = to_return + '<thead><tr class="darkth"><th>Samples</th><th>Requeued</th></tr></thead>';
            $.each(projval['samples'], function(i, sample){
              to_return = to_return +
              '<tr>'+
                '<td>'+sample[0]+'</td>'+
                '<td>'+sample[1]+'</td>'+
              '</tr>';
              if(sample[1]===true) has_requeued='Yes';
              });
              to_return = to_return +'</table></span>';
              return to_return;
            }));
          tbl_row.append($('<td>').html(projval['samples'].length +' <span class="badge bg-secondary">'+ projval['total_num_samples']+'</span>'));
          sumGroups[key] = sumGroups[key] + projval['samples'].length;
          var daysAndLabel = getDaysAndDateLabel(projval['oldest_sample_queued_date'], 'both');
          tbl_row.append($('<td>').html('<span class="badge bg-'+daysAndLabel[1]+'">'+daysAndLabel[0]+'</span>'));
          tbl_row.append($('<td>').html(projval['queued_date']));
          tbl_row.append($('<td>').html('<div>'+has_requeued+'</div>'));
          tbl_row.append($('<td>').html(projval['protocol']));
          if (projval['latest_running_note'] !== '') {
            var note = projval['latest_running_note'];
            var ndate = undefined;
            for (date_key in note) { ndate = date_key; break; }
            notedate = new Date(ndate);
            tbl_row.append($('<td>').html('<div class="card running-note-card">' +
            '<div class="card-header">'+
              note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
              ' - '+ generate_category_label(note[ndate]['categories']) +
            '</div><div class="card-body">'+make_markdown(note[ndate]['note'])+'</pre></div></div>'));
            }
          else{
              tbl_row.append($('<td>').html('No Running notes found'));
          }

          $("#samples_table_body").append(tbl_row);
        });
      }
    });
    // Initialise the Javascript sorting now that we know the number of rows
    init_listjs();
    $('.expand-proj').on('click', function () {
      if($(this).parent().find('table').css('visibility')=='collapse'){
        $(this).find('.fa').toggleClass('fa-plus-circle fa-minus-circle');
        $(this).parent().find('table').css('visibility', 'visible');
      }
      else {
        $(this).find('.fa').toggleClass('fa-minus-circle fa-plus-circle');
        $(this).parent().find('table').css('visibility', 'collapse');
      }
    });
    $('.expand-all').on('click', function () {
      var reqText = {'Expand All': ['Collapse All', 'visible', 'fa-plus-circle', 'fa-minus-circle'],
                      'Collapse All': ['Expand All', 'collapse', 'fa-minus-circle', 'fa-plus-circle']};
      $('.expand-all').find('.fa').removeClass(reqText[$('.expand-all').text()][2]);
      $('#samples_table').find('tr').find('.fa').removeClass(reqText[$('.expand-all').text()][2]);
      $('.expand-all').find('.fa').addClass(reqText[$('.expand-all').text()][3]);
      $('#samples_table').find('tr').find('.fa').addClass(reqText[$('.expand-all').text()][3]);
      $('#samples_table').find('tr').find('table').css('visibility', reqText[$('.expand-all').text()][1]);
      $('.expand-all').contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(reqText[$('.expand-all').text()][0]);
    });
  });
}

// Initialize sorting and searching javascript plugin
function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#samples_table tfoot th').each( function () {
      var title = $('#samples_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    var groupColumn = 0;
    var table = $('#samples_table').DataTable({
        "columnDefs": [
            { "visible": false, "targets": groupColumn }
        ],
        "paging":false,
        "destroy": true,
        "info":false,
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
          api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {
            if ( last !== group ) {
              $(rows).eq( i ).before(
                  '<tr class="group"><td colspan="8">'+group+' (Total: '+sumGroups[group] +')</td></tr>'
              );
              last = group;
            }
          });
        }
    });
    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#samples_table_filter').addClass('form-inline float-right');
    $("#samples_table_filter").appendTo("h1");
    $('#samples_table_filter label input').appendTo($('#samples_table_filter'));
    $('#samples_table_filter label').remove();
    $("#samples_table_filter input").attr("placeholder", "Search...");
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
  $($("#samples_table").DataTable().column(0).header()).trigger("click")
});

function getDaysAndDateLabel(date, option){
  var number_of_days = 0;
  var label = '';
  if (date == null){
      label = 'danger';
      number_of_days = ' Missing';
  } else {
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
  }
  return [number_of_days, label];
}