



$(".tabbable").on("click", '[role="tab"]', function() {

    if($(this).attr('href')=='#tab_ont'){
      $("#ont_fc_table_body").html('<tr><td colspan="4" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
      return $.getJSON('/api/v1/ont_flowcells', function(data) {
        $("#ont_fc_table_body").empty();
        $.each(data, function(key, value) {
          if(!($.isEmptyObject(value))){
            console.log(value)
            var tbl_row = $('<tr>');
            tbl_row.append($('<td>').html(key));
            tbl_row.append($('<td>').html(value['experiment_name']));
            tbl_row.append($('<td>').html(value['sample_name']));
            tbl_row.append($('<td>').html(value['start_time']));
          $("#ont_fc_table_body").append(tbl_row);
        }
      });
     init_list_closed_ws();
    });
   }
  });

  function init_list_closed_ws() {
    // Setup - add a text input to each footer cell
    $('#ont_fc_table tfoot th').each( function () {
      var title = $('#ont_fc_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search..." />' );
    } );

    var table = $('#ont_fc_table').DataTable({
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
    $('#ont_fc_table_filter').addClass('form-inline float-right');
    $("#ont_fc_table_filter").appendTo("h1");
    $('#ont_fc_table_filter label input').appendTo($('#ont_fc_table_filter'));
    $('#ont_fc_table_filter label').remove();
    $("#ont_fc_table_filter input").attr("placeholder", "Search...");
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