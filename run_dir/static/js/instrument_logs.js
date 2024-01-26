
const init_listjs = () => {
    // Setup - add a text input to each footer cell
    $('#instrument_logs_table tfoot th').each(function () {
        const title = $('#instrument_logs_table thead th').eq($(this).index()).text();
        $(this).html(`<input size=10 type="text" placeholder="Search ${title}" />`);
    });

    const table = $('#instrument_logs_table').DataTable({
        paging: false,
        info: false,
        order: [[0, 'desc']]
    });

    // Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#instrument_logs_table_filter').addClass('form-inline');
    $('#instrument_logs_table_filter input').addClass('input-sm');
    $("#instrument_logs_table_filter").appendTo("#instrument_logs_table_filter_col");
    $('#instrument_logs_table_filter label ').html($('#instrument_logs_table_filter input'));
    $("#instrument_logs_table_filter input").attr("placeholder", "Search..");

    // Apply the search
    table.columns().every(function () {
        const that = this;
        $('input', this.footer()).on('keyup change', function () {
        that
            .search(this.value)
            .draw();
        });
    });
};

const init_datepickers = () => {
    $('#datepick1').datepicker({ orientation: 'left top' });
    $('#datepick2').datepicker({ orientation: 'left top' });
};

const init_submit_button = () => {
    $('#submit_interval').click((e) => {
        e.preventDefault();
        let m_d_y;
        let first_date;
        let second_date;
        let dp = $('#inp_date_1').val();

        if (dp !== '') {
            m_d_y = dp.split('/');
            first_date = new Date(m_d_y[2], m_d_y[0] - 1, m_d_y[1]);
        } else {
            first_date = new Date(2016, 01, 01);
        }

        dp = $('#inp_date_2').val();

        if (dp !== '') {
            m_d_y = dp.split('/');
            second_date = new Date(m_d_y[2], m_d_y[0] - 1, m_d_y[1]);
        } else {
            second_date = new Date();
        }

        const loc = `/instrument_logs/${Math.round(first_date.getTime() / 1000)}-${Math.round(second_date.getTime() / 1000)}`;
        window.location.href = loc;
        });
};

init_listjs();
init_datepickers();
init_submit_button();
