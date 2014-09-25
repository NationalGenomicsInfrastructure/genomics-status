function fill_suggestions_table() {
  $.getJSON('/api/v1/suggestions', function(data) {
    $("#suggestionsTableBody").empty();
    $.each(data, function(date, card_info) {
      var card_date = "<tr><td><a target='_blank' href='" + card_info[1] + "'>" + card_info[0] + "</a></td>";
      var card_link = "<td>" + date.split('T')[0] + ' at ' + date.split('T')[1].split('.')[0] + "</td></tr>";
      $('#suggestionsTableBody').append(card_date + card_link);
    });
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
    $.post('/suggestion_box', $('#suggestionForm').serialize())
    .done(function() {
      $("#alertDiv").addClass('alert-success');
      $("#alertDiv").append("Card successfully created in Trello!");
      $("#alertDiv").show();
    })
    .fail(function() {
      $("#alertDiv").addClass('alert-error');
      $("#alertDiv").append("Something went wrong when creating the card in Trello. Please try it again.");
      $("#alertDiv").show();
    })
    .always(function() {
      fill_suggestions_table();
    })
  }
});

$(document).ready(function() {
  fill_suggestions_table();
  // Make the button to hide the alert
  $('#alertButton').live('click', function(event) {        
    $('#alertDiv').hide();
  });
});
