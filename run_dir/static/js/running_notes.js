$(function(){
    return $.getJSON('/api/v1/user_management/users', function (data) {
      window.users=Object.keys(data)
        .map(n=>{
            return {val:n.split('@')[0]};
        });
    });
});

function generate_category_label(category){
     cat_classes = {
        'Workset': ['primary', 'calendar-plus'],
        'Flowcell': ['success', 'grip-vertical'],
        'Decision': ['info', 'thumbs-up'],
        'Lab': ['succe', 'flask'],
        'Bioinformatics': ['warning', 'laptop-code'],
        'User Communication': ['usr', 'people-arrows'],
        'Administration': ['danger', 'folder-open'],
        'Important': ['imp', 'exclamation-circle'],
        'Deviation': ['devi', 'frown'],
        'Invoicing': ['inv', 'file-invoice-dollar']
    }
    // Remove the whitespace
    var categories = category.trim()
    //Below can probably be simplified
    var cat_label = '';
    if (categories.includes('Workset')){
      cat_label += '<span class="badge bg-'+cat_classes['Workset'][0]+'">'+'Workset '+'<span class="fa fa-'+cat_classes['Workset'][1]+'">'+'</span></span> ';
    }if (categories.includes('Flowcell')){
      cat_label += '<span class="badge bg-'+cat_classes['Flowcell'][0]+'">'+'Flowcell '+'<span class="fa fa-'+cat_classes['Flowcell'][1]+'">'+'</span></span> ';
    }if (categories.includes('Decision')){
      cat_label += '<span class="badge bg-'+cat_classes['Decision'][0]+'">'+'Decision '+'<span class="fa fa-'+cat_classes['Decision'][1]+'">'+'</span></span> ';
    }if (categories.includes('Lab')){
      cat_label += '<span class="badge bg-'+cat_classes['Lab'][0]+'">'+'Lab '+'<span class="fa fa-'+cat_classes['Lab'][1]+'">'+'</span></span> '; 
    }if (categories.includes('Bioinformatics')){
      cat_label += '<span class="badge bg-'+cat_classes['Bioinformatics'][0]+'">'+'Bioinformatics '+'<span class="fa fa-'+cat_classes['Bioinformatics'][1]+'">'+'</span></span> ';
    }if (categories.includes('User') && categories.includes('Communication')){
      cat_label += '<span class="badge bg-'+cat_classes['User Communication'][0]+'">'+'User Communication '+'<span class="fa fa-'+cat_classes['User Communication'][1]+'">'+'</span></span> ';
    }if (categories.includes('Administration')){
      cat_label += '<span class="badge bg-'+cat_classes['Administration'][0]+'">'+'Administration '+'<span class="fa fa-'+cat_classes['Administration'][1]+'">'+'</span></span> ';
    }if (categories.includes('Important')){
      cat_label += '<span class="badge bg-'+cat_classes['Important'][0]+'">'+'Important '+'<span class="fa fa-'+cat_classes['Important'][1]+'">'+'</span></span> ';
    }if (categories.includes('Deviation')){
      cat_label += '<span class="badge bg-'+cat_classes['Deviation'][0]+'">'+'Deviation '+'<span class="fa fa-'+cat_classes['Deviation'][1]+'">'+'</span></span> ';
    }if (categories.includes('Invoicing')){
      cat_label += '<span class="badge bg-'+cat_classes['Invoicing'][0]+'">'+'Invoicing '+'<span class="fa fa-'+cat_classes['Invoicing'][1]+'">'+'</span></span> ';
    }
    return cat_label;
}

function get_note_url() {
    // URL for the notes
    if ((typeof notetype !== 'undefined' && notetype == 'lims_step') || ('lims_step' in window && lims_step !== null)){
        note_url='/api/v1/workset_notes/' + lims_step;
    } else if ((typeof notetype !== 'undefined' && notetype == 'flowcell') || ('flowcell_id_reference' in window && flowcell_id_reference!== null)){
        note_url='/api/v1/flowcell_notes/' + flowcell_id_reference;
    } else {
        note_url='/api/v1/running_notes/' + project;
    }
    return note_url;
}

function make_running_note(date, note){
  try {
    var category = '';
    var date = date.replace(/-/g, '/');
    date = date.replace(/\.\d{6}/, '');
    date = new Date(date);
    if (note['note'] != undefined){
        if(date > new Date('2015-01-01')){
          noteText = make_markdown(note['note']);
        } else {
          noteText = '<pre class="plaintext_running_note">'+make_project_links(note['note'])+'</pre>';
        }
        datestring = date.toDateString() + ', ' + date.toLocaleTimeString(date);
        var page_to_link = '';
        if(typeof project !== 'undefined'){
          page_to_link = project;
        }
        else if (typeof flowcell!== 'undefined') {
          page_to_link = flowcell;
        }
        else if(typeof workset_name !== 'undefined'){
          page_to_link = workset_name
        }
        note_id = 'running_note_'+page_to_link+'_'+(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                   date.getUTCDate(), date.getHours(), date.getMinutes(), date.getSeconds())/1000);
        if ('category' in note){
            category=generate_category_label(note['category']);
        }
    }
  } catch(e){
    noteText = '<pre>'+make_project_links(note['note'])+'</pre>';
    var datestring = '?';
  }
  var printHyphen =category? ' - ': ' ';
  var panelClass='';
  if (note['category'] == 'Important') {
    panelClass = 'card-important';
  }
  return '<div class="card mb-2 mx-2">' +
      '<div class="card-header '+panelClass+'" id="'+note_id+'">'+
        '<a class="text-decoration-none" href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
       '<a class="text-decoration-none" href="#'+note_id+'">' + datestring + '</a>' + printHyphen +category +'</div><div class="card-body trunc-note">'+noteText+'</div></div>';
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
      count_cards();
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
          'These problems are usually ' +
          'due to connection problems. Please try again later and report if the problem persists.</p></div>'+debugging);
  });
}
function preview_running_notes(){
    var now = new Date();
    $('.todays_date').text(now.toDateString() + ', ' + now.toLocaleTimeString());
    var category = generate_category_label($('.rn-categ button.active').text());
    category = category ? ' - '+ category : category;
    $('#preview_category').html(category);
    var text = $('#new_note_text').val().trim();
    if (text.length > 0) {
        $('#running_note_preview_body').html(make_markdown(text));
        check_img_sources($('#running_note_preview_body img'));
    } else {
        $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
    }
    // update textarea height
    $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
}
function filter_running_notes(search){
    search=search.toLowerCase();
    $('#running_notes_panels').children().each(function(){
        var header=$(this).children('.card-header').text();
        var note=$(this).children('.card-body').children().text();
        if (header.toLowerCase().indexOf(search) != -1 || note.toLowerCase().indexOf(search) != -1){
            $(this).show();
        }else{
            $(this).hide();
        }
    });
}
//Count rn's of each category and add badge with number to filter dropdown
function count_cards(){
    var cat_cards = {};
    var all = 0;
    $('#running_notes_panels').find('.badge').each(function(){
        var label = $.trim($(this).text());
        all++;
        if (label){
            if (label in cat_cards){
                cat_cards[label]++;
            }else{
                cat_cards[label] = 1;
            }
        }
    });
    $('.btn_count').append('All <span class="badge bg-secondary">'+all+'</span>');
    $('#rn_category').next().find('.dropdown-item').each(function(){
        var label = $.trim($(this).text())
        cat_cards['All'] = all;
        if (!cat_cards[label]){
            $(this).parent('li').addClass('d-none');
        }else if (Object.keys(cat_classes).indexOf(label) != -1){
            $(this).prepend('<span class="badge bg-'+cat_classes[label][0]+' mr-2">'+cat_cards[label]+'</span>');
        }else{
            $(this).prepend('<span class="badge bg-secondary mr-2">'+cat_cards[label]+'</span>');
        }
    });
}

//Filter notes
$('#rn_search').keyup(function() {
    var search=$('#rn_search').val();
    filter_running_notes(search);
    $('#rn_category').html('<span class="badge bg-secondary mr-2">'+
    $('#running_notes_panels').find('.badge').length+'</span>All');
});

//Filter dropdown
$('#rn_category ~ ul > li > button').on('click', function(){
    $('#rn_category').html($(this).html());
    var search = this.lastChild.textContent;
    if (search.includes('All')){
        search = '';
    }
    filter_running_notes(search);
});

// Update the category buttons
$('.rn-categ button').click(function(e){
    e.preventDefault();
    var was_selected = $(this).hasClass('active');
    if(was_selected){
        $(this).removeClass('active');
    }
    if(!was_selected){
        $(this).addClass('active');
    }
    preview_running_notes();
});

//Remove hover text from clicked button
$(document).ready(function(){
      $('[data-toggle="tooltip"]').click(function (){
         $('[data-toggle="tooltip"]').tooltip("hide");
      });
});

// Preview running notes
$('#new_note_text').keyup(preview_running_notes);

// Insert new running note and reload the running notes table
$("#running_notes_form").submit( function(e) {
    e.preventDefault();
    var text = $('#new_note_text').val().trim();
    text = $('<div>').text(text).html();
    var category = $('.rn-categ button.active').text();
    if (text.length == 0) {
        alert("Error: No running note entered.");
        return false;
    }
    if (!$('.rn-categ button.active').text()) {
       if (!confirm("Are you sure that you want to submit without choosing a category?")) {
          return false;
       }
    }

    note_url = get_note_url()
    $('#save_note_button').addClass('disabled').text('Submitting...');
    $.ajax({
      type: 'POST',
      url: note_url,
      dataType: 'json',
      data: {"note": text, "category": category},
      error: function(xhr, textStatus, errorThrown) {
        alert('Error: '+xhr['responseText']+' ('+errorThrown+')');
        $('#save_note_button').removeClass('disabled').text('Submit Running Note');
        console.log(xhr);
        console.log(textStatus);
        console.log(errorThrown);
      },
      success: function(data, textStatus, xhr) {
        // Manually check whether the running note has saved
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
            category=generate_category_label(category);
            var printHyphen =category? ' - ': ' ';
            $('<div class="card mb-2 mx-2"><div class="card-header bg-success-table">'+
                  '<a class="text-decoration-none" href="mailto:' + data['email'] + '">'+data['user']+'</a> - '+
                  now.toDateString() + ', ' + now.toLocaleTimeString(now)+ printHyphen + category +
                '</div><div class="card-body">'+make_markdown(data['note'])+
                '</div></div>').hide().prependTo('#running_notes_panels').slideDown();
            check_img_sources($('#running_notes_panels img'));
          } else {
            alert('Error - Your running note was not saved.');
            $('#save_note_button').removeClass('disabled').text('Submit Running Note');
          }
        });
      }
    });
});
$('#new_note_text').on('focus',function(){$(this).sew({values:window.users})});
