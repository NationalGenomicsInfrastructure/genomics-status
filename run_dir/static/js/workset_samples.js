/*
File: workset_samples.js
URL: /static/js/workset_samples.js
Powers /workset/[workset] - template is run_dir/design/workset_samples.html
*/

// Get data attributes
var workset_name= $('#workset-js').attr('data-workset');


$.getJSON("/api/v1/workset/"+workset_name, function(data) {
    
    // Fill in the main table with summary information
    var content="";
    var wsdata= data[workset_name];
    var tbody = '<tr> \
                     <th>Project id</th> \
                     <th>Project name</th> \
                     <th>Application</th> \
                     <th>Library method</th> \
                     <th>Samples</th> \
                     <th>Library info</th> \
                     <th>Sequencing info</th> \
                 </tr> ';
    
    if(wsdata.hasOwnProperty("projects")){
        $.each(wsdata.projects, function(project_id, project_data){
            content+='<h2>Project <a href="/project/'+project_id+'">'+project_id+'</a></h2>';
            content+='<table class="table table-bordered narrow-headers" id="ws-'+project_id+'"> \
                     <tr> \
                     <th>Project name</th> \
                     <th>Application</th> \
                     <th>Library method</th> \
                 </tr> ';
            var samplesnb=Object.keys(project_data['samples']).length;
            content+="<tr> \
                    <td>"+project_data['name']+"</td>\
                    <td>"+project_data['application']+"</td>\
                    <td>"+project_data['library']+"</td></tr></table>";
        content+="<h3>Samples</h3>";
        content+='<table class="table table-bordered narrow-headers" id="ws-'+project_id+'">';
        $.each(project_data.samples, function(sample_id, sample_data){
        content+="<tr><td>"+sample_id+"</td> \
                <td>";
            $.each(sample_data.library, function(lib_id, lib_data){
                lims_id=lib_id.split("-")[1];
                content+="<a href='https://genologics.scilifelab.se:8443/clarity/work-complete/"+lims_id+"'>"+lib_id+"</a><br />"+lib_data['date']+"<br />"+lib_data['status']+"<br /><br />";
            });
                content+="</td><td>";
            $.each(sample_data.sequencing, function(seq_id, seq_data){
                lims_id=seq_id.split("-")[1];
                content+="<a href='https://genologics.scilifelab.se:8443/clarity/work-complete/"+lims_id+"'>"+seq_id+"</a><br />"+seq_data['date']+"<br />"+seq_data['status']+"<br /><br />";
            });
                content+="</td> \
                </tr>";

        });
        content+="</table>";
    });
    }
    $("#workset_tables").html(content);
    
    // Remove the loading text
    $('#loading_spinner').hide();
    $('#page_content').show();

    // console.log(data)
}).error(function(){
    // workset not found - probably
    $('#page_content').html('<h1>Error - Workset Not Found</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t find the Workset <strong>'+workset_name+'</strong></div>');

    // Remove the loading text
    $('#loading_spinner').hide();
    $('#page_content').show();
});
