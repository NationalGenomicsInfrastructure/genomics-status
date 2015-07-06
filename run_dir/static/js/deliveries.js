/*
File: deliveries.js
URL: /static/js/deliveries.js
Powers /deliveries/ - template is run_dir/design/deliveries.html
*/

// Static config vars
var deliveries = {
  'ongoing': {
    'url': '/api/v1/bioinfo_analysis/?status=Ongoing',
    'container_id': '#ongoing_deliveries'
  },
  'incoming': {
    'url': '/api/v1/bioinfo_analysis/?status=Incoming',
    'container_id': '#incoming_deliveries'
  }
};
var bioinfo_states = ['Ongoing', 'Delivered', 'Aborted'];
var bioinfo_states_classes = ['label-warning', 'label-success', 'label-danger'];
var bioinfo_classes = ['unknown', 'success', 'warning', 'danger', 'active'];
var bioinfo_texts = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];
var editable_statuses = ['Ongoing']; // This started off as a list - leaving it as a list to make it easy to extend
var statusonly_statuses = ['Delivered'];
var app_classes = {
  'finished': ['Finished library'],
  'rnaseq': ['RNA-seq (total RNA)', 'RNA-seq (RiboZero)', 'RNA-seq (mRNA)', 'stranded RNA-seq (total RNA)', 'cDNA', 'stranded RNA-seq (RiboZero)'],
  'exome': ['Exome capture'],
  'customCap': ['Custom capture'],
  'WGreseq': ['WG re-seq', 'WG re-seq (IGN)'],
  'denovo': ['de novo', 'Mate-pair', 'Mate-pair (short insert)', 'Mate-pair (long insert)']
};
var app_fields = {
  'core': ["undemultiplexedreads","unexpectedindexes","lowsampleyield","laneyield","sampleyield","phixerrorrate","basesq30","fastq_screen","blast_wrapper","samplereport","projectreport","dataandreportstransferred","emailsenttouser"],
  'finished': [],
  'rnaseq': ["rnaseq_sequenceduplication","rnaseq_uniquemappingrate"],
  'exome': ["exome_sequenceduplication","exome_targets10xcoverage"],
  'customCap': ["customCap_enrichment"],
  'WGreseq': ["WGreseq_sequenceduplication","WGreseq_mappingrate"],
  'denovo': ["denovo_adaptertrimming","denovo_kmerprofile"],
  'applications': ["applications_datadelivered","applications_dataapproved"]
}
var notetype = 'project';
var project = '';
var flowcell = '';

//
// BUILD THE PAGE
//

$(document).ready(function() {

  $.each(app_classes, function(c, apps){
    $.each(apps, function(i, app){
      $('#bioinfo-filter-application').append('<option>'+app+'</option>');
    });
  });

  // Get the template HTML
  var run_template = $('#ongoing_deliveries .delivery table tbody tr').detach();
  var project_template = $('#ongoing_deliveries .delivery').detach();

  $.each(deliveries, function(type, d){

    $.getJSON(d['url'], function (data) {

      // Hide the loading row and build the real runs based on the template
      var pids = Object.keys(data).sort();
      if(pids.length == 0){
        $(d['container_id']).html('<div class="alert alert-info">No active deliveries found.</div>');
      } else {

        // Get the project data
        $.getJSON('/api/v1/projects?list='+pids.join(','), function (pdata) {

          $.each(pids, function(i, pid){
            var runs = data[pid];
            var p = project_template.clone();

            // Main project fields
            p.find('.bi-project-id').text(pid).attr('href', 'project/'+pid);
            p.find('.bi-project-name').text(pdata[pid]['project_name']);
            p.find('.bi-project-application').text(pdata[pid]['application']);
            p.find('.bi-project-facility').text(pdata[pid]['type']);
            if(pdata[pid]['type'] == 'Application'){
              p.find('.bi-project-facility').removeClass('label-primary').addClass('label-success');
            }
            p.find('.bi-project-assigned').text(pdata[pid]['bioinfo_responsible']);
            if (pdata[pid]['latest_running_note'] !== '') {
              var noteobj = JSON.parse(pdata[pid]['latest_running_note']);
              var ndate = Object.keys(noteobj)[0];
              var note = $(make_markdown(noteobj[ndate]['note'])).find('div, p').contents().unwrap();
              p.find('.bi-project-note').html(note);
            }

            // Progress bar total count
            var total = app_fields['core'].length;
            $.each(app_classes, function(appclass, apps){
              if(apps.indexOf(pdata[pid]['application']) > -1){
                total += app_fields[appclass].length;
              }
            });
            if(pdata[pid]['type'] == 'Application'){
              total += app_fields['applications'].length;
            }

            $.each(runs, function(runid, run){
              var r = run_template.clone();
              var flowcell = runid.replace(/_.+_/g, '_');

              // Main run fields
              r.find('.bi-runid samp a').text(runid);
              r.find('.bi-runid samp a').attr('href', '/flowcells/'+flowcell);
              r.find('.bi-run-status span').text(run['status']);
              var stat_index = bioinfo_states.indexOf(run['status']);
              if(stat_index !== -1){
                r.find('.bi-run-status span').removeClass('label-default').addClass(bioinfo_states_classes[stat_index]);
              }

              // Progress bar
              var passed = warnings = fails = NAs = unsets = 0;
              var dateregex = new RegExp(/\d{4}-\d{2}-\d{2}/);

              $.each(run, function(key, val){

                var ignore = true;
                if(app_fields['core'].indexOf(key) > -1){ ignore = false; }
                if(pdata[pid]['type'] == 'Application'){
                  if(app_fields['applications'].indexOf(key) > -1){ ignore = false; }
                }
                $.each(app_classes, function(appclass, apps){
                  if(apps.indexOf(pdata[pid]['application']) > -1){
                    if(app_fields[appclass].indexOf(key) > -1){
                      ignore = false;
                    }
                  }
                });

                if(!ignore){
                  // console.log(key);
                  switch(val){
                    case 'Pass': passed += 1; break;
                    case 'Warning': warnings += 1; break;
                    case 'Fail': fails += 1; break;
                    case 'N/A': NAs += 1; break;
                    case '?': unsets += 1; break;
                    default: if(dateregex.test(val)){ passed += 1; }
                  }
                }
              });
              total -= NAs;
              r.find('.bi-run-pwf .progress .progress-bar-success').css('width', ((passed / total) * 100)+'%').attr('title', passed+ ' Passes');
              r.find('.bi-run-pwf .progress .progress-bar-warning').css('width', ((warnings / total) * 100)+'%').attr('title', warnings+ ' Warnings');
              r.find('.bi-run-pwf .progress .progress-bar-danger').css('width', ((fails / total) * 100)+'%').attr('title', fails+ ' Fails');
              if((passed + warnings + fails) < total){
                r.find('.bi-run-pwf').addClass('warning');
              } else {
                r.find('.bi-run-pwf').addClass('success');
              }

              // Get the flow cell running notes
              if(type == 'ongoing'){
                $.getJSON('/api/v1/flowcell_notes/'+flowcell, function (fcrn) {
                  var printnote = '-';
                  if(Object.keys(fcrn).length > 0){
                    $.each(fcrn, function(date, note){
                      if(note['note'].indexOf(pid) > -1){
                        note['note'] = note['note'].replace(pid+': ', '');
                        printnote = $(make_markdown(note['note'])).find('div, p').contents().unwrap();
                      }
                    });
                  }
                  r.find('.bi-run-note > span').html(printnote);
                });
              }

              // Add to table
              p.find('table tbody').append(r);
            });

            // Remove stuff if we're incoming
            if(type == 'incoming'){
              p.find('.hide-incoming').remove();
            }

            // Add everything to the DOM and show
            $(d['container_id']).append(p);
            $(d['container_id']+' .loading_spinner').hide();
            $(d['container_id']+' .delivery-filters').show();

          }); // loop through runs
        }); // Get project data

      }


    }).fail(function( jqxhr, textStatus, error ) {
      $('#loading_spinner').hide();
      $('#page_content').show().html('<h1>Error - Delivery Information Not Loaded</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t load the deliveries info. Please try again later or contact one of the genomics status team.</div>');
    });

  });

  ///////////////////////////
  // Running notes modals
  ///////////////////////////
  $('#ongoing_deliveries').on('click', '.runningNotesModal_button', function(e){
    // Set up our variables - make global
    notetype = 'project';
    project = $(this).closest('div').find('.bi-project-id').text();
    $('#runningNotesModal_title').text('Project Running Notes: '+project);
    if($(this).hasClass('fc_runningNotes')){
      notetype = 'flowcell';
      flowcell = $(this).closest('tr').find('.bi-runid samp a').text();
      $('#runningNotesModal_title').html('Flow Cell Running Notes: <code>'+flowcell+'</code>');
    }
    // Prepare the modal
    $('.runningNotesModal_loadingSpinner').show();
    $('#running_notes_panels').hide();
    $('#running_notes_form').hide();
    $('#new_note_text').val('');
    $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');

    $.when(load_running_notes()).done(function(){
      $('.runningNotesModal_loadingSpinner').hide();
      $('#running_notes_panels').show();
      $('#running_notes_form').show();
    });
  });

  ///////////////////////////
  // Filters
  ///////////////////////////
  function update_deliveries_filters(){
    var assigned = $('#bioinfo-filter-assigned').val();
    var completed = $('#bioinfo-filter-completion').val();
    var app = $('#bioinfo-filter-application').val();
    var facility = $('#bioinfo-filter-facility').val();
    var hidden = 0;
    $('#ongoing_deliveries .delivery').show();
    $('#bioinfo-filter-notification').hide();
    $('#ongoing_deliveries .delivery').each(function(){
      var hide = false;
      if(assigned !== 'Anyone' && $(this).find('.bi-project-assigned').text() !== assigned){
        hide = true;
      }
      if(app !== 'Any' && $(this).find('.bi-project-application').text() !== app){
        hide = true;
      }
      if(facility !== 'Any' && $(this).find('.bi-project-facility').text() !== facility){
        hide = true;
      }
      if(hide){
        $(this).hide();
        hidden += 1;
      }
    });
    if(hidden > 0){
      $('#bioinfo-filter-notification').show().find('span').text('Hiding '+hidden+' projects with filters..');
    }
  }
  $('.deliveries-filters select').change(function(){
    update_deliveries_filters();
  });
  $('#bioinfo-clear-filters').click(function(e){
    e.preventDefault();
    $('#bioinfo-filter-assigned').val($('#bioinfo-filter-assigned option:first').val());
    $('#bioinfo-filter-completion').val($('#bioinfo-filter-completion option:first').val());
    $('#bioinfo-filter-application').val($('#bioinfo-filter-application option:first').val());
    $('#bioinfo-filter-facility').val($('#bioinfo-filter-facility option:first').val());
    update_deliveries_filters();
  });

});

//
// PAGE INTERACTION
//

// Click individual status label
$('#ongoing_deliveries').on('click', '.bi-run-status', function(e){
  e.stopImmediatePropagation(); // fires twice otherwise.
  var i = bioinfo_states.indexOf($(this).text());
  if(i >= 0){
    if(typeof bioinfo_states[i+1] !== 'undefined') {
      $(this).children('span').text(bioinfo_states[i+1]);
      $(this).children('span').removeClass(bioinfo_states_classes[i]).addClass(bioinfo_states_classes[i+1]);
    } else {
      $(this).children('span').text(bioinfo_states[0]);
      $(this).children('span').removeClass(bioinfo_states_classes[i]).addClass(bioinfo_states_classes[0]);
    }
    $(this).closest('.delivery').find('.deliveries-save-project').removeAttr('disabled');
  }
});

// Set all delivered / aborted buttons
$('#ongoing_deliveries').on('click', '.deliveries-project-delivered', function(e){
  e.stopImmediatePropagation(); // fires twice otherwise.
  $(this).closest('.delivery').find('.bi-run-status span').removeClass().addClass('label label-success').text('Delivered');
  $(this).closest('.delivery').find('.deliveries-save-project').removeAttr('disabled');
});
$('#ongoing_deliveries').on('click', '.deliveries-project-aborted', function(e){
  e.stopImmediatePropagation(); // fires twice otherwise.
  $(this).closest('.delivery').find('.bi-run-status span').removeClass().addClass('label label-danger').text('Aborted');
  $(this).closest('.delivery').find('.deliveries-save-project').removeAttr('disabled');
});

// Save project statuses
$('#ongoing_deliveries').on('click', '.deliveries-save-project', function(e){
  e.stopImmediatePropagation(); // fires twice otherwise.
  // Shouldn't ever happen. Just in case..
  if($(this).is(':disabled')){ alert('disabled!'); return false; }

  // Collect elements for later
  var save_button = $(this);
  var delivery = $(this).closest('.delivery');
  save_button.text('Saving..').attr('disabled', true);

  // Get the current data for this project
  var pid = delivery.find('.bi-project-id').text();
  if(pid.length > 0){
    $.getJSON('/api/v1/bioinfo_analysis/'+pid, function (data) {

      // Loop through each run ID and update status
      $.each(data, function(runid, run){
        var runstatus = delivery.find('.bi-runid:contains('+runid+')').parent().find('.bi-run-status').text();
        // Some data munging to get it into the expected format
        data[runid] = {
          'project_id': pid,
          'status': runstatus,
          'values': data[runid]
        };
        delete data[runid]['values']['project_id'];
        delete data[runid]['values']['user'];
        delete data[runid]['values']['timestamp'];
        delete data[runid]['values']['status']; // this is the old status, don't worry
      });

      // Resubmit updated object back to the database
      $.ajax({
        type: 'POST',
        url: '/api/v1/bioinfo_analysis/'+pid,
        dataType: 'json',
        data: JSON.stringify(data),
        error: function(xhr, textStatus, errorThrown) {
          alert('There was an error saving the delivery statuses for project '+pid+': '+errorThrown);
          save_button.removeAttr('disabled').text('Save Changes');
          console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(JSON.stringify(runs));
        },
        success: function(data, textStatus, xhr) {
          save_button.text('Save Changes');
          var success_msg = $('<span class="delivery-saved-status">Changes saved <span class="glyphicon glyphicon-ok"></span></span>');
          success_msg.prependTo(save_button.parent()).delay(1500).fadeOut(1500, function(){ $(this).remove(); });
        }
      });



    }); // loading previous project data
  } // PID check
});
