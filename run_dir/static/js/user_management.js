/*
File: user_management.js
URL: /static/js/user_management.js
Powers /user_management/ - template is run_dir/design/user_management.html
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
      $.each(data, function(name, info) {
        //Main table
        let role = info['roles']
        var tbl_row = $('<tr>');
        user_td = '<div class="btn-group">' +
                  '<button class="btn btn-sm ml-2 btn-outline-primary btn-large modify-user-btn" data-user=' + name + '><i class="fa fa-wrench mr-1"></i>Modify</button>' +
                  '<button class="btn btn-sm btn-outline-danger btn-large delete-user-btn'
        if (name == $('#asrol-js').data('user')){
          user_td += ' disabled'
        }
        user_td += '" data-user=' + name + '><i class="fa fa-times mr-1"></i>Delete</button></div>'
        user_td += '<span class="ml-3">' + name + '</span>'

        tbl_row.append($('<td>').html(user_td));

        tbl_row.append($('<td>').html(info['name']));

        tbl_row.append($('<td>').html(info['initials']));

        if(role){
          role_list = Object.values(role).join(', ')
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
          info = tableData[user]
          /* reset the checkboxes */
          $('.modify-user-role-checkbox input').each(function() {
              $(this).prop("checked", false);
          })

          roles = info['roles']
          /* Fill in the checkboxed based on the chosen users roles */
          $.each(roles, function(role_key, role_value) {
              checkbox_id = '#check_' + role_key;
              $(checkbox_id).prop("checked", true);
          });

          $('#formModifyName').prop('value', info['name']);
          $('#formModifyInitials').prop('value', info['initials']);
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
        role_key = this.value
        role_label = $(this).attr('data-label')
        roles[role_key] = role_label
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
    var info={};
    var roles={};
    $(this).addClass('disabled').text('Saving...');
    $('.modify-user-role-checkbox input:checked').each(function() {
      role_key = this.value
      role_label = $(this).attr('data-label')
      roles[role_key] = role_label
    })
    info['roles'] = roles
    info['name'] = $('#formModifyName').val()
    info['initials'] = $('#formModifyInitials').val()

    modifyUser('modify', 'saveUserSettingsBtn', 'Save', chosenUser, info);
  });

  $('body').on('click', '#delUserConfirmBtnModal', function(event){
    var chosenUser=$.trim($('#formDeleteUserName').prop('value'));
    var info={};
    $('#delUserConfirmBtnModal').addClass('disabled').text('Saving...');
    modifyUser('delete', 'delUserConfirmBtnModal', 'Delete', chosenUser, info);
  });

  function modifyUser(option, button, text, username, info){
     $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/api/v1/user_management/users?action='+option,
      data: JSON.stringify({ 'username' : username,
        'roles' : info['roles'],
        'name' : info['name'],
        'initials' : info['initials'] }),
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
