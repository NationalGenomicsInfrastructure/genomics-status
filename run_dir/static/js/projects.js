//Get pseudo-argument for this js file. projects = 'pending' | 'ongoing' | ... 
var projects = $('#projects-js').attr('data-projects');

$(document).ready(function() {
  /* check default checkboxes */
  if (!$("#Filter :checked").length) {
    reset_default_checkboxes();
  }
  load_table();
  load_undefined_columns();
  load_presets();

  //Prevent traditional html submit function
  $('#Search-form').submit(function(event){event.preventDefault();});

  $('body').on('click', '.search-action', function(event) {
    event.preventDefault();
    switch ($(this).data('action')) {
      case 'filterReset':
        reset_default_checkboxes();
      case 'filterApply':
        load_table();
        break;
      case 'filterHeader':
        choose_column($(this).parent().attr("id"));
        break;
      case 'filterDropdown':
        select_from_preset($(this).parent().attr('id'), $(this).attr('id'));
        break;
    }
  });
});

function reset_default_checkboxes(){
  $('#Filter [id$=columns]').children('input').prop('checked', false);
  $('#Filter #basic-columns').children('input').prop('checked', true);
}

function read_current_filtering(){
  var columns = new Array();
  $("#Filter :checkbox:checked").each(function() {
    columns.push([$(this).next('label').text(), $(this).attr('name')]);
  });
  return columns
}

function load_table_head(columns){
  var tbl_head = $('<tr>');
  $.each(columns, function(i, column_tuple) {
    tbl_head.append($('<th>')
      .addClass('sort a')
      .attr('data-sort', column_tuple[1])
      .text(column_tuple[0])
    );  
  });
  $("#project_table_head").html(tbl_head);
}


/* Undefined columns handled here */
function load_undefined_columns() {
  $.getJSON("/api/v1/projects_fields?undefined=true&project_list=" + projects, function(data) {
    var columns_html = "";
    $.each(data, function(column_no, column) {
      columns_html += '<input type="checkbox" name="' + column + '" id="' + column + '">';
      columns_html += '<label for=' + column + '>' + column + '</label><br />';
    });
    $("#undefined_columns").html(columns_html);
  });
};


function load_table() {
  columns = read_current_filtering();
  load_table_head(columns);
  $.getJSON("/api/v1/projects?list=" + projects, function(data) {
    $("#project_table_body").empty();
    var size = 0;
    $.each(data, function(project_id, summary_row) {
      size++;
      var tbl_row = $('<tr>');
      $.each(columns, function(i, column_tuple){
        tbl_row.append($('<td>')
          .addClass(column_tuple[1])
          .html(summary_row[column_tuple[1]])
          );
      });
      //Add links to projects
      tbl_row.find('td.project').append(
        $('<a>').attr('href', "/project/" + project_id).text(project_id)
        );
      //parse and display running notes
      var latest_note = tbl_row.find('td.latest_running_note');
      if (latest_note.text() !== '') {
        var note = JSON.parse(latest_note.text());
        var ndate = undefined;
        for (key in note) {ndate = key; break;}
        latest_note.html(
            ndate.split(" ")[0] + ' by ' + note[ndate]['user'] + ':<pre>' + note[ndate]['note'] + '</pre>'
            );
      }
      $("#project_table_body").append(tbl_row); 
    });
    init_listjs(size, columns);
  });
}

// Initialize sorting and searching javascript plugin
function init_listjs(no_items, columns) {
  column_names = new Array();
  $.each(columns, function(i, column_tuple){
    column_names.push(column_tuple[1]);
  })
  var options = {
    valueNames: column_names,
    page: no_items /* Default is to show only 200 items at a time. */
  };
  var featureList = new List('project-list', options);
  featureList.search($('#search_field').val());
}


//Check or uncheck all fields from clicked category
function choose_column(col){
  var column = document.getElementById(col);
  //Get all the children (checkboxes)
  var cbs = column.getElementsByTagName('input');
  //If one of them is checked we uncheck it, if none of them are checked, 
  //we check them all
  var checked = false;
  for (var i = 0; i < cbs.length; i++) {
    if (cbs[i].checked) {
      cbs[i].checked = false;
      checked = true;
    }
  }
  if (!checked) {
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = true;
    }
  }
}

////////////////////////////////
// Presets related functions  //
///////////////////////////////

function load_presets() {
  $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];

    //Empty previously filled lists of presets
    $('ul#default_presets_dropdown').empty();
    $('ul#user_presets_dropdown').empty();

    //Default presets
    for (var preset in default_presets) {
      var li = '<li class="search-action" data-action="filterDropdown" id="' + preset + '">';
      li += '<a tabindex="-1">' + preset + '</a></li>';
      $('ul#default_presets_dropdown').append(li);
    }
    //User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        var li = '<li class="search-action" data-action="filterDropdown" id="' + preset + '">';
        li += '<a tabindex="-1">' + preset + '</a></li>';
        $('ul#user_presets_dropdown').append(li);
      }
    }
    else {
      var li = '<li class="disabled"><a tabindex="-1">';
      li += 'No user presets';
      li += '</a></li>';
      $('ul#user_presets_dropdown').append(li);
    }

  });
}

function select_from_preset(preset_type, preset) {
  $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    //First uncheck everything
    $('input:checkbox').removeAttr('checked');
    if (preset_type == "default_presets_dropdown") {
      var choices = data['default'][preset];
      for (column in choices) {
        for (choice in choices[column]) {
          $("#Filter #" + choice).attr('checked', choices[column][choice]);
        }
      }
    }
    else if (preset_type == "users_presets_dropdown") {
    }
  });
}

