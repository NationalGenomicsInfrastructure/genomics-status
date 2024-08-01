/*
File: controls.js
URL: /static/js/controls.js
Powers /controls/[List type] - template is run_dir/design/controls.html
*/

$( document ).ready(function() {
  document.title = 'Controls Tables';
  init_datatable_controls('positive_controls_table');
  init_datatable_controls('negative_controls_table');
});

// Initialize sorting and searching javascript plugin 
function init_datatable_controls(table_name) {
  // Setup - add a text input to each footer cell

  $('#'+table_name+' tfoot th').each( function () {
    var title = $('#'+table_name+' thead th').eq( $(this).index() ).text();
    $(this).html( '<input size=10 type="text" placeholder="'+title+'" />' );
  } );

  var table = $('#'+table_name).DataTable({
    "paging":false,
    "info":false,
    "order": [[ 1, "asc" ]],
    "destroy": true,
    dom: 'Bfrti',
    buttons: [
      { extend: 'copy', className: 'btn btn-outline-dark mb-3' },
      { extend: 'excel', className: 'btn btn-outline-dark mb-3' }
    ]
  });

  //Add the bootstrap classes to the search boxes
  let list_name = "#negative_controls_heading";
  if(table_name === "positive_controls_table"){ list_name = "#positive_controls_heading"; }

  $('div.dataTables_filter input').addClass('form-control search search-query');
  $('#'+table_name+'_filter').addClass('form-inline float-right pt-1');
  $('#'+table_name+'_filter').attr("style",'font-size: 14px');
  $('#'+table_name+'_filter').appendTo($(list_name));
  $('#'+table_name+'_filter label input').appendTo($('#'+table_name+'_filter'));
  $('#'+table_name+'_filter label').remove();
  $('#'+table_name+'_filter input').attr("placeholder", "Search...");

   //Apply the search
   table.columns().every( function () {
       var that = this;
       $( 'input', this.footer() ).on( 'keyup change', function () {
           that
           .search( this.value )
           .draw();
       } );
  } );
  
  $("#"+table_name+"_wrapper > .dt-buttons > .buttons-copy").prepend("<span class='mr-1 fa fa-copy'>"); // adds little copy and excel icons to the buttons
  $("#"+table_name+"_wrapper > .dt-buttons > .buttons-excel").prepend("<span class='mr-1 fa fa-file-excel'>");
}