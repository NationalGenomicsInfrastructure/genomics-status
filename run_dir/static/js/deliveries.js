$('.bioinfo-running-notes-save').click(function(e) {
    var td = $(this).parent();
    var tr = $(td).parent();
    var running_note = $(td).find('div[contenteditable="true"]').text();

    // do not save an empty value or if the running note wasn't modified
    if (running_note == "" || $(td).attr('data-running-note') == running_note) {
        return false;
    }

    var tr_class = $(tr).attr('class');
    var tr_id = $(tr).attr('id');
    tr_id = tr_id.replace('bioinfo-', '').split('-');
    var project_id = tr_id[1];
    var run_id = tr_id[2];
    var lane_id = tr_id[3];
    var sample_id = tr_id[4];

    // if hiseqX: 160531_ST-E00198_0117_BHN5N3CCXX,
    // then we get run_id=160531_ST and lane_id =E00198_0117_BHN5N3CCXX
    if (run_id.indexOf('_ST') != -1) {
        run_id = run_id + '-' + lane_id;
        lane_id = sample_id;
        sample_id = tr_id[5];
    }

    // join not undefined values -> if undefined, will skip
    var prefix = [run_id, lane_id, sample_id].join(' ');

    running_note = prefix + '::: ' + running_note;

    var url='/api/v1/running_notes/' + project_id;
    var button = $(this);
    $(button).addClass('disabled').text('Submitting..');
    $.ajax({
        type: 'POST',
        method: 'POST',
        url: url,
        dataType: 'json',
        data: {"note": running_note},
        error: function(xhr, textStatus, errorThrown) {
            alert('Error: '+xhr['responseText']+' ('+errorThrown+')');
            $(button).removeClass('disabled').text('Save');
            console.log(xhr);
            console.log(textStatus);
            console.log(errorThrown);
        },
        success: function(data, textStatus, xhr) {
            $(button).removeClass('disabled').text('Save');
            $(td).attr('data-running-note', data['note']);
            $('#bioinfo-delivery-project-'+project_id).find('div.bi-project-note').text(data['note']);
            // add to the project running_notes
            // new notes are displayed in green
            var new_note_html = '<div class="running-notes-panel panel panel-success" id="running-note-'+project_id+'" style="display:none;">' +
                  '<div class="panel-heading"><a href="mailto:'+data['email']+'">'+ data['user'] + '</a> - '+ data["timestamp"]+'</div>' +
                  '<div class="panel-body"><div class="mkdown">'+data['note']+'</div></div></div>';
            // marked is defined in base.js. Do not use make_markdown - it breaks html!
            var markdown = marked(new_note_html);
            $('#running_notes_panels').prepend(markdown);
            $('#bioinfo-delivery-project-'+project_id).find('div.bi-project-note').text(data['timestamp']+' - ' +data['note']);
        }
    });

});

$('.bioinfo-running-notes-cancel').click(function(e) {
    var td = $(this).parent();
    var tr = $(td).parent();
    var running_note = $(td).attr('data-running-note');
    $(td).find('p').text(running_note);
});

$('.deliveries-page').on('click', '.runningNotesModalDeliveries_button', function(e){
    var button = $(this);
    var project_id = $(button).parents('div.delivery').attr('id');
    project_id = project_id.replace('bioinfo-delivery-project-', '');
    // hopefully this will replace the project value in the running_notes.js
    project = project_id;
    var project_notes = $('.running-notes-panel[id^=running-note-'+project_id+']').show();
    $('#runningNotesModalDeliveries_title').text('Running Notes for project '+project_id)
            .attr('data-project-id', project_id); // add project_id to hide/show projects on click 'See All'
});

$('#runningNotesModalDeliveries').on('hidden.bs.modal', function (e) {
  var running_notes = $('.running-notes-panel').hide();
});


// expand or collapse table
$('.bioinfo-expand').click(function(e){
    // this = a[href=#$(tr).attr('id')];
    e.preventDefault();
    e.stopImmediatePropagation();
    tr = $(this).parent().parent();
    if ($(tr).hasClass('bioinfo-project')) {
        collapseAll(this);
        return false;
    }
    if ($(this).hasClass('expanded')){
        collapse(tr);
    } else {
        expand(tr);
    }
});

function collapse(element) {
    // element is tr
  var element_id = $(element).attr('id');
  var expanded = $(element).find("a[href=#"+element_id+"]");
  $(expanded).removeClass('expanded');
  var span =$(element).find('td.bioinfo-status-expand span.glyphicon');
  if ($(span).hasClass('glyphicon-chevron-down')) {
    $(span).removeClass('glyphicon-chevron-down');
    $(span).addClass('glyphicon-chevron-right');
  }
  var children = $(element).parent().find('tr[data-parent="#'+element_id+'"]')
  $.each(children, function(index, child) {
    $(child).hide().removeClass('expanded').addClass('collapsed');
    collapse(child);
  });
};

function expand(element) {
    var a = $(element).find('.bioinfo-expand');
    $(a).addClass('expanded');
    var tr_id = $(element).attr('id');
    $('tr[data-parent="#'+tr_id+'"]').show().removeClass('collapsed').addClass('expanded');
    var span = $(element).find('td.bioinfo-status-expand span.glyphicon');
    if ($(span).hasClass('glyphicon-chevron-right')) {
        $(span).removeClass('glyphicon-chevron-right')
        $(span).addClass('glyphicon-chevron-down');
    }
};


function collapseAll(a) {
    var current_tr = $(a).parent().parent();
    var top_level_class = "";
    var second_level_class = "";
    var table = $(a).closest('table.table-bioinfo-status');
    if ($(table).hasClass('table-bioinfo-status-sampleview')) {
        top_level_class = 'bioinfo-sample';
        second_level_class = 'bioinfo-fc';
    } else if ($(table).hasClass('table-bioinfo-status-runview')) {
        top_level_class = 'bioinfo-fc';
        second_level_class = 'bioinfo-lane';
    } else {
        console.error('unknown data structure! Change deliveries.js or bioinfo_tab.js!');
    }
    if ($(a).hasClass('expanded')) { // collapse recursively
        var trs = $(table).find('tr:not(.filtered).' + top_level_class + ':has(td.bioinfo-status-expand a.expanded)');
        $.each(trs, function(index, tr) {
            collapse(tr);
        });
        $(a).removeClass('expanded');
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-down');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($(table).find('tr:not(.filtered).'+top_level_class),
            $(table).find('tr:not(.filtered).'+top_level_class).nextUntil('tr.'+top_level_class,
            ':has(td.bioinfo-status-expand a:not(.expanded))'));
        $.each(trs, function(index, tr) {
            expand(tr);
        });
        $(a).addClass('expanded');
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-right');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-down');
    }
};

// filter projects by flowcell status
$(".fc-status-checkbox").change(function() {
    var sample_status = $(this).val();
    var show = $(this).is(':checked');
    if (show) {
        // add/remove markers
        var filtered_classes = $('div#filtered-classes').removeClass(sample_status).attr('class').split(/\s+/);
        $('div#visible-classes').addClass(sample_status);
        // if '', it fails on :not('.')
        if (filtered_classes == '') {
            // show projects that have sample_status class and don't have any filtered classes
            $('div.delivery.'+sample_status+':not(.bioinfo-filtered)').show();
        } else {
            $('div.delivery:not(.bioinfo-filtered).'+sample_status+':not(.'+filtered_classes+')').show();
        }
        $('tr.bioinfo-fc:hidden:has(td span.bioinfo-status:contains('+sample_status+'))').show().removeClass('filtered')
            .nextUntil('tr.bioinfo-fc', 'tr:hidden.expanded').show().removeClass('filtered')
            .closest('div.delivery:not(.bioinfo-filtered)').show();
    } else {
        // add/remove markers
        $('div#filtered-classes').addClass(sample_status);
        var visible_classes = $('div#visible-classes').removeClass(sample_status).attr('class').split(/\s+/);
        // the same, when it's the last one, fails on :not('.')
        if (visible_classes == '') {
            // hide projects which have sample status class and don't have any visible classes
            $('div.delivery.'+sample_status).hide().addClass('status-filtered');
        } else {
            $('div.delivery.'+sample_status+':not(.'+visible_classes.join(', .')+')').hide().addClass('status-filtered');
        }
        // hide rows that have sample_status
        $('div.delivery  table tbody tr.bioinfo-fc:has(td span.bioinfo-status:contains('+sample_status+'))').hide().addClass('filtered')
            .nextUntil('tr.bioinfo-fc', 'tr.expanded').hide().addClass('filtered');
    }
});

// filter projects by bioinfo responsible
$(".bi-responsible-checkbox").change(function() {
    var bioinfo_responsible = $(this).val();
    var show = $(this).is(':checked');
    if (show) {
        $('div.delivery:not(.status-filtered):hidden:has(h3 small span.bi-project-assigned:contains('+bioinfo_responsible+'))')
            .show().removeClass('bioinfo-filtered');
    } else { // hide
        $('div.delivery:visible:has(h3 small span.bi-project-assigned:contains('+bioinfo_responsible+'))').hide()
            .addClass('bioinfo-filtered');
    }
});


// display all statuses
$('.all-statuses').click(function() {
    $('.fc-status-checkbox:not(:checked)').prop('checked', true).trigger('change');
});

// display none statuses
$('.none-statuses').click(function(){
    $('.fc-status-checkbox:checked').prop('checked', false).trigger('change');
});

// display all responsibles
$('.all-responsibles').click(function() {
    $('.bi-responsible-checkbox:not(:checked)').prop('checked', true).trigger('change');
});

// display none responsibles
$('.none-responsibles').click(function(){
    $('.bi-responsible-checkbox:checked').prop('checked', false).trigger('change');
});

// edit bioinfo responsible
$('.button-edit-bioinfo-responsible').click(function() {
    $(this).parent().find('.bi-project-assigned').hide();
    $(this).parent().find('.edit-bi-project-assigned').show();
    $(this).parent().find('.button-edit-bioinfo-responsible').hide();
    $(this).parent().find('.button-save-bioinfo-responsible').show();
    $(this).parent().find('.button-reset-bioinfo-responsible').show();
});

// reset bioinfo responsible
$('.button-reset-bioinfo-responsible').click(function() {
    var responsible = $(this).parent().find('.bi-project-assigned').text().trim(); //.replace(/\s+/, '');
    $(this).parent().find('.bi-project-assigned').show();
    $(this).parent().find('.edit-bi-project-assigned').val(responsible).hide();
    $(this).parent().find('.button-edit-bioinfo-responsible').show();
    $(this).parent().find('.button-save-bioinfo-responsible').hide();
    $(this).parent().find('.button-reset-bioinfo-responsible').hide();
});

// save bioinfo responsible
$('.button-save-bioinfo-responsible').click(function() {
    var parent = $(this).parent();
    var responsible = $(this).parent().find('.edit-bi-project-assigned').val();
    var old_responsible = $(this).parent().find('.bi-project-assigned').text().trim();
    if (responsible != old_responsible) {
        var project_id = $(this).closest('div.delivery').attr('id').replace('bioinfo-delivery-project-', '');
        var url = "/api/v1/deliveries/set_bioinfo_responsible";
        $.ajax({
            type: 'POST',
            method: 'POST',
            url: url,
            dataType: 'json',
            data: {'responsible': responsible, 'project_id': project_id},
            error: function(xhr, textStatus, errorThrown) {
                alert('Error: '+xhr['responseText']+' ('+errorThrown+')');
                console.log(xhr);
                console.log(textStatus);
                console.log(errorThrown);
            },
            success: function(data, textStatus, xhr) {
                var success_msg = $('<span id="bioinfo-resp-status" class="delivery-saved-status">    Updated<span class="glyphicon glyphicon-ok"></span></span>');
                success_msg.appendTo($(parent).find('.button-edit-bioinfo-responsible')).fadeOut(1600, function(){ $(this).remove(); });
            }
        });
    }

    $(this).parent().find('.bi-project-assigned').text(responsible).show();
    $(this).parent().find('.edit-bi-project-assigned').hide();
    $(this).parent().find('.button-edit-bioinfo-responsible').show();
    $(this).parent().find('.button-save-bioinfo-responsible').hide();
    $(this).parent().find('.button-reset-bioinfo-responsible').hide();
});

var categories={ 'Workset': 'label-primary',
                            'Flowcell': 'label-success',
                            'Meeting': 'label-info',
                            'Decision': 'label-info',
                            'User Communication': 'label-danger',
                            'Bioinformatics': 'label-warning',
                            'All': 'label-default' }

// not using running_notes.js anymore
// Insert new running note and reload the running notes table
$("#notes_form").submit( function(e) {
    e.preventDefault();
    // should be set when clicking the button 'See All'
    var project_id = $('#runningNotesModalDeliveries_title').attr('data-project-id');

    var text = $('#new_note_text').val().trim();
    text = $('<div>').text(text).html();
    var category = $('#rn_category option:selected').val();
    if (text.length == 0) {
        alert("Error: No running note entered.");
        return false;
    }
    // don't like to use this
    note_url = '/api/v1/running_notes/' + project_id;
    $('#save_note_button').addClass('disabled').text('Submitting..');
    $.ajax({
      type: 'POST',
      method: 'POST',
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
        // Manually check whether the running note has saved - LIMS API always returns success
        $.getJSON(note_url, function(newdata) {
          var newNote = false;
          $.each(newdata, function(date, note) {
            if(data['note'] == note['note']){
              newNote = make_running_note(date, note); // defined in running_notes.js
            }
          });
          if(newNote){
            // Clear the text box
            $('#new_note_text').val('');
            $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
            $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
            // Clear the 'no running notes found' box if it's there
            if($('#running_notes_panels').html() == '<div class="well">No running notes found.</div>'){
              $('#running_notes_panels .well').slideUp(function(){ $(this).remove(); });
            }
            // Create a new running note and slide it in..
            var now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            var category_span = " <span class='label " + categories[category] + "'>"+category+"</span>";
            $('<div class="running-notes-panel panel panel-success ' + category.replace(/\s+/, '') +
                '" id="running-note-'+project_id+'"><div class="panel-heading">'+
                  '<a href="mailto:' + data['email'] + '">'+data['user']+'</a> - '+
                  now + category_span +
                '</div><div class="panel-body">'+make_markdown(data['note'])+
                '</div></div>').hide().prependTo('#running_notes_panels').slideDown();
            // Enable the submit button again
            $('#save_note_button').removeClass('disabled').text('Submit Running Note');
            // add latest running note
            $('#bioinfo-delivery-project-'+project_id).find('div.bi-project-note').text(now+' - ' +data['note']);
          } else {
            alert('Error - LIMS did not save your running note.');
            // Enable the submit button again
            $('#save_note_button').removeClass('disabled').text('Submit Running Note');
          }
        });
      }
    });
});

//Filter notes by Category
$('#running_notes_search').keyup(function() {
    var search=$('#running_notes_search').val();
    search_running_notes(search);
});

$('.btnCategoryFilter').click(function() {
    $('.btnCategoryFilter').each(function() {$(this).removeClass("glow")});
    $(this).addClass("glow")
    var key=$(this).text();
    if (key == 'All'){
        key='';
    }
    key = key.replace(/\s+/g, '');
    filter_by_category(key);
});

function filter_by_category(key){
    var project_id = $('#runningNotesModalDeliveries_title').attr('data-project-id');
    $('div#running_notes_panels div.running_notes_panel').hide();
    if (key == '') {
        $('#running_notes_panels #running-note-'+project_id).show();
    } else {
        $('#running_notes_panels #running-note-'+project_id).hide();
        $('#running_notes_panels #running-note-'+project_id + '.'+ key).show();
    }
};

function search_running_notes(search) {
    var project_id = $('#runningNotesModalDeliveries_title').attr('data-project-id');
    $('div#running_notes_panels div.running-notes-panel').hide();

     $('.btnCategoryFilter').each(function() {
        if ($(this).text() == 'All') {
            $(this).addClass('glow');
        } else {
            $(this).removeClass("glow")
        }
    });

    if (search == "") {
        $('#running_notes_panels #running-note-'+project_id).show();
    } else {
        $.each($('#running_notes_panels #running-note-'+project_id), function(index, panel){
            var note = $(panel).children('.panel-body').children().text().toLowerCase();
            if (note.indexOf(search) != -1) {
                $(panel).show();
            }
        });
    }
};
