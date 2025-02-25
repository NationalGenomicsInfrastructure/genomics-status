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
    //From running_note.js
    format_latest_running_note();
});

function load_table() {
      var tbl_row = $('<tr>');
      var latest_ws_note = tbl_row.find('td.latest_workset_note');
      if (latest_ws_note.text() !== '') {
        var note = JSON.parse(latest_workset_note_key.text());
        var ndate = undefined;
        for (key in note) { ndate = key; break; }
        notedate = new Date(ndate);
        latest_ws_note.html('<div class="card running-note-card">' +
        '<div class="card-header">'+
          note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
        '</div><div class="card-body">'+make_markdown(note[ndate]['note'])+'</pre></div></div>');
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
      "order": [[ 0, "desc" ]],
      dom: 'Bfrti',
      colReorder: true,
      buttons: [
        {
          extend: 'copy',
          className: 'btn btn-outline-dark mb-3',
          // Remove top two lines with Page title and blank line in output
          messageTop: null,
          title: null,
          exportOptions: {
            format: {
              body: function ( data, row, column, node ) {
                // Replace <hr> and <br> with a semicolon, remove all other html tags, remove newlines, remove &nbsp;
                // These are required since modfying format retains all the html tags
                return data.replace(/<hr\s*[^>]*\s*\/?>/gi, '; ')
                           .replace(/<br>/g, '; ')
                           .replace(/<[^>]*>/g, '')
                           .replace(/\r?\n|\r/g, '')
                           .replace(/&nbsp;/g, ' ');
              }
            }
          }
        },
        {
          extend: 'excel',
          className: 'btn btn-outline-dark mb-3' ,
          // Remove top two lines with Page title and blank line in output
          messageTop: null,
          title: null,
          exportOptions: {
            format: {
              body: function ( data, row, column, node ) {
                // Replace <hr> with a comma, remove all other html tags, remove newlines, remove &nbsp;
                // These are required since modfying format retains all the html tags
                return data.replace(/<hr\s*[^>]*\s*\/?>/gi, ', ')
                          .replace(/<[^>]*>/g, '')
                          .replace(/\r?\n|\r/g, '')
                          .replace(/&nbsp;/g, ' ');
              }
            }
          }
        }
      ]
    });
     //Keep markdown format when dragging around the columns
     table.on( 'column-reorder', function() {
      //from running_note.js
      format_latest_running_note();
    });
    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#workset_table_filter').addClass('form-inline float-right');
    $("#workset_table_filter").appendTo("h1");
    $('#workset_table_filter label input').appendTo($('#workset_table_filter'));
    $('#workset_table_filter label').remove();
    $("#workset_table_filter input").attr("placeholder", "Search...");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        });
    });
    $(".dt-buttons > .buttons-copy").prepend("<span class='mr-1 fa fa-copy'>");
    $(".dt-buttons > .buttons-excel").prepend("<span class='mr-1 fa fa-file-excel'>");
}

var sumGroups = {};
$(".tabbable").on("click", '[role="tab"]', function() {
  if($(this).attr('href')=='#tab_run_worksets'){
    $('#closed_ws_table_filter').remove();
    $('#workset_table_filter').show();
  }
  if($(this).attr('href')=='#tab_closed_worksets'){
    $("#closed_ws_table_body").html('<tr><td colspan="4" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
    return $.getJSON('/api/v1/closed_worksets', function(data) {
      $("#closed_ws_table_body").empty();
      $.each(data, function(key, value) {
        if(!($.isEmptyObject(value))){
          var tbl_row = $('<tr>');
          tbl_row.append($('<td>').html(value['date_run']));
          tbl_row.append($('<td>').html('<a class="text-decoration-none" href="/workset/'+key+'">'+key+'</font>'+'</a>'));
          tbl_row.append($('<td>').html(function() {
            var t = '';
            $.each(value['projects'], function(project, projval) {
              if(!t.trim()){
                t = t + '<a class="text-decoration-none" href="/project/'+project+'">'+projval['project_name']+' ('+project+') <span class="fa fa-folder"></span></a>';
              }
              else {
                t = t + ', <a class="text-decoration-none" href="/project/'+project+'">'+projval['project_name']+' ('+project+') <span class="fa fa-folder"></span></a>';
              }
          });
            return t;
        }));
        $("#closed_ws_table_body").append(tbl_row);
      }
    });
   init_list_closed_ws();
  });
 }
});



// Initialize sorting and searching javascript plugin
function init_list_closed_ws() {
    // Setup - add a text input to each footer cell
    $('#closed_ws_table tfoot th').each( function () {
      var title = $('#closed_ws_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search..." />' );
    } );

    var table = $('#closed_ws_table').DataTable({
      "paging":false,
      "destroy": true,
      "info":false,
      "order": [[ 0, "desc" ]]
    });

    //Add the bootstrap classes to the search thingy
    if($('#workset_table_filter').length){
      $('#workset_table_filter').hide();
    }
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#closed_ws_table_filter').addClass('form-inline float-right');
    $("#closed_ws_table_filter").appendTo("h1");
    $('#closed_ws_table_filter label input').appendTo($('#closed_ws_table_filter'));
    $('#closed_ws_table_filter label').remove();
    $("#closed_ws_table_filter input").attr("placeholder", "Search...");
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
