/* flowcell.html */

const displayUndetermined = (lane) => {
    $(`#table_ud_lane_${lane}:first`).slideToggle();
};

// Copy flowcell lane table to clipboard
$('.lane-copy').click(() => {
    const laneBtn = `#${$(this).attr('id')}`;
    const clipboard = new Clipboard(laneBtn);
    clipboard.on('success', (e) => {
        e.clearSelection();
        $(laneBtn).addClass('active').html('<span class="fa fa-copy"></span> Copied!');
        setTimeout(() => {
            $(laneBtn).removeClass('active').html('<span class="fa fa-copy"></span> Copy table');
        }, 2000);
    });
});

// from runnin_notes.js
// these vars are needed for load_running_notes(); -> it's js
const flowcellIdReference = $('#flowcells-js').attr('data-flowcell'); // passing parameters to <script> from flowcell.html
load_running_notes();
// from links.js
load_links();
