/*
File: invoicing.js
URL: /static/js/invoicing.js
Powers /invoicing - template is run_dir/design/invoicing.html
*/

$(document).ready(function() {
    // Load the data
    document.title = 'Invoicing : Genomics Status';
    load_invoicing_table();
});

function load_invoicing_table() {
  $("#invoicing_table_body").html('<tr><td colspan="5" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
  return $.getJSON('/api/v1/invoice_spec_list', function(data) {
    $("#invoicing_table_body").empty()
    $('#invoicing_table').DataTable().clear().destroy()
    $.each(data, function(key, value) {
      let tbl_row = $('<tr>')
      let checkbox_col = '<input class="form-check-input invoice_checkbox align-middle" type="checkbox" value="'+key+'" id="sel_invoices_'+key+'">'
      tbl_row.append($('<td class="mw-5 text-center">').html(checkbox_col))
      let badge_colour = { "Aborted": "bg-danger", "Closed": "bg-success", "Reception Control": "bg-secondary", "Ongoing": "bg-info", "Pending": "bg-info"}
      let project_row = '<a class="text-decoration-none" href="/project/'+key+'">'+key+', '+value['project_name']+'</a>'
      project_row += '<button type="button" id='+key+' class="btn btn-sm btn-outline-dark view_invoice_btn float-right px-3" data-toggle="modal" data-target="#displayInvoiceModal">View</button>'
      tbl_row.append($('<td>').html(project_row))
      tbl_row.append($('<td>').html('<h4 class="mb-0"><span class="badge '+badge_colour[value['project_status']]+'">'+value['project_status']+'</span></h4>'));
      let date = new Date(parseInt(value['invoice_spec_generated']));
      tbl_row.append($('<td>').html(date.toISOString().slice(0,10) + ', ' + date.toISOString().slice(11,19)));
      tbl_row.append($('<td>').html(value['total_cost'] + ' SEK' ));
      $("#invoicing_table_body").append(tbl_row)
    });
    // Initialise the Javascript sorting now that we know the number of rows
    init_listjs('invoicing_table');
    $('.view_invoice_btn').click(function(e){
      get_invoice_data(e)
    });
  })
}

function get_invoice_data(e){
  $('#view_invoice').empty();
  $.ajax({
    type: 'GET',
    dataType: 'html',
    url: '/api/v1/generate_invoice',
    data: { "project": e.target.id},
    error: function(xhr, textStatus, errorThrown) {
      $('#view_invoice').append('Invoice could not be retrieved: '+errorThrown);
      console.log(xhr); console.log(textStatus); console.log(errorThrown);
    },
    success: function(data, textStatus, xhr) {
    $('#view_invoice').append(data);
    }
  });
}

// Initialize sorting and searching javascript plugin
function init_listjs(table_name) {
    // Setup - add a text input to each footer cell
    $('#'+table_name+' tfoot th.sort').each( function () {
      let title = $('#'+table+' thead th').eq( $(this).index() ).text()
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' )
    } );

    let options = {
      "paging":false,
      "destroy": true,
      "info":false,
      "columnDefs": [ {
          "orderable": false,
          "defaultContent": '',
          "data": null,
      } ],
    }
    if(table_name==='invoicing_table'){
      options['columns'] = [
        null,
        { "width": "25%" },
        null,
        null,
        null
      ]
    }
    var table = $('#'+table_name).DataTable(options);
    $('#'+table_name+'_filter label').remove();
    // Apply the search
    if(table_name!=='invoicing_table'){
      table.columns().every( function () {
          var that = this;
          $( 'input', this.footer() ).on( 'keyup change', function () {
              that
              .search( this.value )
              .draw();
          } );
      } );
    }
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
  $('#gen_invoice_form').attr('action', '/api/v1/generate_invoice').attr('method', 'post').delay(3000).queue(function(){load_invoicing_table()})
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
    $("#sent_invoices_table_body").html('<tr><td colspan="3" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
    return $.getJSON('/api/v1/get_sent_invoices', function(data) {
      $("#sent_invoices_table_body").empty();
      $.each(data, function(key, value) {
          let tbl_row = $('<tr>')
          let project_row = '<a class="text-decoration-none" href="/project/'+key+'">'+key+'</a>'
          project_row += '<button type="button" id='+key+' class="btn btn-sm btn-outline-dark view_invoice_btn float-right px-3" data-toggle="modal" data-target="#displayInvoiceModal">View</button>'
          tbl_row.append($('<td>').html(project_row))
          tbl_row.append($('<td>').html(value['downloaded_date']))
          tbl_row.append($('<td>').html(value['total_cost'] + ' SEK'))
        $("#sent_invoices_table_body").append(tbl_row)
    });
   init_listjs('sent_invoices_table');
   $('.view_invoice_btn').click(function(e){
     get_invoice_data(e)
   });
  });
 }
});
