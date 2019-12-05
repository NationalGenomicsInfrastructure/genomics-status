/*
File: worksets.js
URL: /static/js/worksets.js
Powers /worksets/[List type] - template is run_dir/design/worksets.html
*/

// Get pseudo-argument for this js file. worksets = 'all'
var worksets_page_type = $('#worksets-js').attr('data-worksets');

$(document).ready(function() {
    // Load the data
    load_table();
});

function load_table() {
      var tbl_row = $('<tr>');
      var latest_ws_note = tbl_row.find('td.latest_workset_note');
      if (latest_ws_note.text() !== '') {
        var note = JSON.parse(latest_workset_note_key.text());
        var ndate = undefined;
        for (key in note) { ndate = key; break; }
        notedate = new Date(ndate);
        latest_ws_note.html('<div class="panel panel-default running-note-panel">' +
        '<div class="panel-heading">'+
          note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
        '</div><div class="panel-body">'+make_markdown(note[ndate]['note'])+'</pre></div></div>');
        }
    init_listjs();
}

// Initialize sorting and searching javascript plugin
function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#workset_table tfoot th').each( function () {
      var title = $('#workset_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search..." />' );
    } );

    var table = $('#workset_table').DataTable({
      "paging":false,
      "info":false,
      "order": [[ 0, "desc" ]]
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#workset_table_filter').addClass('form-inline pull-right');
    $("#workset_table_filter").appendTo("h1");
    $('#workset_table_filter label input').appendTo($('#workset_table_filter'));
    $('#workset_table_filter label').remove();
    $("#workset_table_filter input").attr("placeholder", "Search..");
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

function load_workset_notes(wait) {
  // Clear previously loaded notes, if so
  $("#workset_notes_panels").empty();
  $.getJSON("/api/v1/workset_notes/" + worksets_page_type, function(data) {
    $.each(data, function(date, note) {
        noteText = make_markdown(note['note']);
      $('#workset_notes_panels').append('<div class="panel panel-default">' +
          '<div class="panel-heading">'+
            '<a href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
            date.toDateString() + ', ' + date.toLocaleTimeString(date)+
          '</div><div class="panel-body">'+noteText+'</div></div>');
    });
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Workset notes request failed: " + err );
  });
}
var sumGroups = {};
$(".tabbable").on("click", '[role="tab"]', function() {
  if($(this).attr('href')=='#tab_run_worksets'){
    $('#samples_table_filter').remove();
    $('#workset_table_filter').show();
  }
  if($(this).attr('href')=='#tab_pending_samples_to_worksets'){
    $("#samples_table_body").html('<tr><td colspan="4" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');
    return $.getJSON('/api/v1/workset_pools', function(data) {
      $("#samples_table_body").empty();
      var size = 0;
      undefined_fields=[];
      $.each(data, function(key, value) {
        if(!($.isEmptyObject(value))){
          sumGroups[key] = 0;
          $.each(value, function(project, projval){
            var tbl_row = $('<tr>');
            tbl_row.append($('<td>').html(key));
            tbl_row.append($('<td>').html(function() {
              var to_return = '<span class="glyphicon glyphicon-plus-sign expand-proj" aria-hidden="true"></span>';
              to_return = to_return + '<a href="/project/'+project+'">'+projval['pname']+' ('+project+') </a>';
              to_return = to_return + '<span style="float:right; padding-right:50px;"><table cellpadding="5" border="0" style="visibility:collapse;">';
              to_return = to_return + '<thead><tr><th>Samples</th></tr></thead>';
              $.each(projval['samples'], function(i, sample){
                to_return = to_return +
                '<tr>'+
                  '<td>'+sample+'</td>'+
                '</tr>';
                });
                to_return = to_return +'</table></span>';
                return to_return;
              }));
            tbl_row.append($('<td>').html(projval['samples'].length +' ('+ projval['total_num_samples']+')'));
            sumGroups[key] = sumGroups[key] + projval['samples'].length;
            var number_of_days = Math.floor(Math.abs(new Date() - new Date(projval['queued_date']))/(1000*86400));
            tbl_row.append($('<td>').html(number_of_days));
            $("#samples_table_body").append(tbl_row);
          });
        }
      });
      // Initialise the Javascript sorting now that we know the number of rows
      init_listjs2();
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
    });
  }
});

// Initialize sorting and searching javascript plugin
function init_listjs2() {
    // Setup - add a text input to each footer cell
    $('#samples_table tfoot th').each( function () {
      var title = $('#samples_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    //initialize custom project sorting
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
            "pid-pre": function(a) {
                        return parseInt($(a).text().replace(/P/gi, ''));
                            },
            "pid-asc": function(a,b) {
                        return a-b;
                            },
            "pid-desc": function(a,b) {
                        return b-a;
                            }
    });
    var groupColumn = 0;
    var table = $('#samples_table').DataTable({
        "columnDefs": [
            { "visible": false, "targets": groupColumn }
        ],
        "paging":false,
        "destroy": true,
        "info":false,
        "drawCallback": function ( settings ) {
          var api = this.api();
          var rows = api.rows( {page:'current'} ).nodes();
          var last=null;
          api.column(groupColumn, {page:'current'} ).data().each( function ( group, i ) {
            if ( last !== group ) {
              $(rows).eq( i ).before(
                  '<tr class="group"><td colspan="4">'+group+' (Total: '+sumGroups[group] +')</td></tr>'
              );
              last = group;
            }
          });
        }
    });
    //Add the bootstrap classes to the search thingy
    if($('#workset_table_filter').length){
      $('#workset_table_filter').hide();
    }
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#samples_table_filter').addClass('form-inline pull-right');
    $("#samples_table_filter").appendTo("h1");
    $('#samples_table_filter label input').appendTo($('#samples_table_filter'));
    $('#samples_table_filter label').remove();
    $("#samples_table_filter input").attr("placeholder", "Search..");
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

$('body').on('click', '.group', function(event) {
  $($("#samples_table").DataTable().column(0).header()).trigger("click")
});
