/* flowcell.html */

function display_undetermined(lane){
    $("#table_ud_lane_" + lane + ':first').slideToggle();
}

// Copy flowcell lane table to clipboard
$('.lane-copy').click(function(){
    var lane_btn = '#' + $(this).attr('id');
    var clipboard = new Clipboard(lane_btn);
    clipboard.on('success', function(e) {
        e.clearSelection();
        $(lane_btn).addClass('active').html('<span class="glyphicon glyphicon-copy"></span> Copied!');
        setTimeout(function(){
        $(lane_btn).removeClass('active').html('<span class="glyphicon glyphicon-copy"></span> Copy table');
        }, 2000);
    });
});

// from runnin_notes.js
// these vars are needed for load_running_notes(); -> it's js
var notetype='flowcell';
var flowcell_id_reference=$('#flowcells-js').attr('data-flowcell'); // passing parameters to <script> from flowcell.html
load_running_notes();
// from links.js
load_links();
