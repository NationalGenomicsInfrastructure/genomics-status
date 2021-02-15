/*
File: user_preferences.js
URL: /static/js/user_preferences.js
Powers /userpref - template is run_dir/design/user_preferences.html
*/

// On page load
$('#submitPrefBtn').click(function(e){
  var option=$("input[name='notfPref']:checked").data('value')
  $('#submitPrefBtn').addClass('disabled').text('Saving...');
  var api_url = "/userpref";
  $.ajax({
    type: 'POST',
    dataType: 'json',
    url: api_url,
    data: JSON.stringify({'notification_preferences': option}),
    error: function(xhr, textStatus, errorThrown) {
      alert('There was an error in saving your preferences: '+errorThrown);
      $('#submitPrefBtn').removeClass('disabled').text('Save');
      console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(option);
    },
    success: function(saved_data, textStatus, xhr) {
      $('#submitPrefBtn').addClass('disabled').text('Saving...').delay(1500).queue(function(){
        $('#userPrefModal').modal('toggle'); $(this).removeClass('disabled').text('Save'); $(this).dequeue()
      });
    }
  });
});
