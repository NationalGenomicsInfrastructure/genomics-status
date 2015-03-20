/*
File: suggestion_box.js
URL: /static/js/suggestion_box.js
Powers /suggestion_box - template is run_dir/design/suggestion_box.html
*/

function fill_suggestions_table() {
  $.getJSON('/api/v1/suggestions', function(data) {
    $("#suggestionsTableBody").empty();
    var activeCards = [];
    var archivedCards = [];

    $.each(data, function(date, card_info) {
      // Get the information from the API call
      var card_name = card_info[0];
      var card_link = '<a target="_blank" href="' + card_info[1] + '">';
      var archived = card_info[2];
      var card_date = date.split('T')[0] + ' at ' + date.split('T')[1].split('.')[0];

      // Swap out the brackets for a bootstrap label
      var label_class = 'default';
      if(card_name.indexOf('Information Management') > 0){ label_class = 'info'; }
      if(card_name.indexOf('Project Handling') > 0){ label_class = 'success'; }
      if(card_name.indexOf('Policy') > 0){ label_class = 'danger'; }
      if(card_name.indexOf('Bioinfo') > 0){ label_class = 'warning'; }
      if(card_name.indexOf('Meetings') > 0){ label_class = 'primary'; }
      card_name = card_name.replace(/\((.+)\)/g, '<span class="label label-'+label_class+'">$1</span>');

      // Push the row HTML to the applicable arrays
      if(archived) {
          archivedCards.push('<tr class="success">'+
                        '<td>'+card_link+'<s>'+card_name+'</s></a></td>'+
                        '<td>'+card_link+'<s>'+card_date+'</s></a></td>'+
                     '</tr>');
      }
      else {
          activeCards.push('<tr>'+
                          '<td>'+card_link+card_name+'</a></td>'+
                          '<td>'+card_link+card_date+'</a></td>'+
                       '</tr>');
      }
    });

    // append to the DOM
    $('#suggestionsTableBody').append(activeCards.join('\n'));
    $('#suggestionsTableBody').append(archivedCards.join('\n'));

    // Hide processing modal
    $('#processingModal').modal('hide');
  });
};


// Override defaults for jQuery Validate
$.validator.setDefaults({
  highlight: function(element) {
    $(element).closest('.control-group').addClass('error');
  },
  unhighlight: function(element) {
    $(element).closest('.control-group').removeClass('error');
  },
  errorElement: 'span',
  errorClass: 'help-inline',
  errorPlacement: function(error, element) {
    error.insertAfter(element);
  }
});

//Generate alert when POSTing and refresh suggestions table
$("#suggestionForm").validate({
  submitHandler: function(form) {
    var spinnerText = "<div style=\"text-align:center; margin:20px 0;\"><span class=\"glyphicon glyphicon-refresh glyphicon-spin\"></span>  Processing your suggestion..</div>"
    $('#processingModalBody').html(spinnerText);
    $('#processingModal').modal('toggle');
    $.post('/suggestion_box', $('#suggestionForm').serialize())
    .done(function() {
      $("#modalBody").html("Suggestion processed correctly! <i class='icon-ok'></i>");
      fill_suggestions_table();
      $("#suggestionForm").trigger('reset');
    })
    .fail(function() {
      $("#modalBody").html("Ops... something went wrong, please try it again! <i class='icon-thumbs-down'></i>");
    })
  }
});

$(document).ready(function() {
  fill_suggestions_table();
});
