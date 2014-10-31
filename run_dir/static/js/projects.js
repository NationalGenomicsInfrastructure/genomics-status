/*
File: projects.js
URL: /static/js/projects.js
Powers /projects/[List type] - template is run_dir/design/projects.html
*/

// Get pseudo-argument for this js file. projects = 'pending' | 'ongoing' | ... 
var projects_page_type = $('#projects-js').attr('data-projects');

$(document).ready(function() {
  
  // Load the presets first (to get the table headers)
  $.when(load_presets()).done(function(){
    // Load the page content
    $.when(load_table(), load_undefined_columns()).done(function(){
      // Show the page   
      $('#loading_spinner').hide();
      $('#page_content').show();
    });
    
  });
  
  // Prevent traditional html submit function
  $('#Search-form').submit(function(event){event.preventDefault();});
  
});

// Load the Projects Table
function load_table() {
  // Get the columns and write the table header
  columns = read_current_filtering();
  load_table_head(columns);
  
  // Display the loading spinner in the table
  $("#project_table_body").html('<tr><td colspan="'+columns.length+'" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');
  
  
  return $.getJSON("/api/v1/projects?list=" + projects_page_type, function(data) {
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




// Undefined columns handled here
function load_undefined_columns() {
  return $.getJSON("/api/v1/projects_fields?undefined=true&project_list=" + projects_page_type, function(data) {
    var columns_html = "";
    $.each(data, function(column_no, column) {
      $("#undefined_columns").append('<div class="checkbox">'+
          '<label>'+
            '<input type="checkbox" class="filterCheckbox" data-columngroup="undefined-columns" data-displayname="'+column+'" name="'+column+'" id="undefined-columns-'+column+'">'+
            column+
          '</label>'+
        '</div>');
    });
  });
};



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
  return $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];

    // Empty previously filled lists of presets
    // $('#default_preset_buttons').empty();
    // $('#user_presets_dropdown').empty();

    // Default presets
    for (var preset in default_presets) {
      $('#default_preset_buttons').append('<button id="'+prettify(preset)+'" data-action="filterPresets" type="button" class="search-action btn btn-default">'+preset+'</button>');
    }
    // User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        $('#user_presets_dropdown').append('<button id="'+prettify(preset)+'" data-action="filterPresets" type="button" class="search-action btn btn-default">'+preset+'</button>');
      }
    }
    else {
      $('#user_presets_dropdown').append('No user presets');
    }
    
    // Check default checkboxes
    if (!$("#Filter :checked").length) {
      reset_default_checkboxes();
    }
    
  });
}


// Column filtering clicks 
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
    case 'filterPresets':
      select_from_preset($(this).parent().attr('id'), $(this).text());
      break;
  }
});

function reset_default_checkboxes(){
  // Sort out the button classes
  $('#default_preset_buttons button.active').removeClass('active');
  $('#resetProjectCols').addClass('active');
  // Change the checkboxes  
  $('#Filter input').prop('checked', false); // uncheck everything
  $('#basic-columns input').prop('checked', true); // check the 'basic' columns
  
  // Apply the filter
  load_table();
}

function read_current_filtering(){
  var columns = new Array();
  $("#Filter .filterCheckbox:checked").each(function() {
    columns.push([$(this).data('displayname'), $(this).attr('name')]);
  });
  return columns;
}

function select_from_preset(preset_type, preset) {
  return $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    
    //First uncheck everything
    $('#default_preset_buttons button.active').removeClass('active');
    $('#Filter input:checkbox').removeAttr('checked');
    if (preset_type == "default_preset_buttons") {
      var choices = data['default'][preset];
      for (column in choices) {
        for (choice in choices[column]) {
          var column_id = column.toLowerCase().replace(/_/g, '-') + '-' + choice;
          prettyobj(column_id).prop('checked', choices[column][choice]);
        }
      }
      prettyobj(preset).addClass('active');
      
    } else if (preset_type == "users_presets_dropdown") {
      // TODO - implement this
    }
    
    // Apply the filter
    load_table();
  });
}


//
// HELPER FUNCTIONS
//

function prettify(s) {
  // Replaces whitespace with underscores. Replaces sequential _s with one
  // Removes trailing underscores
  return s.toLowerCase().replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_/, "").replace(/_$/, "");
}

// These functions avoid parsing errors due to jQuery not liking element
// IDs with brackets in. Otherwise eqivalent to $('#'+s)
function prettyobj(s) {
  return $(document.getElementById(prettify(s)));
}
function safeobj(s) {
  return $(document.getElementById(s));
}
