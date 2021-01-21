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
      $("#pickUserul li").each(function() {
        $(this).remove();
      })
    }
    var pickuserdropdown=$('#pickUserul')

    pickuserdropdown.append('<li><a href="#" class="dropdown-item clickDropdownGetValue triggerOptionChange" style="cursor:pointer;" data-value="Choose User"> Choose User</a></li>');
    $.getJSON('/api/v1/assign_roles/users', function (data) {
      tableData=data;
      $.each(data, function(name, role) {
        //Main table
        var tbl_row = $('<tr>');
        tbl_row.append($('<td>')
          .html('<button class="btn btn-sm mr-2 btn-danger delete-user-btn" data-user=' + name + '><i class="fa fa-times"></i></button>' + name)
        );
        if(role){
          role_list = Object.values(role).toString()
          tbl_row.append($('<td>').html(role_list))
        }
        else{
          tbl_row.append($('<td>')
            .html('User')
          );
        }
        $("#user_table_body").append(tbl_row);
        //Modify user dropdown
        pickuserdropdown.append('<li><a href="#" class="dropdown-item clickDropdownGetValue triggerOptionChange" data-value="'+name+'">'+name+'</a></li>');
      })

      init_listjs();

      $('.triggerOptionChange').click(function() {
          user = $(this).attr('data-value')
          roles = tableData[user]
          /* reset the checkboxes */
          $('.modify-user-role-checkbox input').each(function() {
              $(this).prop("checked", false);
          })

          /* Fill in the checkboxed based on the chosen users roles */
          $.each(roles, function(role, Role) {
              checkbox_id = '#check_' + role;
              $(checkbox_id).prop("checked", true);
          });
      });
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
      $('#ur_table_filter').addClass('form-inline float-right');
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


  $('body').on('click', '#submitCreateUserBtn', function(event){
    var roles={};
    $('.create-user-role-checkbox input:checked').each(function() {
        role = this.value
        Role = $(this).attr('data-label')
        roles[role] = Role
    })
    $('#submitCreateUserBtn').addClass('disabled').text('Saving...');
    modifyUser('create', 'submitCreateUserBtn', 'Save', $.trim($('#formCreateUser').val()), roles);
  });

  $('body').on('click', '.delete-user-btn', function(event) {
    var chosenUser=$(this).attr('data-user')
    $('#formDeleteUserName').prop('value', chosenUser);
    $('#delUserConfirmModal').modal('show');
  });


  $('#saveUserSettingsBtn').click(function(event){
    var chosenUser=$.trim($('#pickUserBtn').text());
    var roles={};
    if (chosenUser!='Choose User'){
       $(this).addClass('disabled').text('Saving...');
       $('.modify-user-role-checkbox input:checked').each(function() {
           role = this.value
           Role = $(this).attr('data-label')
           roles[role] = Role
       })
       modifyUser('modify', 'saveUserSettingsBtn', 'Save', chosenUser, roles);
    }
    else{
       alert('Please choose a user!');
    }
  });

  $('body').on('click', '#delUserConfirmBtnModal', function(event){
    var chosenUser=$.trim($('#formDeleteUserName').prop('value'));
    var roles={};
    $('#delUserConfirmBtnModal').addClass('disabled').text('Saving...');
    modifyUser('delete', 'delUserConfirmBtnModal', 'Delete', chosenUser, roles);
  });

  function modifyUser(option, button, text, username, roles){
     $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/api/v1/assign_roles/users?action='+option,
      data: JSON.stringify({ 'username' : username,
        'roles' : roles}),
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
          else if (option=='modify') {
            $('#modifyUserModal').modal('toggle');
          } else {
            $('#formDeleteUserName').prop('placeholder', '');
            $('#delUserConfirmModal').modal('hide');
          }
          $('#'+button).removeClass('disabled').text(text);
          $('#'+button).dequeue();

          $(".triggerOptionChange").trigger("click");
          $('#pickUserBtn').html('<i class="fa fa-list-alt"></i> Choose User <span class="caret"></span>');
          load_user_table();
        });
      }
    });
  }
});

function setChangingDropdownValue(elem, text, userrole){
  var saveClass=elem.find('.fa').attr('class');
  var constructI='<i class="'+saveClass+'"';
  if(typeof userrole !== 'undefined'){
    constructI+='data-userrole="'+userrole+'"></i> ';
  }
  else{
    constructI+='></i> ';
  }
  elem.find('.btn').html(constructI+text+' <span class="caret"></span>');
}

function checkForSelfDelete(chosenUser){
  if(chosenUser == $('#asrol-js').data('user')){
    $("#modDelBtnDelete").addClass('disabled');
    $("#modDelBtnDelete").addClass('disabledNoClick');
  }
  else{
    $("#modDelBtnDelete").removeClass('disabled');
    $("#modDelBtnDelete").removeClass('disabledNoClick');
  }
}

$('body').on('click', '.triggerOptionChange', function(event){
  if($('#currRoletorem').length)
    $('#currRoletorem').remove();
  $("#currRoleRow").hide();
  checkForSelfDelete($(this).data('value'));
})
