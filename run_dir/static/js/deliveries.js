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
    var project_id = tr_id[0];
    var run_id = tr_id[1];
    var lane_id = tr_id[2];
    var sample_id = tr_id[3];

    // join not undefined values -> if undefined, will skip
    var prefix = [run_id, lane_id, sample_id].join(' ');

    running_note = prefix + '::: ' + running_note;

    var url='/api/v1/running_notes/' + project_id;
    var button = $(this);
    $(button).addClass('disabled').text('Submitting..');

    $.ajax({
        type: 'POST',
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
            var new_note_html = '<div class="running-notes-panel panel panel-default" id="running-note-'+[project_id, run_id, lane_id, sample_id].join('-')+'" style="display:none;"> \
                  <div class="panel-heading"><a href="mailto:'+data['email']+'">'+ data['user'] + '</a> - '+ data["timestamp"]+'</div> \
                  <div class="panel-body"><div class="mkdown">'+data['note']+'</div></div></div>';
            // make_markdown is defined in base.js
            var markdown = make_markdown(new_note_html);
            $('#running_notes_panels').prepend(markdown);
        }
    });
});

$('.bioinfo-running-notes-cancel').click(function(e) {
    var td = $(this).parent();
    var tr = $(td).parent();
    var running_note = $(td).attr('data-running-note');
    $(td).find('p').text(running_note);
});

$('.deliveries-page').on('click', '.runningNotesModal_button', function(e){
    var button = $(this);
    var project_id = $(button).parents('div.delivery').attr('id');
    project_id = project_id.replace('bioinfo-delivery-project-', '');
    // hopefully this will replace the project value in the running_notes.js
    project = project_id;
    var project_notes = $('.running-notes-panel[id^=running-note-'+project_id+']');
    $.each(project_notes, function(i, running_note){
        $(running_note).show();
    });
    $('#runningNotesModal_title').text('Running Notes for project '+project_id);
});

$('#runningNotesModal').on('hidden.bs.modal', function (e) {
  var running_notes = $('.running-notes-panel');
    $.each(running_notes, function(i, running_note){
        $(running_note).hide();
    });
})


function topParent(tr) {
    var parent_id = $(tr).attr('data-parent');
    // tr = topParent = .bioinfo-project
    if (parent_id == undefined){
        console.log($('table.table-bioinfo-status').find('tr[data-parent="'+$(tr).attr('id')+'"]'));
    }
    console.log(parent_id);
    var parent_tr = $(parent_id);
    console.log($(parent_tr));
//    if ($(parent_tr).hasClass('bioinfo-project')) {
//        return $(tr);
//    } else {
//        return topParent(parent_tr);
//    }
};


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
  var children = $(element).parent().find('tr[data-parent=#'+element_id+']')
  $.each(children, function(index, child) {
    $(child).hide();
    collapse(child);
  });
};

function expand(element) {
    var a = $(element).find('.bioinfo-expand');
    $(a).addClass('expanded');
    var tr_id = $(element).attr('id');
    $('tr[data-parent=#'+tr_id+']').show();
    var span = $(element).find('td.bioinfo-status-expand span.glyphicon')
    if ($(span).hasClass('glyphicon-chevron-right')) {
        $(span).removeClass('glyphicon-chevron-right')
        $(span).addClass('glyphicon-chevron-down');
    }
};

function collapseAll(a) {
    var current_tr = $(a).parent().parent();
    var top_parent_tr = topParent(current_tr);
    var top_level_class = "";
    var second_level_class = "";
    if ($(top_parent_tr).hasClass('bioinfo-sample')) {
        top_level_class = 'bioionfo_sample';
        second_level_class = 'bioinfo-fc';
    } else if ($(top_parent_tr).hasClass('bioinfo-fc')) {
        top_level_class = 'bioinfo-fc';
        second_level_class = 'bioinfo-lane';
    } else {
        alert('unknown data structure! Change deliveries.js or bioinfo_tab.js!');
    }

    if ($(a).hasClass('expanded')) { // collapse recursively
        var trs = $('.table-bioinfo-status ' + top_level_class);
        $.each(trs, function(index, tr) {
            if ($(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                collapse(tr);
            }
        });
        $(a).removeClass('expanded');
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-down');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($('.table-bioinfo-status tr.'+top_level_class), $('.table-bioinfo-status '+second_level_class));
         $.each(trs, function(index, tr) {
            if (!$(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                expand(tr);
            }
         });
         $(a).addClass('expanded');
         $(a).find('span.glyphicon').removeClass('glyphicon-chevron-right');
         $(a).find('span.glyphicon').addClass('glyphicon-chevron-down');
    }
};
