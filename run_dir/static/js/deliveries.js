/*
File: deliveries.js
URL: /static/js/deliveries.js
Powers /deliveries/ - template is run_dir/design/deliveries.html
*/

// Static config vars
var bioinfo_api_url = '/api/v1/bioinfo_analysis/';
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

  $.getJSON(bioinfo_api_url, function (data) {

    $('#loading_spinner').hide();
    $('#page_content').show();

    // Hide the loading row and build the real runs based on the template
    if(Object.keys(data).length == 0){
      $('#ongoing_deliveries, #incoming_deliveries').html('<div class="alert alert-info">No active deliveries found.</div>');
    } else {
      var run_template = $('#ongoing_deliveries .ongoing-delivery table tbody tr').detach();
      var project_template = $('#ongoing_deliveries .ongoing-delivery').detach();
      $.each(data, function(pid, runs){
        var p = project_template.clone();
        p.find('.bi-project-id').text(pid);
        $.each(runs, function(i, runs){
          for (runid in runs){ // should only be one, but just in case
            var r = run_template.clone();
            var run = runs[runid];

            // Main fields
            r.find('.bi-runid samp a').text(runid);
            r.find('.bi-runid samp a').attr('href', runid.replace(/_.+_/g, '_'));
            r.find('.bi-run-status span').text(run['status']).
                  removeClass('label-default').
                  addClass(bioinfo_states_classes[bioinfo_states.indexOf(run['status'])]);

            // Progress bar
            var total = passed = warnings = fails = NAs = unsets = 0;
            $.each(run, function(key, val){
              var ignore = true;
              if(app_fields['core'].indexOf(key) > -1){ ignore = false; }
              if(!ignore){
                console.log(key);
                total += 1;
                switch(val){
                  case 'Pass': passed += 1; break;
                  case 'Warning': warnings += 1; break;
                  case 'Fail': fails += 1; break;
                  case 'N/A': NAs += 1; break;
                  case '?': unsets += 1; break;
                  // TODO - BROKEN
                  case /\d\d\d\d-\d\d-\d\d/.test(val): passed += 1; break;
                  default: console.log('DEFAULT: "'+val+'"');
                }
              }
            });
            total -= NAs;
            r.find('.bi-run-pwf .progress .progress-bar-success').css('width', (passed / total) * 100).attr('title', passed+ ' Passes');
            r.find('.bi-run-pwf .progress .progress-bar-warning').css('width', (warnings / total) * 100).attr('title', warnings+ ' Warnings');
            r.find('.bi-run-pwf .progress .progress-bar-danger').css('width', (fails / total) * 100).attr('title', fails+ ' Fails');

            // Add to table
            p.find('table tbody').append(r);
          }
        });
        $('#ongoing_deliveries').append(p);
      });
    }


  }).fail(function( jqxhr, textStatus, error ) {
    $('#loading_spinner').hide();
    $('#page_content').show().html('<h1>Error - Delivery Information Not Loaded</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t load the deliveries info. Please try again later or contact one of the genomics status team.</div>');
  });

});
