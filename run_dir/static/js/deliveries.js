/*
File: deliveries.js
URL: /static/js/deliveries.js
Powers /deliveries/ - template is run_dir/design/deliveries.html
*/

// Static config vars
var bioinfo_urls = {
  'ongoing': '/api/v1/bioinfo_analysis/?status=Ongoing',
  'incoming': '/api/v1/bioinfo_analysis/?status=Incoming'
};
var bioinfo_states = ['Ongoing', 'Delivered', 'Aborted'];
var bioinfo_states_classes = ['label-warning', 'label-success', 'label-danger'];
var bioinfo_classes = ['unknown', 'success', 'warning', 'danger', 'active'];
var bioinfo_texts = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];
var editable_statuses = ['Ongoing']; // This started off as a list - leaving it as a list to make it easy to extend
var statusonly_statuses = ['Delivered'];
var app_classes = {
  'rnaseq': ['RNA-seq (total RNA)', 'RNA-seq (RiboZero)', 'RNA-seq (mRNA)', 'stranded RNA-seq (total RNA)', 'cDNA', 'stranded RNA-seq (RiboZero)'],
  'exome': ['Exome capture'],
  'customCap': ['Custom capture'],
  'WGreseq': ['WG re-seq', 'WG re-seq (IGN)'],
  'denovo': ['de novo', 'Mate-pair', 'Mate-pair (short insert)', 'Mate-pair (long insert)']
};
var app_fields = {
  'core': ["undemultiplexedreads","unexpectedindexes","lowsampleyield","laneyield","sampleyield","phixerrorrate","basesq30","fastq_screen","blast_wrapper","samplereport","projectreport","dataandreportstransferred","emailsenttouser"],
  'rnaseq': ["rnaseq_sequenceduplication","rnaseq_uniquemappingrate"],
  'exome': ["exome_sequenceduplication","exome_targets10xcoverage"],
  'customCap': ["customCap_enrichment"],
  'WGreseq': ["WGreseq_sequenceduplication","WGreseq_mappingrate"],
  'denovo': ["denovo_adaptertrimming","denovo_kmerprofile"],
  'applications': ["applications_datadelivered","applications_dataapproved"]
}

$(document).ready(function() {

  $.each(app_classes, function(c, apps){
    $.each(apps, function(i, app){
      $('#bioinfo-filter-application').append('<option>'+app+'</option>');
    });
  });

  $.each(bioinfo_urls, function(delivery_type, bioinfo_api_url){
    console.log(bioinfo_api_url);
    $.getJSON(bioinfo_api_url, function (data) {

      // Hide the loading row and build the real runs based on the template
      var pids = Object.keys(data);
      if(pids.length == 0){
        $('#ongoing_deliveries, #incoming_deliveries').html('<div class="alert alert-info">No active deliveries found.</div>');
      } else {
        // Get the template HTML
        var run_template = $('#ongoing_deliveries .ongoing-delivery table tbody tr').detach();
        var project_template = $('#ongoing_deliveries .ongoing-delivery').detach();

        // Get the project data
        $.getJSON('/api/v1/projects?list='+pids.join(','), function (pdata) {

          $.each(data, function(pid, runs){
            var p = project_template.clone();

            // Main project fields
            p.find('.bi-project-id').text(pid);
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

            $.each(runs, function(runid, run){
              var r = run_template.clone();
              var flowcell = runid.replace(/_.+_/g, '_');

              // Main run fields
              r.find('.bi-runid samp a').text(runid);
              r.find('.bi-runid samp a').attr('href', '/flowcells/'+flowcell);
              r.find('.bi-run-status span').text(run['status']).
                    removeClass('label-default').
                    addClass(bioinfo_states_classes[bioinfo_states.indexOf(run['status'])]);

              // Progress bar
              var total = passed = warnings = fails = NAs = unsets = 0;
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
                  total += 1;
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
              if(unsets > 0){
                r.find('.bi-run-pwf').addClass('warning');
              } else {
                r.find('.bi-run-pwf').addClass('success');
              }

              // Get the flow cell running notes
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

              // Add to table
              p.find('table tbody').append(r);
            });

            // Add everything to the DOM and show
            $('#ongoing_deliveries').append(p);
            $('#loading_spinner').hide();
            $('#page_content').show();

          }); // loop through runs
        }); // Get project data

      }


    }).fail(function( jqxhr, textStatus, error ) {
      $('#loading_spinner').hide();
      $('#page_content').show().html('<h1>Error - Delivery Information Not Loaded</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t load the deliveries info. Please try again later or contact one of the genomics status team.</div>');
    });

  });

});
