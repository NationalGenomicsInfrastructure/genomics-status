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
