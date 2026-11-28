const fill_last_updated_text = () => {
    // Find out when the update script last ran
    $.getJSON('/api/v1/last_psul', (data) => {
        let text;
        if (data.status === 'Success') {
            let timestring = '';
            if (data.hours === 0 && data.minutes <= 2) {
                timestring = 'The script to pull information from the LIMS is running now.';
            } else {
                if (data.hours > 0) {
                    timestring = `${data.hours} hours`;
                } else if (data.minutes > 0) {
                    timestring = `${data.minutes} minutes`;
                } else if (data.seconds > 0) {
                    timestring = `${data.seconds} seconds`;
                }
                text = `<i class="fa-solid fa-arrows-rotate mr-2"></i>The script to pull information from the LIMS last ran ${timestring} ago.`;
            }
        } else {
            console.log(`Last PSUL update check failed. Returned "${data.status}"`);
            text = '<i class="fa-solid fa-circle-exclamation mr-2"></i>Unable to fetch status of PSUL';
        }
        $('#updated-status').html(text);
    });
};

const fill_sensorpush_status_field = () => {
    // Find status of sensorpush
    $.getJSON('/api/v1/sensorpush_warnings', (data) => {
        let text;
        if (data.length === 0) {
            text = '<div class="alert alert-success"><a class="alert-link text-decoration-none" href="/sensorpush">' +
                '<i class="fa-solid fa-temperature-snow fs-2 mr-3 align-text-top"></i>' +
                '<span class="fw-bold">Freezers and fridges are <span class="">OK!</span></a></span></div>';
        } else {
            text = '<div class="alert alert-danger"><a class="alert-link text-decoration-none" href="/sensorpush">' +
                '<i class="fa-solid fs-2 fa-snowflake-droplets mr-3 align-text-top"></i>' +
                `<span class="fw-bold">${data.length} freezer(s) and/or fridge(s) have had warnings the last 24 hours</a></span></div>`;
        }
        $('#sensorpush_status').html(text);
    });
};

$('body').on('click', '.group', (event) => {
    $($("#prio_projs_table").DataTable().column(0).header()).trigger("click");
});

$(document).ready(() => {
    fill_last_updated_text();
    fill_sensorpush_status_field();
});
