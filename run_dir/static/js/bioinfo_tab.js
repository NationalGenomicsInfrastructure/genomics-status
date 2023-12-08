
const bioinfo_qc_statuses = {'?': 'unknown', 'Pass': 'bg-success-table', 'Warning': 'bg-warning-table', 'Fail': 'bg-danger-table', 'N/A': 'active'};
const bioinfo_qc_classes = ['unknown', 'bg-success-table', 'bg-warning-table', 'bg-danger-table', 'active'];
const bioinfo_qc_values = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];

const sample_statuses = {
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

const sample_classes = ['bg-secondary', 'bg-secondary', 'bg-secondary', 'bg-primary', 'bg-warning', 'bg-success', 'bg-warning', 'bg-success', 'bg-danger', 'bg-primary', 'bg-danger'];
const sample_values = ['Demultiplexing', 'Transferring', 'Sequencing', 'New', 'QC-ongoing', 'QC-done', 'BP-ongoing', 'BP-done', 'Failed', 'Delivered', 'ERROR'];

// Datepickers
$('.table-bioinfo-status').on('focus', '.input-group.date input', function (e) {
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
    const td = $(this).closest('td');
    checkSampleStatus(td);
});

$('.table-bioinfo-status').on('click', '.datepicker-today', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    const isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if (!isdisabled) {
        const today = formatDateTime(new Date(), false);
        const input = $(this).prevAll("input:first");
        // if undefined, means we are in the header
        if ($(input).val() !== undefined) {
            $(input).val(today);
        }
    }
    // set values to upper and lower levels
    const dateTd = $(this).closest('td.datadelivered');
    // if no dateTd, we are in the header -> set all rows
    if (date_td.length === 0) {
        // set all
        const all_tds = $(this).closest('table.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.datadelivered');
        if (all_tds.length !== 0) {
            $(all_tds).find('input:first').val(today);
        }
        // update status for all rows:
        const all_rows = $(this).closest('.table-bioinfo-status').find('td.datadelivered');
        $.each(all_rows, function (i, td) {
            checkSampleStatus(td, 'no_recursion');
        });
    } else { // not in header
        const child_tds = getAllChildTrs($(date_td).parent());
        if (child_tds.length !== 0) {
            $(child_tds).children('td.datadelivered').find('input:text').val(today);
        }
        setParentDate(date_td);
        // update status
        checkSampleStatus(date_td);
    }
});

$('.table-bioinfo-status').on('click', '.date-reset', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    const isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if (!isdisabled) {
        const today = formatDateTime(new Date(), false);
        const input = $(this).prevAll("input:first");
        // if undefined, means we are in the header
        if ($(input).val() !== undefined) {
            $(input).val("");
        }
    }
    // set values to upper and lower levels
    const date_td = $(this).closest('td.datadelivered');
    // if no dateTd, we are in the header -> set all rows
    if (date_td.length === 0) {
        // set all
        const all_tds = $(this).closest('table.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.datadelivered');
        $(all_tds).find('input:first').val('');
        $.each(all_tds, function (i, td) {
            checkSampleStatus(td, 'no_recursion');
        });
    } else { // not in header
        const child_trs = getAllChildTrs($(date_td).parent());
        if (child_trs.length !== 0) {
            $(child_trs).children('td.datadelivered').find('input:text').val("");
        }
        setParentDate(date_td);
        // update status
        checkSampleStatus(date_td);
    }
});

// expand or collapse table
$('.bioinfo-expand').click(function (e) {
    // this = a[href=#$(tr).attr('id')];
    e.preventDefault();
    e.stopImmediatePropagation();
    const tr = $(this).closest('tr');
    if ($(tr).hasClass('bioinfo-project')) {
        collapseAll(this);
        return false;
    }
    if ($(this).hasClass('expanded')) {
        collapse(tr);
    } else {
        expand(tr);
    }
});

const collapse = element => {
    // element is tr
    const element_id = $(element).attr('id');
    const expanded = $(element).find(`a[href="#${element_id}"]`);
    $(expanded).removeClass('expanded');
    const span = $(element).find('td.bioinfo-status-expand span.fa');
    if ($(span).hasClass('fa-chevron-down')) {
        $(span).removeClass('fa-chevron-down');
        $(span).addClass('fa-chevron-right');
    }

    const tr = $(element);
    const tr_class = $(tr).attr('class').split(' ')[0].trim(); //e.g. bioinfo-fc

    // excluding parent elements from selection
    let parent_class = $(tr).attr('data-parent').split('-').splice(0, 2).join('-').replace('#', '');
    if ($(tr).closest('table').hasClass('table-bioinfo-status-sampleview')) {
        if (parent_class != 'bioinfo-sample') {
            parent_class += ',.bioinfo-sample';
        }
    } else {
        if (parent_class != 'bioinfo-fc') {
            parent_class += ',.bioinfo-fc';
        }
    }
    const children = $(element).nextUntil(`tr.${tr_class}`, `tr:not(.${parent_class})`); // does not include tr and next tr
    $(children).hide().children('td.bioinfo-status-expand span.fa').removeClass('fa-chevron-down fa-chevron-right').addClass('fa-chevron-right');
};

const expand = element => {
    const a = $(element).find('.bioinfo-expand');
    $(a).addClass('expanded');
    const tr_id = $(element).attr('id');
    $('tr[data-parent="#' + tr_id + '"]').show();
    const span = $(element).find('td.bioinfo-status-expand span.fa');
    if ($(span).hasClass('fa-chevron-right')) {
        $(span).removeClass('fa-chevron-right');
        $(span).addClass('fa-chevron-down');
    }
};

const collapseAll = a => {
    const current_tr = $(a).parent().parent();
    let top_level_class = "";
    let second_level_class = "";
    const table = $(a).closest('table.table-bioinfo-status');
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
        const trs = $(table).find(`tr.${top_level_class}`);
        $.each(trs, (index, tr) => {
            if ($(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                collapse(tr);
            }
        });

        $(a).removeClass('expanded');
        $(a).find('span.fa').removeClass('fa-chevron-down');
        $(a).find('span.fa').addClass('fa-chevron-right');
    } else { // expand - not recursively
        const trs = $.merge($(table).find(`tr.${top_level_class}`), $(table).find(`tr.${second_level_class}`));
        $.each(trs, (index, tr) => {
            if (!$(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                expand(tr);
            }
        });

        $(a).addClass('expanded');
        $(a).find('span.fa').removeClass('fa-chevron-right');
        $(a).find('span.fa').addClass('fa-chevron-down');
    }
};

$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-row', function(e) {
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    const td = $(this);

    const tr = $(this).parent();
    const row_status = $(td).attr('class').split(/\s+/)[1]; // '?'
    const next_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(row_status) + 1) % bioinfo_qc_values.length]; // 'Pass'
    const next_class = bioinfo_qc_statuses[next_status]; // 'success'

    // set row
    const row = $(tr).children('td.bioinfo-status-qc');
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
    // to handle the case if the last element of its level is clicked
    let parent_class = $(tr).attr('data-parent').split('-').splice(0, 2).join('-').replace('#', '');
    if ($(td).closest('table').hasClass('table-bioinfo-status-sampleview')) {
        parent_class = parent_class !== 'bioinfo-sample' ? `${parent_class},.bioinfo-sample` : parent_class;
    } else {
        parent_class = parent_class !== 'bioinfo-fc' ? `${parent_class},.bioinfo-fc` : parent_class;
    }
    const tr_class = $(tr).attr('class').split(/\s+/)[0];
    // set row
    const children_rows = $(tr).nextUntil('tr.' + tr_class, `tr:not(.bioinfo-status-disabled,.${parent_class})`).children('td.bioinfo-status-qc');
    $(children_rows).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_status);

    // update row class
    const child_row_tds = $(tr).nextUntil('tr.' + tr_class, `tr:not(.bioinfo-status-disabled,.${parent_class})`).children('td.bioinfo-status-row');
    $(child_row_tds).removeClass(bioinfo_qc_values.join(' ')).addClass(next_status);
    // update status of children rows:
    $.each(child_row_tds, function(i, td) {
        checkSampleStatus(td);
    });
});

$('.table-bioinfo-status').on('click', 'th.bioinfo-status-th', function(e) {
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    // get last clicked value
    const th = $(this);
    let th_status = $(th).attr('class').split(/\s+/)[3];
    if (th_status === undefined) {
        th_status = '?';
    }
    const th_class = bioinfo_qc_statuses[th_status];

    // get next status
    const new_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(th_status) + 1) % bioinfo_qc_values.length];
    const new_class = bioinfo_qc_statuses[new_status];

    // get tds with the same column name
    const column_name = $(th).attr('class').split(/\s+/)[2];
    const tds = $(th).closest('.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.' + column_name);

    $(tds).removeClass(bioinfo_qc_classes.join(' ')).addClass(new_class).text(new_status);
    $(th).removeClass(th_status).addClass(new_status);

    // update sample status
    const top_level_class = $(this).closest('table').hasClass('bioinfo-status-runview') ? 'bioinfo-fc' : 'bioinfo-sample';

    // get only top flowcells (for runview) or samples (for sampleview) -> then checkSampleStatus works faster
    tds = $(this).closest('table.table-bioinfo-status-runview:visible').find(`tr.${top_level_class} td.${column_name}`);
    // merge results from both views, one of them will be empty
    $.merge(tds, $(this).closest('table.table-bioinfo-status-sampleview:visible').find(`tr.${top_level_class} td.${column_name}`));

    $.each(tds, function(i, td){
        checkSampleStatus(td);
    });
});

const topParent = (tr) => {
    const parent_id = $(tr).attr('data-parent');
    const parent_tr = $(parent_id);

    if ($(parent_tr).hasClass('bioinfo-project')) {
        return tr;
    } else {
        return topParent(parent_tr);
    }
};

$('.table-bioinfo-status-runview').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-bp', (e) => {
    // whatever it means
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    const td = $(this);
    const td_class = $(td).attr('class').split(/\s+/)[1];

    const qc_value = $(td).text().trim(); // '?'
    const qc_class = bioinfo_qc_statuses[qc_value]; // 'unknown'
    const next_value = bioinfo_qc_values[(bioinfo_qc_values.indexOf(qc_value) + 1) % bioinfo_qc_values.length]; // 'Pass'
    const next_class = bioinfo_qc_statuses[next_value]; // 'success'

    let child_trs = [];
    if ($(td).parent().hasClass('bioinfo-sample')) {
        child_trs = $(td).parent();
    } else {
        child_trs = getAllChildTrs($(td).parent());
    }

    const sample_ids = $.map($(child_trs).filter('tr.bioinfo-sample'), (child_tr) => {
        return $(child_tr).children('td').children('samp').text().trim();
    });

    // update on sample level and get lane_ids to update
    const lane_trs_to_change = [];
    $.each(sample_ids, (i, sample_id) => {
        const sample_trs_to_change = $('.table-bioinfo-status-runview').find('tr.bioinfo-sample td:contains(' + sample_id + ')').parent();
        const tds_to_change = $(sample_trs_to_change).find('td.' + td_class);
        $(tds_to_change).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_value);
        $.each(tds_to_change, (i, td_to_change) => {
            checkSampleStatus(td_to_change, 'no_recursion');
        });
        // get parent lanes
        const lane_ids = $.map(sample_trs_to_change, (sample_tr) => {
            return $(sample_tr).attr('data-parent');
        });
        $.merge(lane_trs_to_change, lane_ids);
    });

    // update on lane level
    lane_trs_to_change = [...new Set(lane_trs_to_change)];
    $.each(lane_trs_to_change, (i, lane_tr) => {
        const lane_td = $(lane_tr).children('td.' + td_class);
        aggregateTdStatus(lane_td, 'no_recursion');
        checkSampleStatus(lane_td, 'no_recursion');
    });

    // get flowcells to update
    const fc_trs_to_change = $.map(lane_trs_to_change, (lane_tr) => {
        return $(lane_tr).attr('data-parent');
    });
    fc_trs_to_change = [...new Set(fc_trs_to_change)];

    // update on flowcell level
    $.each(fc_trs_to_change, (i, fc_tr) => {
        const fc_td = $(fc_tr).children('td.' + td_class);
        aggregateTdStatus(fc_td, 'no_recursion');
        checkSampleStatus(fc_td, 'no_recursion');
    });
});

$('.table-bioinfo-status-sampleview').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-bp', (e) => {
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    const td = $(this);
    const bp_class = $(td).attr('class').split(/\s+/)[1];

    const td_text = $(td).text().trim(); // '?'
    const td_class = bioinfo_qc_statuses[td_text]; // 'unknown'
    const next_text = bioinfo_qc_values[(bioinfo_qc_values.indexOf(td_text) + 1) % bioinfo_qc_values.length]; // 'Pass'
    const next_class = bioinfo_qc_statuses[next_text]; // 'success'

    // Find all flowcells and lanes for the selected sample
    const sample_tr = topParent($(td).parent());
    const bp_trs = getAllChildTrs(sample_tr);
    const sample_td = $(sample_tr).children('td.' + bp_class);

    // update values
    $(sample_td).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_text);
    $(bp_trs).children('td.' + bp_class).removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_text);

    // update status
    checkSampleStatus(sample_td);
});

// no_recursion is called in runview.bp-click, as all rows updated in a loop
function checkSampleStatus(td, no_recursion) {
    // update status of the current row
    // update status of all children
    // update status of parent(s)

    // qc values have already been updated;
    const next_value = $(td).text().trim();
    const span = $(td).closest('tr').find('td.bioinfo-status-runstate span');
    const sample_status = $(span).text().trim();
    let new_status = '';

    // check if delivered
    const delivered = $(td).parent().find('td.datadelivered').find('input:text').val().trim();
    if (delivered !== '') {
        new_status = 'Delivered';
    } else {
        // qc_done when none of the qc boxes contain '?'
        const qc_done = $(td).parent().children('td.bioinfo-status-qc:contains("?")').length === 0;
        // same for bp
        const bp_done = $(td).parent().children('td.bioinfo-status-bp:contains("?")').length === 0;

        // qc_new when all the qc boxes contain '?'
        const qc_new = $(td).parent().children('td.bioinfo-status-qc:contains("?")').length ===
            $(td).parent().children('td.bioinfo-status-qc').length;
        // for bp, the length can be different depending on the application,
        // so compare the length of all boxes with the length of boxes containing '?'
        const bp_new = $(td).parent().children('td.bioinfo-status-bp:contains("?")').length ===
            $(td).parent().children('td.bioinfo-status-bp').length;

        // failed if all qc boxes set to 'Fail'. Doesn't matter what is in BP
        const qc_failed = $(td).parent().children('td.bioinfo-status-qc:contains("Fail")').length ===
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
    if (no_recursion === undefined) {
        // update child statuses
        const tr_class = $(td).parent().attr('class').split(/\s+/)[0];
        // exclude parent elements from selection
        // handling the case if the last element of it's class is clicked
        let parent_class = $(td).parent().attr('data-parent').split('-').splice(0, 2).join('-').replace('#', '');
        if ($(td).closest('table').hasClass('table-bioinfo-status-sampleview')) {
            if (parent_class !== 'bioinfo-sample') {
                parent_class += ',.bioinfo-sample';
            }
        } else {
            if (parent_class !== 'bioinfo-fc') {
                parent_class += ',.bioinfo-fc';
            }
        }
        const child_spans = $(td).parent().nextUntil('tr.' + tr_class, 'tr:not(.bioinfo-status-disabled,.'+parent_class+')').find('td.bioinfo-status-runstate span');
        $(child_spans).removeClass(sample_classes.join(' ')).addClass(sample_statuses[new_status]).text(new_status);

        // update parent status
        setParentSpanStatus(span);
    } // else - only update the current level
};

$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-qc', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    const td = $(this);

    const td_text = td.text().trim(); // '?'
    const td_class = bioinfo_qc_statuses[td_text]; // 'unknown'
    const next_text = bioinfo_qc_values[(bioinfo_qc_values.indexOf(td_text) + 1) % bioinfo_qc_values.length]; // 'Pass'
    const next_class = bioinfo_qc_statuses[next_text]; // 'success'

    td.removeClass(td_class);
    td.addClass(next_class);
    td.text(next_text);

    const child_trs = getAllChildTrs(td.parent());
    const column = td.attr('class').split(/\s+/)[1];
    const child_tds = child_trs.children(`td.${column}`);
    if (child_tds.length !== 0) {
        child_tds.removeClass(bioinfo_qc_classes.join(' ')).addClass(next_class).text(next_text);
    }

    const table = td.closest('table');
    const view = table.attr('class').split(/\s+/)[2];
    let first_level_class, second_level_class, top_level_class;

    if (view === 'table-bioinfo-status-runview') {
        first_level_class = 'bioinfo-sample';
        second_level_class = 'bioinfo-lane';
        top_level_class = 'bioinfo-run';
    } else if (view === 'table-bioinfo-status-sampleview') {
        first_level_class = 'bioinfo-sample';
        second_level_class = 'bioinfo-run';
        top_level_class = 'bioinfo-lane';
    }

    const tr = td.parent();
    if (tr.hasClass(first_level_class)) {
        setParentStatus(td);
        const td_class = td.attr('class').split(/\s+/)[1];
        const parent_td = $(tr.attr('data-parent')).children(`.${td_class}`);
        setParentStatus(parent_td);
    } else if (tr.hasClass(second_level_class)) {
        setParentStatus(td);
    } else if (tr.hasClass(top_level_class)) {
        // do nothing;
    }
    checkSampleStatus(td);
});

// Find parent of td and set its status
const setParentStatus = (td) => {
    const td_class = $(td).attr('class').split(/\s+/)[1];
    const parent_td = $($(td).parent().attr('data-parent')).children(`td.${td_class}`);

    if (parent_td.length === 0) {
        return false;
    }

    if ($(parent_td).text().trim() === 'Pass' && $(td).text().trim() === 'Warning') {
        $(parent_td).text('Warning');
        $(parent_td).removeClass('bg-success-table');
        $(parent_td).addClass('bg-warning-table');
    } else {
        aggregateTdStatus(parent_td);
    }
};

const getAllChildTrs = (tr) => {
    const table = $(tr).closest('table');
    let first_level_class = '';
    let second_level_class = '';
    let top_level_class = '';

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
        const tr_id = $(tr).attr('id');
        return $('.table-bioinfo-status tr[data-parent="#' + tr_id + '"]:not(.bioinfo-status-disabled)');
    } else if ($(tr).hasClass(top_level_class)) {
        // find the next tr of the same level and return everything between tr and next_tr
        const children = $(tr).nextUntil('tr.' + top_level_class, 'tr:not(.bioinfo-status-disabled)');
        return children;
    }
};

$(document).ready(() => {
    const sample_view = $('table.table-bioinfo-status-sampleview');
    const run_view = $('table.table-bioinfo-status-runview');
    loadTable(run_view);
    loadTable(sample_view);
});

function loadTable(view_table) {
    let second_level_class, top_level_class;

    if ($(view_table).hasClass('table-bioinfo-status-sampleview')) {
        second_level_class = '.bioinfo-fc';
        top_level_class = '.bioinfo-sample';
    } else if ($(view_table).hasClass('table-bioinfo-status-runview')) {
        second_level_class = '.bioinfo-lane';
        top_level_class = '.bioinfo-fc';
    }

    const second_level_trs = $(view_table).find('tr' + second_level_class);
    second_level_trs.each((i, tr) => {
        // if status is 'New', no need to aggregate
        const span_status = $(tr).find('.bioinfo-status-runstate span').text().trim();
        if (span_status === 'New' || span_status === 'ERROR') {
            // do nothing;
        } else {
            aggregateStatus(tr);
        }
    });

    const top_level_trs = $(view_table).find('tr' + top_level_class);
    top_level_trs.each((i, tr) => {
        // if status is 'New', no need to aggregate
        const span_status = $(tr).find('.bioinfo-status-runstate span').text().trim();
        if (span_status === 'New') {
            // do nothing;
        } else {
            aggregateStatus(tr);
        }
    });
};

function aggregateStatus(tr) {
    // this one does not aggregate the rows if the project is delivered (because it is .bioinfo-status-disabled)
    // var first_level_children = $(tr).closest('table').find("tr:not(.bioinfo-status-disabled)[data-parent='#" + $(tr).attr('id') + "']");

    // IMPORTANT!!!
    // this one does aggregate the delivered rows, but the behavior is not tested completely.
    // if the page is loading slow or something is breaking, use the previous line
    const first_level_children = $(tr).closest('table').find("tr[data-parent='#" + $(tr).attr('id') + "']");
    const children_statuses = {};

    // get a dict of statuses for each column
    first_level_children.each((i, child_tr) => {
        const qc_and_bp_tds = $(child_tr).children('td.bioinfo-status-qc, td.bioinfo-status-bp');

        qc_and_bp_tds.each((i, td) => {
            const qc_class = $(td).attr('class').split(/\s+/)[1];

            if (qc_class in children_statuses) {
                if (children_statuses[qc_class].indexOf(qc_class) === -1) {
                    children_statuses[qc_class].push($(td).text().replace(/\s+/g, ''));
                }
            } else {
                children_statuses[qc_class] = [$(td).text().replace(/\s+/g, '')];
            }
        });
    });

    Object.keys(children_statuses).forEach(qc_class => {
        const second_level_td = $(tr).children('td.' + qc_class);
        let td_text = '';

        if (children_statuses[qc_class].length === 1) {
            td_text = children_statuses[qc_class][0];
        } else if (children_statuses[qc_class].indexOf('?') !== -1) {
            td_text = '?';
        } else if (children_statuses[qc_class].indexOf('Warning') !== -1) {
            td_text = 'Warning';
        } else if (children_statuses[qc_class].indexOf('Fail') !== -1 && children_statuses[qc_class].indexOf('Pass') !== -1) {
            td_text = 'Warning';
        } else if (children_statuses[qc_class].indexOf('Pass') !== -1) {
            td_text = 'Pass';
        } else if (children_statuses[qc_class].indexOf('N/A') !== -1) {
            td_text = 'N/A';
        } else if (children_statuses[qc_class].indexOf('Fail') !== 1) {
            td_text = 'Fail';
        } else {
            // should not happen
        }

        $(second_level_td).text(td_text);
        const current_classes = $(second_level_td).attr('class').split(/\s+/);
        $(second_level_td).removeClass(bioinfo_qc_classes.join(' '));
        $(second_level_td).addClass(bioinfo_qc_statuses[td_text]);
    });
}

// no_recursion is called in runview.bp-click, as we check all rows in a loop
const aggregateTdStatus = (td, no_recursion) => {
    if (td === undefined || $(td).parent().hasClass('bioinfo-project')) {
        return false;
    }

    let parent_status = "";
    const td_class = $(td).attr('class').split(/\s+/)[1];
    const child_tds = getAllChildTrs($(td).parent()).children(`td.${td_class}`);

    const statuses = [];
    child_tds.each((i, child_td) => {
        const td_text = $(child_td).text().trim().replace(/\s/g, '');
        // add text if it's not yet in array
        if (statuses.indexOf(td_text) === -1) {
            statuses.push(td_text);
        }
    });

    // if 'N/A' in statuses -> ignore
    // if all statuses are 'N/A' -> 'N/A'
    if (statuses.length === 1 && statuses.indexOf('N/A') !== -1) {
        parent_status = 'N/A';
    } else if (statuses.indexOf('N/A') !== -1) {
        // remove 'N/A' from statuses
        statuses.splice(statuses.indexOf('N/A'), 1);
    }

    if (statuses.length === 1) { // if all statuses were the same
        parent_status = statuses[0];
    } else if (statuses.indexOf('?') !== -1) {
        parent_status = '?';
    } else if (statuses.indexOf('Warning') !== -1 || statuses.indexOf('Fail') !== -1) {
        parent_status = 'Warning';
    }

    $(td).text(parent_status);
    const current_class = $(td).attr('class').split(/\s+/)[2];
    const parent_class = bioinfo_qc_statuses[parent_status];
    $(td).removeClass(current_class);
    $(td).addClass(parent_class);

    // if no_recursion, we don't call it for parent
    if (no_recursion === undefined) {
        const parent_id = $(td).parent().attr('data-parent');
        // if td is not 'bioinfo-fc'
        if (parent_id.indexOf('bioinfo-project') === -1) {
            const td_index = $(td).parent().children().index($(td));
            const td_parent = $(parent_id).children()[td_index];
            aggregateTdStatus(td_parent);
        }
    }
};

//////
// SAVE CHANGES
//////
$('#bioinfo-status-saveButton').click((e) => {
    e.preventDefault(); // reloads the page otherwise
    e.stopImmediatePropagation(); // fires twice otherwise.

    if ($(this).is(':disabled')) {
        alert('disabled!');
        return false;
    }

    // Build the JSON object
    const sample_run_lane_statuses = {};
    const table = $('.table-bioinfo-status:visible');
    const project_id = $(table).find('tr.bioinfo-project').attr('id').replace('bioinfo-project-', '');

    let lowest_level;
    if ($(table).hasClass('table-bioinfo-status-runview')) {
        lowest_level = 'bioinfo-sample';
    } else if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        lowest_level = 'bioinfo-lane';
    }

    const extract_sample_run_lane_id = (tr_id) => {
        // remove 'bioinfo-lane-' in the beginning
        tr_id = tr_id.replace(`${lowest_level}-`, '');
        const sample_run_lane = tr_id.split(/-/);
        // first one is sample
        const sample = sample_run_lane[0];
        // the last one is lane
        const lane = sample_run_lane[sample_run_lane.length - 1];
        // everything what left in the middle is flowcell
        // because flowcell id can contain '-' as well
        const flowcell = tr_id.replace(`${sample}-`, '').replace(`-${lane}`, '');
        return [sample, flowcell, lane];
    };

    const extract_run_lane_sample_id = (tr_id) => {
        tr_id = tr_id.replace(`${lowest_level}-`, '');
        const sample_run_lane = tr_id.split(/-/);
        // sample is the last one
        const sample = sample_run_lane[sample_run_lane.length - 1];
        // lane is the second from the end
        const lane = sample_run_lane[sample_run_lane.length - 2];
        // flowcell is all the rest
        const flowcell = tr_id.replace(`-${lane}`, '').replace(`-${sample}`, '');
        return [sample, flowcell, lane];
    };

    const disabled_rows = [];
    let show_warning = false;

    // assuming, there is only one view is active (=one table is visible)
    $(`.table-bioinfo-status:visible tr.${lowest_level}:has(td)`).each(function () {
        const tr = $(this);
        const tr_id = tr.attr('id');
        let sample_run_lane;

        if ($(table).hasClass('table-bioinfo-status-runview')) {
            sample_run_lane = extract_run_lane_sample_id(tr_id);
        } else {
            sample_run_lane = extract_sample_run_lane_id(tr_id);
        }

        const sample = sample_run_lane[0];
        const flowcell = sample_run_lane[1];
        const lane = sample_run_lane[2];

        const status = tr.find('.bioinfo-status-runstate span').text().trim();
        const row = { 'sample_status': status, 'qc': {}, 'bp': {} };

        // get qc values
        tr.children('td.bioinfo-status-qc').each(function (i, td) {
            const field_name = $(td).attr('class').split(/\s+/)[1];
            if (field_name !== undefined) {
                row['qc'][field_name] = $(td).text().trim();
            } else {
                console.error('error: undefined field name');
                console.error($(td));
            }
        });

        // get pb values
        tr.children('td.bioinfo-status-bp').each(function (i, td) {
            const field_name = $(td).attr('class').split(/\s+/)[1];
            if (field_name !== undefined) {
                row['bp'][field_name] = $(td).text().trim();
            } else {
                console.error('error: undefined field name');
                console.error($(td));
            }
        });

        const row_key = [project_id, sample, flowcell, lane];
        sample_run_lane_statuses[row_key] = row;
        sample_run_lane_statuses[row_key]['sample_status'] = status;

        // get data_delivered date
        const date_input = tr.find('td.datadelivered input:text');
        const data_delivered = date_input.val();
        sample_run_lane_statuses[row_key]['datadelivered'] = data_delivered;

        if (data_delivered !== '') {
            show_warning = true;
            disabled_rows.push(this);
        }
    });

    if (show_warning) {
        $('#bioinfo-confirm-dialog').modal('show');
        $('#bioinfo-confirm-save').click((e) => {
            e.preventDefault();
            e.stopImmediatePropagation(); // fires twice otherwise.
            $('#bioinfo-status-saveButton').addClass('disabled').text('Saving..');
            const bioinfo_api_url = "/api/v1/bioinfo_analysis/" + project_id;
            $.ajax({
                type: 'POST',
                url: bioinfo_api_url,
                dataType: 'json',
                data: JSON.stringify(sample_run_lane_statuses),
                error: function (xhr, textStatus, errorThrown) {
                    alert('There was an error saving the bioinformatics statuses: ' + errorThrown);
                    $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                    console.log(xhr);
                    console.log(textStatus);
                    console.log(errorThrown);
                    console.log(JSON.stringify(sample_run_lane_statuses));
                },
                success: function (saved_data, textStatus, xhr) {
                    let status = 'Changes saved ';
                    if (saved_data['not_saved'].length > 0) {
                        status = 'Not all changes saved in bulk update! Doc ids that failed to update are shown below.';
                        let to_display = status;
                        saved_data['not_saved'].forEach((item, i) => {
                            to_display += '<br>' + item;
                        });
    
                        $('#save_error_display').html(to_display);
                    }
                    const success_msg = $('<span class="delivery-saved-status">' + status + '<span class="fa fa-check"></span></span>');
                    success_msg.prependTo('.bioinfo-savespan').delay(1500).fadeOut(1500, function () { $(this).remove(); });
                    $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                    //$('#bioinfo-history-dump').text(JSON.stringify(saved_data, null, '  '));
                    $('table.table-bioinfo-status:visible').find("td.bioinfo-status-runstate span:contains('Delivered')").closest('tr').addClass('bioinfo-status-disabled');
                    $('tr.bioinfo-status-disabled td.datadelivered input:text').prop('disabled', true);
                    updateSecondTable(saved_data['saved_data']);
                }
            });
            $('#bioinfo-confirm-dialog').modal('hide');
        });
        $('#bioinfo-confirm-cancel').click((e) => {
            $('#bioinfo-confirm-dialog').modal('hide');
        });
    } else {
        $('#bioinfo-status-saveButton').addClass('disabled').text('Saving..');
        const bioinfo_api_url = "/api/v1/bioinfo_analysis/" + project_id;
        $.ajax({
            type: 'POST',
            url: bioinfo_api_url,
            dataType: 'json',
            data: JSON.stringify(sample_run_lane_statuses),
            error: function (xhr, textStatus, errorThrown) {
                alert('There was an error saving the bioinformatics statuses: ' + errorThrown);
                $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                console.log(xhr);
                console.log(textStatus);
                console.log(errorThrown);
                console.log(JSON.stringify(sample_run_lane_statuses));
            },
            success: function (saved_data, textStatus, xhr) {
                let status = 'Changes saved ';
                if (saved_data['not_saved'].length > 0) {
                    status = 'Not all changes saved in bulk update! Doc ids that failed to update are shown below.';
                    let to_display = status;
                    saved_data['not_saved'].forEach((item, i) => {
                        to_display += '<br>' + item;
                    });
    
                    $('#save_error_display').html(to_display);
                }
                const success_msg = $('<span class="delivery-saved-status">' + status + '<span class="fa fa-check"></span></span>');
                success_msg.prependTo('.bioinfo-savespan').delay(1500).fadeOut(1500, function () { $(this).remove(); });
                $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                //$('#bioinfo-history-dump').text(JSON.stringify(saved_data, null, '  '));
                $('table.table-bioinfo-status:visible').find("td.bioinfo-status-runstate span:contains('Delivered')").closest('tr').addClass('bioinfo-status-disabled');
                $('tr.bioinfo-status-disabled td.datadelivered input:text').prop('disabled', true);
                updateSecondTable(saved_data['saved_data']);
            }
        });
    }
});

function updateSecondTable(saved_data) {
    const table = $('table.table-bioinfo-status:hidden');
    let view, lowest_level;

    if ($(table).hasClass('table-bioinfo-status-runview')) {
        view = 'runview';
        lowest_level = 'bioinfo-sample';
    } else if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        view = 'sampleview';
        lowest_level = 'bioinfo-lane';
    } else {
        // should not be a case
        // add code here in case we decided to add another view
    }

    const get_tr_id = (run, lane, sample, view) => {
        let lowest_level;
        if (view === 'runview') {
            lowest_level = 'bioinfo-sample';
            return `${lowest_level}-${run}-${lane}-${sample}`;
        } else if (view === 'sampleview') {
            lowest_level = 'bioinfo-lane';
            return `${lowest_level}-${sample}-${run}-${lane}`;
        }
    };

    $.each(saved_data, (i, row) => {
        i = i.split(',');
        const project = i[0];
        const sample = i[1];
        const run = i[2];
        const lane = i[3];
        const tr_id = get_tr_id(run, lane, sample, view);
        const tr = $(`#${tr_id}`);
        const qc_boxes = { ...row.qc, ...row.bp };

        $.each(qc_boxes, (qc_name, qc_value) => {
            // wtf it doesn't exclude length property??
            if (qc_name !== 'length') {
                const td = $(tr).children(`td.${qc_name}`).first();
                $(td).text(qc_value);
                const td_class = $(td).attr('class').split(/\s/)[2];
                $(td).removeClass(td_class);
                $(td).addClass(bioinfo_qc_statuses[qc_value]);
            }
        });

        if (row.datadelivered !== '') {
            const date_td = $(tr).find('td.datadelivered');
            const date_input = $(date_td).find('input:text');
            $(date_input).val(row.datadelivered);
            $(date_input).prop('disabled', true);
            $(tr).addClass('bioinfo-status-disabled');
            disableParentDate(date_td);
        }
    });
    loadTable(table);
}

// this one shouldn't be done like that
const setParentSpanStatus = (span) => {
    if (span === undefined) {
        return false;
    }

    const tr = $(span).parent().parent();
    const parent_tr = $($(tr).attr('data-parent'));

    if ($(parent_tr).hasClass('bioinfo-project')) {
        return false;
    }

    const sibling_trs = $(`.table-bioinfo-status:visible tr[data-parent='#${parent_tr.attr('id')}']`);
    const statuses = [];

    $.each(sibling_trs, (index, sibling_tr) => {
        const span = $(sibling_tr).find('td.bioinfo-status-runstate span.badge');
        if (statuses.indexOf($(span).text().trim()) === -1) {
            statuses.push($(span).text().trim());
        }
    });

    let parent_status = "";
    if (statuses.length === 1) {
        parent_status = statuses[0];
    } else {
        const keywords = ['Sequencing', 'Demultiplexing', 'Transferring', 'New', 'Failed', 'QC-ongoing', 'QC-done', 'BP-ongoing', 'BP-done', 'Delivered'];
        for (const keyword of keywords) {
            if (statuses.indexOf(keyword) !== -1) {
                parent_status = keyword;
                break;
            }
        }
    }

    const parent_span = $(parent_tr).find('td.bioinfo-status-runstate span.badge');
    const span_status = $(parent_span).text().trim();
    $(parent_span).text(parent_status);
    $(parent_span).removeClass(sample_statuses[span_status]);
    $(parent_span).addClass(sample_statuses[parent_status]);
    setParentSpanStatus(parent_span);
};

$('select#bioinfo-view').on("change", (e) => {
    const selected_view = $(this).val();
    if (selected_view === 'run-view') {
        $('table.table-bioinfo-status-runview').show();
        $('table.table-bioinfo-status-sampleview').hide();
    } else if (selected_view === 'sample-view') {
        $('table.table-bioinfo-status-runview').hide();
        $('table.table-bioinfo-status-sampleview').show();
    }
});

// update date on all levels, when it changed
$('td.datadelivered').on('change', 'input:text', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation(); // this doesn't help, it still fires a few times
    const td = $(this).closest('td.datadelivered');
    const delivery_date = $(this).val();

    const child_trs = getAllChildTrs($(td).parent());
    if (child_trs.length !== 0) {
        $(child_trs).children('td.datadelivered').find('input:text').val(delivery_date);
    }
    setParentDate(td);

    // update status
    checkSampleStatus(td);
});

const setParentDate = (td) => {
    const parent_tr = $($(td).parent().attr('data-parent'));   
    if (td === undefined || $(parent_tr).hasClass('bioinfo-project')) {
        return false;
    }
    const parent_td = $(parent_tr).find('td.datadelivered');
    const delivery_date = $(td).find('input:text').val();
    const sibling_trs = getAllChildTrs(parent_tr);
    // if parent has only one child
    if (sibling_trs.length <= 1) {
        $(parent_td).find('input:text').val(delivery_date);
    } else {
        // set on top the earliest date
        sibling_trs.forEach((sibling_tr) => {
            const date_input = $(sibling_tr).find('td.datadelivered input:text');
            if ($(date_input).val() < delivery_date) {
                delivery_date = $(date_input).val();
            }
        });
        $(parent_td).find('input:text').val(delivery_date);
    }
    setParentDate(parent_td);
};

const disableParentDate = (td) => {
    const parent_tr = $($(td).parent().attr('data-parent'));  
    if (td === undefined || $(parent_tr).hasClass('bioinfo-project')) {
        return false;
    }
    const parent_td = $(parent_tr).find('td.datadelivered');
    if (parent_td === undefined) {
        return false;
    }
    const delivery_date = $(td).find('input:text').val();
    const sibling_trs = getAllChildTrs(parent_tr);
    // if parent has only one child
    if (sibling_trs.length <= 1) {
        $(parent_td).parent().addClass('bioinfo-status-disabled');
        $(parent_td).find('input:text').prop('disabled', true);
    } else {
        // disable if all the others are also disabled
        let all_disabled = true;
        sibling_trs.forEach((tr) => {
            if (!$(tr).hasClass('bioinfo-status-disabled')) {
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
$('#bioinfo-show-history-button').on('click', (e) => {
    $('#bioinfo-show-history').modal();
});

// show edit history
$('#bioinfo-show-history-button').on('click', (e) => {
    $('#bioinfo-show-history').modal();
});

$('button.btn-reset-history-timestamp').on('click', (e) => {
    const table = $(e.target).closest('div.accordion-item').find('table');
    // headers - to extract fc-lane-sample id
    const spans = $(table).find('tr.history-header th span');
    // update the view
    spans.each((i, span) => {
        // get fc-lane-sample_id from the table header
        const sample = $(span).text().trim();
        // from header until next header, only .history-qc (skipping user and status)
        const trs = $(span).closest('tr.history-header').nextUntil('tr.history-header', 'tr.history-qc');
        // extract values for each run-lane-sample
        trs.each((i, tr) => {
            const qc_key = $(tr).find('td.qc_key').text().trim();
            const qc_value = $(tr).find('td.qc_value').text().trim();
            // update qc boxes in the main table
            const qc_box = $('#bioinfo-sample-' + sample + ' td.' + qc_key);
            $(qc_box).text(qc_value);
            $(qc_box).removeClass(bioinfo_qc_classes.join(' '));
            $(qc_box).addClass(bioinfo_qc_statuses[qc_value]);
        });
        // update sample_status value as well
        const status_tr = $(span).closest('tr.history-header').nextUntil('tr.history-header', 'tr.history-status')[0];
        const sample_status = $(status_tr).find('td.qc_value').text().trim();
        const sample_tr = $('#bioinfo-sample-' + sample);
        const sample_span = $(sample_tr).find('td.bioinfo-status-runstate span');
        const current_sample_status = $(sample_span).text().trim();
        $(sample_span).text(sample_status);
        $(sample_span).removeClass(sample_classes.join(' '));
        $(sample_span).addClass(sample_statuses[sample_status]);

        // remove delivery date
        const date_tr = $(span).closest('tr.history-header').nextUntil('tr.history-header', 'tr.history-datadelivered')[0];
        const data_delivered = $(date_tr).find('td.qc_value').text().trim();
        const date_input = $('#bioinfo-sample-' + sample).find('td.datadelivered').find('input:text');
        $(date_input).val(data_delivered);
        if (data_delivered == '') {
            $('tr#bioinfo-sample-' + sample).prop('disabled', false);
            $('tr#bioinfo-sample-' + sample).removeClass('bioinfo-status-disabled');
        }
    });
    const view = $('table.table-bioinfo-status:visible');
    loadTable(view); // todo: no need to load the whole table
    $('#bioinfo-status-saveButton').prop('disabled', false);
});

$('button.btn-reset-history-sample').on('click', (e) => {
    const header = $(e.target).closest('table tr.history-header');
    const sample_status = $(e.target).closest('table').find('tr.history-status td.qc_value').first().text().trim();

    const run_lane_sample = $(header).find('th span').text();
    const table = $('table.table-bioinfo-status:visible');

    // check the view, and get tr_id
    let tr_id = '#bioinfo-sample-' + run_lane_sample;
    if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        const sample_id = run_lane_sample.split('-');
        const sample = sample_id[sample_id.length - 1];
        const lane = sample_id[sample_id.length - 2];
        const run = run_lane_sample.replace('-' + sample, '').replace('-' + lane, '');
        const sample_run_lane = [sample, run, lane].join('-');
        tr_id = tr_id = '#bioinfo-lane-' + sample_run_lane;
    }

    // reset all values to '?' -> in Status DB we store only the changed values. All the rest are assumed to be default
    const qc_boxes = $(tr_id).find('td.bioinfo-status-qc');
    const bp_boxes = $(tr_id).find('td.bioinfo-status-bp');
    $(qc_boxes).removeClass(bioinfo_qc_classes.join(' ')).addClass(bioinfo_qc_statuses['?']).text('?');
    $(bp_boxes).removeClass(bioinfo_qc_classes.join(' ')).addClass(bioinfo_qc_statuses['?']).text('?');

    qc_boxes.each((i, qc_box) => setParentStatus(qc_box));
    bp_boxes.each((i, bp_box) => setParentStatus(bp_box));

    // set values from the table
    if (sample_status !== 'New') {
        const trs = $(header).nextUntil('tr.history-header', 'tr.history-qc');
        trs.each((i, tr) => {
            const qc_key = $(tr).find('td.qc_key').text().trim();
            const qc_value = $(tr).find('td.qc_value').text().trim();
            const qc_box = $(tr_id).find('td.' + qc_key);
            $(qc_box).text(qc_value);
            $(qc_box).removeClass(bioinfo_qc_classes.join(' '));
            $(qc_box).addClass(bioinfo_qc_statuses[qc_value]);
            setParentStatus(qc_box);
        });
    }
    // update sample status
    const span = $(tr_id).find('td.bioinfo-status-runstate span');
    $(span).removeClass(sample_classes.join(' ')).text(sample_status).addClass(sample_statuses[sample_status]);
    setParentSpanStatus(span);
});
