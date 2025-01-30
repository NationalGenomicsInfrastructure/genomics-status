/*
File: projects.js
URL: /static/js/projects.js
Powers /projects/ - template is run_dir/design/projects.html
*/

//sorting/filtering filter
var saved_filter={};
//sorted/filtered preset to be saved
var sort_preset='';

// On page load
$(function(){

  $('#pageInfo').on('click', function(){
     $('#displayPageInfo').slideToggle();
  });

  $('#displayPageInfo').find('button').click(function(){
     $('#displayPageInfo').slideToggle();
  });

  $('#filterInfo').on('click', function(){
     $('#displayInfo').slideToggle();
  });

  $('#displayInfo').find('span[type="button"]').click(function(){
     $('#displayInfo').slideToggle();
  });

  // Load the presets first (to get the table headers)
  $.when(load_presets()).done(function(){
    // Show the page
    $('#loading_spinner').hide();
    $('#page_content').show();

    //API call to get table on load
    const queryString = window.location.search.slice(1);
    const urlParams = new URLSearchParams(queryString);
    var on_load = false;
    var preset_to_be_loaded = 'Lab Ongoing';
    var preset_origin = 'default';


    function fetch_user_onload_preset(){
      // Fetch user defined 'onload' preset
      return $.getJSON('/api/v1/presets/onloadcheck?action=load', function (data) {
        if(data!=null){
          // preset on load found
          on_load = data['loadtable']
          preset_to_be_loaded = data['preset']
          preset_origin = data['origin']
          // Switch the settings 
          setChangingDropdownValue($('#all_presets_dropdown'), preset_origin, preset_to_be_loaded);
          if(data['loadtable']==true){
            $("#onLoadTableOn").trigger("click");
          }
          else {
            $("#onLoadTableOff").trigger("click");
          }
          // Indicate which preset that is chosen
          if(preset_origin=='userdefined'){
            $('#user_presets_dropdown').find(".btn").addClass('active');
            setChangingDropdownValue($('#user_presets_dropdown'), preset_origin, preset_to_be_loaded);
            $('#formDeletePresetName').val(preset_to_be_loaded);
            appendDeleteBtn(preset_to_be_loaded);
            select_from_preset("users_presets_dropdown", preset_to_be_loaded);
          } else {
            select_from_preset("default_preset_buttons", preset_to_be_loaded);
            $("#default_preset_buttons").find('input[data-value="'+preset_to_be_loaded+'"]').prop('checked', true)
          }
        } else {
          // No preset saved to be selected automatically
          $("#presetOpt-lab_ongoing").trigger("click");
          $("#statusOptAll").trigger("click");
          select_from_preset("default_preset_buttons", 'Lab Ongoing');
        }
      })
    }

    $.when(fetch_user_onload_preset()).done(function() {
      if (urlParams.has('load_preset')) {
        // this takes precedence
        preset_to_be_loaded = urlParams.get('load_preset')
        preset_button = $("#default_preset_buttons").find('input[data-value="'+preset_to_be_loaded+'"]')

        if (preset_button.length > 0){
          preset_origin = 'default'
        } else {
          preset_origin = 'userdefined'
        }

        // Presets from url params will always be loaded
        on_load = true
      }

      if (on_load) {
        if(preset_origin=='userdefined'){
          // Indicate which preset that is chosen
          $("#default_preset_buttons").find('input').prop('checked', false)
          $('#user_presets_dropdown').find(".btn").addClass('active');
          setChangingDropdownValue($('#user_presets_dropdown'), preset_origin, preset_to_be_loaded);
          $('#formDeletePresetName').val(preset_to_be_loaded);
          appendDeleteBtn(preset_to_be_loaded);
          select_from_preset("users_presets_dropdown", preset_to_be_loaded);
        }
        else{
          // Default presets
          $('#formDeletePresetName').val('');
          $('#deletePresetBtn').remove();
          $('#user_presets_dropdown').find(".btn").removeClass('active');

          if(preset_to_be_loaded!='Choose Preset'){
            $("#default_preset_buttons").find('input[data-value="'+preset_to_be_loaded+'"]').prop('checked', true);
            select_from_preset("default_preset_buttons", preset_to_be_loaded);
          }
          else {
            $("#presetOpt-lab_ongoing").trigger("click");
            select_from_preset("default_preset_buttons", 'Lab Ongoing');
          }
          updateStatusBar1($('#statusbtnBar1 :input[data-projects=all]'));
        }
        setTimeout(getTableParamsandLoad,300);

      }
    });
  });

  // Prevent traditional html submit function
  $('#Search-form').submit(function(event){event.preventDefault();});

  //Search filter for choose preset fields
  $("#formSearchfields").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    var arr =[];
    $('[id^="allFields-"]').each(function(i, elem) {
          if (elem.closest('label').textContent.toLowerCase().indexOf(value) != -1) {
            if(jQuery.inArray($(this).data('columngroup'), arr) == -1){
              arr.push($(this).data('columngroup').toLowerCase());
            }
            $(this).closest('label').show();
          }else{
              $(this).closest('label').hide();
          }
    });
    $('.colHeader').each(function(i, elem) {
      if(jQuery.inArray($(this).prop('id'), arr) == -1){
        $(this).find('h4').hide();
      }
      else{
        $(this).find('h4').show();
      }
    })
  });

  $(".sortableListSource").sortable({
      connectWith: ".sortableListSource"
    });

  $('[data-toggle="tooltip"]').tooltip()

});
// Load the Projects Table
function load_table(status, type, columns, dates) {
  if ($.fn.dataTable.isDataTable( '#project_table' )){
      var dtbl= $('#project_table').DataTable();
      dtbl.destroy();
      $("#project_table_filter").remove();
  }
  // Get the columns and write the table header
  load_table_head(columns);
  // Display the loading spinner in the table
  $("#project_table_body").html('<tr><td colspan="'+columns.length+'" class="text-muted"><span class="fa fa-sync fa-spin"></span> <em>Loading...</em></td></tr>');
  url="/api/v1/projects?list=";
  $.each( status, function( i, val ) {
    if(i+1<status.length){
      url=url+val+",";
    }
    else {
      url=url+val;
    }
  })
  // Date filtering
  if(dates['old_open_date']!='')
    url=url+"&oldest_open_date="+dates['old_open_date'];
  if(dates['new_open_date']!='')
    url=url+"&youngest_open_date="+dates['new_open_date'];
  if(dates['old_queue_date']!='')
    url=url+"&oldest_queue_date="+dates['old_queue_date'];
  if(dates['new_queue_date']!='')
    url=url+"&youngest_queue_date="+dates['new_queue_date'];
  if(dates['old_close_date']!='')
    url=url+"&oldest_close_date="+dates['old_close_date'];
  if(dates['new_close_date']!='')
    url=url+"&youngest_close_date="+dates['new_close_date'];

  url=url+"&type="+type;
  //Current loaded fields :
  var fields= [];
  $("#allFields .filterCheckbox").each(function() {
    fields.push($(this).attr('name'));
  });
  return $.getJSON(url, function(data) {
    $("#project_table_body").empty();
    var size = 0;
    undefined_fields=[];
    if ($('#user_presets_dropdown .dropdown-toggle').hasClass('active')){
      //only add sorting/filtering save button if user-defined preset is loaded
      $("#copyTable").append('<button type="submit" class="btn btn-sm btn-primary mt-3 float-right" id="saveFilter">Save filtering/sorting to Preset</button>').html();
    }
    $.each(data, function(project_id, summary_row) {
      $.each(summary_row, function(key,value){
        //this tracks the fields existing in our projects objects, but not present in the filter tab yet.
        if ($.inArray(key, undefined_fields) == -1 && $.inArray(key, fields) == -1 && key !== 'running_notes'){
          undefined_fields.push(key);
        }
      });
      size++;
      var tbl_row = $('<tr>');
      $.each(columns, function(i, column_tuple){
        tbl_row.append($('<td>')
          .addClass(column_tuple[1])
          .html(function(){
            if(column_tuple[1]=='delivery_projects' && !(typeof summary_row[column_tuple[1]] === "undefined")){
              let txt='';
              $.each(summary_row[column_tuple[1]], function(i, item){
                txt+=item+'<br/>';
              })
              return txt;
            }
            else if(column_tuple[1]=='priority'){
              let txt='';
              if(summary_row[column_tuple[1]]==='High'){
                txt = '<span class="badge bg-danger"> Priority <span class="fa-solid fa-flag fa-sm"></span></span>'
              }
              return txt;
            }
            return summary_row[column_tuple[1]];
          })
          .addClass(function(){
            if(column_tuple[0].indexOf('fa')>=0){
              if(summary_row[column_tuple[1]]!='-' && typeof summary_row[column_tuple[1]] !== 'undefined'){
                to_ret='';
                check_value = Math.abs(summary_row[column_tuple[1]]);
                switch(column_tuple[1]){
                  case 'days_recep_ctrl':
                    to_ret = check_value>7 ? check_value>14 ? 'alert-red': 'alert-orange' :'alert-green';
                    break;
                  case 'days_prep_start':
                    to_ret = check_value>7 ? check_value>10 ? 'alert-red': 'alert-orange' :'alert-green';
                    break;
                  case 'days_seq_start':
                    to_ret = check_value>7 ? check_value>10 ? 'alert-red': 'alert-orange' :'alert-green';
                    break;
                  case 'days_seq':
                    to_ret = check_value>7 ? check_value>14 ? 'alert-red': 'alert-orange' :'alert-green';
                    break;
                  case 'days_analysis':
                    to_ret = check_value>7 ? check_value>10 ? 'alert-red': 'alert-orange' : 'alert-green';
                    break;
                  case 'days_data_delivery':
                    to_ret = check_value>7 ? check_value>10 ? 'alert-red': 'alert-orange' : 'alert-green';
                    break;
                  case 'days_close':
                    to_ret = check_value>7 ? check_value>10 ? 'alert-red': 'alert-orange' : 'alert-green';
                    break;
                  case 'days_prep':
                    to_ret = check_value>10 ? check_value>19 ? 'alert-red': 'alert-orange' : 'alert-green';
                    break;
                }
              return to_ret;
              }
            }
          })
        );
      });

      // Add links to projects
      tbl_row.find('td.project').html('<a class="text-decoration-none" href="/project/' + project_id + '">' + project_id + '</a>');

      // Add links to Portal References
      var portal_name = summary_row['customer_project_reference'];
      var portal_id = summary_row['portal_id'];
      tbl_row.find('td.customer_project_reference').html('<a target="_blank" class="text-decoration-none" href="https://ngisweden.scilifelab.se/orders/order/'+portal_id + '">' + portal_name + '</a>');

      //parse and display running notes
      var latest_note = tbl_row.find('td.latest_running_note');
      if (latest_note.text() !== '') {
        var note = JSON.parse(latest_note.text());
        var ndate = undefined;
        for (key in note) { ndate = key; break; }
        notedate =  new Date(ndate.replace(' ', 'T'));
        latest_note.html('<div class="card">' +
            '<div class="card-header">'+
              note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
              ' - '+ generate_category_label(note[ndate]['categories']) +
            '</div><div class="card-body trunc-note-latest">'+make_markdown(note[ndate]['note'])+'</pre></div></div>');

      }
      $("#project_table_body").append(tbl_row);
    });
    add_undefined_columns(undefined_fields)

    // Initialise the Javascript sorting now that we know the number of rows
    init_listjs(size, columns);
  });
}

function load_table_head(columns){
  var tbl_head = $('<tr class="sticky darkth">');
  var tbl_foot = $('<tr class="darkth">');
  $.each(columns, function(i, column_tuple) {
    tbl_head.append($('<th>')
      .addClass(function(){
        var toReturn = 'sort a';
        return toReturn;
      })
      .attr("data-sort",  column_tuple[1])
      .attr("data-toggle",  function(){
        if(column_tuple[0].indexOf('fa')>=0)
        return 'tooltip';
      })
      .attr("title",  function(){
        if(column_tuple[0].indexOf('fa')>=0)
        return column_tuple[2];
      })
      .text(function(){
        if(column_tuple[0].indexOf('fa')<0)
          return column_tuple[0]
      })
      .html(function(){
        if(column_tuple[0].indexOf('fa')>=0){
            return '<i class= "fa '+column_tuple[0]+'"></i>';
        }
      })
    );
    tbl_foot.append($('<th>')
      .text(function(){
        if(column_tuple[0].indexOf('fa')<0)
          return column_tuple[0]
      })
    );
  });
  $("#project_table_head").html(tbl_head);
  $("#project_table_foot").html(tbl_foot);
}


// Undefined columns handled here now
function add_undefined_columns(cols) {
    var columns_html = "";
    $.each(cols, function(col_id, column) {
      $("#undefined_columns").append('<div class="checkbox">'+
          '<label>'+
            '<input type="checkbox" class="filterCheckbox mr-1" data-columngroup="UNDEFINED_COLUMNS" data-displayname="'+column+'" name="'+column+'" id="allFields-undefined-columns-'+column+'">'+
            column+
          '</label>'+
        '</div>');
    });
};

// Initialize sorting and searching javascript plugin
function init_listjs(no_items, columns) {
    // Setup - add a text input to each footer cell
    $('#project_table tfoot th').each( function () {
      var title = $('#project_table thead th').eq( $(this).index() ).text();
      var inputSize = 10;
      if(title.length==0)
        inputSize = 1;
      $(this).html( '<input size='+inputSize+' type="text" placeholder="Search '+title+'" />' );
    } );

    //initialize custom project sorting
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
            "pid-pre": function(a) {
                        return parseInt($(a).text().replace(/P/gi, ''));
                            },
            "pid-asc": function(a,b) {
                        return a-b;
                            },
            "pid-desc": function(a,b) {
                        return b-a;
                            }
    });
    if ($.fn.dataTable.isDataTable( '#project_table' )){
        var table = $('#project_table').DataTable();
    }else{
        var table = $('#project_table').DataTable({
           "aoColumnDefs": [
              {"sType": "pid", "aTargets": [0]}
           ],
          "paging":false,
          "destroy": true,
          "info":false,
          "order": [[ 0, "desc" ]],
          dom: 'Bfrti',
          buttons: [
            {
              extend: 'copy',
              className: 'btn btn-outline-dark mb-3',
              messageTop: null,
              title: null,
            },
            {
              extend: 'excel',
              className: 'btn btn-outline-dark mb-3',
              messageTop: null,
              title: null,
            }
          ],
          "stateSave": true,
          "stateLoadCallback": function () {
          // read out the filter settings and apply
              return saved_filter;
            }
        });
    }
    $(".dt-buttons > .buttons-copy").prepend("<span class='mr-1 fa fa-copy'>");
    $(".dt-buttons > .buttons-excel").prepend("<span class='mr-1 fa fa-file-excel'>");

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#project_table_filter').addClass('form-inline float-right m-2');
    $("#project_table_filter").appendTo("h1");
    $('#project_table_filter label input').appendTo($('#project_table_filter'));
    $('#project_table_filter label').remove();
    $("#project_table_filter input").attr("placeholder", "Search..");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        } );
    } );
}

//Check or uncheck all fields from clicked category
function choose_column(col, colid){
  var column = document.getElementById(col);
  //Get all the children (checkboxes)
  var cbs=$( "#"+col+"" ).find('input[data-columngroup="'+colid.toUpperCase().replace('-', '_')+'_COLUMNS"]');
  //If one of them is checked we uncheck it, if none of them are checked,
  //we check them all
  var checked = false;
  for (var i = 0; i < cbs.length; i++) {
    if (cbs[i].checked) {
      cbs[i].checked = false;
      checked = true;
    }
  }
  if($( "#"+colid+"" ).find('input').prop('checked'))
    $( "#"+colid+"" ).find('input').prop('checked',false);
  if (!checked) {
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = true;
    }
    $( "#"+colid+"" ).find('input').prop('checked',true);
  }
  updateTableFields("");
}

////////////////////////////////
// Presets related functions  //
///////////////////////////////

function load_presets() {
  return $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];


    var allPresetsDropdownMod='<button class="btn btn-outline-dark dropdown-toggle wrapStyle" type="button" id="inputStateAll" data-toggle="dropdown">\
      <i class="fa fa-list-alt"></i> Choose Preset <span class="caret"></span></button> \
      <ul id="inputStateAllul" class="dropdown-menu" role="menu" aria-labelledby="inputStateAll">';

    allPresetsDropdownMod+='<li><a href="#" class="clickDropdownGetValue dropdown-item" style="cursor:pointer;" data-value="Choose Preset" data-origin="default"> Choose Preset</a></li>';
    for (var preset in default_presets) {
      $('#default_preset_buttons').append('<input type="radio" name="presetOptions" id="presetOpt-'+prettify(preset)+'" data-value="'+preset+'" autocomplete="off" class="btn-check">\
          <label class="btn btn-outline-dark rBtngp2" for="presetOpt-'+prettify(preset)+'"><i class="fa '+default_presets[preset].ICON.glyphicon+'"></i> '+preset+'</label>');

      allPresetsDropdownMod+='<li><a href="#" class="clickDropdownGetValue dropdown-item" data-value="'+preset+'" data-origin="default">'+preset+'</a></li>';
    }

    var userDefPresetsDropdown='<button id="inputPreset" class="btn btn-outline-dark dropdown-toggle wrapStyle" data-toggle="dropdown" type="button">\
      <i class="fa fa-user"></i> User defined Presets <span class="caret"></span></button>\
      <ul id="inputPresetul" class="dropdown-menu dropdown-menu-wide" role="menu" aria-labelledby="inputPreset">';
    // User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        userDefPresetsDropdown+='<li><a href="#" class="clickDropdownGetValue dropdown-item" style="cursor:pointer;" data-value="'+preset+'"> '+preset+'</a></li>';
        allPresetsDropdownMod+='<li><a href="#" class="clickDropdownGetValue dropdown-item" style="cursor:pointer;" data-value="'+preset+'" data-origin="userdefined"">'+preset+'</a></li>';
      }
    }
    userDefPresetsDropdown+='</ul>';
    $('#user_presets_dropdown').append(userDefPresetsDropdown);
    allPresetsDropdownMod+='</ul>';
    $('#all_presets_dropdown').append(allPresetsDropdownMod);

    //changing the button value
    $('.clickDropdownGetValue').on("click", function() {
      setChangingDropdownValue($(this).parents(".changingDropdown"), $(this).data('origin'), $(this).text());
      });
  });
}

function update_presets_onChange() {
    $('#inputStateAll').remove();
    $('#inputStateAllul').remove();
    $('#inputPreset').remove();
    $('#inputPresetul').remove();
    $('#default_preset_buttons').find('label').each(function(e){
      $(this).remove();
    })
    load_presets();
}

function setChangingDropdownValue(elem, origin, text){
  var saveClass=elem.find('.fa').attr('class');
  elem.find('.btn').html('<i class="'+saveClass+'" data-origin="'+origin+'"></i> '+text+' <span class="caret"></span>');
}

// Column filtering clicks
$('body').on('click', '.search-action', function(event) {
  event.preventDefault();
  switch ($(this).data('action')) {
    case 'filterApply':
      saveOnLoadStatus();
      break;
    case 'filterHeader':
      choose_column($(this).parent().attr("id"), $(this).attr("id"));
      break;
    case 'filterPresets':
      select_from_preset($(this).parent().attr('id'), $(this).text());
      break;
  }
});

function saveOnLoadStatus(){
  var checked;
  var origin="";
  var preset="";

  if($("input[name='onLoadTable']:checked").prop('id')=="onLoadTableOn")
    checked=true;
  else
    checked=false;

  origin=$($.parseHTML($('#inputStateAll').html())[0]).data('origin');
  preset=$.trim($("#inputStateAll").text());

  $('#applySettingsModal').addClass('disabled').text('Saving...');
  $.ajax({
    type: 'POST',
    dataType: 'json',
    url: '/api/v1/presets/onloadcheck?action=save',
    data: JSON.stringify({ "loadtable": checked,
            "preset": preset,
            "origin": origin
          }),
    error: function(xhr, textStatus, errorThrown) {
      alert('There was an error in saving the settings: '+errorThrown);
      $('#applySettingsModal').removeClass('disabled').text('Save');
      console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(preset, origin);
    },
    success: function(saved_data, textStatus, xhr) {
      $('#applySettingsModal').addClass('disabled').text('Saved!').delay(1500).queue(function(){ $('#settingsModal').modal('toggle'); $('#applySettingsModal').removeClass('disabled').text('Save'); $('#applySettingsModal').dequeue();});
    }
  });
}

$('body').on('click hidden.bs.dropdown', '.rBtngp2', function(event){
  event.preventDefault();
  if ($(this).hasClass('changingDropdown')){
    $.each($('.rBtngp2').get().map(x => x.getAttribute('for')), function(i, id){
      $('#'+id).prop('checked', false);
    })
    $(this).find(".btn").addClass('active');

  }
  else{
    $('#inputPreset').removeClass('active');
    $('#'+$(this).attr('for')).prop('checked', true);
  }
  //get chosen preset and populate in table
  read_current_filtering();
});

//Saving the filtering/sorting to user-defined preset
$(document).on('click', '#saveFilter', function() {
  var presetFilterName = '';
  if ($('#user_presets_dropdown .dropdown-toggle').hasClass('active')){
    //if user-defined preset selected, save to old preset
    presetFilterName=$('#user_presets_dropdown .dropdown-toggle').text();
    if (sort_preset !== presetFilterName){
      //if selected preset does not match the loaded preset, otherwise in won't apply to the correct preset
      alert('The selected Preset does not match the table, please click "Load Table" and redo the sorting/filtering again to save it.');
    }
    else {
      //save
      var table_filter = $('#project_table').DataTable().state()
      var userPage_api_url = "/api/v1/presets?savefilter="+$.trim(presetFilterName);
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: userPage_api_url,
        data: JSON.stringify(table_filter),
        error: function(xhr, textStatus, errorThrown) {
          alert('There was an error in saving the preset: '+errorThrown);
          $('#saveFilter').removeClass('disabled').text('Error saving');
          console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(JSON.stringify(table_filter));
        },
        success: function(saved_data, textStatus, xhr) {
          $('#saveFilter').addClass('disabled').text('Saving...').delay(1500).queue(function(){$(this).removeClass('disabled').text('Save filtering/sorting to Preset'); $(this).dequeue()});
        }
      });
    }
  }
  else if ($('input[name="presetOptions"]:checked')){
    //if default preset selected
    alert('Please select a user-defined Preset'); 
  }
});

function read_current_filtering(){
  var columns = new Array();
  var preset;
  if($("#presetButtons .active").prop("id")=="inputPreset"){
    $('#formPresetName').val('');
    preset=$.trim($("#presetButtons .active").text());
    $('#formPresetName').val(preset);
    $('#formDeletePresetName').val(preset);
    if (preset!='User defined Presets') {
        appendDeleteBtn(preset);
    }
    select_from_preset("users_presets_dropdown", preset);
  }
  else{
    if($('#deletePresetBtn').closest("html").length>0)
      $('#deletePresetBtn').remove();
    $('#formPresetName').val('');
    preset=$('#presetButtons').find('input:checked').data('value');
    $('#formDeletePresetName').val('');
    select_from_preset("default_preset_buttons", preset);
  }
}

function appendDeleteBtn(preset){
  $('#deletePresetBtn').remove();
  $("#savePresetBtn").after("<button type='submit' class='btn btn-danger m-2' id='deletePresetBtn' data-toggle='modal' data-target='#deleteModal'>Delete "+preset+"</button>");
}

function sel_from_ps(preset_type, preset, data){
    //First uncheck everything
  $('#default_preset_buttons button.active').removeClass('active');
  $('.filterCheckbox').prop('checked', false);
  if (preset_type == "default_preset_buttons") {
    if(preset=='Lab Ongoing'){
      $('[name="statusOptions"').prop('checked', false)
      updateStatusBar1($('#statusOptOngoing'), 'defaultClick');
    }
    if(preset=='Rec Ctrl'){
      $('[name="statusOptions"').prop('checked', false)
      updateStatusBar1($('#statusOptRecCtrl'), 'defaultClick');
    }
    if(preset=='Need Review'){
      $('[name="statusOptions"').prop('checked', false)
      updateStatusBar1($('#statusOptNeedReview'), 'defaultClick');

    }
    if(preset=='Bioinformatics'){
      $('[name="statusOptions"').prop('checked', false)
      updateStatusBar1($('#statusOptOngoing'), 'defaultClick');

    }
    if(preset=='Order Status'){
      $('[name="statusOptions"').prop('checked', false)
      updateStatusBar1($('#statusOptOngoing'), 'defaultClick');

    }
    var choices = data['default'][preset];
    for (column in choices) {
      if(column.indexOf('COLUMNS')!=-1){
        for (choice in choices[column]) {
          var column_id = 'allFields-'+column.toLowerCase().replace(/_/g, '-') + '-' + choice.replace(/\(|\)/g, '');
          $("#"+column_id).prop('checked', true);
        }
      }
    }
    resetReorderFields();
  }
  else if (preset_type == "users_presets_dropdown") {
    resetReorderFields();
    var choices = data['user'][preset];
    var order="";
    for (column in choices) {
      if(column.indexOf('COLUMNS')!=-1){
        for (choice in choices[column]) {
          var column_id = 'allFields-'+column.toLowerCase().replace(/_/g, '-') + '-' + choice.replace(/\(|\)/g, '');
          $("#"+column_id).prop('checked', true);
        }
        if(choices['COLUMNORDER'])
          order=choices['COLUMNORDER'];
      }
      else {
        if(column.indexOf('STATUS')!=-1){
          $('.sOptions').prop('checked', false);
          $.each( choices[column].split(', '), function(i, val) {
            $('#statusbtnBar1 :input[data-projects='+val+']').prop('checked', true);
            updateStatusBar1($('#statusbtnBar1 :input[data-projects="'+val+'"]'));
          })
        }
        if(column.indexOf('TYPE')!=-1){
          var saveClass=$('#formTypedropdown').find('.fa').attr('class');
          $('#formTypedropdown').find('.btn').html('<i class="'+saveClass+'"></i> '+choices[column]+' <span class="caret"></span>')
        }
        if(column.indexOf('DATES')!=-1){
          $('#inp_date_1').val(choices[column]['old_open_date']);
          $('#inp_date_2').val(choices[column]['new_open_date']);
          $('#inp_date_3').val(choices[column]['old_queue_date']);
          $('#inp_date_4').val(choices[column]['new_queue_date']);
          $('#inp_date_5').val(choices[column]['old_close_date']);
          $('#inp_date_6').val(choices[column]['new_close_date']);
        }
        if(column.indexOf('FILTER')!=-1){
          //filter/sort to be saved to usr-def preset
          saved_filter=choices[column];
        }
      }
    }
    updateTableFields(order);
  }
}

function select_from_preset(preset_type, preset, data=null) {
    if (data == null){
      $.getJSON('/api/v1/presets?presets_list=pv_presets', function(data){sel_from_ps(preset_type, preset, data)})
        .fail(function(jqXHR, textStatus, errorThrown) { alert('getJSON request failed! ' + textStatus); });
    }else{
        sel_from_ps(preset_type, preset, data);
    }
}

$('#deletePresetBtnModal').click(function(e){
  var presetToDel=$.trim($('#formDeletePresetName').val());
  $('#deletePresetBtnModal').addClass('disabled').text('Deleting...');
  $.getJSON('/api/v1/presets/onloadcheck?action=load', function (data) {
    if(data['origin']=='userdefined' && data['preset']==presetToDel){
      data['origin']='default';
      data['preset']='Choose Preset';
      data['loadtable']=false;
      $("#onLoadTableOff").trigger("click");
      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/v1/presets/onloadcheck?action=save',
        data: JSON.stringify(data),
        error: function(xhr, textStatus, errorThrown) {
          alert('There was an error in saving the settings: '+errorThrown);
          console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(preset, origin);
        },
        success: function(saved_data, textStatus, xhr) {
          console.log('onloadcheck updated!');
        }
      });
    }
  })
  var userPage_api_url = "/api/v1/presets?delete="+presetToDel;
  $.ajax({
    type: 'POST',
    //dataType: 'json',
    url: userPage_api_url,
    data: {'presetname': presetToDel},
    error: function(xhr, textStatus, errorThrown) {
      alert('There was an error in deleting the preset: '+errorThrown);
      $('#deletePresetBtnModal').removeClass('disabled').text('Delete');
      console.log(xhr); console.log(textStatus); console.log(errorThrown);console.log(presetToDel);;
    },
    success: function(saved_data, textStatus, xhr) {
      $('#deletePresetBtnModal').addClass('disabled').text('Deleted!').delay(1500).queue(function(){ $('#deleteModal').modal('toggle'); $(this).removeClass('disabled').text('Delete'); $(this).dequeue()});
      update_presets_onChange();
      $("#deletePresetBtn").remove();
      setTimeout(function() {
        $("#presetOpt-lab_ongoing").trigger("click");
      }, 100);
    }
  });
})

$('body').on('change', '.sOptions', function(event) {
  updateStatusBar1($(this), 'add');
});

function updateStatusBar1(source, type){
  var currChoice=source.attr('id');
  var prevChoices=[];
  var chosenStatusStr="";
  if(type!='defaultClick'){
    $('.sOptions').each(function(e){
      if(this.checked)
        prevChoices.push($(this).attr('id'));
    })
  }
  else{
    prevChoices.push(currChoice);
  }
  $('.sOptions').prop('checked', false);
  if(currChoice=='statusOptAll' || prevChoices.length==7 || prevChoices.length==0){
    $('#statusOptAll').prop('checked', true);
    chosenStatusStr="All";
    dealWithDatepickers('datepick1', 'add');
    dealWithDatepickers('datepick2', 'add');
    dealWithDatepickers('datepick3', 'add');
  }
  else{
    var j=prevChoices.length;
    var checklist=prevChoices;
    dealWithDatepickers('datepick1', 'remove');
    dealWithDatepickers('datepick2', 'remove');
    dealWithDatepickers('datepick3', 'remove');
    if($.inArray('statusOptAll', checklist) !== -1){
        checklist.splice(checklist.indexOf('statusOptAll'),1);
    }
    if($.inArray('statusOptClosed', checklist) !== -1){
      dealWithDatepickers('datepick1', 'add');
      dealWithDatepickers('datepick3', 'add');
      dealWithDatepickers('datepick2', 'add');
    }
    if($.inArray('statusOptOngoing', checklist) !== -1 || $.inArray('statusOptOpen', checklist) !== -1 || $.inArray('statusOptNeedReview', checklist) !== -1 || $.inArray('statusOptRecCtrl', checklist) !== -1 ){
      dealWithDatepickers('datepick1', 'add');
    }
    if($.inArray('statusOptOngoing', checklist) !== -1 || $.inArray('statusOptOpen', checklist) !== -1 || $.inArray('statusOptNeedReview', checklist) !== -1 ){
      dealWithDatepickers('datepick2', 'add');
    }
    $.each( prevChoices, function(i, val) {
      if(val!='statusOptAll'){
        $('#'+val).prop('checked', true);
        if(i+1<j){
          chosenStatusStr=chosenStatusStr+ $('#'+val).next('label').text()+", ";
        }
        else {
          chosenStatusStr=chosenStatusStr+ $('#'+val).next('label').text();
        }
      }
    })
  }
  $('#formStatus').val(chosenStatusStr);
}
function dealWithDatepickers(datepick, option){
  if(option=='add'){
    $('#'+datepick+'_start > .form-control').prop('disabled', false);
    $('#'+datepick+'_start').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
    let two_years_ago = new Date()
    two_years_ago.setFullYear(two_years_ago.getFullYear() - 2);
    $('#'+datepick+'_start').datepicker('update', two_years_ago);

    $('#'+datepick+'_end > .form-control').prop('disabled', false);
    $('#'+datepick+'_end').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
    $('#'+datepick+'_end').datepicker('update', new Date());
  }
  if(option=='remove'){
    $('#'+datepick+'_start > .form-control').prop('disabled', true);
    $('#'+datepick+'_start').datepicker('remove');
    $('#'+datepick+'_start').children('input').val('');
    $('#'+datepick+'_end > .form-control').prop('disabled', true);
    $('#'+datepick+'_end').datepicker('remove');
    $('#'+datepick+'_end').children('input').val('');
  }
}
$('.loadTablebtns').click(function(e){
  if ($('#user_presets_dropdown .dropdown-toggle').hasClass('active')){
    sort_preset=$('#user_presets_dropdown .dropdown-toggle').text();
  }
  else if ($('input[name="presetOptions"]:checked')){
    if ($('#saveFilter').length > 0){
      //hide sorting/filtering save button if exists when default preset loaded
      $("#saveFilter").hide();
    }
  }
  getTableParamsandLoad();
});

function getTableParamsandLoad(){
  var select = get_current_selection('load');
  var columns=new Array();
  $.each( select.columns, function( i, val ) {
    columns.push([i, val[0]]);
    if(i.indexOf('fa')<=0)
      columns[columns.length-1].push(val[2]);
  })
  if(select.status.length==0 || columns.length==0){
    alert('Select a status and preset!');
    return;
  }
  load_table(select.status, select.type, columns, select.dates);
}

$('#submitPresetNameBtn').click(function(e){
  var select=get_current_selection('save');
  var presetName=$.trim($('#formPresetName').val());
  if(presetName=='Name...' || presetName==''){
    alert('Please enter a preset name!');
    return;
  }
  var presetObj={};
  $.each( select.columns, function( i, val ) {
    if(val[1] in presetObj){
      presetObj[val[1]][val[0]]=true;
    }
    else{
      var temp={};
      temp[val[0]]=true;
      presetObj[val[1]]=temp;
    }
  })
  var status="";
  $.each( select.status, function( i, val ) {
    if(i+1<select.status.length)
      status=status+val+', ';
    else {
      status=status+val;
    }
  })
  presetObj['STATUS']=status;
  presetObj['TYPE']=select.type;
  presetObj['COLUMNORDER']=select.columnorder;
  presetObj['DATES']=select.dates;
  $('#submitPresetNameBtn').addClass('disabled').text('Saving...');
  var userPage_api_url = "/api/v1/presets?save="+presetName;
  $.ajax({
    type: 'POST',
    dataType: 'json',
    url: userPage_api_url,
    data: JSON.stringify(presetObj),
    error: function(xhr, textStatus, errorThrown) {
      alert('There was an error in saving the preset: '+errorThrown);
      $('#submitPresetNameBtn').removeClass('disabled').text('Apply');
      console.log(xhr); console.log(textStatus); console.log(errorThrown); console.log(JSON.stringify(presetObj));
    },
    success: function(saved_data, textStatus, xhr) {
      $('#submitPresetNameBtn').addClass('disabled').text('Saving...').delay(1500).queue(function(){ $('#projectFieldsModal').modal('toggle'); $(this).removeClass('disabled').text('Save'); $(this).dequeue()});
      update_presets_onChange();
      setTimeout(function(){
        $('#user_presets_dropdown').find(".btn").addClass('active');
        setChangingDropdownValue($('#user_presets_dropdown'),'userdefined', presetName);
        $('#formDeletePresetName').val(presetName);
        appendDeleteBtn(presetName);
        select_from_preset("users_presets_dropdown", presetName);
      }, 100);
    }
  });
});

function get_current_selection(source){
  var status=new Array();
  $('#statusbtnBar1').find('input[name=statusOptions]:checked').each(function(e){
    status.push($(this).data('projects'));
  })
  var type=$.trim($('#formType').text());
  var dates= {};
  var columns = {};
  dates['old_open_date']= $('#inp_date_1').val();
  dates['new_open_date']= $('#inp_date_2').val();
  dates['old_queue_date']= $('#inp_date_3').val();
  dates['new_queue_date']= $('#inp_date_4').val();
  dates['old_close_date']= $('#inp_date_5').val();
  dates['new_close_date']= $('#inp_date_6').val();
  currDate=new Date();
  monthNday=((''+(currDate.getMonth()+1)).length<2 ? '0' : '')+(currDate.getMonth()+1)+'-'+((''+currDate.getDate()).length<2 ? '0' : '')+(currDate.getDate());
  today=currDate.getFullYear()+'-'+monthNday;
  twoYearsAgo=currDate.getFullYear() - 2+'-'+monthNday;
  if(source!='save'){
    if(status.includes('closed')){
      if(dates['old_close_date']==''){
        dates['old_close_date']=twoYearsAgo;
      }
      if(dates['new_close_date']==''){
        dates['new_close_date']=today;
      }
    }
    if(status.includes('open') || status.includes('ongoing') || status.includes('reception_control')){
      if(dates['old_open_date']==''){
        dates['old_open_date']=twoYearsAgo;
      }
      if(dates['new_open_date']==''){
        dates['new_open_date']=today;
      }
      if(status.includes('ongoing')){
        if(dates['old_queue_date']==''){
          dates['old_queue_date']=twoYearsAgo;
        }
        if(dates['new_queue_date']==''){
          dates['new_queue_date']=today;
        }
      }
    }
  }
  columnorder=$("#tHeaderListul").sortable("toArray", {attribute: 'data-name'});
  $.each(columnorder, function (i, elem){
    getElem=$('#allColFields').find("input[name='"+elem+"']");
    columns[$(getElem).data('displayname')]=[$(getElem).attr('name'),$(getElem).data('columngroup')];
    if($(getElem).data('displayname').indexOf("fa")>=0)
      columns[$(getElem).data('displayname')].push($(getElem).parent().text().match(/\(([^)]+)\)/)[1]);
  });
  return {
        status: status,
        type: type,
        columns: columns,
        columnorder:columnorder,
        dates: dates
    };
}
$("#uncheckAll").change(function(e){
  var notDisplayed=$("#allColFields").find("label[style='display: none;']");
  $("#allColFields").find("input[class='filterCheckbox']").closest('label').each(function(i, elem) {
      if(jQuery.inArray(elem, notDisplayed) == -1){
        if($("#uncheckAll").find("input").prop('checked')){
          $(elem).find('input').prop('checked', true);
        }
        else {
          $(elem).find('input').prop('checked', false);
        }
      }
  })
})

$("#displaySelected").change(function(e){
  var toBeDisplayed=$("#allColFields input[class='filterCheckbox']:checked ");
  $("#allColFields input[class='filterCheckbox']").each(function(i, elem){
    if(jQuery.inArray(elem, toBeDisplayed) == -1){
      if($("#displaySelected").find("input").prop('checked')){
        $(elem).closest('label').hide();
      }
      else{
        $(elem).closest('label').show();
      }
    }
  })
  if($("#displaySelected").find("input").prop('checked')){
    $('.colHeader').find('h4').hide();
    $.each(toBeDisplayed, function(i, elem) {
      $(elem).closest('.colHeader').find('h4').show();
    })
  }
  else{
    $('.colHeader').find('h4').show();
  }
})

$("#allFields").change(function(e){
  updateTableFields("");
})

$('#resetReorderingbtn').on("click", function() {
  resetReorderFields();
});

function getTHeaderElem(elem){
  thElem = '<li data-name="'+$(elem).prop('name')+'" class="list-inline-item">';
  if($(elem).data('displayname').indexOf('fa')>=0){
    thElem+= '<i class="fa '+$(elem).data('displayname')+'" data-toggle="tooltip" title="'+$(elem).parent().text().match(/\(([^)]+)\)/)[1]+'"></i>';
  }
  else
    thElem+=$(elem).data('displayname');
  thElem+='</li>';
  return thElem;
}

function resetReorderFields(){
  $("#tHeaderListul").empty();
  tHList="";
  $("#allColFields input.filterCheckbox:checked").each(function(i, elem){
     tHList += getTHeaderElem(elem);
   })
  $('#tHeaderListul').append(tHList);
}

function updateTableFields(order){
  var selectedFields=$("#allColFields input.filterCheckbox:checked");
  if(order==""){
    if(selectedFields.length>$('#tHeaderListul li').length){
      $("#allColFields input.filterCheckbox:checked").each(function(i, elem){
        if($('#tHeaderListul li[data-name="'+$(elem).prop('name')+'"]').length==0){
          $("#tHeaderListul").append(getTHeaderElem(elem));
        }
      })
    }
    else if(selectedFields.length<$('#tHeaderListul li').length){
      $("#tHeaderListul li").each(function(i, elem){
        var get = selectedFields.toArray().findIndex(function(element) {return $(element).prop('name')==$(elem).data('name');})
        if(get==-1){
          $(elem).remove();
        }
      })
    }
  }
  else{
    $("#tHeaderListul").empty();
    tHList="";
    $.each(order, function (i, elem){
      tHList+= getTHeaderElem($('#allColFields').find("input[name='"+elem+"']"));
    })
    $('#tHeaderListul').append(tHList);
  }
}

$(document).keypress(function(e) {
  if ($("#settingsModal").hasClass('in') && (e.keycode == 13 || e.which == 13)) {
    $("#applySettingsModal").trigger('click');
  }
  if ($("#projectFieldsModal").hasClass('in') && (e.keycode == 13 || e.which == 13)) {
    $("#submitPresetNameBtn").trigger('click');
  }
  if ($("#deleteModal").hasClass('in') && (e.keycode == 13 || e.which == 13)) {
    $("#deletePresetBtnModal").trigger('click');
  }
});

$('#allHistoryCheckbox').change(function(e){
    if($("#allHistoryCheckbox").prop('checked')){
      $('#inp_date_1').val('2012-01-01');
      $('#inp_date_3').val('2012-01-01');
      $('#inp_date_5').val('2012-01-01');
    }
    else{
      $('#inp_date_1').val('');
      $('#inp_date_3').val('');
      $('#inp_date_5').val('');
    }
})

//
// HELPER FUNCTIONS
//
$('#collapseOne').on('shown.bs.collapse', function () {
 $('.card-title a .fa').removeClass('fa-caret-down').addClass('fa-caret-up');
});
$('#collapseOne').on('hidden.bs.collapse', function () {
 $('.card-title a .fa').removeClass('fa-caret-up').addClass('fa-caret-down');
});
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
