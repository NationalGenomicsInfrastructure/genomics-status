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
    $('#modalBody').html("<p>Processing your suggestion...</p>");
    $("#processingModal").modal('toggle');
    var target = document.getElementById('modalBody')
    var spinner = new Spinner().spin(target);
    $.post('/suggestion_box', $('#suggestionForm').serialize())
    .done(function() {
      $("#modalBody").html("Suggestion processed correctly! <i class='icon-ok'></i>");
    })
    .fail(function() {
      $("#modalBody").html("Ops... something went wrong, please try it again! <i class='icon-thumbs-down'></i>");
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
