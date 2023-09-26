// Translates fetched text from markdown to HTML
$(document).ready(function(){
    $('.running-note-body, .bi-project-note').each(function(){
        var raw_html = $(this).html();
        $(this).html( marked(raw_html) );
    });
    
    $('.fillbadgecolour').html(function(){
        //from running_notes.js
        let categories = JSON.parse($(this).text().replace(/'/g, '"'))
        return generate_category_label(categories)
    });
    $('.card-body').addClass('trunc-note');
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
  var expanded = $(element).find('a[href="#'+element_id+'"]');
  $(expanded).removeClass('expanded');
  var span =$(element).find('td.bioinfo-status-expand span.fa');
  if ($(span).hasClass('fa-chevron-down')) {
    $(span).removeClass('fa-chevron-down');
    $(span).addClass('fa-chevron-right');
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
    var span = $(element).find('td.bioinfo-status-expand span.fa');
    if ($(span).hasClass('fa-chevron-right')) {
        $(span).removeClass('fa-chevron-right')
        $(span).addClass('fa-chevron-down');
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
        $(a).find('span.fa').removeClass('fa-chevron-down');
        $(a).find('span.fa').addClass('fa-chevron-right');
    } else { // expand - not recursively
        var trs = $.merge($(table).find('tr:not(.filtered).'+top_level_class),
            $(table).find('tr:not(.filtered).'+top_level_class).nextUntil('tr.'+top_level_class,
            ':has(td.bioinfo-status-expand a:not(.expanded))'));
        $.each(trs, function(index, tr) {
            expand(tr);
        });
        $(a).addClass('expanded');
        $(a).find('span.fa').removeClass('fa-chevron-right');
        $(a).find('span.fa').addClass('fa-chevron-down');
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
                var success_msg = $('<span id="bioinfo-resp-status" class="delivery-saved-status">    Updated<span class="fa fa-check"></span></span>');
                success_msg.appendTo($(parent).find('.button-edit-bioinfo-responsible')).fadeOut(1600, function(){ $(this).remove(); });

                // updating bioinfo-responsible filter
                // reducing the number of projects for old_responsible
                var old_checkbox = $('div.responsible-filters').find('input.bi-responsible-checkbox[value="'+old_responsible+'"]');
                var old_number_span = $(old_checkbox).parent().find('span.badge');
                var old_number_of_projects = parseInt($(old_number_span).text().trim());
                // hide if it was the last project
                if (old_number_of_projects == 1) {
                    $(old_checkbox).closest('div.chkbox').hide();
                // reduce otherwise
                } else {
                    $(old_number_span).text(old_number_of_projects - 1);
                }
                // increasing the number of projects for new_responsible
                var new_checkbox = $('div.responsible-filters').find('input.bi-responsible-checkbox[value="'+responsible+'"]');
                // create checkbox if not exist
                if (new_checkbox.length == 0) {
                    var html = '<div class="chkbox mb-2"> <label class="checkbox-inline"> <input class="bi-responsible-checkbox" type="checkbox" value="'
                        + responsible+'" checked>' + responsible + ' <span class="badge rounded-pill bg-secondary">1</span> </label> </div>'
                    var new_element = $.parseHTML(html);
                    $('div.responsible-filters').append(new_element);
                // increase the number of projects
                } else {
                    var new_number_span = $(new_checkbox).parent().find('span.badge');
                    var new_number_of_projects = parseInt($(new_number_span).text().trim());
                    $(new_number_span).text(new_number_of_projects + 1);
                }
            },
        });
    }

    $(this).parent().find('.bi-project-assigned').text(responsible).show();
    $(this).parent().find('.edit-bi-project-assigned').hide();
    $(this).parent().find('.button-edit-bioinfo-responsible').show();
    $(this).parent().find('.button-save-bioinfo-responsible').hide();
    $(this).parent().find('.button-reset-bioinfo-responsible').hide();
});
