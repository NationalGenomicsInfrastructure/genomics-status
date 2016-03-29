// Datepickers
$('.table-bioinfo-status').on('focus', '.input-group.date input', function(e) {
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    $(this).datepicker({
        format: "yyyy-mm-dd",
        todayHighlight: true
    });
});

$('.table-bioinfo-status').on('click', '.datepicker-today', function(e) {
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if(!isdisabled){
      var today = formatDateTime(new Date(), false);
      $(this).prevAll("input:first").val(today);
    }
    // set values to upper and lower levels
    var date_td = $(this).closest('td.datadelivered');
    var child_tds = getChildTds(date_td);
    $.each(child_tds, function(i, td){
        // do not change if disabled
        if (!$(td).parent().hasClass('bioinfo-status-disabled')) {
            $(td).find('input:text').val(today);
        }
    });
    setParentDate(date_td);
});
$('.table-bioinfo-status').on('click', '.date-reset', function(e) {
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if(!isdisabled){
      var today = formatDateTime(new Date(), false);
      $(this).prevAll("input:first").val("");
    }
    // set values to upper and lower levels
    var date_td = $(this).closest('td.datadelivered');
    var child_tds = getChildTds(date_td);
    $.each(child_tds, function(i, td){
        // do not change if disabled
        if (!$(td).parent().hasClass('bioinfo-status-disabled')) {
            $(td).find('input:text').val("");
        }
    });
    setParentDate(date_td);
});

// expand or collapse table
$('.bioinfo-expand').click(function(e){
    // this = a[href=#$(tr).attr('id')];
    e.preventDefault();
    e.stopImmediatePropagation();
    tr = $(this).parent().parent();
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
  var expanded = $(element).find("a[href=#"+element_id+"]");
  $(expanded).removeClass('expanded');
  var span =$(element).find('td.bioinfo-status-expand span.glyphicon');
  if ($(span).hasClass('glyphicon-chevron-down')) {
    $(span).removeClass('glyphicon-chevron-down');
    $(span).addClass('glyphicon-chevron-right');
  }
  var children = $(element).parent().find('tr[data-parent=#'+element_id+']')
  $.each(children, function(index, child) {
    $(child).hide();
    collapse(child);
  });
};

function expand(element) {
    var a = $(element).find('.bioinfo-expand');
    $(a).addClass('expanded');
    var tr_id = $(element).attr('id');
    $('tr[data-parent=#'+tr_id+']').show();
    var span = $(element).find('td.bioinfo-status-expand span.glyphicon')
    if ($(span).hasClass('glyphicon-chevron-right')) {
        $(span).removeClass('glyphicon-chevron-right')
        $(span).addClass('glyphicon-chevron-down');
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
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-down');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($(table).find('tr.'+top_level_class), $(table).find('tr.'+second_level_class));
        $.each(trs, function(index, tr) {
            if (!$(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                expand(tr);
            }
        });
        $(a).addClass('expanded');
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-right');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-down');
    }
};

var bioinfo_qc_statuses = {'?': 'unknown', 'Pass': 'success', 'Warning': 'warning', 'Fail': 'danger', 'N/A': 'active'};
var bioinfo_qc_classes = ['unknown', 'success', 'warning', 'danger', 'active'];
var bioinfo_qc_values = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];


function setChildrenStatus_new(parent_td) {
    var new_class = $(parent_td).attr('class').split(/\s+/)[2];
    var new_value = $(parent_td).text();
    // get all of them recursively
    var tds = getChildTds(parent_td);
    // if tds is empty, return
    $.each(tds, function(i, td) {
        $(td).text(new_value);
        $.each($(td).attr('class').split(/\s+/), function(i, td_class) {
            if(bioinfo_qc_classes.indexOf(td_class) != -1) {
                $(td).removeClass(td_class);
            }
        });
        $(td).addClass(new_class);
        $(td).text(new_value);
    });
};

// set the whole row
$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-row', function(e) {
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var td = $(this);
    var tr = $(td).parent()[0];
    var row_status = $(td).attr('class').split(/\s+/)[1];   // '?'
    var row_class = bioinfo_qc_statuses[row_status];        // 'unknown'
    var new_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(row_status)+1) % bioinfo_qc_values.length]; // 'Pass'
    var new_class = bioinfo_qc_statuses[new_status];        // 'success'
    var tds = $(tr).find('td.bioinfo-status-qc');
    $.each(tds, function(index, td) {
        var classes = $(td).attr('class').split(/\s+/);
        // remove any of the bioinfo_qc_classes
        $.each(classes, function(i, td_class){
            if (bioinfo_qc_classes.indexOf(td_class) != -1) {
                $(td).removeClass(td_class);
            }
        });

        $(td).addClass(new_class);
        $(td).text(new_status);
        setChildrenStatus_new(td);
    });

    var parent_tr = $($(tr).attr('data-parent'));
    if (!$(parent_tr).hasClass('bioinfo-project')) {
        agregateStatus(parent_tr); // it's not recursive function, call one more time
        var top_parent = $(parent_tr).attr('data-parent');
        if (!$(top_parent).hasClass('bioinfo-project')) {
            agregateStatus(top_parent);
        }
    }

    $(td).removeClass(row_status);
    $(td).addClass(new_status);

    // check sample_status
    var bp_tds = $(tr).children('td.bioinfo-status-bp');
    // if no bp set
    var bp_statuses = [];
    $.each(bp_tds, function(i, bp){
        var bp_status = $(bp).text().trim();
        // ignore 'N/A' values
        if (bp_status != 'N/A' && bp_statuses.indexOf(bp_status) == -1) {
            bp_statuses.push(bp_status);
        }
    });
    var new_sample_status;
    if (new_status != '?') {
        if (new_status == 'Fail') {
            new_sample_status = 'Failed';
        } else if (bp_statuses.length == 1 && bp_statuses[0] == '?') {
            new_sample_status = 'QC-done';
        } else if (bp_statuses.indexOf('?') != -1) {
            new_sample_status = 'BP-ongoing';
        } else if (bp_statuses.indexOf('?') == -1) {
            new_sample_status = 'BP-done';
        }
    } else {
        // if all qc (and bp?) are failed, status = Failed
        if (bp_statuses.length == 1 && bp_statuses[0] == '?') {
            new_sample_status = 'New';
        } else {
            new_sample_status = 'QC-ongoing';
        }
    }
    var span = $(tr).find('td.bioinfo-status-runstate span.label');
    $(span).text(new_sample_status);
    setChildrenSpanStatus(span);
    setParentSpanStatus(span);
});

// double click on header -> set all the values
$('.table-bioinfo-status').on('click', 'th.bioinfo-status-th', function(e) {
    e.stopImmediatePropagation();
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }

    var th = $(this);
    var th_status = $(th).attr('class').split(/\s+/)[2];
    if (th_status == undefined) {
        th_status = '?';
    }
    var th_class = bioinfo_qc_statuses[th_status];

    // get next status
    var new_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(th_status)+1) % bioinfo_qc_values.length];
    var new_class = bioinfo_qc_statuses[new_status];

    // get tds with the same column name
    var column_name = $(th).attr('class').split(/\s+/)[1];
    var tds = $(th).closest('.table-bioinfo-status').find('tr:not(.bioinfo-status-disabled) td.'+column_name);
    $.each(tds, function(index, td) {
        $(td).removeClass(th_class);
        $(td).addClass(new_class);
        $(td).text(new_status);
    });
    $(th).removeClass(th_status);
    $(th).addClass(new_status);

});

function topParent(tr) {
    var parent_id = $(tr).attr('data-parent');
    var parent_tr = $(parent_id);
    if ($(parent_tr).hasClass('bioinfo-project')) {
        return $(tr);
    } else {
        return topParent(parent_tr);
    }
};

$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-bp', function(e) {
    // whatever it means
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var td = $(this);

    var top_parent = topParent($(td).parent());
    var td_index = $(td).parent().children().index(td);
    var top_td = $(top_parent).children()[td_index];

    var child_tds = getChildTds(top_td);
    child_tds.push(top_td);

    var current_value = $(this).text().trim();
    if (bioinfo_qc_values.indexOf(current_value) == -1) {
        current_value = '?';
    }
    var index = bioinfo_qc_values.indexOf(current_value);
    var next_value = bioinfo_qc_values[(index+1) % bioinfo_qc_values.length];

    $.each(child_tds, function(i, child_td) {
        console.log(child_td);
        var td_classes = $(child_td).attr('class').split(/\s+/);
        $.each(td_classes, function(i, td_class) {
            if (bioinfo_qc_classes.indexOf(td_class) != -1) {
                $(child_td).removeClass(td_class);
            }
        });
        $(child_td).addClass(bioinfo_qc_statuses[next_value]);
        $(child_td).text(next_value);
    });

    checkSampleStatusOnBPClick(td);
});

function checkSampleStatusOnBPClick(td) {
    var next_value = $(td).text().trim();
    // check the sample status
    var span = $(td).parent().find('td.bioinfo-status-runstate span');
    var sample_status = $(span).text().trim();

    // all bp boxes except the current one
    var bp_boxes = $(td).parent().children('td.bioinfo-status-bp:not(.'+$(td).attr('class').split(/\s+/)[1] + ')');
    var bp_statuses = [];
    $.each(bp_boxes, function(i, bp){
         var bp_value = $(bp).text().trim();
         if (bp_statuses.indexOf(bp_value) == -1 && bp_value != 'N/A') {
            bp_statuses.push(bp_value);
         }
    });
    var new_sample_status = sample_status;
    if (sample_status == 'QC-ongoing') {
        // all the rest values are also '?'
        if (next_value == '?' && bp_statuses.length == 1 && bp_statuses.indexOf('?') != -1) {
            new_sample_status = 'New';
        } else {
            // do nothing
        }
    } else if (sample_status == 'New') { // if we clicked for the first time
        new_sample_status = 'QC-ongoing';
    } else if (sample_status == 'QC-done') {
        if (next_value == '?') {
            new_sample_status = 'QC-done';
        } else { // if we clicked the first bp which is not N/A or '?'
            new_sample_status = 'BP-ongoing';
        }
    } else if (sample_status == 'BP-done' && next_value == '?') {
        new_sample_status = 'BP-ongoing';
    } else if (sample_status == 'BP-ongoing') {
        // all other values are not '?': bp_statuses.indexOf('?') == -1
        if (bp_statuses.indexOf('?') == -1 ) { // if all the other values are set or 'N/A'
            new_sample_status = 'BP-done'; // this one is the last one
        } else if ((bp_statuses.length == 1 && bp_statuses[0] == '?') && (next_value == '?' || next_value == 'N/A')) { // not sure about 'N/A'
            new_sample_status = 'QC-done'; // all the other values are '?' and current value is '?'
        } else if (bp_statuses.length > 1 && bp_statuses.indexOf('?') != -1) { // bp_statuses has both '?' and not '?'
            // status stays the same
            new_sample_status = 'BP-ongoing';
        }
    }
    $(span).text(new_sample_status);
    setChildrenSpanStatus(span);
    setParentSpanStatus(span);
};

function checkSampleStatusOnQCClick(td) {

    // check the sample status
    var span = $(td).parent().find('td.bioinfo-status-runstate span');
    var sample_status = $(span).text().trim();
    var next_value = $(td).text().trim();

    // check also bp status
    var bp_boxes = $(td).parent().children('td.bioinfo-status-bp');
    var bp_statuses = [];
    $.each(bp_boxes, function(i, bp){
         var bp_value = $(bp).text().trim();
         if (bp_statuses.indexOf(bp_value) == -1 && bp_value != 'N/A') {
            bp_statuses.push(bp_value);
         }
    });
    var bp_ongoing = false;
    var bp_done = false;
    if (bp_statuses.indexOf('?') == -1) {
        bp_done = true;
    } else if (bp_statuses.length != 1 && bp_statuses.indexOf('?') != -1) {
        bp_ongoing = true;
    }

    // check if the current qc box is the last to complete qc
    var qc_boxes = $(td).parent().children('td.bioinfo-status-qc:not(.'+$(td).attr('class').split(/\s+/)[1]+')');
    var last_value = true;
    var qc_statuses = [];
    var unique_statuses = [];
    $.each(qc_boxes, function(i, qc){
        var qc_value = $(qc).text().trim();
        if (qc_value == '?') {
            last_value = false;
            return false;
        }
        if (unique_statuses.indexOf(qc_value) == -1) {
            unique_statuses.push(qc_value);
        }
        qc_statuses.push(qc_value);
    });

    var new_sample_status = sample_status;
    if (sample_status == 'New') { // if we clicked for the first time
        new_sample_status = 'QC-ongoing';
    } else if ((sample_status == 'QC-done' || sample_status == 'BP-ongoing' || sample_status == 'BP-done') && next_value == '?') {
        new_sample_status = 'QC-ongoing';
    } else if (sample_status == 'QC-ongoing') {
        if (last_value && bp_done && next_value != '?') {
            new_sample_status = 'BP-done';
        } else if (last_value && bp_ongoing && next_value != '?') {
            new_sample_status = 'BP-ongoing';
        } else if (next_value == '?' && qc_statuses.indexOf('?') == -1) {
            new_sample_status = 'New';
        }
    } // if not the last value, also don't care

    if (unique_statuses.length == 1 && unique_statuses[0] == 'Fail') {
        new_sample_status = 'Failed';
    }

    $(span).text(new_sample_status);
    setChildrenSpanStatus(span);
    setParentSpanStatus(span);
};

$('.table-bioinfo-status').on('click', 'tr:not(.bioinfo-status-disabled) td.bioinfo-status-qc', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    setChildrenStatus(this);
    var td = $(this);
    var td_index = $(td).parent().children().index($(td));
    var parent_td = $($(td).parent().attr('data-parent')).children()[td_index];
    agreateTdStatus(parent_td);

    checkSampleStatusOnQCClick(td);
});

var getChildTds = function(td) {
    var childTds = [];
    var tr = $(td).parent();
    var column_index = $(tr).children().index(td);
    $.each(getChildTrs(tr), function(i, child_tr){
        child_td = $(child_tr).children()[column_index];
        childTds.push(child_td);
    });
    return childTds;
};

var getChildTrs = function(tr) {
    var children = [];
    var tr_id = $(tr).attr('id');
    var child_trs = $('.table-bioinfo-status tr[data-parent="#'+tr_id+'"]');
    $.each(child_trs, function(i, child_tr){
        children.push(child_tr);
    });
    if (children.length != 0) {
        var result = [];
        $.each(children, function(i, child_tr) {
            result = $.merge(result, getChildTrs(child_tr));
        });
        return $.merge(result, children);
    } else {
        return children;
    }
};

$(document).ready(function() {
    var start_time = new Date().getTime()
    console.log(start_time);
    var sample_view = $('table.table-bioinfo-status-sampleview');
    var run_view = $('table.table-bioinfo-status-runview');
    setParentStatus(sample_view);
    setParentStatus(run_view);
    var end_time = new Date().getTime()
    console.log(end_time);
    console.log(end_time - start_time);
});


// sets the values to 'pass' and so on to all the tree up,
// in the template we set only [sample, run, lane] level
function setParentStatus(view_table) {
    if ($(view_table).hasClass('table-bioinfo-status-sampleview')) {
        var second_level_class = '.bioinfo-fc';
        var top_level_class = '.bioinfo-sample';
    } else if ($(view_table).hasClass('table-bioinfo-status-runview')) {
        var second_level_class = '.bioinfo-lane';
        var top_level_class = '.bioinfo-fc';
    }
    var second_level_trs = $(view_table).find('tr'+second_level_class);
    $.each(second_level_trs, function(i, tr) {
        agregateStatus(tr);
    });
    var top_level_trs = $(view_table).find('tr'+top_level_class);
    $.each(top_level_trs, function(i, tr) {
        agregateStatus(tr);
    });
};

function agregateStatus(tr) {
    var first_level_children = $(tr).closest('table').find("tr[data-parent='#"+$(tr).attr('id')+"']");
    var children_statuses = {};
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
        } else {
            console.log(list_of_qc_values);
            // should not happen
        }
        $(second_level_td).text(td_text);
        var current_classes = $(second_level_td).attr('class').split(/\s+/);
        $.each(current_classes, function(i, cur_class) {
            if (bioinfo_qc_classes.indexOf(cur_class) != -1) {
                $(second_level_td).removeClass(cur_class);
            }
        });
        $(second_level_td).addClass(bioinfo_qc_statuses[td_text]);
    });
}

var agreateTdStatus = function(td) {
    if (td == undefined || $(td).parent().hasClass('bioinfo-project')) {return false;}
    var parent_status = "";
    var child_tds = getChildTds(td);
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

    var call_recursive_function = false;
    if ($(td).text().trim() != parent_status) {
        call_recursive_function = true;
    }

    $(td).text(parent_status);
    var current_class = $(td).attr('class').split(/\s+/)[2];
    var parent_class = bioinfo_qc_statuses[parent_status];
    $(td).removeClass(current_class);
    $(td).addClass(parent_class);

    if (call_recursive_function) {
        var parent_id = $(td).parent().attr('data-parent');
        // if td is not 'bioinfo-fc'
        if (parent_id != undefined) {
            var td_index = $(td).parent().children().index($(td));
            var td_parent = $(parent_id).children()[td_index];
            agreateTdStatus(td_parent);
        }

    }
};

function setChildrenStatus(td) {
    var tds = getChildTds(td);
    tds.push(td);

    // default values
    var current_class = "unknown";
    var next_class = "success";
    var next_label = "Pass";

    // get current class, it must be one of the bioinfo_qc_classes
    $.each($(td).attr('class').split(/\s+/), function(i, td_class) {
        var current_index = bioinfo_qc_classes.indexOf(td_class);
          if (current_index != -1) {
            current_class = td_class;
            var next_index = (current_index + 1) % bioinfo_qc_classes.length;
            next_class = bioinfo_qc_classes[next_index];
            next_label = bioinfo_qc_values[next_index];
            return false;
          }
    });

    $.each($(tds), function(i, td_child) {
        $(td_child).removeClass(current_class);
        $(td_child).addClass(next_class);
        $(td_child).text(next_label);
    });
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
        var data_delivered = $(this).find('td.datadelivered input:text').val();
        sample_run_lane_statuses[row_key]['datadelivered'] = data_delivered;
        if (data_delivered != '') {
            show_warning = true;
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
                    console.log('success');
                    var success_msg = $('<span class="delivery-saved-status">Changes saved <span class="glyphicon glyphicon-ok"></span></span>');
                    success_msg.prependTo('.bioinfo-savespan').delay(1500).fadeOut(1500, function(){ $(this).remove(); });
                    $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                    $('#bioinfo-history-dump').text(JSON.stringify(saved_data, null, '  '));
                    updateSecondTable(saved_data);
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
                console.log('success');
                var success_msg = $('<span class="delivery-saved-status">Changes saved <span class="glyphicon glyphicon-ok"></span></span>');
                success_msg.prependTo('.bioinfo-savespan').delay(1500).fadeOut(1500, function(){ $(this).remove(); });
                $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
                $('#bioinfo-history-dump').text(JSON.stringify(saved_data, null, '  '));
                updateSecondTable(saved_data);
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
                agregateStatus(table);
            }
        });
    });
}
//
//
var sample_statuses = {
    'Demultiplexing': 'label-default',
    'Transferring': 'label-default',
    'Sequencing': 'label-default',
    'New': 'label-primary',
    'QC-ongoing': 'label-warning',
    'QC-done': 'label-success',
    'BP-ongoing': 'label-warning',
    'BP-done': 'label-success',
    'Failed': 'label-danger',
    'Delivered': 'label-success',
    };
var sample_classes = ['label-default', 'label-default', 'label-default', 'label-primary', 'label-warning', 'label-success', 'label-warning', 'label-success', 'label-danger', 'label-sucess'];
var sample_values = ['Demultiplexing', 'Transferring', 'Sequencing', 'New', 'QC-ongoing', 'QC-done', 'BP-ongoing', 'BP-done', 'Failed', 'Delivered'];


// assuming that the status has been just updated, but not the class
function setChildrenSpanStatus(span) {
    var new_status = $(span).text().trim();
    var new_class = sample_statuses[new_status];
    var current_class = $(span).attr('class').split(/\s/)[1]; // label-primary

    $(span).removeClass(current_class);
    $(span).addClass(new_class);

    var tr = $(span).parent().parent();
    // set the same status for all children
    var child_trs = getChildTrs(tr);
    // if tr is lane, child_trs = []
    $.each(child_trs, function(index, child_tr) {
        var child_span = $(child_tr).find('td.bioinfo-status-runstate span.label');
        $(child_span).text(new_status);
        var child_class = $(child_span).attr('class').split(/\s/)[1];
        $(child_span).removeClass(child_class);
        $(child_span).addClass(new_class);
    });
};

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
        var span = $(sibling_tr).find('td.bioinfo-status-runstate span.label');
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

    var parent_span = $(parent_tr).find('td.bioinfo-status-runstate span.label');
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

$('th.bioinfo-status-th-date').on('click', '.datepicker-today', function(e) {
    var table = $(this).closest('table');
    var today = formatDateTime(new Date(), false);
    var tds = $(table).find('td.datadelivered')

    var date_inputs = $(table).find('td.datadelivered input:text');
    $.each(date_inputs, function(i, input){
        if($(input).val() == '') {
            $(input).val(today);
        }

        var label = $(input).closest('tr').find('td.bioinfo-status-runstate span.label');
        label.text('Delivered');
        var label_class = $(label).attr('class').split(/\s+/)[1];
        label.removeClass(label_class);
        label.addClass('label-danger');
    });
});

$('th.bioinfo-status-th-date').on('click', '.date-reset', function(e) {
    var table = $(this).closest('table');
    var date_inputs = $(table).find('td.datadelivered input:text');
    $.each(date_inputs, function(i, input){
        $(input).val("");
    });
});

// update date on all levels, when it changed
$('td.datadelivered').on('change', 'input:text', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // this doesn't help, it still fires a few times
    var td = $(this).closest('td.datadelivered');
    var delivery_date = $(this).val();
    var child_tds = getChildTds(td);
    $.each(child_tds, function(i, td){
        // do not change if disabled
        if (!$(td).parent().hasClass('bioinfo-status-disabled')) {
            $(td).find('input:text').val(delivery_date);
        }
    });
    setParentDate(td);
});

function setParentDate(td) {
    var parent_tr = $($(td).parent().attr('data-parent'));
    if (td == undefined || $(parent_tr).hasClass('bioinfo-project')) {return false;}
    var parent_td = $(parent_tr).find('td.datadelivered');
    var delivery_date = $(td).find('input:text').val();
    var sibling_trs = getChildTrs(parent_tr);
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
