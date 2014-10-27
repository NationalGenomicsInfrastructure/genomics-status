/*
File: suggestion_box.js
URL: /static/js/suggestion_box.js
Powers /suggestion_box - template is run_dir/design/suggestion_box.html
*/

function fill_suggestions_table() {
  $.getJSON('/api/v1/suggestions', function(data) {
    $("#suggestionsTableBody").empty();
    $.each(data, function(date, card_info) {
      var card_name = card_info[0];
      var card_link = '<a target="_blank" href="' + card_info[1] + '">';
      var archived = card_info[2];
      var card_date = date.split('T')[0] + ' at ' + date.split('T')[1].split('.')[0];
      if(archived) {
          $('#suggestionsTableBody').append('<tr class="success">'+
                        '<td>'+card_link+'<s>'+card_name+'</s></a></td>'+
                        '<td>'+card_link+'<s>'+card_date+'</s></a></td>'+
                     '</tr>');
      }
      else {
          $('#suggestionsTableBody').append('<tr>'+
                          '<td>'+card_link+card_name+'</a></td>'+
                          '<td>'+card_link+card_date+'</a></td>'+
                       '</tr>');
      }
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
    var spinnerText = "<div class='test_padding'> \
                        <span class='icon-refresh glyphicon-refresh-animate'></span>  Processing your suggestion... \
                      </div>"
    $('#modalBody').html(spinnerText);
    $('#processingModal').modal('toggle');
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
});
