/*
File: project_samples.js
URL: /static/js/project_samples.js
Powers /project/[PID] - template is run_dir/design/project_samples.html
*/

// Get pseudo-argument for this js file. Ie, project = P1234
var project = $('#projects-js').attr('data-project');
var ordered_reads = 0.0;

$(document).ready(function() {

  // Initialise everything - order is important :)
  $.when(load_presets()).done(function(){
    load_undefined_info();
    load_all_udfs();
    load_samples_table();
    load_running_notes();
    load_bioinfo_table();
    load_links();
    load_charon_summary();
  });

  // Prevent traditional html submit function
  $('#Search-form').submit(function(e){
    e.preventDefault();
  });

  $('body').on('click', '.search-action', function(e) {
    // Stop the checkbox from firing if clicked, plus stop bubbling
    e.stopPropagation();
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
  $("body").on('click', '.caliper-thumbnail',  function(e) {
      e.preventDefault();
      loadCaliperImageModal('#'+$(this).attr('id'));
  });
  $('#caliperModal .right, #caliperModal .left').click(function(e){
    e.preventDefault();
    loadCaliperImageModal($(this).attr('href'));
  })

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
  var featureList = new List('tab_samples_content', options);
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
    $("#Filter .filterCheckbox:checked").each(function() {
      var p = $(this).data('columngroup');
      if (!columns.hasOwnProperty(p)) {
        columns[p] = new Array([$(this).data('displayname'), $(this).attr('name')]);
      }
      else {
        columns[p].push([$(this).data('displayname'), $(this).attr('name')]);
      }
    });
    return columns;
  } else {
    var columns = new Array();
    $("#Filter .filterCheckbox:checked").each(function() {
      columns.push([$(this).data('displayname'), $(this).attr('name')]);
    });
    return columns;
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
  if(safeobj(col).find('input.filterCheckbox:checked').length > 0){
    safeobj(col).find('input').prop('checked', false);
  }
  // Nothing checked - check everything
  else {
    safeobj(col).find('input').prop('checked', true);
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
          prettyobj(column_id).prop('checked', choices[column][choice]);
        }
      }
      prettyobj(preset).addClass('active');

    } else if (preset_type == "users_presets_dropdown") {
      // TODO - implement this
    }

    // Apply the filter
    load_samples_table();
  });
}

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
          if(v['status'] == 'open'){ label_class = 'danger'; v['status'] = 'Open'; }
          if(v['status'] == 'pending'){ label_class = 'info'; v['status'] = 'Pending'; }
          if(v['status'] == 'on-hold'){ label_class = 'warning'; v['status'] = 'On-Hold'; }
          if(v['status'] == 'solved'){ label_class = 'success'; v['status'] = 'Solved'; }
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
						var panel_label = ' &nbsp; <span class="label label-warning">Internal</span>';
            if (c['public']) {
              panel_class = 'default';
			  panel_label = '';
            }
            var updated_at = new Date(c['created_at']);
            ticket += '<div class="panel panel-'+panel_class+'">'+
                        '<div class="panel-heading">'+updated_at.toGMTString() + panel_label + '</div>'+
                        '<div class="panel-body"><pre>'+c['body']+'</pre></div>'+
                      '</div>';

          });
          $('#com_accordion').append(ticket);
        });
      }

      // Hide the loading modal
      $('#zendesk_loading_spinner').hide();
      $('#com_accordion').show();

    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        console.log( "ZenDesk tickets request failed: " + err );
    });
  }
}

function load_undefined_info(){
  $.getJSON("/api/v1/projects_fields?undefined=true", function(data) {
    $.each(data, function(column_no, column) {
      $("#undefined_project_info").append('<dt>' + column + '</dt><dd id="' + column + '"></dd>');
    });
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Couldn't load undefined fields: " + err );
  });
}

function load_all_udfs(){
  $.getJSON("/api/v1/project_summary/" + project, function (data) {
    $('#loading_spinner').hide();
    $('#page_content').show();

    // Project not found
    if(Object.getOwnPropertyNames(data).length == 0){
      $('#page_content').html('<h1>Error - Project Not Found</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t find the project <strong>'+project+'</strong></div>');
      return false;
    }

    $.each(data, function(key, value) {
      // Rename a few fields to something more sane
      if(key == 'Aborted'){ key = 'aborted_samples'; }
      if(key == 'In Progress'){ key = 'in_progress_samples'; }
      if(key == 'Finished'){ key = 'finished_samples'; }


      // Set the project name and status
      if (prettify(key) == 'project_name'){
        if (!data['portal_id']) {
          project_title = project + ", " + data['project_name'] + " (no order in NGI portal)";
        } else {
          project_title = project + ", " + data['project_name'] + ' &nbsp; <small>NGI Portal: <a href="https://portal.scilifelab.se/genomics/node/' + data['portal_id'] + '" target="_blank">' + data['customer_project_reference'] + '</a></small>';
        }
        prettyobj(key).html(project_title);
        prettyobj(key).attr('p_name', data['project_name']);

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
        safeobj(key).html(auto_format(value));
      }

      // Make the comments render Markdown and make project IDs into links
      else if (prettify(key) == 'project_comment'){
        value = value.replace(/\_/g, '\\_');
        $('#project_comment').html(make_markdown(value));
        check_img_sources($('#project_comment img'));
      }

      // Create the links for review and display the banner
      else if (prettify(key) == 'pending_reviews'){
        $("#review_ids").html(value);
        $("#review_alert").show();
      }

      // Pass / Fail sample counts
      else if (prettify(key) == 'passed_initial_qc' || prettify(key) == 'passed_library_qc'){
        var parts = value.split('/');
        if(parts[0].replace(/\D/g,'').length > 0 && parts[1].replace(/\D/g,'').length > 0){
          if(parts[0].replace(/\D/g,'') < parts[1].replace(/\D/g,'')){
            safeobj(key).html('<span class="label label-danger">'+value+'</span>');
          } else if(parts[0].replace(/\D/g,'') >= parts[1].replace(/\D/g,'')){
            safeobj(key).html('<span class="label label-success">'+value+'</span>');
          }
        } else {
          safeobj(key).html('<span class="label label-default">'+value+'</span>');
        }
      }

      // Everything else
      else {
			  if(prettyobj(key).length > 0){
					prettyobj(key).html(auto_format(value));
				} else if(safeobj(key).length > 0){
			  	safeobj(key).html(auto_format(value));
				} else {
					// console.log("Can't find field for "+key+': '+value+' (prettified key: '+prettify(key)+')');
				}
      }
    });

		// Check that we haven't hidden any fields that have content
		if($('#best_practice_analysis_completed').text() != '-'){
			$('.bp-dates').show();
		}
		if($('#aborted').text() != '-'){
			$('.aborted-dates').show();
		}

    // Everything has loaded - fix the missing 'days in production' if we can
    if($('#days_in_production').text() == '-' &&
        $('#open_date').text() != '-' &&
        $('#close_date').text() != '-'){

      var openDate = new Date($('#open_date').text());
      var closeDate = new Date($('#close_date').text());
      var timeDiff = Math.abs(closeDate.getTime() - openDate.getTime());
      var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      $('#days_in_production').text(diffDays);

    }

    // Make the page title reflect the page contents
    // Long string of functions is to remove <small>NGI Portal</small> text..
    document.title = $("#project_name").attr('p_name') + ' : Genomics Status';

		// Make the cool timescale bar if we can
		make_timescale();

    // Warn users about old projects
    old_project_warning('2010-07-1');

    // Check the height of the user comment
    check_fade_height();
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Couldn't load all udfs: " + err );
      $('#page_content').html('<h1>Error - Project Not Found</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t find the project <strong>'+project+'</strong></div>');
  });
};

function prettify(s, nospecialchars) {
  // Replaces whitespace with underscores. Replaces sequential _s with one
  // Removes trailing underscores
  if(typeof nospecialchars !== 'undefined' && nospecialchars == true){
    s = s.replace(/\W+/g, "");
  }
  s = s.toLowerCase().replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_/, "").replace(/_$/, "");
  return s
}

// These functions avoid parsing errors due to jQuery not liking element
// IDs with brackets in. Otherwise eqivalent to $('#'+s)
function prettyobj(s) {
  return $(document.getElementById(prettify(s)));
}
function safeobj(s) {
  return $(document.getElementById(s));
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
      tbl_head += '<abbr data-toggle="tooltip" title="Reads passing application QC criteria. If paired end, this is read pairs.">Million Reads Sequenced</abbr>';
    } else {
      tbl_head += column_tuple[0];
    }

    tbl_head += '</th>';
  });
  tbl_head += '</tr>';
  $("#samples_table_head").html(tbl_head);
}

function load_samples_table() {
  // Load the table header and get the filters
  var cols = read_current_filtering();
  load_table_head(cols);

  // Display the loading spinner in the table
  $("#samples_table_body").html('<tr><td colspan="'+cols.length+'" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');

  // Print each sample
  $.getJSON("/api/v1/project/" + project, function (samples_data) {
    columns = read_current_filtering(true);
    var tbl_body = "";
    var size = 0;

    // No samples
    if(Object.getOwnPropertyNames(samples_data).length == 0){
      $('#tab_samples_content').html('<div class="alert alert-info">Project <strong>'+project+'</strong> does not yet have any samples..</div>');
      return false;
    }

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
                var fc = info[column_id][i];
                // Remove the lane number and barcode - eg 6_FCID_GTGAAA
                fc = fc.substring(2);
                fc = fc.replace(/_[ACTG\-]+$/,'');
                tbl_row += '<samp class="nowrap"><a href="/flowcells/' + fc + '">' +
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

            // Make sure that 'million reads' has two decimal places
            else if (column_id == 'total_reads_(m)' && typeof info[column_id] !== 'undefined'){
              tbl_row += '<td class="' + column_id + ' text-right">' + Number(info[column_id]).toFixed(2) + '</td>';
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
            if (column_id == 'caliper_image'){
                tbl_row += '<td class="' + column_id + '">'+
                            '<span class="caliper_loading_spinner">'+
                              '<span class="glyphicon glyphicon-refresh glyphicon-spin"></span>  Loading image..</span>'+
                            '</span>'+
                            '<a id="caliper_thumbnail_'+info['scilife_name']+'" class="caliper-thumbnail loading" href="'+info['initial_qc'][column_id]+'" data-imgtype="Initial QC Caliper Image" data-samplename="'+info['scilife_name']+'"></a>'+
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

              // Special case for workset_name, which is a link to Genstat workset page
              if (column_id == "workset_name" && info_library[column_id]) {
                tbl_row += '<samp class="nowrap" title="Open Workset" data-toggle="tooltip"><a href="/workset/';
                tbl_row += info_library[column_id] + '" target="_blank">' + info_library[column_id] + '</a></samp><br>';
              }

              // Special case for workset_setup, which is a link to the LIMS
              else if (column_id == "workset_setup" && info_library[column_id]) {
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

        else if (subset == "library-validation-columns" && info['library_prep'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            tbl_row += '<td class="' + column_id + '">';
            $.each(info['library_prep'], function(library, info_library) {
              if ('library_validation' in info_library) {
                // We only want to show up the LIMS process ID with the higher number (the last one)
                var process_id = max_str(Object.keys(info_library['library_validation']));
                var validation_data = info_library['library_validation'][process_id];
                if (validation_data) {
                  validation_data[column_id] = round_floats(validation_data[column_id], 2);
                  // Caliper column
                  if(column_id == 'caliper_image'){
                       tbl_row += '<span class="caliper_loading_spinner">'+
                                     '<span class="glyphicon glyphicon-refresh glyphicon-spin"></span>  Loading image..</span>'+
                                   '</span>'+
                                   '<a id="caliper_thumbnail_'+info['scilife_name']+'" class="caliper-thumbnail loading" href="'+validation_data[column_id]+'" data-imgtype="Library Validation Caliper Image" data-samplename="'+info['scilife_name']+'"></a>';
                  }

                  // Remove the X from initial QC initials
                  else if(column_id == 'initials'){
                    var sig = validation_data[column_id];
                    if(sig.length == 3 && sig[2] == 'X'){
                      sig = sig.substring(0,2);
                    }
                    tbl_row += '<span class="label label-default" data-toggle="tooltip" title="Original signature: '+validation_data[column_id]+'">'+sig+'</span><br>';
                  }

                  // Everything else
                  else {
                    tbl_row += auto_format(validation_data[column_id], true);
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
                // We only want to show up the LIMS process ID with the higher number (the last one)
                var process_id = max_str(Object.keys(info_library['pre_prep_library_validation']));
                var validation_data = info_library['pre_prep_library_validation'][process_id];
                if (validation_data) {
                  validation_data[column_id] = round_floats(validation_data[column_id], 2);
                  tbl_row += auto_format(validation_data[column_id]);
                }
              }
            });
            tbl_row += '</td>';
          });
        }
        else if (subset == "bioinfo-columns" && info['run_metrics_data'] !== undefined) {
          $.each(fields, function(idx, column_tuple){
            var column_name = column_tuple[0];
            var column_id = column_tuple[1];
            tbl_row += '<td class="' + column_id + '">';
            $.each(info['run_metrics_data'], function(rmd, rmid) {
              val=parseFloat(rmid[column_id])
              if (val === 'NaN'){
                  tbl_row += auto_format(rmid[column_id]);
              }else{
               if(val % 1 === 0){
                  tbl_row += auto_format(val);
               }else{
                  tbl_row += auto_format(val.toFixed(2));
               }
              }
              tbl_row+='<br />';
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

    // Initialise the table sorting
    var columns = read_current_filtering(false);
    init_listjs(size, columns);

    // last step, update caliper images
    update_caliper();
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Couldn't load project samples: " + err );
  });
}
function update_caliper(){
  $.each($('.caliper-thumbnail'), function(){
    if($(this).hasClass('loading')){
        var imglink = $(this).attr('href');
        var el = $(this);
        if(imglink==="undefined"){
                el.append('<span class="label label-undefined">No caliper link</span>');
                el.prev('.caliper_loading_spinner').remove();
                el.removeClass('loading');
        } else {
            $.getJSON(imglink, function(data){
                el.append('<img src="data:image/png;base64,'+data+'">');
                el.prev('.caliper_loading_spinner').remove();
                el.removeClass('loading');
            }).fail(function(){
                el.append('<span class="label label-danger"><abbr title="'+imglink+' '+jqxhr.responseText+'">Error</abbr></span>');
                el.prev('.caliper_loading_spinner').remove();
                el.removeClass('loading');
            });
       }
   }
 });
}
function loadCaliperImageModal(target){
  var data = $(target).find('img').attr('src');
  var samplename = $(target).data('samplename');
  var imgtype = $(target).data('imgtype');
  var nextTarget = $(target).closest('tr').next().find('.caliper-thumbnail').attr('id');
  var prevTarget = $(target).closest('tr').prev().find('.caliper-thumbnail').attr('id');
  if(nextTarget === undefined){
    nextTarget = $('#samples_table_body').find('.caliper-thumbnail:first').attr('id');
  }
  if(prevTarget === undefined){
    prevTarget = $('#samples_table_body').find('.caliper-thumbnail:last').attr('id');
  }

  $('#caliperModal .modal-header h3').html(samplename+' <small>'+imgtype+'</small>');
  if(data === undefined){
    $('#caliper_modal_image_wrapper').html('<p class="help-block text-center">Data still loading. Please try again in a moment..</p>');
  } else {
    $('#caliper_modal_image_wrapper').html('<img src="'+data+'" title="'+name+'" />');
  }
  $('#caliperModal .right').attr('href', '#'+nextTarget);
  $('#caliperModal .left').attr('href', '#'+prevTarget);
  $('#caliperModal').modal();
}

// Bunch of functions here moved into base.js



// Get rid of the "read-more" if we're just not that big
function check_fade_height(){
  if($('#customer_project_description_wrapper').outerHeight() < 100){
    $('.fade-read-more').remove();
    $('#customer_project_description_wrapper').removeClass('showfade');
  }
}

// Fade the "read-more" customer comment
// Stolen from http://css-tricks.com/text-fade-read-more/
$('#customer_project_description_wrapper').hover(function(e){
  e.stopPropagation();
  $('.fade-read-more .btn').fadeIn();
}, function(e){
  e.stopPropagation();
  $('.fade-read-more .btn').fadeOut();
});

$('#customer_project_description_wrapper, #customer_project_description_wrapper .btn').click(function() {
	$('#customer_project_description_wrapper')
		.css({"height": $('#customer_project_description_wrapper').height(),
			"max-height": 9999})
		.animate({
			"height": $('#customer_project_description').height()
		});
	$('.fade-read-more').fadeOut();
	return false;
});



// Awesome dates timeline
$('#show_order_timeline').click(function(e){
  e.preventDefault();
  $('#project_timescale_production, #project_timescale_orderdates, #show_orderdates_btn, #hide_orderdates_btn').toggle();
});
function make_timescale(){
  make_timescale_bar('#project_timescale_production', false);
  make_timescale_bar('#project_timescale_orderdates', true);
}
// Fire tooltips on datestamp hover
$('.rawdate').hover(
  function(){
    $(".project_timescale").find("[data-datestamp='" + $(this).text() + "']").tooltip({html: true}).tooltip('show');
  }, function() {
    $(".project_timescale").find("[data-datestamp='" + $(this).text() + "']").tooltip('hide');
  }
);

function make_timescale_bar(tsid, include_orderdates){
	// Which elements are we looking at?
  var order_date_ids = [
      	'order_received',
      	'contract_sent',
      	'plates_sent',
      	'contract_received',
      	'sample_information_received',
      	'samples_received',
      	'open_date',
      	'first_initial_qc_start_date'
      ];
  var production_date_ids = [
  			'queued',
  			'library_prep_start',
  			'qc_library_finished',
  			'sequencing_start_date',
  			'all_samples_sequenced',
  			'all_raw_data_delivered',
  			'best_practice_analysis_completed',
  			'close_date',
  			'aborted'
  		];
  if(include_orderdates){
    date_ids = order_date_ids.concat(production_date_ids);
  } else {
    date_ids = production_date_ids;
  }

	var oldest = new Date();
  var opendate = new Date();
  var prodstart = new Date();
	var newest = new Date();
	var dates = {};
	$.each(date_ids, function(i, id){
		if($('#'+id).text() !== '-'){
      // Get date and nice description
      var el = $('#'+id);
      var rawdate = el.text();
			var dateobj = new Date(rawdate);
      var name = id;
			if(el.is('dd')){
				name = el.prev().text();
			} else if(el.is('span')){
				name = el.parent().prev().text();
			}
      // Push to hash
			if(typeof dates[rawdate] == 'undefined') {
				dates[rawdate] = [name];
			} else {
			  dates[rawdate].push(name);
			}
			if(dateobj.getTime() < oldest.getTime()){
				oldest = dateobj;
			}
      // Open date
			if(id == 'open_date'){
				opendate = dateobj;
			}
      // Production start date
			if(id == 'queued'){
				prodstart = dateobj;
			}
      // Close dates
			if(id == 'close_date' || id == 'aborted'){
				newest = dateobj;
			}
		}
	});

  // Which colours and timestops are we using?
  var cols = ['#82BFFF', '#5785FF', '#FFC521', '#FA4C47'];
  var colstops = [
        prodstart.getTime(),                        // prod start  - l blue
        prodstart.getTime() + (3*7*24*60*60*1000),  // 3 weeks - dark blue
        prodstart.getTime() + (6*7*24*60*60*1000),  // 6 weeks - orange
        prodstart.getTime() + (9*7*24*60*60*1000),  // 9 weeks - red
        newest.getTime()                            // End of bar
      ];
  if(include_orderdates){
    cols = ['#DEDEDE','#A8D0A2'].concat(cols);
    colstops = [oldest.getTime(), opendate.getTime()].concat(colstops);
  }
	if(oldest.getTime() < newest.getTime()){
		// Set up the CSS on the bar
		var range = newest.getTime() - oldest.getTime();
    var gradcols = [];
    var lastpercent = 0;
    $.each(colstops, function(j, thetime){
      if(thetime == oldest.getTime()){ return true; }
      var percent = ((thetime - oldest.getTime()) / range) * 100;
      gradcols.push(cols[j-1]+' '+lastpercent+'%, '+cols[j-1]+' '+percent+'%');
      lastpercent = percent;
    });

    // Make the bar coloured
		$(tsid).css('height', '2px');
		$(tsid).css("background-image", "-webkit-linear-gradient(left, "+gradcols.join(',')+")");
		$(tsid).css("background-image", "-moz-linear-gradient(right, "+gradcols.join(',')+")");
		$(tsid).css("background-image", "-o-linear-gradient(right, "+gradcols.join(',')+")");
		$(tsid).css("background-image", "linear-gradient(to right, "+gradcols.join(',')+")");

		// Put date objects onto the timeline
		$.each(dates, function(rawdate, names){
			var dateobj = new Date(rawdate);

      // Find the colour for this date
      var thiscol = cols[0];
      $.each(colstops, function(j, thetime){
        if(dateobj.getTime() > thetime){
          if(j == cols.length){
            thiscol = cols[j-1];
          } else {
            thiscol = cols[j];
          }
        }
      });

      // Write the hover text
      var timeDiff = dateobj.getTime() - prodstart.getTime();
      var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      var diffWeeks = 0;
      while(diffDays >= 7){ diffWeeks += 1; diffDays -= 7; }
      var diffdaystext = '';
      if(diffDays > 0 || diffWeeks > 0){
         diffdaystext = '<br><em>';
         if(diffWeeks > 0){ diffdaystext += diffWeeks + 'w '; }
         if(diffDays > 0){ diffdaystext += diffDays + 'd'; }
         diffdaystext += ' since queue date</em>';
      }

      // Work out where to place the tick and plot it
			var percent = ((dateobj.getTime() - oldest.getTime()) / range) * 100;
			$(tsid).append('<div class="timelineTarget" style="left:'+percent+'%;" data-datestamp="'+rawdate+'" data-toggle="tooltip" data-placement="bottom" title="'+rawdate+'<br><strong>'+names.join('</strong><br><strong>')+'</strong>'+diffdaystext+'"><div class="timelineTick" style="background-color:'+thiscol+';"></div></div>');

      // Coloured borders next to dates in table
      $(':contains('+rawdate+')').filter(function(){ return $(this).children().length === 0;}).css('border-right', '2px solid '+thiscol).css('padding-right','5px');
		});
	}
}


///////////////////
////// BIOINFO ANALYSIS code
///////////////////

// Static config vars
var bioinfo_api_url = '/api/v1/bioinfo_analysis/'+project;
var bioinfo_states = ['Ongoing', 'Delivered'];
var bioinfo_states_classes = ['label-danger', 'label-success'];
var bioinfo_classes = ['unknown', 'success', 'warning', 'danger', 'active'];
var bioinfo_texts = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];

// Build bioinfo table - main loading spinner waits for this function
function load_bioinfo_table() {

  // Hide the application-specific columns
  var app_classes = {
    'rnaseq': ['RNA-seq (total RNA)', 'RNA-seq (RiboZero)', 'RNA-seq (mRNA)', 'stranded RNA-seq (total RNA)', 'cDNA', 'stranded RNA-seq (RiboZero)'],
    'exome': ['Exome capture'],
    'customCap': ['Custom capture'],
    'WGreseq': ['WG re-seq', 'WG re-seq (IGN)'],
    'denovo': ['de novo', 'Mate-pair', 'Mate-pair (short insert)', 'Mate-pair (long insert)']
  };
  $('[class^=bioinfo-app-]').hide();

  return $.getJSON(bioinfo_api_url, function (data) {

    // Show the columns that we need
    if($('#type').text() == 'Application'){
      $('.bioinfo-app-applications').show();
    }
    var thisapp = $('#application').text();
    $.each(app_classes, function(key, arr){
      if(arr.indexOf(thisapp) != -1){
        $('.bioinfo-app-'+key).show();
      }
    });

    // Hide the loading row and build the real runs based on the template
    $('#bioinfo-noruns').hide();
    var templaterow = $('#bioinfo-template-row').attr('id', '').show().detach();
    var field_names = [];
    $('.bioinfo-field-names th').each(function(i){
      // First cell in data rows is th not td, so i-1 to avoid offset
      field_names[i-1] = prettify($(this).text(), true);
    });
    $.each(data, function(key, vals){
      // Start by copying the template row
      var tr = templaterow.clone();

      // Flowcell and status
      var url_key = key.replace(/_.+_/g, '_');
      tr.find('th.bioinfo-status-runid samp').html('<a href="../flowcells/'+url_key+'">'+key+'</a>');
      tr.find('td.bioinfo-status-runstate span').text(vals.status);
      var bsi = bioinfo_states.indexOf(vals.status);
      if(bsi != -1){
        tr.find('td.bioinfo-status-runstate span').removeClass('label-default').addClass(bioinfo_states_classes[bsi]);
      }
      // Set the values for the row
      tr.children('td').each(function(i){
        if(field_names[i] in vals.values){
          if($(this).hasClass('bioinfo-status-pfw')){
            var state = vals.values[field_names[i]];
            $(this).text(state);
            var si = bioinfo_texts.indexOf(state);
            if(si != -1){
              $(this).removeClass('unknown').addClass(bioinfo_classes[si]);
            }
          } else {
            if($(this).find('input').length > 0){
              $(this).find('input').val(vals.values[field_names[i]]);
            }
          }
        }
      });
      // Add to table
      $('.table-bioinfo-status').append(tr);
    });

    // Set rows as disabled if they're not ready yet
    var enabled_statues = ['Ongoing', 'Delivered'];
    $('.table-bioinfo-status tr:has(td)').each(function(){
      var status = $(this).find('.bioinfo-status-runstate span').text();
      if(enabled_statues.indexOf(status) == -1){
        $(this).addClass('bioinfo-status-disabled');
        $(this).find('input').attr('disabled', true);
      }
    });

  }).fail(function( jqxhr, textStatus, error ) {
    var numcols = 0; // I doubt that anyone will notice this. But I'm OCD.
    $(".bioinfo-field-names th").each(function(){ numcols += $(this).css('display') != 'none' ? 1 : 0; });
    $('#bioinfo-noruns').addClass('danger');
    $('#bioinfo-noruns td').attr('colspan', numcols).html("Error loading bioinfo analysis data: <code>"+textStatus+"</code>, <code>"+error+'</code>');
  });
}

$(document).ready(function() {

  // Run ID status - individual runs
  $('.table-bioinfo-status').on('click', '.bioinfo-status-runstate', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if(!isdisabled){
      var i = bioinfo_states.indexOf($(this).text());
      if(i >= 0){
        if(typeof bioinfo_states[i+1] !== 'undefined') {
          $(this).children('span').text(bioinfo_states[i+1]);
          $(this).children('span').removeClass(bioinfo_states_classes[i]).addClass(bioinfo_states_classes[i+1]);
        } else {
          $(this).children('span').text(bioinfo_states[0]);
          $(this).children('span').removeClass(bioinfo_states_classes[i]).addClass(bioinfo_states_classes[0]);
        }
      }
      // Update the select box
      var states = [];
      $('.bioinfo-status-runstate').each(function(){
        var s = $(this).text();
        if(states.indexOf(s) == -1){ states.push(s); }
      });
      if(states.length == 1){
        $('#bioinfo_set-status').val(states[0]);
      } else {
        $('#bioinfo_set-status').val('[ different values ]');
      }
    }
  });

  // Passed / Warn / Fail / NA cells
  $('.table-bioinfo-status').on('click', 'td.bioinfo-status-pfw', function(e) {
    e.stopImmediatePropagation(); // fires twice otherwise.
    var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
    $(this).closest('tr').hasClass('bioinfo-status-disabled');
    if(!isdisabled){
      var td = $(this);
      $.each(bioinfo_classes, function(i, val){
        if(td.hasClass(val)){
          td.removeClass(val);
          if(typeof bioinfo_classes[i+1] !== 'undefined') {
            td.addClass(bioinfo_classes[i+1]);
            td.text(bioinfo_texts[i+1]);
          } else {
            td.addClass(bioinfo_classes[0]);
            td.text(bioinfo_texts[0]);
          }
          return false;
        }
      });
    }
  });

  // Datepickers
  $('.table-bioinfo-status').on('focus', '.input-group.date input', function() {
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
      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth()+1; //January is 0!
      if(dd<10) { dd='0'+dd }
      if(mm<10) { mm='0'+mm }
      today = today.getFullYear()+'-'+mm+'-'+dd;
      $(this).prevAll("input:first").val(today);
    }
  });

  // Copy first row
  $('#bioinfo-status-copyFirstRow').click(function(e){
    e.preventDefault();
    e.stopImmediatePropagation(); // fires twice otherwise.
    var states = [];
    var input_vals = [];
    $('.table-bioinfo-status tr:has(td)').each(function(){
      var tr = $(this);
      var isdisabled = tr.hasClass('bioinfo-status-disabled');
      if(!isdisabled){
        if(states.length == 0){
          tr.children('td').each(function(i){
            if($(this).hasClass('bioinfo-status-pfw')){
              states[i] = $(this).text();
            } else {
              if($(this).find('input').length > 0){
                input_vals[i] = $(this).find('input').val();
              }
            }
          });
        } else {
          tr.children('td').each(function(i){
            if($(this).hasClass('bioinfo-status-pfw')){
              $(this).text(states[i]);
              $(this).removeClass().addClass('bioinfo-status-pfw');
              $(this).addClass(bioinfo_classes[bioinfo_texts.indexOf(states[i])]);
            } else if($(this).find('input').length > 0){
              $(this).find('input').val(input_vals[i]);
            }
          });
        }
      }
    });
  });

  // Set all states dropdown box
  $('#bioinfo_set-status').change(function(){
    var state = $(this).val();
    if(state !== '[ different values ]'){
      $('.table-bioinfo-status tr:has(td)').each(function(){
        var isdisabled = $(this).closest('tr').hasClass('bioinfo-status-disabled');
        if(!isdisabled){
          $(this).find('.bioinfo-status-runstate span').text(state).
            removeClass().addClass('label '+bioinfo_states_classes[bioinfo_states.indexOf(state)]);
        }
      });
    }
  });

  //////
  // SAVE CHANGES
  //////
  $('#bioinfo-status-saveButton').click(function(e){
    e.preventDefault();
    e.stopImmediatePropagation(); // fires twice otherwise.

    // Build the JSON object
    var runs = {};
    var field_names = [];
    $('.bioinfo-field-names th:visible').each(function(i){
      // First cell in data rows is th not td, so i-1 to avoid offset
      field_names[i-1] = prettify($(this).text(), true);
    });
    $('.table-bioinfo-status tr:visible:has(td)').each(function(){
      var runid = $(this).find('th.bioinfo-status-runid').text();
      var status = $(this).find('.bioinfo-status-runstate span').text();
      var vals = {
        uppnex_confirmed: $("#uppnex_id_confirmed").is(':checked') ? 'true' : 'false'
      };
      $(this).children('td:visible').each(function(i){
        if($(this).hasClass('bioinfo-status-pfw')){
          vals[field_names[i]] = $(this).text();
        } else {
          if($(this).find('input').length > 0){
            vals[field_names[i]] = $(this).find('input').val();
          }
        }
      });
      runs[runid] = {project_id: project, status: status, values: vals};
    });

    $('#bioinfo-status-saveButton').addClass('disabled').text('Saving..');
    $.ajax({
      async: false,
      type: 'POST',
      url: bioinfo_api_url,
      dataType: 'json',
      data: JSON.stringify(runs),
      error: function(xhr, textStatus, errorThrown) {
        alert('There was an error saving the bioinformatics statuses: '+errorThrown);
        $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
        console.log(xhr); console.log(textStatus); console.log(errorThrown);
      },
      success: function(data, textStatus, xhr) {
        $('#bioinfo-status-saveButton').removeClass('disabled').text('Save Changes');
      }
    });

  });

});


// Warn users about old projects
function old_project_warning(warndate_raw){
  var openDate = new Date($('#open_date').text());
  var warnDate = new Date(warndate_raw);
  if(openDate.getTime() < warnDate.getTime()){
    $('#old_project_warning').show();
    $('#old_project_warning').attr('title', 'This project was created before '+warndate_raw+'.<br>Genomics Status may be inaccruate.');
  }
}
function load_charon_summary(){
  $.getJSON("/api/v1/charon_summary/"+ project, function(data) {
      if (data['tot'] != 0){
          $('#charon-status').show();
          $('#charon-status-tot').text(data['tot']);
          $('#charon-status-seq').text(data['seq']);
          $('#charon-status-ana').text(data['ana']);
          $('#charon-status-passed').text(data['passed']);
          $('#charon-status-failed').text(data['failed']);
          $('#charon-status-runn').text(data['runn']);
          $('#charon-status-hge').text(data['hge']);
      }
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Couldn't load charon data: " + err );
  });


}
