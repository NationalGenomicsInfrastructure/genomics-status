/* flowcell.html */

function display_undetermined(lane){
    $("#table_ud_lane_" + lane + ':first').slideToggle();
}

// from runnin_notes.js
// these vars are needed for load_running_notes(); -> it's js
var notetype='flowcell';
var flowcell=$('#flowcells-js').attr('data-flowcell'); // passing parameters to <script> from flowcell.html
load_running_notes();
// from links.js
load_links();