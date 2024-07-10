/*
File: controls.js
URL: /static/js/controls.js
Powers /controls/[List type] - template is run_dir/design/controls.html
*/

$( document ).ready(function() {
  document.title = 'something else';
  init_listjs_controls('negative_controls_table');
});

// Initialize sorting and searching javascript plugin 
function init_listjs_controls(table_name) {
  // Setup - add a text input to each footer cell
  $('#'+table_name+' tfoot th').each( function () {
    var title = $('#'+table_name+' thead th').eq( $(this).index() ).text();
    $(this).html( '<input size=10 type="text" placeholder="'+title+'" />' );
  } );

  var table = $('#'+table_name).DataTable({
    "paging":false,
    "info":false,
    "destroy": true,
    "order": [[ 1, "desc" ]],
    colReorder: true,
    dom: 'Bfrti',
    buttons: [
      { extend: 'copy', className: 'btn btn-outline-dark mb-3' },
      { extend: 'excel', className: 'btn btn-outline-dark mb-3' }
    ]
  });

  //Add the bootstrap classes to the search boxes
  if (!table_name || table_name == "negative_controls_table"){ list_name = "#negative_control-list"; }
  else if(table_name == "positive_controls_table"){ list_name = "#positive_control-list"; }

  $('#'+table_name+'_filter').addClass('form-inline float-right pt-1');
  $('#'+table_name+'_filter').appendTo($(list_name));
  $('#'+table_name+'_filter label input').appendTo($('#'+table_name+'_filter'));
  $('#'+table_name+'_filter label').remove();
  $('#'+table_name+'_filter input').attr("placeholder", "Search...");

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

//find the correct tab information
$(".tabbable").on("click", '[role="tab"]', function() {
  if($(this).attr('href')=='#tab_negative_controls'){
    table_name = 'negative_controls_table';
  }
  if($(this).attr('href')=='#tab_positive_controls'){
    table_name = 'positive_controls_table';
  }
  init_listjs_controls(table_name);
});