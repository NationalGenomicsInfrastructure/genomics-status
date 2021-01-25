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

    $.getJSON('/api/v1/user_management/users', function (data) {
      tableData=data;
      $.each(data, function(name, role) {
        //Main table
        var tbl_row = $('<tr>');
        user_td = '<div class="btn-group">' +
                  '<button class="btn btn-sm ml-2 btn-outline-primary btn-large modify-user-btn" data-user=' + name + '><i class="fa fa-wrench mr-1"></i>Modify</button>'
        if (name != $('#asrol-js').data('user')){
          user_td += '<button class="btn btn-sm mr-3 btn-outline-danger btn-large delete-user-btn" data-user=' + name + '><i class="fa fa-times mr-1"></i>Delete</button>'
        }
        user_td += '</div>' + name

        tbl_row.append($('<td>').html(user_td));

        if(role){
          role_list = Object.values(role).toString()
          tbl_row.append($('<td>').html(role_list))
        }
        else{
          tbl_row.append($('<td>')
            .html('')
          );
        }
        $("#user_table_body").append(tbl_row);
      })

      init_listjs();

      $('.modify-user-btn').click(function() {
          user = $(this).attr('data-user')
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
      $('#ur_table_filter').addClass('form-inline float-right mt-2');
      $("#ur_table_filter").appendTo("#searchGoesHere");
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
    modifyUser('create', 'submitCreateUserBtn', 'Save', $.trim($('#createUserName').val()), roles);
  });

  $('body').on('click', '.delete-user-btn', function(event) {
    var chosenUser=$(this).attr('data-user')
    $('#formDeleteUserName').prop('value', chosenUser);
    $('#delUserConfirmModal').modal('show');
  });

  $('body').on('click', '.modify-user-btn', function(event) {
    var chosenUser=$(this).attr('data-user')
    $('#formModifyUserName').prop('value', chosenUser);
    $('#modifyUserModal').modal('show');
  });

  $('#saveUserSettingsBtn').click(function(event){
    var chosenUser=$.trim($('#formModifyUserName').val());
    var roles={};
    $(this).addClass('disabled').text('Saving...');
    $('.modify-user-role-checkbox input:checked').each(function() {
      role = this.value
      Role = $(this).attr('data-label')
      roles[role] = Role
    })
    modifyUser('modify', 'saveUserSettingsBtn', 'Save', chosenUser, roles);
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
      url: '/api/v1/user_management/users?action='+option,
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
