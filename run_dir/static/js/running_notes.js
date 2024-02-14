$(function(){
  if(typeof project!=='undefined'){
      $.getJSON('/api/v1/latest_sticky_run_note/'+project, function (data) { 
        //latest_sticky_note
        let sticky_run_note = data 
        let date = Object.keys(sticky_run_note)[0]
        $('#latest_sticky_note').html(make_running_note(date, sticky_run_note[date], true))
  })};

    return $.getJSON('/api/v1/user_management/users', function (data) {
      window.users=Object.keys(data)
        .map(n=>{
            return {val:n.split('@')[0]};
        });
    });
});

function generate_category_label(categories){
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
        'Invoicing': ['inv', 'file-invoice-dollar'],
        'Sticky': ['sticky', 'note-sticky']

    }
    var cat_label = '';
    Object.values(categories).forEach(function(val){
      var cat = val.trim()
      if (Object.keys(cat_classes).indexOf(cat) != -1){
          cat_label += '<span class="badge bg-'+cat_classes[cat][0]+'">'+cat+'&nbsp;'+'<span class="fa fa-'+ cat_classes[cat][1] +'">'+"</span></span> ";
      }
    });
    return cat_label;
}

function get_note_url(reference) {
    // URL for the notes
    let note_id = '';
    let note_type = '';
    let url = '';
    if ('workset_reference' in reference && reference['workset_reference'] !== null){
      note_id = reference['workset_reference'];
      note_type = 'workset';
    } else if (reference !== undefined && 'flowcell_id_reference' in reference){
      note_id = reference['flowcell_id_reference'];
      note_type = 'flowcell';
      //Change this soon to explicit parameter
      if((typeof $('#rn-js').data('flowcell-type') !== 'undefined') && ($('#rn-js').data('flowcell-type') ==='ont')){
        note_type += '_ont';
      }
    } else if (reference !== undefined && 'project_reference' in reference){
      note_id = reference['project_reference'];
      note_type = 'project';
    }
    url='/api/v1/running_notes/' + note_id;
    return {url: url, note_type: note_type}; 
}

function create_note_link(date){
  let page_to_link = '';
  if(typeof project !== 'undefined'){
    page_to_link = project;
  }
  else if (typeof flowcell!== 'undefined') {
    page_to_link = flowcell;
  }
  else if(typeof workset_name !== 'undefined'){
    page_to_link = workset_name
  }
  return 'running_note_'+page_to_link+'_'+(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
             date.getUTCDate(), date.getHours(), date.getMinutes(), date.getSeconds())/1000);
}

function make_running_note(date, note, sticky){
  sticky = typeof sticky !== "undefined" ? sticky : false;
  try {
    var category = '';
    var note_id = '';
    date = new Date(date);
    if (note['note'] != undefined){
        if(date > new Date('2015-01-01')){
          //Replace > and < in old versions of running notes saved on lims.
          noteText = make_markdown(note['note'].replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
        } else {
          noteText = '<pre class="plaintext_running_note">'+make_project_links(note['note'])+'</pre>';
        }
        datestring = date.toDateString() + ', ' + date.toLocaleTimeString(date);
        note_id = create_note_link(date);
        
        if ('categories' in note || 'category' in note){
          var categories = [];
          categories = note['categories'];
          category=generate_category_label(categories);
        }
    }
  } catch(e){
    noteText = '<pre>'+make_project_links(note['note'])+'</pre>';
    var datestring = '?';
  }
  var printHyphen =category? ' - ': ' ';
  var panelClass='';
  if (category.includes('Important')) {
    panelClass = 'card-important';
  }
  var margin_if_not_sticky = "";
  if(!sticky){
    margin_if_not_sticky = "mx-2"
  }
  return '<div class="card mb-2 '+margin_if_not_sticky+'">' +
      '<div class="card-header '+panelClass+'" id="'+note_id+'">'+
        '<a class="text-decoration-none" href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
       '<a class="text-decoration-none" href="#'+note_id+'">' + datestring + '</a>' + printHyphen +category +'</div><div class="card-body trunc-note">'+noteText+'</div></div>';
}

function load_running_notes(reference) {
  // Clear previously loaded notes, if so
  const note_values = get_note_url(reference);
  $("#running_notes_panels").empty();
  // From agreements tab
  $("#invoicing_notes").empty();
  return $.getJSON(note_values.url, function(data) {
    if(Object.keys(data).length == 0 || typeof data === 'undefined'){
      $('#running_notes_panels').html('<div class="well">No running notes found.</div>');
    } else {
      $.each(data, function(date, note) {
        $('#running_notes_panels').append(make_running_note(date, note, false));
        let categories = note['categories']
        if(categories.includes('Invoicing')){
          $('#invoicing_notes').append(make_running_note(date, note, true));
        }
      });
      if($('#invoicing_notes').children().length === 0){
        $('#invoicing_notes').html('<div class="well">No running notes found.</div>');
      }
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
      $('#running_notes_panels, #invoicing_notes').append('<div class="alert alert-danger">' +
          '<h4>Error Loading Running Notes: '+err+'</h4>' +
          '<p>Apologies, running notes could not be loaded.' +
          'These problems are usually ' +
          'due to connection problems. Please try again later and report if the problem persists.</p></div>'+debugging);
  });
}
function preview_running_notes(){
    var now = new Date();
    $('.todays_date').text(now.toDateString() + ', ' + now.toLocaleTimeString());
    var categories = []
    $('.rn-categ button.active').each(function() {
      categories.push($(this).text().trim());
    });
    var category = generate_category_label(categories);
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
    $('.btn_count').append('<span class="badge bg-secondary">'+all+'</span> All');
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
    else{
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
    var categories = [];
    $('.rn-categ button.active').each(function() {
      categories.push($(this).text().trim());
    });
    if (text.length == 0) {
        alert("Error: No running note entered.");
        return false;
    }
    if (!$('.rn-categ button.active').text()) {
       if (!confirm("Are you sure that you want to submit without choosing a category?")) {
          return false;
       }
    }
    const note_values = get_note_url()
    if(["flowcell", "workset", "flowcell_ont"].includes(note_values.note_type)){
      if((note_values.note_type==="flowcell" || note_values.note_type==="flowcell_ont") && !categories.includes("Flowcell")){
        categories.push("Flowcell")
      }
      else if(note_values.note_type==="workset" && !categories.includes("Workset")){
        categories.push("Workset")
      }
    }
    $('#save_note_button').addClass('disabled').text('Submitting...');
    $.ajax({
      type: 'POST',
      url: note_values.url,
      dataType: 'json',
      data: JSON.stringify({"note": text, "categories": categories, "note_type": note_values.note_type}),
      error: function(xhr, textStatus, errorThrown) {
        alert('Error: '+xhr['responseText']+' ('+errorThrown+')');
        $('#save_note_button').removeClass('disabled').text('Submit Running Note');
        console.log(xhr);
        console.log(textStatus);
        console.log(errorThrown);
      },
      success: function(data, textStatus, xhr) {
        // Manually check whether the running note has saved
        const note_values = get_note_url()
        $.getJSON(note_values.url, function(newdata) {
          let newNote = false;
          let newNoteDate = null;
          $.each(newdata, function(date, note) {
            if(data['note'] == note['note']){
              newNote = make_running_note(date, note, false);
              newNoteDate = date;
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
            const now = new Date(newNoteDate);
            category=generate_category_label(categories);
            const printHyphen = category? ' - ': ' ';
            const note_id = create_note_link(now)
            $('<div class="card mb-2 mx-2"><div class="card-header bg-success-table">'+
                  '<a class="text-decoration-none" href="mailto:' + data['email'] + '">'+data['user']+'</a> - '+
                  '<a class="text-decoration-none" href="#'+note_id+'">' + now.toDateString() + ', ' + now.toLocaleTimeString(now)+ '</a>'+ 
                  printHyphen + category + '</div><div class="card-body">'+make_markdown(data['note'])+
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

//Used to format the Latest Running Note column
function format_latest_running_note(){
  //Formatting for Running note card body
  $(".running-note-card > .card-body").each(function(i){
      $(this).html(make_markdown($(this).text()));
  });
  $('.fillbadgecolour').html(function(){
      let categories = JSON.parse($(this).text().replace(/'/g, '"'))
      return generate_category_label(categories)
  })
}
