/*
File: clone_project.js
URL: /static/js/clone_project.js
Powers /clone_project - template is run_dir/design/clone_project.html
*/


$('#get-project').on('click', function () {
    let project_id = $('#inputProj').val();
    $("#projid").text(project_id);
    $("#projidModal").text(project_id);
    $('#udfs_div').html("");
    let url = '/api/v1/lims_project_data/' + project_id;
    return $.getJSON(url, function(data) {
        $('#project_name').val(data['name']);
        $('#account').val(data['Account']);
        $('#client').val(data['Client']);
        let col_count=0;
        let html_string = '';
        let udf_queue = {};
        $.each(data['udfs'], function(key,val){
            let id = key.replace(/\ /g, '_').replace(/\(/g, '').replace(/\)/g, '');
            if(col_count%3==0){
                $('#udfs_div').append(html_string);
                $.each(udf_queue, function(udf_key, udf_val){
                    $('#'+udf_key).val(udf_val);
                });
                udf_queue = {};
                html_string = '<div class="row m-0 p-0">';
                html_string += '<div class="form-floating mb-3 col-4 pl-0"> \
                    <textarea class="form-control" placeholder="'+key+'" id="'+id+'" disabled></textarea> \
                    <label for="'+id+'">'+key+'</label> \
                </div>';
            udf_queue[id] = val;
            }
            else{
                html_string += '<div class="form-floating mb-3 col-4 pl-0"> \
                    <textarea class="form-control" placeholder="'+key+'" id="'+id+'" disabled></textarea> \
                    <label for="'+id+'">'+key+'</label> \
                </div>';
                udf_queue[id] = val;
            }
            col_count++;
        });
        
      }).fail(function( jqxhr, textStatus, error ) {
          try {
            let response = JSON.parse(jqxhr.responseText);
            console.log(jqxhr.responseText);
            var err = response['error'];
            let exception = $('<div/>').text(response['error_exception']).html(); // HTML encode string
            var debugging = "<p>For debugging purposes, we've tried to grab the error that triggered this page for you:</p>"+
                            '<p>&nbsp;</p><code class="well text-muted"><small>'+exception+'</small></code>';
          } catch(e) {
            var err = error+', '+textStatus;
            var debugging = '';
          }
          $('#udfs_div').append('<div class="alert alert-danger">' +
          '<h4>Error Loading Project: '+err+'</h4>' +
          '<p>Apologies, the project could not be loaded. ' +
          'Please try again later and report if the problem persists.</p></div>'+debugging);
     });
});

$('body').on('click', '#submitCloneProjBtn', function(event){
    $('#submitCloneProjBtn').addClass('disabled').text('Cloning...');
    let project_id = $('#projid').text();
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: '/api/v1/lims_project_data/'+project_id,
        error: function(xhr, textStatus, errorThrown) {
          alert('There was an error in cloning the project: '+xhr.responseText);
          $('#submitCloneProjBtn').removeClass('disabled').text('Clone');
          console.log(xhr); console.log(textStatus); console.log(errorThrown);
        },
        success: function(saved_data, textStatus, xhr) {
          $('#submitCloneProjBtn').removeClass('disabled').text('Clone');
          $('#cloneProjModal').modal('hide');
          console.log(saved_data);
          alert('Project cloned as '+saved_data['project_id']+', '+saved_data['project_name']+'!');
        }
      });
  });