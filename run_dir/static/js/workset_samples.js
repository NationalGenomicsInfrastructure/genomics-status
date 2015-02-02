/*
File: workset_samples.js
URL: /static/js/workset_samples.js
Powers /workset/[workset] - template is run_dir/design/workset_samples.html
*/

// Get data attributes
var workset_name= $('#workset-js').attr('data-workset');

//globals are on purpose
var wsdata={};
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var margin_left=144;
var margin_top=112;
var interval=90;
var max_x=1144;
var max_y=742;


setupPlate();

$.getJSON("/api/v1/workset/"+workset_name, function(data) {
    
    // Fill in the main table with summary information
    var content="";
    wsdata= data[workset_name];
    
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
        content+='<table class="table table-bordered narrow-headers" id="ws-'+project_id+'"> \
                     <tr> \
                     <th>Sample name</th> \
                     <th>Submitter Name</th> \
                     <th>Reception Control</th> \
                     <th>Library</th> \
                     <th>Sequencing</th> \
                     <th>Location</th> \
                 </tr> ';
        $.each(project_data.samples, function(sample_id, sample_data){
        updateSample(sample_id,sample_data)
        content+="<tr><td>"+sample_id+"</td> \
                  <td>"+sample_data['customer_name']+"</td> \
                  <td>"+sample_data['rec_ctrl']['status']+"</td> \
                <td>";
            $.each(sample_data.library, function(lib_id, lib_data){
                lims_id=lib_id.split("-")[1];
                content+="<a href='https://genologics.scilifelab.se:8443/clarity/work-complete/"+lims_id+"'>"+lib_id+"</a> - "+lib_data['date']+" - "+lib_data['status']+"<br />";
            });
                content+="</td><td>";
            $.each(sample_data.sequencing, function(seq_id, seq_data){
                lims_id=seq_id.split("-")[1];
                content+="<a href='https://genologics.scilifelab.se:8443/clarity/work-complete/"+lims_id+"'>"+seq_id+"</a> - "+seq_data['date']+" - "+seq_data['status']+"<br />";
            });
                content+="</td> \
              <td>"+sample_data['location']+"</td> \
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
function setupPlate(){
    ctx.fillStyle = 'black';
    ctx.font = '12pt Calibri';
    ctx.textAlign = 'center';
    for (var i = margin_left; i <= max_x; i+=interval){
        ctx.fillText((i-margin_left)/interval+1, i, margin_top/2);
    }
    for (var i = margin_top; i <= max_y; i+=interval){
        ctx.fillText(String.fromCharCode((i-margin_top)/interval+65), margin_left/2, i);
    }

    for (var i = margin_left; i <= max_x; i+=interval){
        for (var j=margin_top; j<=max_y; j+=interval){
            drawWell(i, j, 'UNKNOWN');
        }
    }
}
function drawWell(centerX, centerY, sid, stat ){
    ctx.beginPath();
    ctx.arc(centerX,centerY,32,0,2*Math.PI);

    if (stat == 'FAILED'){
        ctx.fillStyle="red";
        ctx.fill()
    }else if (stat == 'PASSED'){
        ctx.fillStyle="green";
        ctx.fill()
    }else{
        ctx.fillStyle="white";
        ctx.fill()
    }
    ctx.fillStyle="black";
    ctx.font = '10pt Calibri';
    ctx.textAlign = 'center';
    ctx.fillText(sid, centerX, centerY);

    ctx.stroke();
}
function updateSample(sample_id,sample_data, level){
    var positions=sample_data['location'].split(':');
    var positionX=parseInt(positions[1]-1)*interval+margin_left;
    var positionY=(positions[0].charCodeAt(0)-65)*interval+margin_top;
    if(level == 'seq'){
        drawWell(positionX, positionY, sample_id, sample_data['sequencing_status']);
    }else if (level == 'rec_ctrl'){
        drawWell(positionX, positionY, sample_id, sample_data['rec_ctrl']['status']);
    }else{ 
        drawWell(positionX, positionY, sample_id, sample_data['library_status']);
    }
}

function updatePlate(level){
    setupPlate();
    if(wsdata.hasOwnProperty("projects")){
        $.each(wsdata.projects, function(project_id, project_data){
            $.each(project_data.samples, function(sample_id, sample_data){
                updateSample(sample_id, sample_data, level);
            });
        });
    }
}
