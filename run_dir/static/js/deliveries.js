/*
File: deliveries.js
URL: /static/js/deliveries.js
Powers /deliveries/ - template is run_dir/design/deliveries.html
*/

// Static config vars
var bioinfo_api_url = '/api/v1/bioinfo_analysis/';
var bioinfo_states = ['Ongoing', 'Delivered'];
var bioinfo_states_classes = ['label-danger', 'label-success'];
var bioinfo_classes = ['unknown', 'success', 'warning', 'danger', 'active'];
var bioinfo_texts = ['?', 'Pass', 'Warning', 'Fail', 'N/A'];
var editable_statuses = ['Ongoing']; // This started off as a list - leaving it as a list to make it easy to extend
var statusonly_statuses = ['Delivered'];

$(document).ready(function() {

  $.getJSON(bioinfo_api_url, function (data) {

    $('#loading_spinner').hide();
    $('#page_content').show();
    console.log(data);

    // Hide the loading row and build the real runs based on the template
    if(Object.keys(data).length == 0){
      $('#ongoing_deliveries, #incoming_deliveries').html('<div class="alert alert-info">No active deliveries found.</div>');
    } else {
      $.each(data, function(key, vals){
        var url_key = key.replace(/_.+_/g, '_');
      });
    }


  }).fail(function( jqxhr, textStatus, error ) {
    $('#loading_spinner').hide();
    $('#page_content').show().html('<h1>Error - Delivery Information Not Loaded</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t load the deliveries info. Please try again later or contact one of the genomics status team.</div>');
  });

});
