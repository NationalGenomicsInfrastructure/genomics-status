function fill_suggestions_table() {
  $.getJSON('/api/v1/suggestions', function(data) {
    $("#suggestionsTable body").empty();
    $.each(data, function(date, card_info) {
      var card_date = "<tr><td><a target='_blank' href='" + card_info[1] + "'>" + card_info[0] + "</a></td>";
      var card_link = "<td>" + date.split('T')[0] + ' at ' + date.split('T')[1].split('.')[0] + "</td></tr>";
      $('#suggestionsTable tr:last').after(card_date + card_link);
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
$("#suggestionForm").validate({submitHandler: function(form) {
  $.post('/suggestion_box', $('#suggestionForm').serialize());
}
});


$(document).ready(function() {
  fill_suggestions_table();
});