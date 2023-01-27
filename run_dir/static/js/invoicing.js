  /*
  File: invoicing.js
  URL: /static/js/invoicing.js
  Powers /invoicing - template is run_dir/design/invoicing.html
  */

  $(document).ready(function() {
      // Load the data
      load_invoicing_table();
  });

  function load_invoicing_table() {
    $("#invoicing_table_body").html('<tr><td colspan="4" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
    return $.getJSON('/api/v1/invoice_spec_list', function(data) {
      $("#invoicing_table_body").empty()
      $('#invoicing_table').DataTable().clear().destroy()
      $.each(data, function(key, value) {
        var tbl_row = $('<tr>')
        var checkbox_col = '<input class="form-check-input invoice_checkbox" type="checkbox" value="'+key+'" id="sel_invoices_'+key+'">'
        tbl_row.append($('<td class="mw-5 text-center">').html(checkbox_col));
        tbl_row.append($('<td>').html(key));
        let date = new Date(parseInt(value['invoice_spec_generated']))
        tbl_row.append($('<td>').html(date.toDateString() + ', ' + date.toLocaleTimeString(date)));
        tbl_row.append($('<td>').html("<button type='button' id="+key+" class='btn btn-outline-dark view_invoice_btn' data-toggle='modal' data-target='#displayInvoiceModal'>View</button>"));
        $("#invoicing_table_body").append(tbl_row);
      });
      // Initialise the Javascript sorting now that we know the number of rows
      init_listjs('invoicing_table');
      $('.view_invoice_btn').click(function(e){
        $('#view_invoice').empty();
        $.ajax({
          type: 'GET',
          dataType: 'html',
          url: '/generate_invoice',
          data: { "project": e.target.id},
          error: function(xhr, textStatus, errorThrown) {
            alert('Invoice could not be retrieved: '+errorThrown);
            console.log(xhr); console.log(textStatus); console.log(errorThrown);
          },
          success: function(data, textStatus, xhr) {
          $('#view_invoice').append(data);
          }
        });
      });
    })
  }

  // Initialize sorting and searching javascript plugin
  function init_listjs(table_name) {
      // Setup - add a text input to each footer cell
      $('#'+table_name+' tfoot th.sort').each( function () {
        var title = $('#'+table+' thead th').eq( $(this).index() ).text();
        $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
      } );


      var table = $('#'+table_name).DataTable({
          "paging":false,
          "destroy": true,
          "info":false,
          "columnDefs": [ {
              "orderable": false,
              "defaultContent": '',
              "data": null
          } ]
      });
      $('#'+table_name+'_filter label').remove();
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

  $('#sel_all_invoices').click(function(e){
    var val = false
    if($('#sel_all_invoices').prop('checked')===true){
      val = true
    }
    $('.invoice_checkbox').each(function(){
      $(this).prop('checked', val)
    })
  })

  $('#invoicing_generate_invoice_btn').click(function(e){
    var projs = []
    $('.invoice_checkbox').each(function(){
      if($(this).prop('checked')===true){
        projs.push($(this).prop('value'))
      }
    })
    $("#sel_proj_form").remove()
    $("#gen_invoice_form").append("<input type='hidden' id='sel_proj_form' name='projects' value="+projs+">")
    $('#gen_invoice_form').attr('action', '/generate_invoice').attr('method', 'post').delay(3000).queue(function(){load_invoicing_table()})
  })

  $('#invoicing_delete_spec_btn').click(function(e){
    var projs = []
    $('.invoice_checkbox').each(function(){
      if($(this).prop('checked')===true){
        projs.push($(this).prop('value'))
      }
    })
    $.ajax({
        url: '/api/v1/delete_invoice',
        type: 'delete',
        data: JSON.stringify({'projects': projs}),
        error: function(xhr, textStatus, errorThrown) {
          alert('Deleting invoices failed: '+errorThrown);
          console.log(xhr); console.log(textStatus); console.log(errorThrown);
        },
        success: function(data, textStatus, xhr) {
          load_invoicing_table();
        }
    })
  })

  $(".tabbable").on("click", '[role="tab"]', function() {
    if($(this).attr('href')=='#tab_invoice_specs'){
      load_invoicing_table()
    }
    if($(this).attr('href')=='#tab_sent_invoices'){
      $("#sent_invoices_table_body").html('<tr><td colspan="2" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
      return $.getJSON('/api/v1/get_sent_invoices', function(data) {
        $("#sent_invoices_table_body").empty();
        $.each(data, function(key, value) {
            var tbl_row = $('<tr>');
            tbl_row.append($('<td>').html(key));
            tbl_row.append($('<td>').html(value));
          $("#sent_invoices_table_body").append(tbl_row);
      });
     init_listjs('sent_invoices_table');
    });
   }
  });
