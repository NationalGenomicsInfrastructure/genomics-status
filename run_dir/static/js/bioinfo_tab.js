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
    if ($(a).hasClass('expanded')) { // collapse recursively
        var trs = $('.table-bioinfo-status tr.bioinfo-sample');
        $.each(trs, function(index, tr) {
            if ($(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                collapse(tr);
            }
        });
        $(a).removeClass('expanded');
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-down');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($('.table-bioinfo-status tr.bioinfo-sample'), $('.table-bioinfo-status tr.bioinfo-fc'));
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

var bioinfo_qc_statuses = {'?': 'unknown', 'Pass': 'success', 'Warning': 'warning', 'Fail': 'danger'};
var bioinfo_qc_classes = ['unknown', 'success', 'warning', 'danger'];
var bioinfo_qc_values = ['?', 'Pass', 'Warning', 'Fail'];

// set the whole row
$('.table-bioinfo-status').on('click', 'td.bioinfo-status-row', function(e) {
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    e.stopImmediatePropagation();
    var tr = $(this).parent();
    var tr_status = $(tr).attr('class').split(/\s+/)[1];
    if (tr_status == undefined) {
        tr_status = '?';
    }
    var tr_class = bioinfo_qc_statuses[tr_status];
    var new_status = bioinfo_qc_values[(bioinfo_qc_values.indexOf(tr_status)+1) % bioinfo_qc_values.length];
    var new_class =  bioinfo_qc_statuses[new_status];
    var tds = $(tr).children('td.bioinfo-status-qc');
    $.each(tds, function(index, td) {
        var td_class = $(td).attr('class').split(/\s+/)[2];
        $(td).removeClass(td_class); // todo: remove any class of bioinfo_qc_classes
        $(td).addClass(tr_class);
        $(td).text(tr_status);
        setChildrenStatus(td);
        var td_index = $(td).parent().children().index($(td));
        var parent_td = $($(td).parent().attr('data-parent')).children()[td_index];
        setParentStatus(parent_td);
    });
    $(this).removeClass(tr_status);
    $(this).addClass(new_status);
});

// double click on header -> set all the values
$('.table-bioinfo-status').on('click', 'th.bioinfo-status-th', function(e) {
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    e.stopImmediatePropagation();
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
    var column_name = $(th).attr('class').split(/\s+/)[1]
    var tds = $('.table-bioinfo-status td.'+column_name);
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

$('.table-bioinfo-status').on('click', 'td.bioinfo-status-bp', function(e) {
    // whatever it means
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    var td = $(this);
    var top_parent = topParent($(td).parent());
    var td_index = $(td).parent().children().index(td);
    var top_td = $(top_parent).children()[td_index];
    setChildrenStatus(top_td);

    console.log($(top_parent));
    console.log(td_index);
    console.log($(top_td));
});

$('.table-bioinfo-status').on('click', 'td.bioinfo-status-qc', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    if ($('.table-bioinfo-status').hasClass('bioinfo-status-disabled')) {
        return false;
    }
    console.log($(this));
    setChildrenStatus(this);
    var td = $(this);
    var td_index = $(td).parent().children().index($(td));
    var parent_td = $($(td).parent().attr('data-parent')).children()[td_index];
    setParentStatus(parent_td);
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

// it returns only the first child of children, wtf??
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

$( document ).ready(function() {
  // Handler for .ready() called.
  checkChildrenStatus('.bioinfo-fc');
});

// sets the values to 'pass' and so on to all the tree up,
 // in the template we set only [sample, run, lane] level
var checkChildrenStatus = function(selector) {
    var flowcell_trs = $(selector); // flowcells
    $.each(flowcell_trs, function(i, tr) {
        var all_tds = $(tr).children('.bioinfo-status-qc');
        $.each(all_tds, function(i, td){
            setParentStatus(td);
        });
    });
    if (selector == '.bioinfo-fc') {
        checkChildrenStatus('.bioinfo-sample');
    }
};

var setParentStatus = function(td) {
    if (td == undefined || $(td).parent().hasClass('bioinfo-project')) {return false;}
    var parent_status = "";
    var child_tds = getChildTds(td);
    var statuses = [];
    $.each(child_tds, function(i, td){
        var td_text = $(td).text().replace(/\s/g, '');
        // add text if it's not yet in array
        if (statuses.indexOf(td_text) == -1) {
            statuses.push(td_text);
        }
    });
    // if all statuses were the same
    if (statuses.length == 1) {
        parent_status = statuses[0];
    } else if (statuses.indexOf('?') != -1) {
        parent_status = '?';
    } else if (statuses.indexOf('Warning') != -1 || statuses.indexOf('Fail') != -1) {
        parent_status = 'Warning';
    }

    var call_recursive_function = false;
    if ($(td).text() != parent_status) {
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
            setParentStatus(td_parent);
        }

    }
};

function setChildrenStatus(td) {
    var tds = getChildTds(td);
    tds.push(td);

    var current_class = "";
    var next_class = "";
    var next_label = "";

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
    e.preventDefault();
    e.stopImmediatePropagation(); // fires twice otherwise.

    if($(this).is(':disabled')){
      alert('disabled!');
      return false;
    }

    // Build the JSON object
    var sample_run_lane_statuses = {};
    // get project_id from the url
    var project_id = window.location.href.split(/\//);
    // remove /bioinfo/ from the end
    project_id = project_id[project_id.length-1];

    $('.table-bioinfo-status tr.bioinfo-lane:has(td)').each(function(){
        var tr = $(this);
        var tr_id = $(tr).attr('id');
        var sample_run_lane = tr_id.replace('bioinfo-lane-', '');
        var sample_run_lane = tr_id.split(/-/);
        var sample = sample_run_lane[2];
        var lane = sample_run_lane[sample_run_lane.length-1];
        var flowcell = tr_id.replace('bioinfo-lane-'+sample+'-', '').replace('-'+lane,'');

        var status = $(this).find('.bioinfo-status-runstate span').text().trim();
        var row = {'sample_status': status, 'qc': {}, 'bp': {}};

        // get qc values
        $(tr).children('td.bioinfo-status-qc').each(function(i, td) {
            var field_name = $(td).attr('class').split(/\s+/)[1];
            if (field_name != undefined) {
                row['qc'][field_name] = $(td).text().trim();
            } else {
                console.log('error:');
                console.log($(td));
            }

        });
        // get pb values
        $(tr).children('td.bioinfo-status-bp').each(function(i, td) {
            var field_name = $(td).attr('class').split(/\s+/)[1];
            if (field_name != undefined) {
                row['bp'][field_name] = $(td).text().trim();
            } else {
                console.log('error:');
                console.log($(td));
            }
        })

        var row_key = [project_id, sample, flowcell, lane];
        sample_run_lane_statuses[row_key] = row;
        sample_run_lane_statuses[row_key]['sample_status'] = status;
    });
    $('#bioinfo-status-saveButton').addClass('disabled').text('Saving..');
    // from here it's copy&paste and i don't know what's happening
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
      }
    });
  });


var sample_statuses = {'New': 'label-primary', 'QC-ongoing': 'label-danger',
    'QC-done': 'label-warning', 'BP-ongoing': 'label-default', 'BP-done': 'label-success'};
var sample_classes = ['label-primary', 'label-danger', 'label-warning', 'label-default', 'label-success'];
var sample_values = ['New', 'QC-ongoing', 'QC-done', 'BP-ongoing', 'BP-done'];


$('td.bioinfo-status-runstate span.label').click(function(e) {
    setChildrenSpanStatus($(this));
    setParentSpanStatus($(this));
});

function setChildrenSpanStatus(span) {
    var current_status = $(span).text();
    var next_status = sample_values[(sample_values.indexOf(current_status)+1) % sample_values.length];
    var current_class = sample_statuses[current_status];
    var next_class = sample_statuses[next_status];

    $(span).text(next_status);
    $(span).removeClass(current_class);
    $(span).addClass(next_class);

    var tr = $(span).parent().parent();
    // set the same status for all children
    var child_trs = getChildTrs(tr);
    // if tr is lane, child_trs = []
    $.each(child_trs, function(index, child_tr) {
        var child_span = $(child_tr).find('td.bioinfo-status-runstate span.label');
        $(child_span).text(next_status);
        var child_class = $(child_span).attr('class').split(' ')[1];
        $(child_span).removeClass(child_class); // remove another class!!
        $(child_span).addClass(next_class);
    });
};

function setParentSpanStatus(span) {
    var tr = $(span).parent().parent();
    if ($(tr).hasClass('bioinfo-lane') || $(tr).hasClass('bioinfo-fc')) {
        var parent_tr = $($(tr).attr('data-parent'));
        var sibling_trs = $(".table-bioinfo-status tr[data-parent='#"+parent_tr.attr('id')+"']");
        var statuses = [];
        $.each(sibling_trs, function(index, sibling_tr) {
            var span = $(sibling_tr).find('td.bioinfo-status-runstate span.label').text();
            if (statuses.indexOf($(span).text()) != -1) {
                statuses.push($(span).text());
            }
        });
        var parent_status = "";
        if (statuses.length == 1) {
            parent_status = statuses[0];
        } else if (statuses.indexOf('BP-ongoing') != -1) {
            parent_status = 'BP-ongoing'; // BP-ongoing
        } else if (statuses.indexOf('QC-ongoing') != -1) {
            parent_status = 'QC-ongoing';// QC-ongoing
        } // todo: else ??. BP-done & QC-done
        else {
            parent_status = 'QC-ongoing';
        }

        var parent_span = $(parent_tr).find('td.bioinfo-status-runstate span.label');
        var span_status = $(parent_span).text();
        $(parent_span).text(parent_status);
        $(parent_span).removeClass(sample_statuses[span_status]);
        $(parent_span).addClass(sample_statuses[parent_status]);
        setParentSpanStatus(parent_span);
    }
}
