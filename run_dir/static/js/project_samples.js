//Get pseudo-argument for this js file. Ie, project = P1234
var project = $('#projects-js').attr('data-project');
var ordered_reads = 0.0;

$(document).ready(function() {
/* Caliper buttons click listener*/
$("body").on('click', '.caliper-img',  function(e) {
    e.preventDefault();
    data=$(this).attr('src')
    $('.modal-body').html("<img src='"+data+"' />");
    $('#caliperModal').modal();
    
});
  /* check default checkboxes */
  if (!$("#Filter :checked").length) {
    reset_default_checkboxes();
  }

  //Initialise stuff
  load_undefined_info();
  load_all_udfs();
  load_samples_table();
  load_running_notes();
  load_links();
  load_presets();

  //Prevent traditional html submit function
  $('#Search-form').submit(function(event){event.preventDefault();});

  $('body').on('click', '.search-action', function(event) {
    event.preventDefault();
    switch ($(this).data('action')) {
      case 'filterReset':
        reset_default_checkboxes();
      case 'filterApply':
        load_samples_table();
        break;
      case 'filterHeader':
        choose_column($(this).parent().attr("id"));
        break;
      case 'filterDropdown':
        select_from_preset($(this).parent().attr('id'), $(this).attr('id'));
        break;
    }
  });

  //Hide or show all accordions
  $('body').on('click', '.toggleCollapse',function(e) {
    e.preventDefault();
    if ($(this).is('.plus')) {
      $(this).removeClass('plus'); $(this).text('[-]');
      $('.tab-pane.active').find('div.collapse').collapse('show');
    }
    else {
      $(this).addClass('plus'); $(this).text('[+]');
      $('.tab-pane.active').find('div.collapse').collapse('hide');
    }
  });

  //Show user communication tab. Loading 
  $('#tab_communication').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
    load_tickets();
  });

});

// Initialize sorting and searching javascript plugin
function init_listjs(no_items, columns) {
  column_names = new Array();
  $.each(columns, function(i, column_tuple){
    column_names.push(column_tuple[1]);
  });
  var options = {
    valueNames: column_names,
    page: no_items /* Default is to show only 200 items at a time. */
  };
  var featureList = new List('sample-list', options);
  featureList.search($('#search_field').val());
}

////////////////////////////////////
// Choose columns related methods //
////////////////////////////////////


function read_current_filtering(header){
  /* If header == True will return a dictionary representing exactly what the
  page shows. I.e columns['basic-columns'] = [['SciLife Sample Name', 'scilife_name'] ...]

  If header == False will return only an array of pairs [display_name, column_id]
  */
  if (header){
    var columns = new Object();
    $("#Filter :checkbox:checked").each(function() {
      var p = $(this).parent().attr('id');
      if (!columns.hasOwnProperty(p)) {
        columns[p] = new Array([$(this).next('label').text(), $(this).attr('name')]);
      }
      else {
        columns[p].push([$(this).next('label').text(), $(this).attr('name')]);
      }
    });
    return columns
  }
  else {
    var columns = new Array();
    $("#Filter :checkbox:checked").each(function() {
      columns.push([$(this).next('label').text(), $(this).attr('name')]);
    });
    return columns
  }
}

function reset_default_checkboxes(){
  $('#Filter [id$=columns]').children('input').prop('checked', false);
  $('#Filter #basic-columns').children('input').prop('checked', true);
}

//Check or uncheck all fields from clicked category
function choose_column(col){
  var column = document.getElementById(col);
  //Get all the children (checkboxes)
  cbs = column.getElementsByTagName('input');
  //If one of them is checked we uncheck it, if none of them are checked, 
  //we check them all
  checked = false;
  for (var i = 0; i < cbs.length; i++) {
    if (cbs[i].checked) {
      cbs[i].checked = false;
      checked = true;
    }
  }
  if (!checked) {
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = true;
    }
  }
}


////////////////////////////////
// Presets related functions  //
///////////////////////////////

function load_presets() {
  $.getJSON('/api/v1/presets?presets_list=sv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];

    //Empty previously filled lists of presets
    $('ul#default_presets_dropdown').empty();
    $('ul#user_presets_dropdown').empty();

    //Default presets
    for (var preset in default_presets) {
      var li = '<li class="search-action" data-action="filterDropdown" id="' + preset + '">';
      li += '<a tabindex="-1">' + preset + '</a></li>';
      $('ul#default_presets_dropdown').append(li);
    }
    //User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        var li = '<li class="search-action" data-action="filterDropdown" id="' + preset + '">';
        li += '<a tabindex="-1">' + preset + '</a></li>';
        $('ul#user_presets_dropdown').append(li);
      }
    }
    else {
      var li = '<li class="disabled"><a tabindex="-1">';
      li += 'No user presets';
      li += '</a></li>';
      $('ul#user_presets_dropdown').append(li);
    }

  });
}


function select_from_preset(preset_type, preset) {
  $.getJSON('/api/v1/presets?presets_list=sv_presets', function (data) {
    //First uncheck everything
    $('input:checkbox').removeAttr('checked');
    if (preset_type == "default_presets_dropdown") {
      var choices = data['default'][preset];
      for (column in choices) {
        for (choice in choices[column]) {
          var column_id = column.toLowerCase().replace(/_/g, '-') + '-' + choice;
          document.getElementById(column_id).checked = choices[column][choice];
        }
      }
    }
    else if (preset_type == "users_presets_dropdown") {
    }
  });
}


function load_links() {
  var link_icon = {'Deviation':'icon-exclamation-sign', 'Other':'icon-file'};
  $("#links_table").empty();
  $.getJSON("/api/v1/links/" + project, function(data) {
    $.each(data, function(key, link) {
      var date = new Date(key);
      var row = '<tr>';
      row += '<td class="span1"><span class="' + link_icon[link['type']] + '"></span></td>';
      row += '<td>' + '<a' +  (link['url'] === "" ? "" : (' href="' + link['url'] + '"')) + '>'+ link['title'] + '</a>';
      row += '<p class="small muted">Added by ' + '<a href="mailto:' + link['email'] + '">' + link['user'] + '</a> on ' + date.toDateString() + '</p><td>';
      row += '<td><pre>' + link['desc'] + '</pre></td>';
      row += '</tr>';
      $("#links_table").append(row);
    });
  });
}

$("#link_form").submit(function(e) {
  e.preventDefault();
  var type = $('#new_link_type option:selected').val();
  var title = $('#new_link_title').val();
  var url = $('#new_link_url').val();
  var desc = $('#new_link_desc').val();

  if (title && type) {
    $.ajax({
      async: false,
      type: 'POST',
      url: '/api/v1/links/' + project,
      dataType: 'json',
      data: {'type': type, 'title': title, 'url':url, 'desc':desc},
    });
    //Clear form fields
    $('#new_link_type, #new_link_title, #new_link_url, #new_link_desc').val("");
    load_links();
  }
  else if(!$.browser.chrome) {
    //Non-chrome users might not get a useful html5 message
    alert('The link needs a title and a type needs to be selected');
  }
});


function load_tickets() {
  var tab_communication = document.getElementById('tab_com_content');
  if (tab_communication.children.length == 0) {
    fetching_data.showPleaseWait();
    var a_header = '<p><b>Note:</b> Internal notes are shown in a yellow box </p> \
                   <div class="accordion" id="tickets_accordion">';
    var a_group = ' \
    <div class="accordion-group"> \
      <div class="accordion-heading"> \
        <a class="accordion-toggle" data-toggle="collapse" data-parent="#tickets_accordion" href="#c{num_ticket}"> \
        {thread_name} \
        </a> \
      </div> \
      <div id="c{num_ticket}" class="accordion-body collapse"> \
        <div class="accordion-inner"> \
          {thread_content} \
        </div> \
      </div> \
    </div>';
    //Get the project name from the header of the page
    var p_name = $("#project_name").attr('p_name');

    $.getJSON("/api/v1/project/" + project + "/tickets?p_name=" + p_name, function(data){
      if ($.isEmptyObject(data)) {
        $('#tab_com_content').html("<h3>No tickets available for " + p_name + "</h3>");
      }
      else {
        // Build the accordion with the tickets information
        var accordion = a_header;
        var tickets = 1;
        // Javascript Object order is not guaranteed, but we want to show the most recent
        // issued ticket first
        $.each(Object.keys(data).reverse(), function(_, k) {
          var v = data[k];
          var title = "Ticket No. " + k + "<br />" + "Created at " + v['created_at'].split('T')[0] +
          "<br /> " + v['subject'] + "." + "<br />" + "Status: " + v['status'];
          var comments = '<center><a href="https://ngisweden.zendesk.com/agent/#/tickets/' + k + '">View it on ZenDesk</a></center>';
          v['comments'].reverse();
          $.each(v['comments'], function(k, c){
            var updated_at = new Date(c['created_at']);
            comments += "Updated on " + updated_at.toGMTString();
            if (c['public']) {
              comments += '<pre>' + c['body'] + '</pre><hr />';
            }
            else {
              comments += '<div class="alert alert-warning">' + c['body'] + '</div>';
            }
          });
          accordion += a_group.replace(/{num_ticket}/g, tickets)
          .replace(/{thread_name}/g, title)
          .replace(/{thread_content}/g, comments);
          tickets++;
        });
        accordion += '<a href="" class="toggleCollapse plus">[+]</a>';
        $('#tab_com_content').html(accordion);
      }
      fetching_data.hidePleaseWait();
    });
  }
}

function load_running_notes(wait) {
  //Clear previously loaded notes, if so
  $("#running_notes_table").empty();
  $.getJSON("/api/v1/running_notes/" + project, function(data) {
    $.each(data, function(date, note) {
      var date = new Date(date);
      var row = '<tr>'
      row += '<td>' + date.toDateString() + ', ' + date.toLocaleTimeString(date) + ' by '
      row += '<a href="mailto:' + note['email'] + '">' + note['user'] + '</a></td>'
      row += '<td><pre>' + note['note'] + '</pre></td>'
      row += '</tr>'
      $("#running_notes_table").append(row);
    });
    //Clear text area
    document.getElementById('new_note_text').value = '';
  });
}

// Insert new running note and reload the running notes table
$("#running_notes_form").submit( function(e) {
  e.preventDefault();
  var text = document.getElementById('new_note_text').value
  if (text) {
    $.ajax({
      async: false,
      type: 'POST',
      url: '/api/v1/running_notes/' + project,
      dataType: 'json',
      data: {"note": text},
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        alert('There was an error inserting the Running Note, please try it again.');
      }
    });
    load_running_notes()
  }
  else {
    alert("The running note text cannot be empty. Please fill in the Running Note.")
  }
});

function load_undefined_info(){
  $.getJSON("/api/v1/projects_fields?undefined=true", function(data) {
    var columns_html ="";
    $.each(data, function(column_no, column) {
      columns_html += '<tr><td>' + column + '</td><td name="' + column + '"></td></tr>';
    });
    $("#undefined_project_info").html(columns_html)
  });
}

function load_all_udfs(){
  $.getJSON("/api/v1/project_summary/" + project, function (data) {
    $.each(data, function(key, value) {
      //Set the project name and status
      if (prettify(key) == 'project_name'){
        if (!data['portal_id']) {
          project_title = project + ", " + data['project_name'] + " (no order in NGI portal)"; 
        } else {
          project_title = project + ", " + data['project_name'] + " (<a href='https://portal.scilifelab.se/genomics/node/" + data['portal_id'] + "'>" + data['customer_project_reference'] + "</a>)"; 
            }
            $("[name=" + prettify(key) + "]").html(project_title);
            $("[name=" + prettify(key) + "]").attr('p_name', data['project_name']);
            //Decide project status (and color) based on the project dates
            var open_date=data["open_date"];
            var queue_date=data["queued"];
            var close_date=data["close_date"];
            var aborted=data["aborted"];
            var source=data["source"];
            if (aborted){
              $("[name=project_status]").text("Aborted");
              $("[name=project_status]").addClass("alert alert-error");
            }
            else {
              if (!open_date && source == 'lims'){
                $("[name=project_status]").text("Pending");
                $("[name=project_status]").addClass("alert alert-info");
              }
              else if (open_date && !queue_date) {
                $("[name=project_status]").text("Reception Control");
                $("[name=project_status]").addClass("alert alert-block");
              }
              else if (queue_date && !close_date) {
                $("[name=project_status]").text("Ongoing");
                $("[name=project_status]").addClass("alert alert-info");
              }
              else {
                $("[name=project_status]").text("Closed");
                $("[name=project_status]").addClass("alert alert-success");
              }
            }
      }
      else {
        $("[name='" + key + "']").text(value)
      }
    });
    var t = $("#tab_communication");
    t.show();
  });
};

function prettify(s) {
  s2 = s.replace("(", "_").replace(")", "_");
  return s2
}

function load_table_head(columns){
  var tbl_head = '<tr>';
  $.each(columns, function(i, column_tuple) {
    tbl_head += '<th class="sort a" data-sort="' + column_tuple[1] + '">' + column_tuple[0] + '</th>';
  });
  tbl_head += '</tr>';
  $("#samples_table_head").html(tbl_head);
}

function load_samples_table() {
  load_table_head(read_current_filtering());
  $.getJSON("/api/v1/project/" + project, function (samples_data) {
    columns = read_current_filtering(true);
    var tbl_body = "";
    var size = 0;
    $.each(samples_data, function (sample, info) {
      size++;
      tbl_row = '<tr>';
      $.each(columns, function(subset, fields){
        if (subset == "basic-columns") {
          $.each(fields, function(idx, column_tuple) {
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            info[column_id] = round_floats(info[column_id], 2);
            // Scilife Sample Name is a link
            if (column_id == "scilife_name") {
              tbl_row += '<td><a class="' + column_id + '" href="/samples/' + 
              info[column_id] + '">' + info[column_id] + '</a></td>';
            }
            // Sample run metrics is an array of links
            else if (column_id == 'sample_run_metrics') {
              tbl_row += '<td class="' + column_id + '">';
              for (var i=0; i<info[column_id].length; i++) {
                tbl_row += '<a href="/qc/' + info[column_id][i] + '">' + 
                info[column_id][i] + '</br></a>';
              }
              tbl_row += '</td>';
            }
            //Library prep is an array of Objects
            else if (column_id == 'library_prep') {
              tbl_row += '<td class="' + column_id + '">';
              if (info[column_id] !== undefined) {
                $.each(info[column_id], function(prep, info_prep){
                  tbl_row += prep + "<br>";
                });
              }
              tbl_row += '</td>';
            }
            //Prep status and prep finished date are arrays
            else if (column_id == 'prep_status' || column_id == 'prep_finished_date') {
              tbl_row += '<td class="' + column_id + '">';
              for (var i=0; i<info[column_id].length; i++) {
                tbl_row += info[column_id][i] + "<br>";
              }
              tbl_row += '</td>';
            }
            else {
              tbl_row += '<td class="' + column_id + '">' + info[column_id] + '</td>';
            }
          });
        }
        else if (subset == "initial-qc-columns" && info['initial_qc'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            info['initial_qc'][column_id] = round_floats(info['initial_qc'][column_id], 2);
            if (~column_name.indexOf('Initial QC Caliper Image')){
                tbl_row += '<td class="' + column_id + '"><div class="caliper-link loading" href="'+info['initial_qc'][column_id]+'"><span class="toremove"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>   Loading...</span></div></td>';
            }else{
                tbl_row += '<td class="' + column_name + '">' + info['initial_qc'][column_id] + '</td>';
            }
          });
        }
        else if (subset == "library-prep-columns" && info['library_prep'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            tbl_row += '<td class="' + column_id + '">';
            $.each(info['library_prep'], function(library, info_library) {
              info_library[column_id] = round_floats(info_library[column_id], 2);
              // Special case for workset_setup, which is a link to the LIMS
              if (column_id == "workset_setup" && info_library[column_id]) {
                tbl_row += '<a href="http://genologics.scilifelab.se:8080/clarity/work-complete/';
                tbl_row += info_library[column_id].split('-')[1] + '">' + info_library[column_id] + '</a><br>';
              }
              else {
                tbl_row += info_library[column_id] + '<br>';
              }
            });
            tbl_row += '</td>';
          });
        }
        else if (subset == "library-validation-columns" && info['library_prep'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            tbl_row += '<td class="' + column_id + '">';
            $.each(info['library_prep'], function(library, info_library) {
              if ('library_validation' in info_library) {
                //We only want to show up the LIMS process ID with the higher number (the last one)
                var process_id = max_str(Object.keys(info_library['library_validation']));
                var validation_data = info_library['library_validation'][process_id];
                if (validation_data) {
                   validation_data[column_id] = round_floats(validation_data[column_id], 2);
                   if (~column_name.indexOf('Library Validation Caliper Image')){
                        tbl_row+='<div class="caliper-link loading" href="'+validation_data[column_id]+
                            '"><span class="toremove"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>Loading...</span></div>';
                   }else{
                        tbl_row += validation_data[column_id] + '<br>';
                   }
               }
              }
            });
            tbl_row += '</td>';
          });
        } 
        else if (subset == "pre-prep-library-validation-columns" && info['library_prep'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            tbl_row += '<td class="' + column_id + '">';
            $.each(info['library_prep'], function(library, info_library) {
              if ('pre_prep_library_validation' in info_library) {
                //We only want to show up the LIMS process ID with the higher number (the last one)
                var process_id = max_str(Object.keys(info_library['pre_prep_library_validation']));
                var validation_data = info_library['pre_prep_library_validation'][process_id];
                if (validation_data) {
                  validation_data[column_id] = round_floats(validation_data[column_id], 2);
                  tbl_row += validation_data[column_id] + '<br>';
                }
              }
            });
            tbl_row += '</td>';
          });
        } 
        // Details columns
        else {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            info['details'][column_id] = round_floats(info['details'][column_id], 2);
            tbl_row += '<td class="' + column_id + '">' + info['details'][column_id] + '</td>';
          });
        }
      });
      tbl_row += '</tr>';
      tbl_body += tbl_row;
    });
    $("#samples_table_body").html(tbl_body);
    columns = read_current_filtering(false);
    init_listjs(size, columns);
    //last step, update caliper images
    update_caliper();
  });
}
function update_caliper(){
  $.each($('.caliper-link'), function(){
    if($(this).hasClass('loading')){
        var currentobj=$(this);
        var imglink = $(this).attr('href');
        if(imglink==="undefined"){
                currentobj.append("No caliper link.");
                currentobj.children('span.toremove').remove();
                currentobj.removeClass('loading');
        }else{
            var jqxhr=$.getJSON(imglink, function(data){
                currentobj.append('<img class="caliper-img" src="data:image/png;base64,'+data+'">');
                currentobj.children('span.toremove').remove();
                currentobj.removeClass('loading');
            })
            .fail(function(){
                currentobj.append("Error.");
                currentobj.children('span.toremove').remove();
                currentobj.removeClass('loading');
            });
       }                                    
   }
 });
}
var fetching_data;
fetching_data = fetching_data || (function () {
  var pleaseWaitDiv = $(' \
    <div class="modal fade bs-example-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true"> \
      <div class="modal-dialog modal-sm"> \
        <div class="modal-content"> \
          <h3>Fetching data from ZenDesk...</h3> \
          <div class="progress progress-striped active"> \
            <div class="bar" style="width: 100%"> \
              <span class="sr-only"> \
              </span> \
            </div> \
          </div> \
        </div> \
      </div> \
    </div>');
  return {
    showPleaseWait: function() {
      pleaseWaitDiv.modal();
    },
    hidePleaseWait: function () {
      pleaseWaitDiv.modal('hide');
    },
  };
})();

//Is there any standar method to do this?
var max_str = function(strs) {
  var max = strs[0];
  for (var i=0; i < strs.length; i++) {
    if (parseInt(strs[i].split('-')[1]) > parseInt(max.split('-')[1])) {
      max = strs[i];
    }
  }
  return max
}

// Round number to the given number of decimals
var round_floats = function(n, p) {
  if (typeof(n) == 'number') {
    // If it's a float...
    if (Math.round(n) != n) {
      n = n.toFixed(p);
    }
  }
  return n;
}

