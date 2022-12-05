


// When a tab of the tabbable element is clicked, run function() defined here-as
$(".tabbable").on("click", '[role="tab"]', function() {

    // If the tab being clicked is the ONT tab
    if($(this).attr('href')=='#tab_ont'){

      // Create the table body, initiated with a row equipped with loading spinners
      $("#ont_fc_table_body").html('<tr><td colspan="12" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
      
      // Use the API linking to the Python script to fetch data from CouchDB and send the data into function() definied here-as
      return $.getJSON('/api/v1/ont_flowcells', function(data) {
        
        // Clear the table body, if any
        $("#ont_fc_table_body").empty();
        
        // For every run entry in the fetched data
        $.each(data, function(key, value) {
          
          // If there is data in the row
          if(!($.isEmptyObject(value))){
            
            // Initiate a new table row
            var tbl_row = $('<tr>');
            // Append key and subsequent values from the data as html

            // Identifiers
            tbl_row.append($('<td>').html(`<a class="text-decoration-none"  href="/flowcells">${key}</a>`));
            tbl_row.append($('<td>').html(value['start_date']));
            tbl_row.append($('<td>').html(value['experiment_name']));
            tbl_row.append($('<td>').html(value['sample_name']));

            // Hardware
            tbl_row.append($('<td>').html(value['flow_cell_type']));
            tbl_row.append($('<td>').html(value['flow_cell_id']));

            // Kits
            tbl_row.append($('<td>').html(value['prep_kit']));
            tbl_row.append($('<td>').html(value['barcoding_kit']));

            // Sequencing metrics
            tbl_row.append($('<td>').html(value['basecalled_pass_bases_format']));
            tbl_row.append($('<td>').html(value['basecalled_pass_read_count_format']));
            tbl_row.append($('<td>').html(value['n50_format']));
            tbl_row.append($('<td>').html(value['accuracy']));

          // Append the table row to the table body
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
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    // Format and sort the finished table
    var table = $('#ont_fc_table').DataTable({
      "paging":false,
      "destroy": true,
      "info":false,
      // Sort by the (n+1)th column, descending
      "order": [[ 1, "desc" ]]
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