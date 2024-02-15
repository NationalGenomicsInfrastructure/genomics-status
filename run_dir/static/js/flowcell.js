/* flowcell.html */

const display_undetermined = (lane) => {
    $(`#table_ud_lane_${lane}:first`).slideToggle();
};

// Copy flowcell lane table to clipboard
$('.lane-copy').click(() => {
    const lane_btn = $(this).attr('id');
    const clipboard = new Clipboard(lane_btn);
    clipboard.on('success', (e) => {
        e.clearSelection();
        $(lane_btn).addClass('active').html('<span class="fa fa-copy"></span> Copied!');
        setTimeout(() => {
            $(lane_btn).removeClass('active').html('<span class="fa fa-copy"></span> Copy table');
        }, 2000);
    });
});

// from running_notes.js
load_running_notes();
// from links.js, only load if links is included
if($('#ln-js').length>0){
    load_links();
}
