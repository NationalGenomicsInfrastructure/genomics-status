
function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#instrument_logs_table tfoot th').each( function () {
      var title = $('#instrument_logs_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );
                             
    var table = $('#instrument_logs_table').DataTable({
      "paging":false,
      "info":false,
      "order": [[ 0, "desc" ]]
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#instrument_logs_table_filter').addClass('form-inline pull-right');
    $("#instrument_logs_table_filter").appendTo("h1");
    $('#instrument_logs_table_filter label input').appendTo($('#fc_table_filter'));
    $('#instrument_logs_table_filter label').remove();
    $("#instrument_logs_table_filter input").attr("placeholder", "Search..");
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

function init_datepickers(){
    $('#datepick1').datepicker();
    $('#datepick2').datepicker();
}
function init_submit_button(){
    $('#submit_interval').click(function(e){
     e.preventDefault();
     var m_d_y=$('#inp_date_1').val().split('/');  
     var first_date=new Date(m_d_y[2], m_d_y[0]-1, m_d_y[1]);
     m_d_y=$('#inp_date_2').val().split('/');  
     var second_date=new Date(m_d_y[2], m_d_y[0]-1, m_d_y[1]);
     var loc="/instrument_logs/"+first_date.getTime()/1000+"-"+second_date.getTime()/1000;
     window.location.href=loc;

    
    });

}

init_listjs();
init_datepickers();
init_submit_button();
