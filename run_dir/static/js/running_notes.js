
function get_note_url() {
    // URL for the notes
    if ((typeof notetype !== 'undefined' && notetype == 'lims_step') || ('lims_step' in window && lims_step !== null)){
        note_url='/api/v1/workset_notes/' + lims_step;
    } else if ((typeof notetype !== 'undefined' && notetype == 'flowcell') || ('flowcell' in window && flowcell!== null)){
        note_url='/api/v1/flowcell_notes/' + flowcell;
    } else {
        note_url='/api/v1/running_notes/' + project;
    }
    return note_url;
}

function make_running_note(date, note){
  try {
    var date = date.replace(/-/g, '/');
    date = date.replace(/\.\d{6}/, '');
    date = new Date(date);
    if(date > new Date('2015-01-01')){
      noteText = make_markdown(note['note']);
    } else {
      noteText = '<pre class="plaintext_running_note">'+make_project_links(note['note'])+'</pre>';
    }
    datestring = date.toDateString() + ', ' + date.toLocaleTimeString(date)
  } catch(e){
    noteText = '<pre>'+make_project_links(note['note'])+'</pre>';
    var datestring = '?';
  }
  return '<div class="panel panel-default">' +
      '<div class="panel-heading">'+
        '<a href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
       datestring + '</div><div class="panel-body">'+noteText+'</div></div>';
}

function load_running_notes(wait) {
  // Clear previously loaded notes, if so
  note_url = get_note_url();
  $("#running_notes_panels").empty();
  return $.getJSON(note_url, function(data) {
    if(Object.keys(data).length == 0 || typeof data === 'undefined'){
      $('#running_notes_panels').html('<div class="well">No running notes found.</div>');
    } else {
      $.each(data, function(date, note) {
        $('#running_notes_panels').append(make_running_note(date, note));
      });
      check_img_sources($('#running_notes_panels img'));
    }
  }).fail(function( jqxhr, textStatus, error ) {
      try {
        var response = JSON.parse(jqxhr.responseText);
        var err = response['page_title'];
        var exception = $('<div/>').text(response['error_exception']).html(); // HTML encode string
        var debugging = "<p>For debugging purposes, we've tried to grab the error that triggered this page for you:</p>"+
                        '<p>&nbsp;</p><code class="well text-muted"><small>'+exception+'</small></code>';
      } catch(e) {
        var err = error+', '+textStatus;
        var debugging = '';
      }
      $('#running_notes_panels').append('<div class="alert alert-danger">' +
          '<h4>Error Loading Running Notes: '+err+'</h4>' +
          '<p>Apologies, running notes could not be loaded.' +
          'Running notes are retrieved from the LIMS, so these problems are usually ' +
          'due to connection problems. Please try again later and report if the problem persists.</p></div>'+debugging);
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

    note_url = get_note_url()
    $('#save_note_button').addClass('disabled').text('Submitting..');
    $.ajax({
      type: 'POST',
      url: note_url,
      dataType: 'json',
      data: {"note": text},
      error: function(xhr, textStatus, errorThrown) {
        alert('Error: '+xhr['responseText']+' ('+errorThrown+')');
        $('#save_note_button').removeClass('disabled').text('Submit Running Note');
        console.log(xhr);
        console.log(textStatus);
        console.log(errorThrown);
      },
      success: function(data, textStatus, xhr) {
        // Manually check whether the running note has saved - LIMS API always returns success
        note_url=get_note_url()
        $.getJSON(note_url, function(newdata) {
          var newNote = false;
          $.each(newdata, function(date, note) {
            if(data['note'] == note['note']){
              newNote = make_running_note(date, note);
            }
          });
          if(newNote){
            // Enable the submit button again
            $('#save_note_button').removeClass('disabled').text('Submit Running Note');
            // Clear the text box
            $('#new_note_text').val('');
            $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
            $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
            // Cler the 'no running notes found' box if it's there
            if($('#running_notes_panels').html() == '<div class="well">No running notes found.</div>'){
              $('#running_notes_panels .well').slideUp(function(){ $(this).remove(); });
            }
            // Create a new running note and slide it in..
            var now = new Date();
            $('<div class="panel panel-success"><div class="panel-heading">'+
                  '<a href="mailto:' + data['email'] + '">'+data['user']+'</a> - '+
                  now.toDateString() + ', ' + now.toLocaleTimeString(now)+
                '</div><div class="panel-body">'+make_markdown(data['note'])+
                '</div></div>').hide().prependTo('#running_notes_panels').slideDown();
            check_img_sources($('#running_notes_panels img'));
          } else {
            alert('Error - LIMS did not save your running note.');
            $('#save_note_button').removeClass('disabled').text('Submit Running Note');
          }
        });
      }
    });
});
