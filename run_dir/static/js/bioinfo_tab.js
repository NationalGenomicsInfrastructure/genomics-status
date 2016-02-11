// Datepickers
$('.table-bioinfo-status').on('focus', '.input-group.date input', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    $(this).datepicker({
        format: "yyyy-mm-dd",
        todayHighlight: true
    });
});

$('.table-bioinfo-status').on('click', '.datepicker-today', function(e) {
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
  var element_id = $(element).attr('id');
  var expanded = $(element).find("a[href=#"+element_id+"]");
  $(expanded).removeClass('expanded');
  var span =$(element).find('span.glyphicon');
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
    var span = $(element).find('span.glyphicon')
    if ($(span).hasClass('glyphicon-chevron-right')) {
        $(span).removeClass('glyphicon-chevron-right')
        $(span).addClass('glyphicon-chevron-down');
    }
};

function collapseAll(a) {
    console.log(a);
    if ($(a).hasClass('expanded')) { // collapse recursively
        var trs = $('.table-bioinfo-status tr.bioinfo-sample');
        console.log($(trs));
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

var bioinfo_statuses = {'?': 'unknown', 'Pass': 'success', 'Warning': 'warning', 'Fail': 'danger'};
var bioinfo_classes = ['unknown', 'success', 'warning', 'danger'];
var bioinfo_texts = ['?', 'Pass', 'Warning', 'Fail'];

// double click on header -> set all the values
$('.table-bioinfo-status').on('click', 'th.bioinfo-status-th', function(e) {
    var th = $(this);
    var th_status = $(th).attr('class').split(/\s+/)[2];
    if (th_status == undefined) {
        th_status = '?';
    }
    var th_class = bioinfo_statuses[th_status];

    // get next status
    var new_status = bioinfo_texts[(bioinfo_texts.indexOf(th_status)+1) % bioinfo_texts.length];
    var new_class = bioinfo_statuses[new_status];

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

$('.table-bioinfo-status').on('click', 'td.bioinfo-status-pfw', function(e) {
  e.stopImmediatePropagation(); // fires twice otherwise.

    var td = $(this);
    var tds = getChildTds(td);
    tds.push(td);

    var current_class = "";
    var next_class = "";
    var next_label = "";

    // get current class, it must be one of the bioinfo_classes
    $.each($(td).attr('class').split(/\s+/), function(i, td_class) {
        var current_index = bioinfo_classes.indexOf(td_class);
          if (current_index != -1) {
            current_class = td_class;
            var next_index = (current_index + 1) % bioinfo_classes.length;
            next_class = bioinfo_classes[next_index];
            next_label = bioinfo_texts[next_index];
            return false;
          }
    });

    $.each($(tds), function(i, td_child) {
        $(td_child).removeClass(current_class);
        $(td_child).addClass(next_class);
        $(td_child).text(next_label);
    });

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
        var first_td = $(tr).children('.undemultiplexedreads');
        var last_td = $(tr).children('.samplereport');
        var first_index = $(tr).children().index(first_td);
        var last_index = $(tr).children().index(last_td);
        var all_tds = $(tr).children().slice(first_index, last_index);
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
    var parent_class = bioinfo_statuses[parent_status];
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
    project_id = project_id[project_id.length-2];

    $('.table-bioinfo-status tr.bioinfo-lane:has(td)').each(function(){
        var tr = $(this);
        var tr_id = $(tr).attr('id');
        var sample_run_lane = tr_id.replace('bioinfo-lane-', '');
        var sample_run_lane = tr_id.split(/-/);
        var sample = sample_run_lane[2];
        var lane = sample_run_lane[sample_run_lane.length-1];
        var flowcell = tr_id.replace('bioinfo-lane-'+sample+'-', '').replace('-'+lane,'');

        var status = $(this).find('.bioinfo-status-runstate span').text().trim();
        var row = {'status': status};

        $(tr).children('td').each(function(i, td) {
            if ($(td).attr('class') != undefined) {
                var field_name = $(td).attr('class').split(/\s+/)[1];
                row[field_name] = $(td).text().trim();
            }
        });

        var row_key = [project_id, sample, flowcell, lane];
        sample_run_lane_statuses[row_key] = row;
        sample_run_lane_statuses[row_key]['status'] = status;
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



//  // Copy first row
//  $('#bioinfo-status-copyFirstRow').click(function(e){
//    e.preventDefault();
//    e.stopImmediatePropagation(); // fires twice otherwise.
//    var states = [];
//    var input_vals = [];
//    $('.table-bioinfo-status tr:has(td)').each(function(){
//      var tr = $(this);
//      var isdisabled = tr.hasClass('bioinfo-status-disabled');
//      if(!isdisabled){
//        if(states.length == 0){
//          tr.children('td').each(function(i){
//            if($(this).hasClass('bioinfo-status-pfw')){
//              states[i] = $(this).text();
//            } else {
//              if($(this).find('input').length > 0){
//                input_vals[i] = $(this).find('input').val();
//              }
//            }
//          });
//        } else {
//          tr.children('td').each(function(i){
//            if($(this).hasClass('bioinfo-status-pfw')){
//              $(this).text(states[i]);
//              $(this).removeClass().addClass('bioinfo-status-pfw');
//              $(this).addClass(bioinfo_classes[bioinfo_texts.indexOf(states[i])]);
//            } else if($(this).find('input').length > 0){
//              $(this).find('input').val(input_vals[i]);
//            }
//          });
//        }
//      }
//    });
//  });