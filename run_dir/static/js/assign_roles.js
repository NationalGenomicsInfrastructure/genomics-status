/*
File: assign_roles.js
URL: /static/js/assign_roles.js
Powers /assign_roles/ - template is run_dir/design/assign_roles.html
*/

// On page load
$(function(){
  var tableData;
  load_user_table();

  // Load the presets first (to get the table headers)
  function load_user_table(){
    if ($.fn.dataTable.isDataTable( '#ur_table' )){
        var dtbl= $('#ur_table').DataTable();
        dtbl.clear();
        dtbl.destroy();
        $("#ur_table_filter").remove();
    }
    if($("#pickUserul").length){
      $("#pickUserul").remove();
    }
    var pickuserdropdown='<ul id="pickUserul" class="dropdown-menu dropdown-menu-center dropdown-menu-wide" role="menu" aria-labelledby="pickUserBtn"  style="z-index: 200;">';
    pickuserdropdown+='<li><a href="#" class="clickDropdownGetValue" style="cursor:pointer;" data-value="Choose User"> Choose User</a></li>';
    $.getJSON('/api/v1/assign_roles/users', function (data) {
      tableData=data;
      $.each(data, function(name, role) {
        //Main table
        var tbl_row = $('<tr>');
        tbl_row.append($('<td>')
          .html(name)
        );
        if(role){
          $.each(role, function(key, value){
            tbl_row.append($('<td>')
              .html(value)
            );
          });
        }
        else{
          tbl_row.append($('<td>')
            .html('User')
          );
        }
        $("#user_table_body").append(tbl_row);
        //Modify user dropdown
        pickuserdropdown+='<li><a href="#" class="clickDropdownGetValue triggerOptionChange" data-value="'+name+'">'+name+'</a></li>';
      })
      pickuserdropdown+='</ul>';
      $('#pickUser').append(pickuserdropdown);
      init_listjs();
    })
 }

 $('body').on('click', '.clickDropdownGetValue', function(event){
   setChangingDropdownValue($(this).parents(".changingDropdown"), $(this).text(), $(this).data('userrole'));
 });

  function init_listjs() {
      // Setup - add a text input to each footer cell
      $('#ur_table tfoot th').each( function () {
        var title = $('#ur_table thead th').eq( $(this).index() ).text();
        $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
      } );

      var table = $('#ur_table').DataTable({
        "paging":false,
        "info":false,
        "order": [[ 0, "asc" ]]
      });

      //Add the bootstrap classes to the search thingy
      $('div.dataTables_filter input').addClass('form-control search search-query');
      $('#ur_table_filter').addClass('form-inline pull-right');
      $("#ur_table_filter").appendTo("h1");
      $('#ur_table_filter label input').appendTo($('#ur_table_filter'));
      $('#ur_table_filter label').remove();
      $("#ur_table_filter input").attr("placeholder", "Search..");
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
  function getCurrRole(){
    user=$.trim($('#pickUserBtn').text());
    if(user=='Choose User')
      return;
    role = tableData[user];
    if(role == null)
      role={'user':'User'};
    return role;
  };

  $('body').on('click', '.rBtngp1', function(event){
    $('.rBtngp1').removeClass('btn-primary');
    $('.rBtngp1').removeClass('btn-default');
    $("#currRoleRow").hide()
    if($('#currRoletorem').length)
      $('#currRoletorem').remove();
    if($(this).prop('id')=="modDelBtnModify"){
      $(this).addClass('btn-primary');
      $("#modDelBtnDelete").addClass('btn-default');
      currUserRole=getCurrRole();
      var curole, cuRole;
      if(typeof currUserRole !== 'undefined'){
        $.each(currUserRole, function(key, value){curole=key; cuRole=value;})
      }
      else{
        curole='user', cuRole='User';
      }
      $("#currRoleBtn").html('<i class="glyphicon glyphicon-list-alt" data-userrole='+curole+'></i> '+cuRole+' <span class="caret"></span>');
      $("#currRoleRow").show();
    }
    else{
      $(this).addClass('btn-primary');
      $("#modDelBtnModify").addClass('btn-default');
    }
  });

  $('body').on('click', '#submitCreateUserBtn', function(event){
    var role={};
    role[$('#roles_dropdownBtn').find('i').data('userrole')] = $.trim($('#roles_dropdownBtn').text());
     $('#submitCreateUserBtn').addClass('disabled').text('Saving...');
     modifyUser('create', 'submitCreateUserBtn', 'Save', $.trim($('#formCreateUser').val()), role);
    });

  $('body').on('click', '#saveUserSettingsBtn', function(event){
    var chosenUser=$.trim($('#pickUserBtn').text());
    var role={};
    if($('#modDelRadio').find('.active').prop('id')==='modDelBtnDelete' && chosenUser!='Choose User'){
       $('#modifyUserModal').modal('show');
       $('#formDeleteUserName').prop('placeholder', $.trim($("#pickUserBtn").text()));
       $('#delUserConfirmModal').modal('show');
    }
    else if ($('#modDelRadio').find('.active').prop('id')==='modDelBtnModify' && chosenUser!='Choose User'){
       $('#saveUserSettingsBtn').addClass('disabled').text('Saving...');
       role[$('#currRoleBtn').find('i').data('userrole')] = $.trim($('#currRoleBtn').text());
       modifyUser('modify', 'saveUserSettingsBtn', 'Save', $.trim($('#pickUserBtn').text()), role);
    }
    else{
       alert('Please choose a user and an option!');
    }
  });

  $('body').on('click', '#delUserConfirmBtnModal', function(event){
    var chosenUser=$.trim($('#pickUserBtn').text());
    var role={};
    $('#delUserConfirmBtnModal').addClass('disabled').text('Saving...');
    role[$('#currRoleBtn').find('i').data('userrole')] = $.trim($('#currRoleBtn').text());
    modifyUser('delete', 'delUserConfirmBtnModal', 'Delete', $.trim($('#pickUserBtn').text()), role);
  });

  function modifyUser(option, button, text, username, role){
     $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/api/v1/assign_roles/users?action='+option,
      data: JSON.stringify({ 'username' : username,
        'role' : role}),
      error: function(xhr, textStatus, errorThrown) {
        alert('There was an error in saving the settings: '+xhr.responseText);
        $('#'+button).removeClass('disabled').text(text);
        console.log(xhr); console.log(textStatus); console.log(errorThrown);
      },
      success: function(saved_data, textStatus, xhr) {
        $('#'+button).addClass('disabled').text('Saved!').delay(1500).queue(function(){
          if(option=='create'){
            $('#createUserModal').modal('toggle');
          }
          else{
            $('#modifyUserModal').modal('toggle');
          }
          $('#'+button).removeClass('disabled').text(text);
          $('#'+button).dequeue();
          if(option=='delete'){
            $('#formDeleteUserName').prop('placeholder', '');
            $('#delUserConfirmModal').modal('hide');
          }
          $(".triggerOptionChange").trigger("click");
          $('#pickUserBtn').html('<i class="glyphicon glyphicon-list-alt"></i> Choose User <span class="caret"></span>');
          load_user_table();
        });
      }
    });
  }
});

function setChangingDropdownValue(elem, text, userrole){
  var saveClass=elem.find('.glyphicon').attr('class');
  var constructI='<i class="'+saveClass+'"';
  if(typeof userrole !== 'undefined'){
    constructI+='data-userrole="'+userrole+'"></i> ';
  }
  else{
    constructI+='></i> ';
  }
  elem.find('.btn').html(constructI+text+' <span class="caret"></span>');
}

$('body').on('click', '.triggerOptionChange', function(event){
  if($('#currRoletorem').length)
    $('#currRoletorem').remove();
  $('.rBtngp1').removeClass('btn-primary');
  $('.rBtngp1').removeClass('active');
  $('.rBtngp1').addClass('btn-default');
  $("#currRoleRow").hide();
})
