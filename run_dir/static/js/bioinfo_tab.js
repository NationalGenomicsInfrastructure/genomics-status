
var bioinfo_qc_statuses = {'?': 'unknown', 'Pass': 'bg-success-table', 'Warning': 'bg-warning-table', 'Fail': 'bg-danger-table', 'N/A': 'active'};
var bioinfo_qc_classes = ['unknown', 'bg-success-table', 'bg-warning-table', 'bg-danger-table', 'active'];
var bioinfo_qc_values = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];

var sample_statuses = {
    'Demultiplexing': 'bg-secondary',
    'Transferring': 'bg-secondary',
    'Sequencing': 'bg-secondary',
    'New': 'bg-primary',
    'QC-ongoing': 'bg-warning',
    'QC-done': 'bg-success',
    'BP-ongoing': 'bg-warning',
    'BP-done': 'bg-success',
    'Failed': 'bg-danger',
    'Delivered': 'bg-primary',
    'ERROR': 'bg-danger',
    };
var sample_classes = ['bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-primary', 'bg-warning', 'bg-success', 'bg-warning', 'bg-success', 'bg-danger', 'bg-primary', 'bg-danger'];
var sample_values = ['Demultiplexing', 'Transferring', 'Sequencing', 'New', 'QC-ongoing', 'QC-done', 'BP-ongoing', 'BP-done', 'Failed', 'Delivered', 'ERROR'];


// Datepickers
$('.table-bioinfo-status').on('focus', '.input-group.date input', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    if ($(this).closest('tr').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    $(this).datepicker({
        format: "yyyy-mm-dd",
        todayHighlight: true
    });
    // update status
    var td = $(this).closest('td');
    checkSampleStatus(td);
});

$('.table-bioinfo-status').on('click', '.datepicker-today', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if(!isdisabled){
      var today = formatDateTime(new Date(), false);
      var input = $(this).prevAll("input:first");
      // if undefined, means we are in header
      if ($(input).val() != undefined) {
        $(input).val(today);
      }
    }
    // set values to upper and lower levels
    var date_td = $(this).closest('td.datadelivered');
    /// if no date_td, we are in header -> set all rows
    if (date_td.length == 0) {
        // set all
        var all_tds = $(this).closest('table.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.datadelivered');
        if (all_tds.length != 0) {
            $(all_tds).find('input:first').val(today);
        }
        // update status for all rows:
        var all_rows = $(this).closest('.table-bioinfo-status').find('td.datadelivered');
        $.each(all_rows, function(i, td) {
            checkSampleStatus(td, 'no_recursion');
        })
    } else { // not in header
        var child_tds = getAllChildTrs($(date_td).parent());
        if (child_tds.length != 0) {
            $(child_tds).children('td.datadelivered').find('input:text').val(today);
        }
        setParentDate(date_td);
        // update status
        checkSampleStatus(date_td);
    }
});


$('.table-bioinfo-status').on('click', '.date-reset', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if(!isdisabled){
      var today = formatDateTime(new Date(), false);
      var input = $(this).prevAll("input:first");
      // if undefined, means we are in header
      if ($(input).val() != undefined) {
        $(input).val("");
      }
    }
    // set values to upper and lower levels
    var date_td = $(this).closest('td.datadelivered');
    /// if no date_td, we are in header -> set all rows
    if (date_td.length == 0) {
        // set all
        var all_tds = $(this).closest('table.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.datadelivered');
        $(all_tds).find('input:first').val('');
        $.each(all_tds, function(i, td) {
            checkSampleStatus(td, 'no_recursion');
        });
    } else { // not in header
        var child_trs = getAllChildTrs($(date_td).parent());
        if (child_trs.length != 0) {
            $(child_trs).children('td.datadelivered').find('input:text').val("");
        }
        setParentDate(date_td);
        // update status
        checkSampleStatus(date_td);
    }
});

// expand or collapse table
$('.bioinfo-expand').click(function(e){
    // this = a[href=#$(tr).attr('id')];
    e.preventDefault();
    e.stopImmediatePropagation();
    var tr = $(this).closest('tr');
    if ($(tr).hasClass('bioinfo-project')) {
        collapseAll(this);
        return false;
    }
    if ($(this).hasClass('expanded')){
        collapse(tr);
    } else {
        expand(tr);
    }
});

function collapse(element) {
    // element is tr
    var element_id = $(element).attr('id');
    var expanded = $(element).find('a[href="#'+element_id+'"]');
    $(expanded).removeClass('expanded');
    var span =$(element).find('td.bioinfo-status-expand span.fa');
    if ($(span).hasClass('fa-chevron-down')) {
        $(span).removeClass('fa-chevron-down');
        $(span).addClass('fa-chevron-right');
    }

    var tr = $(element);
    var tr_class = $(tr).attr('class').split(' ')[0].trim(); //e.g. bioinfo-fc

    // excluding parent elements from selection
    var parent_class = $(tr).attr('data-parent').split('-').splice(0, 2).join('-').replace('#', '');
    if ($(tr).closest('table').hasClass('table-bioinfo-status-sampleview')) {
        if (parent_class != 'bioinfo-sample') {
            parent_class += ',.bioinfo-sample';
        }
    } else {
        if (parent_class != 'bioinfo-fc') {
            parent_class += ',.bioinfo-fc';
        }
    }
    var children = $(element).nextUntil('tr.'+tr_class, 'tr:not(.'+parent_class+')'); // does not inlcude tr and next tr
    $(children).hide().children('td.bioinfo-status-expand span.fa').removeClass('fa-chevron-down fa-chevron-right').addClass('fa-chevron-right');
};

function expand(element) {
    var a = $(element).find('.bioinfo-expand');
    $(a).addClass('expanded');
    var tr_id = $(element).attr('id');
    $('tr[data-parent="#'+tr_id+'"]').show();
    var span = $(element).find('td.bioinfo-status-expand span.fa')
    if ($(span).hasClass('fa-chevron-right')) {
        $(span).removeClass('fa-chevron-right')
        $(span).addClass('fa-chevron-down');
    }
};

function collapseAll(a) {
    var current_tr = $(a).parent().parent();
    var top_level_class = "";
    var second_level_class = "";
    var table = $(a).closest('table.table-bioinfo-status');
    if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        top_level_class = 'bioinfo-sample';
        second_level_class = 'bioinfo-fc';
    } else if ($(table).hasClass('table-bioinfo-status-runview')) {
        top_level_class = 'bioinfo-fc';
        second_level_class = 'bioinfo-lane';
    } else {
        console.error('unknown data structure! Change deliveries.js or bioinfo_tab.js!');
    }
    if ($(a).hasClass('expanded')) { // collapse recursively
        var trs = $(table).find('tr.' + top_level_class);
        $.each(trs, function(index, tr) {
            if ($(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                collapse(tr);
            }
        });
        $(a).removeClass('expanded');
        $(a).find('span.fa').removeClass('fa-chevron-down');
        $(a).find('span.fa').addClass('fa-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($(table).find('tr.'+top_level_class), $(table).find('tr.'+second_level_class));
        $.each(trs, function(index, tr) {
            if (!$(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                expand(tr);
            }
        });
        $(a).addClass('expanded');
        $(a).find('span.fa').removeClass('fa-chevron-right');
        $(a).find('span.fa').addClass('fa-chevron-down');
    }
};

// set the whole row
$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-row', function(e) {
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var td = $(this);

    var tr = $(this).parent();
    var row_status = $(td).attr('class').split(/\s+/)[1]; // '?'
    var next_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(row_status)+1) % bioinfo_qc_values.length]; // 'Pass'
    var next_class = bioinfo_qc_statuses[next_status];    // 'success'

    // set row
    var row = $(tr).children('td.bioinfo-status-qc');
    $(row).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_status);
    // update row class (to know what we clicked last time)
    $(td).removeClass(bioinfo_qc_values.join(' ')).addClass(next_status);
    // update row status
    checkSampleStatus(td);

    // update parent rows
    $.each(row, function(i, td) {
        setParentStatus(td);
    });

    // now the same for all children rows

    // excluding parent elements from selection
    // to handle the case if the last element of it's level is clicked
    var parent_class = $(tr).attr('data-parent').split('-').splice(0, 2).join('-').replace('#', '');
    if ($(td).closest('table').hasClass('table-bioinfo-status-sampleview')) {
        if (parent_class != 'bioinfo-sample') {
            parent_class += ',.bioinfo-sample';
        }
    } else {
        if (parent_class != 'bioinfo-fc') {
            parent_class += ',.bioinfo-fc';
        }
    }
    var tr_class = $(tr).attr('class').split(/\s+/)[0];
    // set row
    var children_rows = $(tr).nextUntil('tr.'+tr_class, 'tr:not(.bioinfo-status-disabled,.'+parent_class+')').children('td.bioinfo-status-qc');
    $(children_rows).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_status);

    // update row class
    var child_row_tds = $(tr).nextUntil('tr.'+tr_class, 'tr:not(.bioinfo-status-disabled,.'+parent_class+')').children('td.bioinfo-status-row');
    $(child_row_tds).removeClass(bioinfo_qc_values.join(' ')).addClass(next_status);
    // update status of children rows:
    $.each(child_row_tds, function(i, td) {
        checkSampleStatus(td);
    });
});

// click on header -> set all the values
$('.table-bioinfo-status').on('click', 'th.bioinfo-status-th', function(e) {
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    // get last clicked value
    var th = $(this);
    var th_status = $(th).attr('class').split(/\s+/)[3];
    if (th_status == undefined) {
        th_status = '?';
    }
    var th_class = bioinfo_qc_statuses[th_status];

    // get next status
    var new_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(th_status)+1) % bioinfo_qc_values.length];
    var new_class = bioinfo_qc_statuses[new_status];

    // get tds with the same column name
    var column_name = $(th).attr('class').split(/\s+/)[2];
    var tds = $(th).closest('.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.'+column_name);

    $(tds).removeClass(bioinfo_qc_classes.join(' ')).addClass(new_class).text(new_status);
    $(th).removeClass(th_status).addClass(new_status);

    // update sample status
    if ($(this).closest('table').hasClass('bioinfo-status-runview')) {
        var top_level_class = 'bioinfo-fc';
    } else {
        var top_level_class = 'bioinfo-sample';
    }

    // get only top flowcells (for runview) or samples (for sampleview) -> then checkSampleStatus works faster
    tds = $(this).closest('table.table-bioinfo-status-runview:visible').find('tr.bioinfo-fc td.'+column_name);
    // merge results from both views, one of them will be empty
    $.merge(tds, $(this).closest('table.table-bioinfo-status-sampleview:visible').find('tr.bioinfo-sample td.'+column_name));

    $.each(tds, function(i, td){
        checkSampleStatus(td);
    });
});

function topParent(tr) {
    var parent_id = $(tr).attr('data-parent');
    var parent_tr = $(parent_id);
    if ($(parent_tr).hasClass('bioinfo-project')) {
        return tr;
    } else {
        return topParent(parent_tr);
    }
};

$('.table-bioinfo-status-runview').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-bp', function(e) {
    // whatever it means
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var td = $(this);
    var td_class = $(td).attr('class').split(/\s+/)[1];

    var qc_value = $(td).text().trim();   // '?'
    var qc_class = bioinfo_qc_statuses[qc_value];        // 'unknown'
    var next_value = bioinfo_qc_values[(bioinfo_qc_values.indexOf(qc_value)+1) % bioinfo_qc_values.length]; // 'Pass'
    var next_class = bioinfo_qc_statuses[next_value];        // 'success'

    var child_trs = [];
    if ($(td).parent().hasClass('bioinfo-sample')) {
        child_trs = $(td).parent();
    } else {
        child_trs = getAllChildTrs($(td).parent());
    }

    var sample_ids = $.map($(child_trs).filter('tr.bioinfo-sample'), function(child_tr) {
        return $(child_tr).children('td').children('samp').text().trim();
    });

    // update on sample level and get lane_ids to update
    var lane_trs_to_change = [];
    $.each(sample_ids, function(i, sample_id){
        var sample_trs_to_change = $('.table-bioinfo-status-runview').find('tr.bioinfo-sample td:contains('+sample_id+')').parent();
        var tds_to_change = $(sample_trs_to_change).find('td.'+td_class);
        $(tds_to_change).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_value);
        $.each(tds_to_change, function(i, td_to_change) {
            checkSampleStatus(td_to_change, 'no_recursion');
        });
        // get parent lanes
        var lane_ids = $.map(sample_trs_to_change, function(sample_tr) {
            return $(sample_tr).attr('data-parent');
        });
        $.merge(lane_trs_to_change, lane_ids);
    });

    // update on lane level
    lane_trs_to_change = $.unique(lane_trs_to_change);
    $.each(lane_trs_to_change, function(i, lane_tr) {
        var lane_td = $(lane_tr).children('td.'+td_class);
        aggregateTdStatus(lane_td, 'no_recursion');
        checkSampleStatus(lane_td, 'no_recursion');
    });

    // get flowcells to update
    var fc_trs_to_change = $.map(lane_trs_to_change, function(lane_tr) {
        return $(lane_tr).attr('data-parent');
    });
    fc_trs_to_change = $.unique(fc_trs_to_change);

    // update on flowcell level
    $.each(fc_trs_to_change, function(i, fc_tr) {
        var fc_td = $(fc_tr).children('td.'+td_class);
        aggregateTdStatus(fc_td, 'no_recursion');
        checkSampleStatus(fc_td, 'no_recursion');
    });
});


$('.table-bioinfo-status-sampleview').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-bp', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    var td = $(this);
    var bp_class = $(td).attr('class').split(/\s+/)[1];

    var td_text = $(td).text().trim();   // '?'
    var td_class = bioinfo_qc_statuses[td_text];        // 'unknown'
    var next_text = bioinfo_qc_values[(bioinfo_qc_values.indexOf(td_text)+1) % bioinfo_qc_values.length]; // 'Pass'
    var next_class = bioinfo_qc_statuses[next_text];        // 'success'

    // find all flowcells and lanes for selected sample
    var sample_tr = topParent($(td).parent());
    var bp_trs = getAllChildTrs(sample_tr);
    var sample_td = $(sample_tr).children('td.'+bp_class);
    // update values
    $(sample_td).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_text);
    $(bp_trs).children('td.'+bp_class).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_text);
    // update status
    checkSampleStatus(sample_td);

});

// no_recursion is called in runview.bp-click, as all rows updated in a loop
function checkSampleStatus(td, no_recursion){
    // update status of current row
    // update status of all children
    // update status of parent(s)

    // qc values has already been updated;
    var next_value = $(td).text().trim();
    var span = $(td).closest('tr').find('td.bioinfo-status-runstate span');
    var sample_status = $(span).text().trim();
    var new_status = '';

    // check if delivered
    var delivered = $(td).parent().find('td.datadelivered').find('input:text').val().trim();
    if (delivered != '') {
        new_status = 'Delivered';
    } else {
        // qc_done when none of the qc boxes contain '?'
        var qc_done = $(td).parent().children('td.bioinfo-status-qc:contains("?")').length == 0;
        // same for bp
        var bp_done = $(td).parent().children('td.bioinfo-status-bp:contains("?")').length == 0;

        // qc_new when all the qc boxes contain '?'
        var qc_new = $(td).parent().children('td.bioinfo-status-qc:contains("?")').length == 
            $(td).parent().children('td.bioinfo-status-qc').length;
        // for bp length can be different depending on the application,
        // so compare the length of all boxes with length of boxes containing '?'
        var bp_new = $(td).parent().children('td.bioinfo-status-bp:contains("?")').length ==
            $(td).parent().children('td.bioinfo-status-bp').length;

        // failed if all qc boxes set to 'Fail'. Doesn't matter what is in BP
        var qc_failed = $(td).parent().children('td.bioinfo-status-qc:contains("Fail")').length == 
            $(td).parent().children('td.bioinfo-status-qc').length;

        if (qc_failed) {
            new_status = 'Failed';
        } else if (qc_new && bp_new) {
            new_status = 'New';
        } else if (qc_done && bp_done) {
            new_status = 'BP-done';
        } else if (qc_done && bp_new) {
            new_status = 'QC-done';
        } else if (qc_done && !bp_done) {
            new_status = 'BP-ongoing';
        } else {
            new_status = 'QC-ongoing';
        }
    }

    $(span).removeClass(sample_classes.join(' ')).addClass(sample_statuses[new_status]).text(new_status);
    // if we want to update ALL levels
    if (no_recursion == undefined) {
        // update child statuses
        var tr_class = $(td).parent().attr('class').split(/\s+/)[0];
        // exclude parent elements from selection
        // handling the case if the last element of it's class is clicked
        var parent_class = $(td).parent().attr('data-parent').split('-').splice(0, 2).join('-').replace('#', '');
        if ($(td).closest('table').hasClass('table-bioinfo-status-sampleview')) {
            if (parent_class != 'bioinfo-sample') {
                parent_class += ',.bioinfo-sample';
            }
        } else {
            if (parent_class != 'bioinfo-fc') {
                parent_class += ',.bioinfo-fc';
            }
        }
        var child_spans = $(td).parent().nextUntil('tr.' + tr_class, 'tr:not(.bioinfo-status-disabled,.'+parent_class+')').find('td.bioinfo-status-runstate span');
        $(child_spans).removeClass(sample_classes.join(' ')).addClass(sample_statuses[new_status]).text(new_status);

        // update parent status
        setParentSpanStatus(span);
    } // else - only update current level
};


$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-qc', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    var td = $(this);

    var td_text = $(td).text().trim();   // '?'
    var td_class = bioinfo_qc_statuses[td_text];        // 'unknown'
    var next_text = bioinfo_qc_values[(bioinfo_qc_values.indexOf(td_text)+1) % bioinfo_qc_values.length]; // 'Pass'
    var next_class = bioinfo_qc_statuses[next_text];        // 'success'

    $(td).removeClass(td_class);
    $(td).addClass(next_class);
    $(td).text(next_text);

    var child_trs = getAllChildTrs($(td).parent());
    var column = $(td).attr('class').split(/\s+/)[1];
    var child_tds = $(child_trs).children('td.'+column);
    if (child_tds.length != 0) {
        $(child_tds).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_text);
    }

    var table = $(td).closest('table');
    var view = $(table).attr('class').split(/\s+/)[2];
    if (view == 'table-bioinfo-status-runview') {
        var first_level_class = 'bioinfo-sample';
        var second_level_class = 'bioinfo-lane';
        var top_level_class = 'bioinfo-run';
    } else if (view == 'table-bioinfo-status-sampleview') {
        var first_level_class = 'bioinfo-sample';
        var second_level_class = 'bioinfo-run';
        var top_level_class = 'bioinfo-lane';
    }

    var tr = $(td).parent();
    if ($(tr).hasClass(first_level_class)) {
        setParentStatus(td);
        var td_class = $(td).attr('class').split(/\s+/)[1];
        var parent_td = $($(td).parent().attr('data-parent')).children('.'+td_class);
        setParentStatus(parent_td);
    } else if ($(tr).hasClass(second_level_class)) {
        setParentStatus(td);
    } else if ($(tr).hasClass(top_level_class)) {
        // do nothing;
    }
    checkSampleStatus(td);
});

// find parent of td and set it's status
function setParentStatus(td) {
    var td_class = $(td).attr('class').split(/\s+/)[1];
    var parent_td = $($(td).parent().attr('data-parent')).children('td.'+td_class);
    if (parent_td.length == 0) {
        return false;
    }
    if ($(parent_td).text().trim() == 'Pass' && $(td).text().trim() == 'Warning')  {
        $(parent_td).text('Warning');
        $(parent_td).removeClass('bg-success-table');
        $(parent_td).addClass('bg-warning-table')
    } else {
        aggregateTdStatus(parent_td);
    }
};

function getAllChildTrs(tr) {
    var table = $(tr).closest('table');
    var first_level_class = '';
    var second_level_class = '';
    var top_level_class = '';
    if ($(table).hasClass('table-bioinfo-status-runview')) {
        first_level_class = 'bioinfo-sample';
        second_level_class = 'bioinfo-lane';
        top_level_class = 'bioinfo-fc';
    } else if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        first_level_class = 'bioinfo-fc';
        second_level_class = 'bioinfo-lane';
        top_level_class = 'bioinfo-sample';
    }

    if ($(tr).hasClass(first_level_class)) {
        return [];
    } else if ($(tr).hasClass(second_level_class)) {
        var tr_id = $(tr).attr('id');
        return $('.table-bioinfo-status tr[data-parent="#'+tr_id+'"]:not(.bioinfo-status-disabled)');
    } else if ($(tr).hasClass(top_level_class)) {
        // find next tr of the same level and return everything between tr and next_tr
        children = $(tr).nextUntil('tr.'+top_level_class, 'tr:not(.bioinfo-status-disabled)'); // does not inlcude tr and next tr
        return children
    }
};

$(document).ready(function() {
    var sample_view = $('table.table-bioinfo-status-sampleview');
    var run_view = $('table.table-bioinfo-status-runview');
    loadTable(run_view);
    loadTable(sample_view);
});

// sets the values to 'pass' and so on to all the tree up,
// in the template we set only [sample, run, lane] level
function loadTable(view_table) {
    if ($(view_table).hasClass('table-bioinfo-status-sampleview')) {
        var second_level_class = '.bioinfo-fc';
        var top_level_class = '.bioinfo-sample';
    } else if ($(view_table).hasClass('table-bioinfo-status-runview')) {
        var second_level_class = '.bioinfo-lane';
        var top_level_class = '.bioinfo-fc';
    }
    var second_level_trs = $(view_table).find('tr'+second_level_class);
    $.each(second_level_trs, function(i, tr) {
        // if status is 'New', no need to aggregate
        var span_status = $(tr).find('.bioinfo-status-runstate span').text().trim();
        if (span_status == 'New' || span_status == 'ERROR') {
            // do nothing;
        } else {
            aggregateStatus(tr);
        }
    });
    var top_level_trs = $(view_table).find('tr'+top_level_class);
    $.each(top_level_trs, function(i, tr) {
        // if status is 'New', no need to aggregate
        var span_status = $(tr).find('.bioinfo-status-runstate span').text().trim()
        if (span_status == 'New') {
            // do nothing;
        } else {
            aggregateStatus(tr);
        }
    });
};

function aggregateStatus(tr) {
    // this one does not aggregate the rows if project is delivered (because it is .bioinfo-status-disabled)
    // var first_level_children = $(tr).closest('table').find("tr:not(.bioinfo-status-disabled)[data-parent='#"+$(tr).attr('id')+"']");

    // IMPORTANT!!!
    // this one does aggregate the delivered rows, but the behavior is not tested completely.
    // if the page is loading slow or something is breaking, use the previous line
    var first_level_children = $(tr).closest('table').find("tr[data-parent='#"+$(tr).attr('id')+"']");
    var children_statuses = {};
    // get a dict of statuses for each column
    $.each(first_level_children, function(i, child_tr){
        var qc_and_bp_tds = $(child_tr).children('td.bioinfo-status-qc, td.bioinfo-status-bp');
        $.each(qc_and_bp_tds, function(i, td) {
            var qc_class = $(td).attr('class').split(/\s+/)[1];
            if (qc_class in children_statuses) {
                if (children_statuses[qc_class].indexOf(qc_class) == -1) {
                    children_statuses[qc_class].push($(td).text().replace(/\s+/g, ''));
                }
            } else {
                children_statuses[qc_class] = [$(td).text().replace(/\s+/g, '')];
            }
        });
    });
    $.each(children_statuses, function(qc_class, list_of_qc_values) {
        var second_level_td = $(tr).children('td.' + qc_class);
        var td_class = "";
        var td_text = "";
        if (list_of_qc_values.length == 1) {
            td_text = list_of_qc_values[0];
        } else if (list_of_qc_values.indexOf('?') != -1) {
            td_text = '?';
        } else if (list_of_qc_values.indexOf('Warning') != -1) {
            td_text = 'Warning';
        } else if (list_of_qc_values.indexOf('Fail') != -1 && list_of_qc_values.indexOf('Pass') != -1) {
            td_text = 'Warning';
        } else if (list_of_qc_values.indexOf('Pass') != -1 ){
            td_text = 'Pass';
        } else if (list_of_qc_values.indexOf('N/A') != -1 ){
            td_text = 'N/A'
        } else if (list_of_qc_values.indexOf('Fail') != 1) {
            td_text = 'Fail';
        } else {
            // should not happen
        }
        $(second_level_td).text(td_text);
        var current_classes = $(second_level_td).attr('class').split(/\s+/);
        $(second_level_td).removeClass(bioinfo_qc_classes.join(' '));
        $(second_level_td).addClass(bioinfo_qc_statuses[td_text]);
    });
};

// no_recursion is called in runview.bp-click, as we check all rows in a loop
function aggregateTdStatus(td, no_recursion) {
    if (td == undefined || $(td).parent().hasClass('bioinfo-project')) {return false;}
    var parent_status = "";
    var td_class = $(td).attr('class').split(/\s+/)[1];
    var child_tds = getAllChildTrs($(td).parent()).children('td.'+td_class);

    var statuses = [];
    $.each(child_tds, function(i, td){
        var td_text = $(td).text().trim().replace(/\s/g, '');
        // add text if it's not yet in array
        if (statuses.indexOf(td_text) == -1) {
            statuses.push(td_text);
        }
    });
    // if 'N/A' in statuses -> ignore
    // if all statuses are 'N/A' -> 'N/A'
    if (statuses.length == 1 && statuses.indexOf('N/A') != -1) {
        parent_status = 'N/A'
    } else if (statuses.indexOf('N/A') != -1) {
        // remove 'N/A' from statuses
        statuses.splice(statuses.indexOf('N/A'),1);
    }
    if (statuses.length == 1) { // if all statuses were the same
        parent_status = statuses[0];
    } else if (statuses.indexOf('?') != -1) {
        parent_status = '?';
    } else if (statuses.indexOf('Warning') != -1 || statuses.indexOf('Fail') != -1) {
        parent_status = 'Warning';
    }

    $(td).text(parent_status);
    var current_class = $(td).attr('class').split(/\s+/)[2];
    var parent_class = bioinfo_qc_statuses[parent_status];
    $(td).removeClass(current_class);
    $(td).addClass(parent_class);

    // if no_recursion, we don't call it for parent
    if (no_recursion == undefined) {
        var parent_id = $(td).parent().attr('data-parent');
        // if td is not 'bioinfo-fc'
        if (parent_id.indexOf('bioinfo-project') == -1) {
            var td_index = $(td).parent().children().index($(td));
            var td_parent = $(parent_id).children()[td_index];
            aggregateTdStatus(td_parent);
        }
    }
};

  //////
  // SAVE CHANGES
  //////
$('#bioinfo-status-saveButton').click(function(e){
    e.preventDefault(); // reloads the page otherwise
    e.stopImmediatePropagation(); // fires twice otherwise.

    if($(this).is(':disabled')){
      alert('disabled!');
      return false;
    }

    // Build the JSON object
    var sample_run_lane_statuses = {};
    var table = $('.table-bioinfo-status:visible');
    var project_id = $(table).find('tr.bioinfo-project').attr('id').replace('bioinfo-project-', '');

    if ($(table).hasClass('table-bioinfo-status-runview')){
        lowest_level = 'bioinfo-sample';
    } else if ($(table).hasClass('table-bioinfo-status-sampleview')){
        var lowest_level = "bioinfo-lane";
    }

    var extract_sample_run_lane_id = function(tr_id) {
        // remove 'bioinfo-lane-' in the beginning
        tr_id = tr_id.replace(lowest_level+'-', '');
        var sample_run_lane = tr_id.split(/-/);
        // first one is sample
        var sample = sample_run_lane[0];
        // the last one is lane
        var lane = sample_run_lane[sample_run_lane.length-1];
        // everything what left in the middle is flowcell
        // because flowcell id can contain '-' as well
        var flowcell = tr_id.replace(sample+'-', '').replace('-'+lane,'');
        return [sample, flowcell, lane];
    };
    var extract_run_lane_sample_id = function(tr_id) {
        tr_id = tr_id.replace(lowest_level+'-', '');
        var sample_run_lane = tr_id.split(/-/);
        // sample is the last one
        var sample = sample_run_lane[sample_run_lane.length-1];
        // lane is the second from the end
        var lane = sample_run_lane[sample_run_lane.length-2];
        // flowcell is all the rest
        var flowcell = tr_id.replace('-'+lane, '').replace('-'+sample,'');
        return [sample, flowcell, lane];
    };
    var disabled_rows = [];
    var show_warning = false;
    // assuming, there is only one view is active (=one table is visible)
    $('.table-bioinfo-status:visible tr.'+lowest_level+':has(td)').each(function(){
        var tr = $(this);
        var tr_id = $(tr).attr('id');
        var sample_run_lane;
        if ($(table).hasClass('table-bioinfo-status-runview')) {
            sample_run_lane = extract_run_lane_sample_id(tr_id);
        } else {
            sample_run_lane = extract_sample_run_lane_id(tr_id);
        }
        var sample = sample_run_lane[0];
        var flowcell = sample_run_lane[1];
        var lane = sample_run_lane[2];

        var status = $(this).find('.bioinfo-status-runstate span').text().trim();
        var row = {'sample_status': status, 'qc': {}, 'bp': {}};
        // get qc values
        $(tr).children('td.bioinfo-status-qc').each(function(i, td) {
            var field_name = $(td).attr('class').split(/\s+/)[1];
            if (field_name != undefined) {
                row['qc'][field_name] = $(td).text().trim();
            } else {
                console.error('error: undefined field name');
                console.error($(td));
            }
        });
        // get pb values
        $(tr).children('td.bioinfo-status-bp').each(function(i, td) {
            var field_name = $(td).attr('class').split(/\s+/)[1];
            if (field_name != undefined) {
                row['bp'][field_name] = $(td).text().trim();
            } else {
                console.error('error: undefined field name');
                console.error($(td));
            }
        });
        var row_key = [project_id, sample, flowcell, lane];
        sample_run_lane_statuses[row_key] = row;
        sample_run_lane_statuses[row_key]['sample_status'] = status;

        // get data_delivered date
        var date_input = $(this).find('td.datadelivered input:text');
        var data_delivered = date_input.val();
        sample_run_lane_statuses[row_key]['datadelivered'] = data_delivered;
        if (data_delivered != '') {
            show_warning = true;
            disabled_rows.push(this);
        }
    });

    if (show_warning) {
        $('#bioinfo-confirm-dialog').modal('show');
        $('#bioinfo-confirm-save').click(function(e) {
            e.preventDefault();
            e.stopImmediatePropagation(); // fires twice otherwise.
            $('#bioinfo-status-saveButton').addClass('disabled').text('Saving..');
            var bioinfo_api_url = "/api/v1/bioinfo_analysis/"+project_id;
            $.ajax({
                type: 'POST',
                url: bioinfo_api_url,
                dataType: 'json',
                data: JSON.stringify(sample_run_lane_statuses),
                error: function(xhr, textStatus, errorThrown) {
                    alert('There was an error saving the bioinformatics statuses: '+errorThrown);
                    $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                    console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(JSON.stringify(sample_run_lane_statuses));
                },
                success: function(saved_data, textStatus, xhr) {
                    var status = 'Changes saved ';
                    if(saved_data['not_saved'].length>0){
                      status = 'Not all changes saved in bulk update! Doc ids that failed to update are shown below.'
                      var to_display = status
                      saved_data['not_saved'].forEach((item, i) => {
                        to_display += '<br>'+item
                      });

                      $('#save_error_display').html(to_display)
                    }
                    var success_msg = $('<span class="delivery-saved-status">'+status+'<span class="fa fa-check"></span></span>');
                    success_msg.prependTo('.bioinfo-savespan').delay(1500).fadeOut(1500, function(){ $(this).remove(); });
                    $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                    //$('#bioinfo-history-dump').text(JSON.stringify(saved_data, null, '  '));
                    $('table.table-bioinfo-status:visible').find("td.bioinfo-status-runstate span:contains('Delivered')").closest('tr').addClass('bioinfo-status-disabled');
                    $('tr.bioinfo-status-disabled td.datadelivered input:text').prop('disabled', true);
                    updateSecondTable(saved_data['saved_data']);
                }
            });
            $('#bioinfo-confirm-dialog').modal('hide');
        });
        $('#bioinfo-confirm-cancel').click(function(e) {
            $('#bioinfo-confirm-dialog').modal('hide');
        });
    } else {
        $('#bioinfo-status-saveButton').addClass('disabled').text('Saving..');
            var bioinfo_api_url = "/api/v1/bioinfo_analysis/"+project_id;
            $.ajax({
              type: 'POST',
              url: bioinfo_api_url,
              dataType: 'json',
              data: JSON.stringify(sample_run_lane_statuses),
              error: function(xhr, textStatus, errorThrown) {
                alert('There was an error saving the bioinformatics statuses: '+errorThrown);
                $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(JSON.stringify(sample_run_lane_statuses));
              },
              success: function(saved_data, textStatus, xhr) {
                var status = 'Changes saved ';
                if(saved_data['not_saved'].length>0){
                  status = 'Not all changes saved in bulk update! Doc ids that failed to update are shown below.'
                  var to_display = status
                  saved_data['not_saved'].forEach((item, i) => {
                    to_display += '<br>'+item
                  });

                  $('#save_error_display').html(to_display)
                }
                var success_msg = $('<span class="delivery-saved-status">'+status+'<span class="fa fa-check"></span></span>');
                success_msg.prependTo('.bioinfo-savespan').delay(1500).fadeOut(1500, function(){ $(this).remove(); });
                $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                //$('#bioinfo-history-dump').text(JSON.stringify(saved_data, null, '  '));
                $('table.table-bioinfo-status:visible').find("td.bioinfo-status-runstate span:contains('Delivered')").closest('tr').addClass('bioinfo-status-disabled')
                $('tr.bioinfo-status-disabled td.datadelivered input:text').prop('disabled', true);
                updateSecondTable(saved_data['saved_data']);
            }
        });
    }
});

function updateSecondTable(saved_data) {
    var table = $('table.table-bioinfo-status:hidden');
    if ($(table).hasClass('table-bioinfo-status-runview')) {
        var view = 'runview';
        var lowest_level = 'bioinfo-sample';
    } else if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        var view = 'sampleview';
        var lowest_level = 'bioinfo-lane';
    } else {
        // should not be a case
        // add code here in case we decided to add another view
    }
    function get_tr_id(run, lane, sample, view) {
        if (view == 'runview') {
            var lowest_level = 'bioinfo-sample';
            return lowest_level + '-' + run + '-' + lane + '-' + sample;
        } else if (view == 'sampleview') {
            var lowest_level = 'bioinfo-lane';
            return lowest_level + '-' + sample + '-' + run + '-' + lane;
        }
    };
    $.each(saved_data, function(i, row) {
        i = i.split(',');
        var project = i[0];
        var sample = i[1];
        var run = i[2];
        var lane = i[3];
        var tr_id = get_tr_id(run, lane, sample, view);
        var tr = $('#'+tr_id);
        var qc_boxes = $.extend(row['qc'], row['bp']);
        $.each(qc_boxes, function(qc_name, qc_value) {
            // wtf it doesn't exclude length property??
            if (qc_name != 'length') {
                var td = $(tr).children('td.'+qc_name).first();
                $(td).text(qc_value);
                var td_class = $(td).attr('class').split(/\s/)[2];
                $(td).removeClass(td_class);
                $(td).addClass(bioinfo_qc_statuses[qc_value]);
            }
        });
        if (row['datadelivered'] != '') {
            var date_td = $(tr).find('td.datadelivered');
            var date_input =  $(date_td).find('input:text');
            $(date_input).val(row['datadelivered']);
            $(date_input).prop('disabled', true);
            $(tr).addClass('bioinfo-status-disabled');
            disableParentDate(date_td);
        }
    });
    loadTable(table);
}

var sample_statuses = {
    'Demultiplexing': 'bg-secondary',
    'Transferring': 'bg-secondary',
    'Sequencing': 'bg-secondary',
    'New': 'bg-primary',
    'QC-ongoing': 'bg-warning',
    'QC-done': 'bg-success',
    'BP-ongoing': 'bg-warning',
    'BP-done': 'bg-success',
    'Failed': 'bg-danger',
    'Delivered': 'bg-success',
    };
var sample_classes = ['bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-primary', 'bg-warning', 'bg-success', 'bg-warning', 'bg-success', 'bg-danger', 'bg-sucess'];
var sample_values = ['Demultiplexing', 'Transferring', 'Sequencing', 'New', 'QC-ongoing', 'QC-done', 'BP-ongoing', 'BP-done', 'Failed', 'Delivered'];

// this one shouldn't be done like that
function setParentSpanStatus(span) {
    if (span == undefined) {
        return false;
    }
    var tr = $(span).parent().parent();
    var parent_tr = $($(tr).attr('data-parent'));
    if ($(parent_tr).hasClass('bioinfo-project')) {
        return false;
    }
    var sibling_trs = $(".table-bioinfo-status:visible tr[data-parent='#"+parent_tr.attr('id')+"']");
    var statuses = [];
    $.each(sibling_trs, function(index, sibling_tr) {
        var span = $(sibling_tr).find('td.bioinfo-status-runstate span.badge');
        if (statuses.indexOf($(span).text().trim()) == -1) {
            statuses.push($(span).text().trim());
        }
    });
    var parent_status = "";
    if (statuses.length == 1) {
        parent_status = statuses[0];
    } else if (statuses.indexOf('Sequencing') != -1) {
        parent_status = 'Sequencing';
    } else if (statuses.indexOf('Demultiplexing') != -1) {
        parent_status = 'Demultiplexing';
    } else if (statuses.indexOf('Transferring') != -1) {
        parent_status = 'Transferring';
    } else if (statuses.indexOf('New') != -1) {
        parent_status = 'New';
    } else if (statuses.indexOf('Failed') != -1) {
        parent_status = 'Failed';
    } else if (statuses.indexOf('QC-ongoing') != -1) {
        parent_status = 'QC-ongoing';
    } else if (statuses.indexOf('QC-done') != -1) {
        parent_status = 'QC-done';
    } else if (statuses.indexOf('BP-ongoing') != -1) {
        parent_status = 'BP-ongoing';
    } else if (statuses.indexOf('BP-done') != -1) {
        parent_status = 'BP-done';
    } else if (statuses.indexOf('Delivered') != -1) {
        parent_status = 'Delivered';
    }

    var parent_span = $(parent_tr).find('td.bioinfo-status-runstate span.badge');
    var span_status = $(parent_span).text().trim();
    $(parent_span).text(parent_status);
    $(parent_span).removeClass(sample_statuses[span_status]);
    $(parent_span).addClass(sample_statuses[parent_status]);
    setParentSpanStatus(parent_span);
};

$('select#bioinfo-view').on( "change", function(e) {
    var selected_view = $(this).val();
    if (selected_view == 'run-view') {
        $('table.table-bioinfo-status-runview').show();
        $('table.table-bioinfo-status-sampleview').hide();
    } else if (selected_view == 'sample-view') {
        $('table.table-bioinfo-status-runview').hide();
        $('table.table-bioinfo-status-sampleview').show();
    }
});

// update date on all levels, when it changed
$('td.datadelivered').on('change', 'input:text', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // this doesn't help, it still fires a few times
    var td = $(this).closest('td.datadelivered');
    var delivery_date = $(this).val();

    var child_trs = getAllChildTrs($(td).parent());
    if (child_trs.length != 0) {
        $(child_trs).children('td.datadelivered').find('input:text').val(delivery_date);
    }
    setParentDate(td);

    // update status
    checkSampleStatus(td);
});

function setParentDate(td) {
    var parent_tr = $($(td).parent().attr('data-parent'));
    if (td == undefined || $(parent_tr).hasClass('bioinfo-project')) {return false;}
    var parent_td = $(parent_tr).find('td.datadelivered');
    var delivery_date = $(td).find('input:text').val();
    var sibling_trs = getAllChildTrs(parent_tr);
    // if parent has only one child
    if (sibling_trs.length <= 1) {
        $(parent_td).find('input:text').val(delivery_date);
    } else {
        // set on top the earliest date
        $.each(sibling_trs, function(i, sibling_tr){
            var date_input = $(sibling_tr).find('td.datadelivered input:text');
            if ($(date_input).val() < delivery_date) {
                delivery_date = $(date_input).val();
            }
        });
        $(parent_td).find('input:text').val(delivery_date);
    }
    setParentDate(parent_td);
};

function disableParentDate(td) {
    var parent_tr = $($(td).parent().attr('data-parent'));
    if (td == undefined || $(parent_tr).hasClass('bioinfo-project')) {return false;}
    var parent_td = $(parent_tr).find('td.datadelivered');
    if (parent_td == undefined) {
        return false;
    }
    var delivery_date = $(td).find('input:text').val();
    var sibling_trs = getAllChildTrs(parent_tr);
    // if parent has only one child
    if (sibling_trs.length <= 1) {
        $(parent_td).parent().addClass('bioinfo-status-disabled');
        $(parent_td).find('input:text').prop('disabled', true);
    } else {
        // disable if all the others are also disabled
        all_disabled = true;
        $.each(sibling_trs, function(i, tr){
            if (!$(tr).hasClass('bioinfo-status-disabled')){
                all_disabled = false;
                return false; // break
            }
        });
        if (all_disabled) {
            $(parent_td).parent().addClass('bioinfo-status-disabled');
            $(parent_td).find('input:text').prop('disabled', true);
        }
    }
    disableParentDate(parent_td);
};

// show edit history
$('#bioinfo-show-history-button').on('click', function(e){
    $('#bioinfo-show-history').modal();
});

$('button.btn-reset-history-timestamp').on('click', function(e){
    var table = $(this).closest('div.accordion-item').find('table');
    // headers - to extract fc-lane-sample id
    var spans = $(table).find('tr.history-header th span');
    // update the view
    $.each(spans, function(i, span){
        // get fc-lane-sample_id from the table header
        var sample = $(span).text().trim();
        // from header until next header, only .history-qc (skipping user and status)
        var trs = $(span).closest('tr.history-header').nextUntil('tr.history-header', 'tr.history-qc');
        // extract values for each run-lane-sample
        $.each(trs, function(i, tr){
            var qc_key = $(tr).find('td.qc_key').text().trim();
            var qc_value = $(tr).find('td.qc_value').text().trim();
            // update qc boxes in the main table
            var qc_box = $('#bioinfo-sample-' + sample + ' td.'+qc_key);
            $(qc_box).text(qc_value);
            $(qc_box).removeClass(bioinfo_qc_classes.join(' '));
            $(qc_box).addClass(bioinfo_qc_statuses[qc_value]);
        });
        // update sample_status value as well
        var status_tr = $(span).closest('tr.history-header').nextUntil('tr.history-header', 'tr.history-status')[0];
        var sample_status = $(status_tr).find('td.qc_value').text().trim();
        var sample_tr = $('#bioinfo-sample-' + sample);
        var sample_span = $(sample_tr).find('td.bioinfo-status-runstate span')
        var current_sample_status = $(sample_span).text().trim();
        $(sample_span).text(sample_status);
        $(sample_span).removeClass(sample_classes.join(' '));
        $(sample_span).addClass(sample_statuses[sample_status]);

        // remove delivery date
        var date_tr = $(span).closest('tr.history-header').nextUntil('tr.history-header', 'tr.history-datadelivered')[0];
        var data_delivered = $(date_tr).find('td.qc_value').text().trim();
        var date_input = $('#bioinfo-sample-' + sample).find('td.datadelivered').find('input:text');
        $(date_input).val(data_delivered);
        if (data_delivered == '') {
            $('tr#bioinfo-sample-' + sample).prop('disabled', false);
            $('tr#bioinfo-sample-' + sample).removeClass('bioinfo-status-disabled');
        }
    });
    var view = $('table.table-bioinfo-status:visible');
    loadTable(view); // todo: no need to load the whole table
    $('#bioinfo-status-saveButton').prop('disabled', false);
});

$('button.btn-reset-history-sample').on('click', function(e){
    var header = $(this).closest('table tr.history-header');
    var sample_status = $(this).closest('table').find('tr.history-status td.qc_value').first().text().trim();

    var run_lane_sample = $(header).find('th span').text();
    var table = $('table.table-bioinfo-status:visible');

    // check the view, and get tr_id
    var tr_id = '#bioinfo-sample-'+run_lane_sample;
    if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        var sample_id = run_lane_sample.split('-');
        var sample = sample_id[sample_id.length-1];
        var lane = sample_id[sample_id.length-2];
        var run = run_lane_sample.replace('-'+sample, '').replace('-'+lane, '');
        var sample_run_lane = [sample, run, lane].join('-');
        tr_id = tr_id = '#bioinfo-lane-' + sample_run_lane;
    }

    // reset all values to '?' -> in Status DB we store only the changed values. All the rest are assumed to be default
    var qc_boxes = $(tr_id).find('td.bioinfo-status-qc');
    var bp_boxes = $(tr_id).find('td.bioinfo-status-bp');
    $(qc_boxes).removeClass(bioinfo_qc_classes.join(' ')).addClass(bioinfo_qc_statuses['?']).text('?');
    $(bp_boxes).removeClass(bioinfo_qc_classes.join(' ')).addClass(bioinfo_qc_statuses['?']).text('?');

    $.each(qc_boxes, function(i, qc_box){
        setParentStatus(qc_box);
    });
    $.each(bp_boxes, function(i, bp_box) {
        setParentStatus(bp_box);
    });

    // set values from the table
    if (sample_status != 'New') {
        var trs = $(header).nextUntil('tr.history-header', 'tr.history-qc');
        $.each(trs, function(i, tr){
            var qc_key = $(tr).find('td.qc_key').text().trim();
            var qc_value = $(tr).find('td.qc_value').text().trim();
            var qc_box = $(tr_id).find('td.'+qc_key);
            $(qc_box).text(qc_value);
            $(qc_box).removeClass(bioinfo_qc_classes.join(' '));
            $(qc_box).addClass(bioinfo_qc_statuses[qc_value]);
            setParentStatus(qc_box);
        });
    }
    // update sample status
    var span = $(tr_id).find('td.bioinfo-status-runstate span');
    $(span).removeClass(sample_classes.join(' ')).text(sample_status).addClass(sample_statuses[sample_status]);
    setParentSpanStatus(span);
});
