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
            var running_note_id = [project_id, run_id, lane_id, sample_id].join(' ').trim().replace(/\s+/g, '-');
            var new_note_html = '<div class="running-notes-panel panel panel-default" id="running-note-'+running_note_id+'" style="display:none;">' +
                  '<div class="panel-heading"><a href="mailto:'+data['email']+'">'+ data['user'] + '</a> - '+ data["timestamp"]+'</div>' +
                  '<div class="panel-body"><div class="mkdown">'+data['note']+'</div></div></div>';
            // marked is defined in base.js. Do not use make_markdown - it breaks html!
            var markdown = marked(new_note_html);
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
    var span = $(element).find('td.bioinfo-status-expand span.glyphicon')
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
        var trs = $(table).find('tr.' + top_level_class);
        $.each(trs, function(index, tr) {
            if ($(tr).find('a.bioinfo-expand').hasClass('expanded')) {
                collapse(tr);
            }
        });
        $(a).removeClass('expanded');
        $(a).find('span.glyphicon').removeClass('glyphicon-chevron-down');
        $(a).find('span.glyphicon').addClass('glyphicon-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($(table).find('tr.'+top_level_class), $(table).find('tr.'+second_level_class));
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

// filter projects by flowcell status
$(".fc-status-checkbox").change(function() {
    var sample_status = $(this).val();
    var show = $(this).is(':checked');
    if (show) {
        $('div[class="delivery '+sample_status+' status-filtered"]').show().removeClass('status-filtered');
        $(' tr.bioinfo-fc:hidden:has(td span.bioinfo-status:contains('+sample_status+'))').show()
            .nextUntil('tr.bioinfo-fc', 'tr:hidden.expanded').show().closest('div.delivery:not(.bioinfo-filtered)').show();

    } else {
        $('div:visible[class="delivery '+sample_status+'"]').hide().addClass('status-filtered');
        $('div.delivery:visible table tbody tr.bioinfo-fc:has(td span.bioinfo-status:contains('+sample_status+'))').hide()
            .nextUntil('tr.bioinfo-fc', 'tr.expanded').hide();
    }
});

// filter projects by bioinfo responsible
$(".bi-responsible-checkbox").change(function() {
    var bioinfo_responsible = $(this).val();
    var show = $(this).is(':checked');

    if (show) {
        if (bioinfo_responsible == 'assigned') {
            $('div.responsible-filters input[type="checkbox"]').nextUntil(this).attr('checked', true);
            $('div.delivery:not(.status-filtered):hidden:has(h3 small span.bi-project-assigned:not(:contains(unassigned)))')
                .show().removeClass('bioinfo-filtered');
        } else {
            $('div.delivery:not(.status-filtered):hidden:has(h3 small span.bi-project-assigned:contains('+bioinfo_responsible+'))')
                .show().removeClass('bioinfo-filtered');
        }
    } else { // hide
        if (bioinfo_responsible == 'assigned') {
            $('div.responsible-filters input[type="checkbox"]').nextUntil(this).attr('checked', false);
            $('div.delivery:visible:has(h3 small span.bi-project-assigned:not(:contains(unassigned)))').hide()
                .addClass('bioinfo-filtered');
        } else {
            $('div.delivery:visible:has(h3 small span.bi-project-assigned:contains('+bioinfo_responsible+'))').hide()
                .addClass('bioinfo-filtered');
        }
    }
});