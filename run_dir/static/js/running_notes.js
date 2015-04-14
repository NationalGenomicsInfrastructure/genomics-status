
function get_note_url() {
    //URL for the notes
    if ('lims_step' in window && lims_step !== null){
        note_url='/api/v1/workset_notes/' + lims_step;
    }else if ('flowcell' in window && flowcell!== null){
        note_url='/api/v1/flowcell_notes/' + flowcell;
    }else {
        note_url='/api/v1/running_notes/' + project;
    }
    return note_url;
}

function load_running_notes(wait) {
  // Clear previously loaded notes, if so
  note_url=get_note_url()
  $("#running_notes_panels").empty();
  $.getJSON(note_url, function(data) {
    $.each(data, function(date, note) {
      var date = new Date(date);
      if(date > new Date('2015-01-01')){
        noteText = make_markdown(note['note']);
      } else {
        noteText = '<pre>'+make_project_links(note['note'])+'</pre>';
      }
      $('#running_notes_panels').append('<div class="panel panel-default">' +
          '<div class="panel-heading">'+
            '<a href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
            date.toDateString() + ', ' + date.toLocaleTimeString(date)+
          '</div><div class="panel-body">'+noteText+'</div></div>');
      check_img_sources($('#running_notes_panels img'));
    });
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "Running notes request failed: " + err );
  });
}

// Preview running notes
$('#new_note_text').keyup(function() {
    var now = new Date();
    $('.todays_date').text(now.toDateString() + ', ' + now.toLocaleTimeString());
    var text = $('#new_note_text').val().trim();
    if (text.length > 0) {
        $('#running_note_preview_body').html(make_markdown(text));
        check_img_sources($('#running_note_preview_body img'));
    } else {
        $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
    }
    // update textarea height
    $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
});

// Insert new running note and reload the running notes table
$("#running_notes_form").submit( function(e) {
    e.preventDefault();
    var text = $('#new_note_text').val().trim();
    if (text.length == 0) {
        alert("Error: No running note entered.");
        return false;
    }

    note_url=get_note_url()
    $('#save_note_button').addClass('disabled').text('Submitting..');
    $.ajax({
      async: false,
      type: 'POST',
      url: note_url,
      dataType: 'json',
      data: {"note": text},
      error: function(xhr, textStatus, errorThrown) {
        alert('There was an error inserting the Running Note: '+errorThrown);
        $('#save_note_button').removeClass('disabled').text('Submit Running Note');
        console.log(xhr);
        console.log(textStatus);
        console.log(errorThrown);
      },
      success: function(data, textStatus, xhr) {
        $('#save_note_button').removeClass('disabled').text('Submit Running Note');
        // Clear the text box
        $('#new_note_text').val('');
        $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
        $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
        // Create a new running note and slide it in..
        var now = new Date();
        $('<div class="panel panel-success"><div class="panel-heading">'+
              '<a href="mailto:' + data['email'] + '">'+data['user']+'</a> - '+
              now.toDateString() + ', ' + now.toLocaleTimeString(now)+
            '</div><div class="panel-body">'+make_markdown(data['note'])+
            '</div></div>').hide().prependTo('#running_notes_panels').slideDown();
        check_img_sources($('#running_notes_panels img'));
      }
    });
});
