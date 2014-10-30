//Get pseudo-argument for this js file. Ie, project = P1234
var project = $('#projects-js').attr('data-project');
var ordered_reads = 0.0;

$(document).ready(function() {
  
  // Initialise everything - order is important :)
  $.when(load_presets()).done(function(){
    load_undefined_info();
    load_all_udfs();
    load_samples_table();
    load_running_notes();
    load_links();
  });

  // Prevent traditional html submit function
  $('#Search-form').submit(function(e){
    e.preventDefault();
  });
  
  $('body').on('click', '.search-action', function(e) {
    e.stopPropagation(); // Stop the checkbox from firing if clicked
    switch ($(this).data('action')) {
      case 'filterReset':
        reset_default_checkboxes();
        break;
      case 'filterApply':
        load_samples_table();
        break;
      case 'filterHeader':
        choose_column($(this).parent().attr("id"));
        break;
      case 'filterPresets':
        select_from_preset($(this).parent().attr('id'), $(this).text());
        break;
    }
  });

  //Show user communication tab. Loading 
  $('#tab_communication').click(function (e) {
    load_tickets();
  });
  
  // Caliper buttons click listener
  $("body").on('click', '.caliper-img',  function(e) {
      e.preventDefault();
      data=$(this).attr('src')
      $('.modal-body').html("<img class='caliper-modal' src='"+data+"' />");
      $('#caliperModal').modal();
    
  });

});

// Initialize sorting and searching javascript plugin
function init_listjs (no_items, columns) {
  column_names = new Array();
  $.each(columns, function(i, column_tuple){
    column_names.push(column_tuple[1]);
  });
  var options = {
    valueNames: column_names,
    page: no_items /* Default is to show only 200 items at a time. */
  };
  var featureList = new List('sample-list', options);
  // featureList.search($('#search_field').val());
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
    $("#Filter .filterCheckbox:checked").each(function() {
      var p = $(this).data('columngroup');
      if (!columns.hasOwnProperty(p)) {
        columns[p] = new Array([$(this).data('displayname'), $(this).attr('name')]);
      }
      else {
        columns[p].push([$(this).data('displayname'), $(this).attr('name')]);
      }
    });
    return columns
  } else {
    var columns = new Array();
    $("#Filter .filterCheckbox:checked").each(function() {
      columns.push([$(this).data('displayname'), $(this).attr('name')]);
    });
    return columns
  }
}

function reset_default_checkboxes(){
  $('#Filter input').prop('checked', false); // uncheck everything
  $('#basic-columns input').prop('checked', true); // check the 'basic' columns
  $('#default_view').addClass('active');
}

//Check or uncheck all fields from clicked category
function choose_column(col){
  // If any are checked, uncheck all
  if($('#'+col+' input.filterCheckbox:checked').length > 0){
    $('#'+col+' input').prop('checked', false);
  }
  // Nothing checked - check everything
  else {
    $('#'+col+' input').prop('checked', true);
  }
}
// Update the header checkbox when clicking in the list
$('#Filter').on('click', '.filterCheckbox', function(){
  var group = $(this).closest('.col-sm-4');
  if(group.find('input.filterCheckbox:checked').length == 0){
    group.find('.headingCheckbox').prop('checked', false);
  } else {
    group.find('.headingCheckbox').prop('checked', true);
  }
});


////////////////////////////////
// Presets related functions  //
///////////////////////////////

function load_presets() {
  return $.getJSON('/api/v1/presets?presets_list=sv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];

    // Empty previously filled lists of presets
    $('#default_preset_buttons').empty();
    $('#user_presets_dropdown').empty();

    // Default presets
    for (var preset in default_presets) {
      $('#default_preset_buttons').append('<button id="'+prettify(preset)+'" data-action="filterPresets" type="button" class="search-action btn btn-default">'+preset+'</button>');
    }
    // User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        $('#user_presets_dropdown').append('<button id="'+prettify(preset)+'" data-action="filterPresets" type="button" class="search-action btn btn-default">'+preset+'</button>');
      }
    }
    else {
      $('#user_presets_dropdown').append('No user presets');
    }
    
    // Check default checkboxes
    if (!$("#Filter :checked").length) {
      reset_default_checkboxes();
    }
    
  });
}


function select_from_preset(preset_type, preset) {
  $.getJSON('/api/v1/presets?presets_list=sv_presets', function (data) {
    
    //First uncheck everything
    $('#default_preset_buttons button.active').removeClass('active');
    $('#Filter input:checkbox').removeAttr('checked');
    if (preset_type == "default_preset_buttons") {
      var choices = data['default'][preset];
      for (column in choices) {
        for (choice in choices[column]) {
          var column_id = column.toLowerCase().replace(/_/g, '-') + '-' + choice;
          $('#'+column_id).prop('checked', choices[column][choice]);
        }
      }
      $('#'+prettify(preset)).addClass('active');
      
    } else if (preset_type == "users_presets_dropdown") {
      // TODO - implement this
    }
    
    // Apply the filter
    load_samples_table();
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
  if ($('#com_accordion').children().length == 0) {
    
    //Get the project name from the header of the page
    var p_name = $("#project_name").attr('p_name');

    $.getJSON("/api/v1/project/" + project + "/tickets?p_name=" + p_name, function(data){
      
      if ($.isEmptyObject(data)) {
        $('#tab_com_content').html('<div class="alert alert-info">No Zendesk tickets available for ' + p_name + '</div>');
      } else {
        // Javascript Object order is not guaranteed, but we want to show the 
        // most recent issued ticket first
        $.each(Object.keys(data).reverse(), function(_, k) {
          var v = data[k];
          
          var label_class = 'default';
          if(v['status'] == 'closed'){ label_class = 'success'; v['status'] = 'Closed'; }
          var title = '<span class="pull-right">'+
                         '<a class="text-muted" data-toggle="collapse" data-parent="#accordion" href="#zendesk_ticket_'+k+'">'+
                           v['created_at'].split('T')[0] + 
                         '</a> &nbsp; <a href="https://ngisweden.zendesk.com/agent/#/tickets/'+k+'" target="_blank" class="btn btn-primary btn-xs">View ticket on ZenDesk</a>'+
                      '</span>' +
                      '<h4 class="panel-title">'+
                        '<span class="label label-' + label_class + '">' + v['status'] + '</span> ' +
                        '<a data-toggle="collapse" data-parent="#accordion" href="#zendesk_ticket_'+k+'">'+
                          '#'+k + ' - ' + v['subject'] + 
                        '</a>'+
                      '</h4>';
          
          var ticket = '<div class="panel panel-default">' +
                        '<div class="panel-heading">'+title+'</div>'+
                        '<div id="zendesk_ticket_'+k+'" class="panel-collapse collapse"><div class="panel-body">';

          v['comments'].reverse();
          $.each(v['comments'], function(k, c){
            var panel_class = 'warning';
            if (c['public']) {
              var panel_class = 'default';
            }
            var updated_at = new Date(c['created_at']);
            ticket += '<div class="panel panel-'+panel_class+'">'+
                        '<div class="panel-heading">'+updated_at.toGMTString() + '</div>'+
                        '<div class="panel-body"><pre>'+c['body']+'</pre></div>'+
                      '</div>';
            
          });
          $('#com_accordion').append(ticket);
        });
      }
      
      // Hide the loading modal
      $('#zendesk_loading_spinner').hide();
      $('#com_accordion').show();
      
    });
  }
}

function load_running_notes(wait) {
  // Clear previously loaded notes, if so
  $("#running_notes_table").empty();
  $.getJSON("/api/v1/running_notes/" + project, function(data) {
    $.each(data, function(date, note) {
      var date = new Date(date);
      $('#running_notes_panels').append('<div class="panel panel-default">' +
          '<div class="panel-heading">'+
            '<a href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
            date.toDateString() + ', ' + date.toLocaleTimeString(date)+
          '</div><div class="panel-body">'+markdown.toHTML(note['note'])+'</div></div>');
    });
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
        alert('There was an error inserting the Running Note, please try it again. '+XMLHttpRequest+' // '+textStatus+' // '+errorThrown);
      }
    }).done(function(){
      load_running_notes();
      // Clear text area
      document.getElementById('new_note_text').value = '';
    });
  }
  else {
    alert("The running note text cannot be empty. Please fill in the Running Note.")
  }
});

function load_undefined_info(){
  $.getJSON("/api/v1/projects_fields?undefined=true", function(data) {
    $.each(data, function(column_no, column) {
      $("#undefined_project_info").append('<dt>' + column + '</dt><dd id="' + column + '"></dd>');
    });
  });
}

function load_all_udfs(){
  $.getJSON("/api/v1/project_summary/" + project, function (data) {
    $('#loading_spinner').hide();
    $('#page_content').show();
    $.each(data, function(key, value) {
      // Set the project name and status
      if (prettify(key) == 'project_name'){
        if (!data['portal_id']) {
          project_title = project + ", " + data['project_name'] + " (no order in NGI portal)"; 
        } else {
          project_title = project + ", " + data['project_name'] + ' &nbsp; <small>NGI Portal: <a href="https://portal.scilifelab.se/genomics/node/' + data['portal_id'] + '" target="_blank">' + data['customer_project_reference'] + '</a></small>'; 
        }
        $("#" + prettify(key)).html(project_title);
        $("#" + prettify(key)).attr('p_name', data['project_name']);
        
        // Decide project status (and color) based on the project dates
        var open_date = data["open_date"];
        var queue_date = data["queued"];
        var close_date = data["close_date"];
        var aborted = data["aborted"];
        var source = data["source"];
        if (aborted){
          $("#project_status_alert").text("Aborted");
          $("#project_status_alert").addClass("label-danger");
        }
        else {
          if (!open_date && source == 'lims'){
            $("#project_status_alert").text("Pending");
            $("#project_status_alert").addClass("label-info");
          }
          else if (open_date && !queue_date) {
            $("#project_status_alert").text("Reception Control");
            $("#project_status_alert").addClass("label-default");
          }
          else if (queue_date && !close_date) {
            $("#project_status_alert").text("Ongoing");
            $("#project_status_alert").addClass("label-info");
          }
          else {
            $("#project_status_alert").text("Closed");
            $("#project_status_alert").addClass("label-success");
          }
          // Hide the aborted dates
          $('.aborted-dates').hide();
        }
      }
      
      // Make the project contact address clickable
      else if (prettify(key) == 'contact'){
         $('#contact').html('<a href="mailto:'+value+'">'+value+'</a>');
      }
        
      // Colour code the project type
      else if (prettify(key) == 'type'){
        if(value == 'Production'){
          $('#type').html('<span class="label label-primary">'+value+'</span>');
        } else if(value == 'Application'){
          $('#type').html('<span class="label label-success">'+value+'</span>');
        } else {
          $('#type').html('<span class="label label-default">'+value+'</span>');
        }
      }
      
      // Hide the BP Date if no BP
      else if (prettify(key) == 'best_practice_bioinformatics' && value == 'No'){
        $('.bp-dates').hide();
        $('#'+key).html(auto_format(value));
      }
      
      // Make the comments render Markdown
      else if (prettify(key) == 'project_comment'){
        $('#project_comment').html(markdown.toHTML(value));
      }
        
      // Pass / Fail sample counts
      else if (prettify(key) == 'passed_initial_qc' || prettify(key) == 'passed_library_qc'){
        var parts = value.split('/');
        if(parts[0].replace(/\D/g,'').length == 0 || parts[1].replace(/\D/g,'').length == 0){
          $('#'+key).html('<span class="label label-default">'+value+'</span>');
        } else if(parts[0].replace(/\D/g,'') < parts[1].replace(/\D/g,'')){
          $('#'+key).html('<span class="label label-danger">'+value+'</span>');
        } else if(parts[0].replace(/\D/g,'') == parts[1].replace(/\D/g,'')){
          $('#'+key).html('<span class="label label-success">'+value+'</span>');
        }
      // Everything else
      } else {
        $('#'+key).html(auto_format(value));
      }
    });
    
    // Everything has loaded - fix the missing 'days in production' if we can
    if($('#days_in_production').text() == '-' &&
        $('#open_date').text().length > 0 &&
        $('#close_date').text().length > 0){
          
      var openDate = new Date($('#open_date').text());
      var closeDate = new Date($('#close_date').text());
      var timeDiff = Math.abs(closeDate.getTime() - openDate.getTime());
      var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
      $('#days_in_production').text(diffDays);
    }
  });
};

function prettify(s) {
  return s.toLowerCase().replace("(", "_").replace(")", "_").replace(/\s+/g, "_");
}

function load_table_head(columns){
  var tbl_head = '<tr>';
  $.each(columns, function(i, column_tuple) {
    tbl_head += '<th class="sort a" data-sort="' + column_tuple[1] + '">';
    
    if(column_tuple[0] == 'SciLife Sample Name') {
      tbl_head += '<abbr data-toggle="tooltip" title="SciLifeLab Sample Name">Sample</abbr>';
    } else if(column_tuple[0] == 'Prep Finished Date') {
      tbl_head += 'Prep Finished';
    } else if(column_tuple[0] == 'Library Validation Caliper Image') {
      tbl_head += '<abbr data-toggle="tooltip" title="Latest Library Validation Caliper Image">Caliper Image</abbr>';
    } else if(column_tuple[0] == 'Million Reads Sequenced') { 
      tbl_head += '<abbr data-toggle="tooltip" title="Reads passing application QC criteria. If paired end, this is read pairs.">Sequenced Reads</abbr>';
    } else {
      tbl_head += column_tuple[0];
    }
    
    tbl_head += '</th>';
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
            
            // Scilife Sample Name
            if (column_id == "scilife_name") {
              if(info[column_id] == 'Unexpectedbarcode'){
                tbl_row += '<td class="'+column_id+'"><span class="label label-danger" data-toggle="tooltip" title="These reads failed to demultiplex">'+
                            info[column_id] + '</span></td>';
              } else {
                // TODO - Wire this up to the new QC page when it's ready
                tbl_row += '<td class="'+column_id+'"><a target="_blank" data-toggle="tooltip" title="See this sample in the LIMS" '+
                            'href="http://genologics.scilifelab.se:8080/clarity/search?scope=Sample&query='+info[column_id]+'">'+
                            info[column_id] + '</a></td>';
              }
            }
            
            // Sample run metrics is an array of links - link to flowcells page
            else if (column_id == 'sample_run_metrics') {
              tbl_row += '<td class="' + column_id + '">';
              for (var i=0; i<info[column_id].length; i++) {
                tbl_row += '<samp class="nowrap"><a href="/flowcells/' + info[column_id][i] + '">' + 
                info[column_id][i] + '</a></samp><br>';
              }
              tbl_row += '</td>';
            }
            
            // Library prep is an array of *Objects*
            else if (column_id == 'library_prep') {
              tbl_row += '<td class="' + column_id + '">';
              if (info[column_id] !== undefined) {
                $.each(info[column_id], function(prep, info_prep){
                  tbl_row += auto_format(prep, true) + ' ';
                });
              }
              tbl_row += '</td>';
            }
            
            // Convert million reads to just reads
            else if (column_id == 'total_reads_(m)'){
              var reads = info[column_id] * 1000000;
              tbl_row += auto_samples_cell(column_id, reads);
            }
            
            // everything else 
            else {
              tbl_row += auto_samples_cell(column_id, info[column_id]);
            }
            
          });
        }
        else if (subset == "initial-qc-columns" && info['initial_qc'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            info['initial_qc'][column_id] = round_floats(info['initial_qc'][column_id], 2);
            
            // Caliper image
            if (~column_name.indexOf('Initial QC Caliper Image')){
                tbl_row += '<td class="' + column_id + '">'+
                            '<div class="caliper-link loading" href="'+info['initial_qc'][column_id]+'">'+
                              '<span class="toremove">'+
                                '<i class="icon-refresh glyphicon-refresh-animate"></i>&nbsp;Loading...'+
                              '</span>'+
                            '</div>'+
                          '</td>';
            }
            
            // Remove the X from initial QC initials
            else if(column_id == 'initials'){
              var sig = info['initial_qc'][column_id];
              if(sig.length == 3 && sig[2] == 'X'){
                sig = sig.substring(0,2);
              }
              tbl_row += '<td class="'+column_id+'">'+
                          '<span class="label label-default" data-toggle="tooltip" title="Original signature: '+info['initial_qc'][column_id]+'">'+
                              sig+'</span></td>';
            }
            
            
            // everything else 
            else {
              tbl_row += auto_samples_cell(column_id, info['initial_qc'][column_id]);
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
                tbl_row += '<samp class="nowrap" title="Open in LIMS" data-toggle="tooltip"><a href="http://genologics.scilifelab.se:8080/clarity/work-complete/';
                tbl_row += info_library[column_id].split('-')[1] + '" target="_blank">' + info_library[column_id] + '</a></samp><br>';
              }
              
              // Make the reagent label use a samp tag
              else if (column_id == "reagent_label" && info_library[column_id]) {
                tbl_row += '<samp class="nowrap">' + info_library[column_id] + '</samp><br>';
              }
              
              else {
                tbl_row += auto_format(info_library[column_id], true);
              }
            });
            tbl_row += '</td>';
          });
        }
        
        else if ((subset == 'library-validation-columns' || subset == 'pre-prep-library-validation-columns') 
                && info['library_prep'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            tbl_row += '<td class="' + column_id + '">';
            var key = 'library_validation';
            if(subset == 'pre-prep-library-validation-columns'){
              key = 'pre_prep_library_validation';
            }
            $.each(info['library_prep'], function(library, info_library) {
              if (key in info_library) {
                // We only want to show up the LIMS process ID with the higher number (the last one)
                var process_id = max_str(Object.keys(info_library[key]));
                var validation_data = info_library[key][process_id];
                if (validation_data) {
                   validation_data[column_id] = round_floats(validation_data[column_id], 2);
                   if (~column_name.indexOf('Library Validation Caliper Image')){
                        tbl_row+='<div class="caliper-link loading" href="'+validation_data[column_id]+
                            '"><span class="toremove"><i class="icon-refresh glyphicon-refresh-animate"></i>&nbsp;Loading...</span></div>';
                   } else {
                        tbl_row += auto_format(info_library[column_id], true);
                   }
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
            tbl_row += auto_samples_cell(column_id, info['details'][column_id]);
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
                currentobj.append("<abbr title='"+imglink+" "+jqxhr.responseText+"'>Error.</abbr>");
                currentobj.children('span.toremove').remove();
                currentobj.removeClass('loading');
            });
       }                                    
   }
 });
}

function auto_format(value, samples_table){
  // Default value for function
  samples_table = (typeof samples_table === "undefined") ? false : samples_table;
  
  if(typeof value == 'string'){
    value = value.toLowerCase();
  }
  
  // Put all False / Failed / Fail into labels
  if(typeof value == 'string' && (
            value == 'false' || 
            value == 'failed' || 
            value == 'fail' || 
            value == 'no' ||
            value == 'n/a' || 
            value == 'aborted' )){
    return '<span class="label label-danger sentenceCase">'+value+'</span> ';
  }

  // Put all False / Failed / Fail into labels
  else if(typeof value == 'string' && (
            value == 'true' || 
            value == 'passed' || 
            value == 'pass' || 
            value == 'yes' || 
            value == 'finished')){
    return '<span class="label label-success sentenceCase">'+value+'</span> ';
  }
  
  // Dates
  else if(samples_table && typeof value == 'string' && value.split('-').length == 3 && value.length == 10){
    return '<span class="label label-default sentenceCase">'+value+'</span> ';
  }
  
  // Put all undefined into labels
  else if((typeof value == 'string' && value == 'undefined')
          || typeof value == 'undefined' || typeof value == 'null'){
    return '<span class="label label-default sentenceCase">'+value+'</span> ';
  }
  
  else {
    if(samples_table){
      return value + '<br>';
    } else {
      return value;
    }
  }
}

function auto_samples_cell (id, val){
  
  // Column returns an array
  if (val instanceof Array){
    cell = '<td class="' + id + '">';
    $.each(val, function(key, val){
      cell += auto_format(val, true) + ' ';
    });
    return cell + '</td>';
  }
  
  // Numeric value - right align
  else if (!isNaN(parseFloat(val)) && isFinite(val)){
    // Give numbers spaces in thousands separator
    val = val.toLocaleString(['fr-FR', 'en-US']);
    return '<td class="' + id + ' text-right">' + auto_format(val, true) + '</td>';
  }
  
  // Single value
  else {
    return '<td class="' + id + '">' + auto_format(val, true) + '</td>';
  }
}

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

