/*
File: projects.js
URL: /static/js/projects.js
Powers /projects/ - template is run_dir/design/projects.html
*/

// On page load
$(function(){

  $('#pageInfo').on('click', function(){
     $('#displayPageInfo').slideToggle();
  });

  $('#displayPageInfo').find('span[type="button"]').click(function(){
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
    $.getJSON('/api/v1/presets/onloadcheck?action=load', function (data) {
      if(data!=null){
        setChangingDropdownValue($('#all_presets_dropdown'), data['origin'], data['preset']);
        if(data['origin']=='userdefined'){
          $('#user_presets_dropdown').find(".btn").addClass('active');
          setChangingDropdownValue($('#user_presets_dropdown'), data['origin'], data['preset']);
          $('#formDeletePresetName').val(data['preset']);
          appendDeleteBtn(data['preset']);
          select_from_preset("users_presets_dropdown", data['preset']);
        }
        else{
          $('#formDeletePresetName').val('');
          if(data['preset']!='Choose Presets'){
            $("#default_preset_buttons").find('input[data-value="'+data['preset']+'"]').parent('.btn').addClass('active');
            select_from_preset("default_preset_buttons", data['preset']);
          }
          else {
            $("#presetOpt-lab_ongoing").trigger("click");
            select_from_preset("default_preset_buttons", 'Lab Ongoing');
          }
          updateStatusBar1($('#statusbtnBar1 :input[data-projects=all]'));
        }
        if(data['loadtable']==true){
          $("#onLoadTableOn").trigger("click");
          setTimeout(getTableParamsandLoad,300);
        }
        else {
          $("#onLoadTableOff").trigger("click");
        }
      }
      else{
        $("#onLoadTableOff").trigger("click");
        $("#presetOpt-lab_ongoing").trigger("click");
        $("#statusOptAll").trigger("click");
        select_from_preset("default_preset_buttons", 'Lab Ongoing');
      }
    })
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
});
// Load the Projects Table
function load_table(status, type, columns, dates) {
  // Get the columns and write the table header
  load_table_head(columns);
  // Display the loading spinner in the table
  $("#project_table_body").html('<tr><td colspan="'+columns.length+'" class="text-muted"><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading..</em></td></tr>');
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
  $("#Filter .filterCheckbox").each(function() {
    fields.push($(this).attr('name'));
  });
  return $.getJSON(url, function(data) {
    if ($.fn.dataTable.isDataTable( '#project_table' )){
        var dtbl= $('#project_table').DataTable();
        dtbl.destroy();
        $("#project_table_filter").remove();
    }
    $("#project_table_body").empty();
    var size = 0;
    undefined_fields=[];

    $.each(data, function(project_id, summary_row) {
      $.each(summary_row, function(key,value){
        //this tracks the fields existing in our projects objects, but not present in the filter tab yet.
        if ($.inArray(key, undefined_fields) == -1 && $.inArray(key, fields) == -1 ){
          undefined_fields.push(key);
        }
      });
      size++;
      var tbl_row = $('<tr>');
      $.each(columns, function(i, column_tuple){
        tbl_row.append($('<td>')
          .addClass(column_tuple[1])
          .html(summary_row[column_tuple[1]])
          );
      });

      // Add links to projects
      tbl_row.find('td.project').html('<a href="/project/' + project_id + '">' + project_id + '</a>');

      // Add links to Portal References
      var portal_name = summary_row['customer_project_reference'];
      var portal_id = summary_row['portal_id'];
      tbl_row.find('td.customer_project_reference').html('<a target="_blank" href="https://ngisweden.scilifelab.se/order/'+portal_id + '">' + portal_name + '</a>');

      //parse and display running notes
      var latest_note = tbl_row.find('td.latest_running_note');
      if (latest_note.text() !== '') {
        var note = JSON.parse(latest_note.text());
        var ndate = undefined;
        for (key in note) { ndate = key; break; }
        notedate = new Date(ndate);
        latest_note.html('<div class="panel panel-default running-note-panel">' +
            '<div class="panel-heading">'+
              note[ndate]['user']+' - '+notedate.toDateString()+', ' + notedate.toLocaleTimeString(notedate)+
            '</div><div class="panel-body">'+make_markdown(note[ndate]['note'])+'</pre></div></div>');

      }
      $("#project_table_body").append(tbl_row);
    });
    load_undefined_columns(undefined_fields)

    // Initialise the Javascript sorting now that we know the number of rows
    init_listjs(size, columns);
  });
}

function load_table_head(columns){
  var tbl_head = $('<tr>');
  var tbl_foot = $('<tr>');
  $.each(columns, function(i, column_tuple) {
    tbl_head.append($('<th>')
      .addClass('sort a')
      .attr('data-sort', column_tuple[1])
      .text(column_tuple[0])
    );
    tbl_foot.append($('<th>')
      .text(column_tuple[0])
    );
  });
  $("#project_table_head").html(tbl_head);
  $("#project_table_foot").html(tbl_foot);
}


// Undefined columns handled here now
function load_undefined_columns(cols) {
    var columns_html = "";
    $.each(cols, function(col_id, column) {
      $("#undefined_columns").append('<div class="checkbox">'+
          '<label>'+
            '<input type="checkbox" class="filterCheckbox" data-columngroup="UNDEFINED_COLUMNS" data-displayname="'+column+'" name="'+column+'" id="allFields-undefined-columns-'+column+'">'+
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
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
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
          "order": [[ 0, "desc" ]]
        });
    }

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#project_table_filter').addClass('form-inline pull-right');
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
}

////////////////////////////////
// Presets related functions  //
///////////////////////////////

function load_presets() {
  return $.getJSON('/api/v1/presets?presets_list=pv_presets', function (data) {
    var default_presets = data['default'];
    var user_presets = data['user'];


    var allPresetsDropdownMod='<button class="btn btn-default btn-sm dropdown-toggle wrapStyle" type="button" id="inputStateAll" data-toggle="dropdown"><i class="glyphicon glyphicon-list-alt"></i> Choose Preset <span class="caret"></span></button><ul id="inputStateAllul" class="dropdown-menu dropdown-menu-right dropdown-menu-wide" role="menu" aria-labelledby="inputStateAll"  style="z-index: 200;">';
    allPresetsDropdownMod+='<li><a href="#" class="clickDropdownGetValue" style="cursor:pointer;" data-value="Choose Preset" data-origin="default"> Choose Presets</a></li>';
    for (var preset in default_presets) {
      $('#default_preset_buttons').append('<label class="btn btn-default rBtngp2"><input type="radio" name="presetOptions" id="presetOpt-'+prettify(preset)+'" data-value="'+preset+'" autocomplete="off"><i class="glyphicon '+default_presets[preset].ICON.glyphicon+'"></i> '+preset+'</label>');

      allPresetsDropdownMod+='<li><a href="#" class="clickDropdownGetValue" data-value="'+preset+'" data-origin="default">'+preset+'</a></li>';
    }

    var userDefPresetsDropdown='<button id="inputPreset" class="btn btn-default dropdown-toggle wrapStyle" data-toggle="dropdown" type="button"> <i class="glyphicon glyphicon-user"></i> User defined Presets <span class="caret"></span></button><ul id="inputPresetul" class="dropdown-menu dropdown-menu-wide" role="menu" aria-labelledby="inputPresetul">';
    // User presets, if there are any
    if (!jQuery.isEmptyObject(user_presets)) {
      for (var preset in user_presets) {
        userDefPresetsDropdown+='<li><a href="#" class="clickDropdownGetValue" style="cursor:pointer;" data-value="'+preset+'"> '+preset+'</a></li>';
        allPresetsDropdownMod+='<li><a href="#" class="clickDropdownGetValue" style="cursor:pointer;" data-value="'+preset+'" data-origin="userdefined"">'+preset+'</a></li>';
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
  var saveClass=elem.find('.glyphicon').attr('class');
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

$('body').on('click', '.rBtngp1', function(event){
  $('.rBtngp1').removeClass('btn-primary');
  $('.rBtngp1').removeClass('btn-default');
  if($(this).prop('id')=="onLoadTableOn"){
    $(this).addClass('btn-primary');
    $("#onLoadTableOff").addClass('btn-default');
  }
  else{
    $(this).addClass('btn-primary');
    $("#onLoadTableOn").addClass('btn-default');
  }
});

function saveOnLoadStatus(){
  var checked;
  var origin="";
  var preset="";

  if($('#onLoadRadio').find('.active').prop('id')=="onLoadTableOn")
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

$('body').on('click', '.rBtngp2', function(event){
  event.preventDefault();
  $('.rBtngp2').removeClass('active');
  if($(this).find(".btn").prop('id')=="inputPreset"){
    $(this).find(".btn").addClass('active');
  }
  else{
    $(this).addClass('active');
  }
  //get chosen preset and populate in table
  read_current_filtering();
});

function read_current_filtering(){
  var columns = new Array();
  var preset;
  if($("#presetButtons .active").prop("id")=="inputPreset"){
    preset=$.trim($("#presetButtons .active").text());
    $('#formDeletePresetName').val(preset);
    if (preset!='User defined Presets') {
        appendDeleteBtn(preset);
    }
    select_from_preset("users_presets_dropdown", preset);
  }
  else{
    preset=$("#presetButtons .active").children('input').data('value');
    $('#formDeletePresetName').val('');
    select_from_preset("default_preset_buttons", preset);
  }
}

function appendDeleteBtn(preset){
  $('#deletePresetBtn').remove();
  $("#savePresetBtn").after("<button type='submit' class='btn btn-default' id='deletePresetBtn' data-toggle='modal' data-target='#deleteModal' style='margin:5px;'>Delete "+preset+"</button>");
}

function sel_from_ps(preset_type, preset, data){
    //First uncheck everything
  $('#default_preset_buttons button.active').removeClass('active');
  $('.filterCheckbox').prop('checked', false);
  if (preset_type == "default_preset_buttons") {
    if(preset=='Lab Ongoing'){
      $('.statusOptions').removeClass('active');
      updateStatusBar1($('#statusOptOngoing'), 'defaultClick');
    }
    if(preset=='Rec Ctrl'){
      $('.statusOptions').removeClass('active');
      updateStatusBar1($('#statusOptRecCtrl'), 'defaultClick');
    }
    if(preset=='Need Review'){
      $('.statusOptions').removeClass('active');
      updateStatusBar1($('#statusOptNeedReview'), 'defaultClick');

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
  }
  else if (preset_type == "users_presets_dropdown") {
    var choices = data['user'][preset];
    for (column in choices) {
      if(column.indexOf('COLUMNS')!=-1){
        for (choice in choices[column]) {
          var column_id = 'allFields-'+column.toLowerCase().replace(/_/g, '-') + '-' + choice.replace(/\(|\)/g, '');
          $("#"+column_id).prop('checked', true);
        }
      }
      else {
        if(column.indexOf('STATUS')!=-1){
          $('.statusOptions').removeClass('active');
          $('.statusOptions').find('input').prop('checked', false);
          $.each( choices[column].split(', '), function(i, val) {
            $('#statusbtnBar1 :input[data-projects='+val+']').prop('checked', true);
            updateStatusBar1($('#statusbtnBar1 :input[data-projects="'+val+'"]'));
          })
        }
        if(column.indexOf('TYPE')!=-1){
          var saveClass=$('#formTypedropdown').find('.glyphicon').attr('class');
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
      }
    }
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
      data['preset']='Choose Presets';
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

$('body').on('change', '.statusOptions', function(event) {
  updateStatusBar1($(this).find('input'), 'add');
});

function updateStatusBar1(source, type){
  var currChoice=source.attr('id');
  var prevChoices=[];
  var chosenStatusStr="";
  if(type!='defaultClick'){
    $('.statusOptions').find('input').each(function(e){
      if(this.checked)
        prevChoices.push($(this).attr('id'));
    })
  }
  else{
    prevChoices.push(currChoice);
  }
  $('.statusOptions').removeClass('active');
  $('.statusOptions').find('input').prop('checked', false);
  if(currChoice=='statusOptAll' || prevChoices.length==7 || prevChoices.length==0){
    $('#statusOptAll').parent().addClass('active');
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
    if(jQuery.inArray('statusOptAll', checklist) !== -1){
        checklist.splice(checklist.indexOf('statusOptAll'),1);
    }
    if(jQuery.inArray('statusOptClosed', checklist) !== -1){
      dealWithDatepickers('datepick1', 'add');
      dealWithDatepickers('datepick3', 'add');
      dealWithDatepickers('datepick2', 'add');
    }
    if(jQuery.inArray('statusOptOngoing', checklist) !== -1 || jQuery.inArray('statusOptOpen', checklist) !== -1 || jQuery.inArray('statusOptNeedsReview', checklist) !== -1 || jQuery.inArray('statusOptRecCtrl', checklist) !== -1 ){
      dealWithDatepickers('datepick1', 'add');
    }
    if(jQuery.inArray('statusOptOngoing', checklist) !== -1 || jQuery.inArray('statusOptOpen', checklist) !== -1 || jQuery.inArray('statusOptNeedsReview', checklist) !== -1 ){
      dealWithDatepickers('datepick2', 'add');
    }
    $.each( prevChoices, function(i, val) {
      if(val!='statusOptAll'){
        $('#'+val).parent().addClass('active');
        $('#'+val).prop('checked', true);
        if(i+1<j){
          chosenStatusStr=chosenStatusStr+ $('#'+val).closest('label').text()+", ";
        }
        else {
          chosenStatusStr=chosenStatusStr+ $('#'+val).closest('label').text();
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

    $('#'+datepick+'_end > .form-control').prop('disabled', false);
    $('#'+datepick+'_end').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
  }
  if(option=='remove'){
    $('#'+datepick+'_start > .form-control').prop('disabled', true);
    $('#'+datepick+'_start').datepicker('remove');
    $('#'+datepick+'_end > .form-control').prop('disabled', true);
    $('#'+datepick+'_end').datepicker('remove');
  }
}
$('#loadTablebtn').click(function(e){
  getTableParamsandLoad();
});

function getTableParamsandLoad(){
  var select = get_current_selection('load');
  var columns=new Array();
  $.each( select.columns, function( i, val ) {
    columns.push([i, val[0]]);
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
  if(source!='save'){
    if(status.includes('closed')){
      if(dates['old_close_date']==''){
        dates['old_close_date']=currDate.getFullYear() - 2+'-'+(currDate.getMonth()+1)+'-'+currDate.getDate();
      }
      if(dates['new_close_date']==''){
        dates['new_close_date']=currDate.getFullYear()+'-'+(currDate.getMonth()+1)+'-'+currDate.getDate();
      }
    }
    if(status.includes('open') || status.includes('ongoing') || status.includes('reception_control')){
      if(dates['old_open_date']==''){
        dates['old_open_date']=currDate.getFullYear() - 2+'-'+(currDate.getMonth()+1)+'-'+currDate.getDate();
      }
      if(dates['new_open_date']==''){
        dates['new_open_date']=currDate.getFullYear()+'-'+(currDate.getMonth()+1)+'-'+currDate.getDate();
      }
      if(status.includes('ongoing')){
        if(dates['old_queue_date']==''){
          dates['old_queue_date']=currDate.getFullYear() - 2+'-'+(currDate.getMonth()+1)+'-'+currDate.getDate();
        }
        if(dates['new_queue_date']==''){
          dates['new_queue_date']=currDate.getFullYear()+'-'+(currDate.getMonth()+1)+'-'+currDate.getDate();
        }
      }
    }
  }
  $('#allFields').find('input:checked').each(function(e){
    columns[$(this).data('displayname')]=[$(this).attr('name'),$(this).data('columngroup')];
  });
  return {
        status: status,
        type: type,
        columns: columns,
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

//
// HELPER FUNCTIONS
//
$('#collapseOne').on('shown.bs.collapse', function () {
  $('.panel-title a .glyphicon').removeClass('glyphicon-triangle-bottom').addClass('glyphicon-triangle-top');
});
$('#collapseOne').on('hidden.bs.collapse', function () {
  $('.panel-title a .glyphicon').removeClass('glyphicon-triangle-top').addClass('glyphicon-triangle-bottom');
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
