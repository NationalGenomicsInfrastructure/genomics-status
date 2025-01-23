/*
File:smartseq3_progress.js
URL: /static/js/smartseq3_progress.js
Powers /smartseq3_progress - template is run_dir/design/smartseq3_progress.html
*/

$(document).ready(function() {
    // Load the data
    load_table();
});

function load_table() {
    $('#progress_table_body').html('<tr><td colspan="15" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading..</em></td></tr>');
    return $.getJSON('/api/v1/smartseq3_progress', function(data) {
        $('#progress_table_body').empty();
        let steps = data[0];
        let projects = data[1];
        $.each(steps, function(key, step) {
            $.each(step['samples'], function(sampleid, sample_val) {
                let tbl_row = $('<tr>');
                let proj_link = '<a class="text-decoration-none" href="/project/P'+sample_val['projectid']+'">'+projects[sample_val['projectid']]['projectname']+' (P'+sample_val['projectid']+') </a>';
                tbl_row.append($('<td>').html(proj_link));
                tbl_row.append($('<td>').html(step['stepname']));
                tbl_row.append($('<td>').html(sample_val['Sample plate sent date']));
                tbl_row.append($('<td>').html(sample_val['Sample plate received date']));
                tbl_row.append($('<td>').html(sampleid));
                tbl_row.append($('<td>').html(sample_val['Sample Type']));
                tbl_row.append($('<td>').html(sample_val['Sample Links']));
                tbl_row.append($('<td>').html(sample_val['PCR Cycles']));
                tbl_row.append($('<td>').html(sample_val['Optimal Cycle Number']));
                tbl_row.append($('<td>').html(sample_val['Cell Type']));
                tbl_row.append($('<td>').html(sample_val['Tissue Type']));
                tbl_row.append($('<td>').html(sample_val['Species Name']));
                tbl_row.append($('<td>').html(sample_val['Reagent Label']));
                tbl_row.append($('<td>').html(projects[sample_val['projectid']]['Sequence units ordered (lanes)']));
                tbl_row.append($('<td>').html(sample_val['Comment']));
                $('#progress_table_body').append(tbl_row);
         });
        });
        init_datatable();
    });
}

// Initialize sorting and searching javascript plugin
function init_datatable() {
    // Setup - add a text input to each footer cell
    $('#progress_table tfoot th').each( function () {
      var title = $('#progress_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search..." />' );
    } );

    var table = $('#progress_table').DataTable({
      "paging":false,
      "info":false,
      "order": [[ 0, "desc" ]],
      dom: 'Bfrti',
      colReorder: true,
      buttons: [
        {
            extend: 'copy',
            className: 'btn btn-outline-dark mb-3',
            messageTop: null,
            title: null,
        },
        {
            extend: 'excel',
            className: 'btn btn-outline-dark mb-3',
            messageTop: null,
            title: null,
        }
      ]
    });
    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#progress_table_filter').addClass('form-inline float-right');
    $("#progress_table_filter").appendTo("h1");
    $('#progress_table_filter label input').appendTo($('#progress_table_filter'));
    $('#progress_table_filter label').remove();
    $("#progress_table_filter input").attr("placeholder", "Search...");
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