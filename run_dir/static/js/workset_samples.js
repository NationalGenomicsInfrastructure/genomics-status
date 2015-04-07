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
    //reused, needed as global
    lims_step=wsdata['id'];
    date_run=wsdata['date_run'];
    $('#date_run').html(date_run);
    $('#span_lims_step').html('<a href="http://genologics.scilifelab.se:8080/clarity/work-complete/'+lims_step.substr(3)+'">'+lims_step+'</a>');
    load_workset_notes();
    load_links();

    if(wsdata && wsdata.hasOwnProperty("projects")){
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
                  <td>"+auto_format(sample_data['rec_ctrl']['status'])+"</td> \
                <td>";
            $.each(sample_data.library, function(lib_id, lib_data){
                lims_id=lib_id.split("-")[1];
                content+="<a href='https://genologics.scilifelab.se:8443/clarity/work-complete/"+lims_id+"'>"+lib_id+'</a> <span class="label label-date sentenceCase">'+lib_data['date']+"</span> "+auto_format(lib_data['status'])+"<br />";
            });
                content+="</td><td>";
            $.each(sample_data.sequencing, function(seq_id, seq_data){
                lims_id=seq_id.split("-")[1];
                content+="<a href='https://genologics.scilifelab.se:8443/clarity/work-complete/"+lims_id+"'>"+seq_id+'</a> <span class="label label-date sentenceCase">'+seq_data['date']+"</span> "+auto_format(seq_data['status'])+"<br />";
            });
                content+='</td><td class="text-center">'+sample_data['location']+"</td> \
                </tr>";

        });
        content+="</table><hr>";
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

// Preview running notes
$('#new_note_text').keyup(function() {
    var now = new Date();
    $('.todays_date').text(now.toDateString() + ', ' + now.toLocaleTimeString());
    var text = $('#new_note_text').val().trim();
    if (text.length > 0) {
        $('#running_note_preview_body').html(make_markdown(text));
        check_img_sources($('#running_note_preview_body img'));
    } else {
        $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
    }
    // update textarea height
    $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
});

// Insert new running note and reload the running notes table
$("#workset_notes_form").submit( function(e) {
    e.preventDefault();
    var text = $('#new_note_text').val().trim();
    if (text.length == 0) {
        alert("Error: No running note entered.");
        return false;
    }

    $('#save_note_button').addClass('disabled').text('Submitting..');
    $.ajax({
      async: false,
      type: 'POST',
      url: '/api/v1/workset_notes/' +lims_step,
      dataType: 'json',
      data: {"note": text},
      error: function(xhr, textStatus, errorThrown) {
        alert('There was an error inserting the Running Note: '+errorThrown);
        $('#save_note_button').removeClass('disabled').text('Submit Workset Note');
        console.log(xhr);
        console.log(textStatus);
        console.log(errorThrown);
      },
      success: function(data, textStatus, xhr) {
        $('#save_note_button').removeClass('disabled').text('Submit Workset Note');
        // Clear the text box
        $('#new_note_text').val('');
        $('#running_note_preview_body').html('<p class="text-muted"><em>Nothing to preview..</em></p>');
        $('#new_note_text').css('height', $('#running_note_preview_panel').css('height'));
        // Create a new running note and slide it in..
        var now = new Date();
        $('<div class="panel panel-success"><div class="panel-heading">'+
              '<a href="mailto:' + data['email'] + '">'+data['user']+'</a> - '+
              now.toDateString() + ', ' + now.toLocaleTimeString(now)+
            '</div><div class="panel-body">'+make_markdown(data['note'])+
            '</div></div>').hide().prependTo('#running_notes_panels').slideDown();
        check_img_sources($('#running_notes_panels img'));
      }
    });
});

$("#link_form").submit(function(e) {
  e.preventDefault();
  var type = $('#new_link_type option:selected').val();
  var title = $('#new_link_title').val();
  var url = $('#new_link_url').val();
  var desc = $('#new_link_desc').val();

  if (title && type) {
    $.ajax({
      async: false,
      type: 'POST',
      url: '/api/v1/workset_links/' + lims_step,
      dataType: 'json',
      data: {'type': type, 'title': title, 'url':url, 'desc':desc}
    }).done(function(){
      //Clear form fields
      $('#new_link_type, #new_link_title, #new_link_url, #new_link_desc').val("");
      load_links();
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        console.log( "Couldn't insert link: " + err );
        alert( "Error - Couldn't insert link ..  Is there something weird about this project in the LIMS?" );
    });

  }
  else if(!$.browser.chrome) {
    //Non-chrome users might not get a useful html5 message
    alert('The link needs a title and a type needs to be selected');
  }
});
function load_links() {
  var link_icon = {'Deviation':'exclamation-sign text-danger', 'Other':'file text-primary'};
  $("#existing_links").empty();
  $.getJSON("/api/v1/workset_links/" + lims_step, function(data) {
    $.each(data, function(key, link) {
      var link_href = link['url'] === "" ? "" : (' href="' + link['url'] + '"');
			var date = new Date(key);
      $("#existing_links").append('<div class="link_wrapper"><div class="col-sm-8 col-sm-offset-2">'+
						'<div class="media"><a class="media-left"'+link_href+'>'+
							'<span style="font-size:18px;" class="glyphicon glyphicon-'+link_icon[link['type']]+'"></span>'+
						'</a><div class="media-body">'+
							'<h4 class="media-heading"><span class="media-left"><a "'+link_href+'>'+link['title']+'</a>'+
								' &nbsp; <small><a href="mailto:'+link['email']+'">'+link['user']+'</a>'+
								' - '+date.toDateString()+
							'</span></h4>'+
							link['desc']+
						'</div></div>'+
						'</div><div class="clearfix"></div></div>');
    });
  });
}

function load_workset_notes(wait) {
  // Clear previously loaded notes, if so
  $("#workset_notes").empty();
  $.getJSON("/api/v1/workset_notes/" + lims_step, function(data) {
    $.each(data, function(date_str, note) {
        noteText = make_markdown(note['note']);
        var date = new Date(date_str);
      $('#workset_notes').append('<div class="panel panel-default">' +
          '<div class="panel-heading">'+
            '<a href="mailto:' + note['email'] + '">'+note['user']+'</a> - '+
            date.toDateString() + ', ' + date.toLocaleTimeString(date)+
          ' <span class="glyphicon glyphicon-remove-sign delete_note" id="'+date_str+'"></span></div><div class="panel-body">'+noteText+'</div></div>');
            //check_img_sources($('#running_notes_panels img'));
    });
  }).fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ", " + error;
      console.log( "workset notes request failed: " + err );
  });
}




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
            drawWell(i, j, 'Unknown');
        }
    }
}
function drawWell(centerX, centerY, sid, stat ){
    ctx.beginPath();
    ctx.arc(centerX,centerY,32,0,2*Math.PI);

    if (stat == 'FAILED'){
        ctx.fillStyle="#f2dede";
        ctx.strokeStyle="#DDC4C4";
        ctx.fill()
        ctx.fillStyle="#a94442";
    }else if (stat == 'PASSED'){
        ctx.fillStyle="#dff0d8";
        ctx.strokeStyle="#B4DA95";
        ctx.fill()
        ctx.fillStyle="#3c763d";
    }else{
        ctx.fillStyle="white";
        ctx.strokeStyle="#CCCCCC";
        ctx.fill()
        ctx.fillStyle="#666666";
    }
    ctx.font = '10pt Calibri';
    ctx.textAlign = 'center';
    ctx.fillText(sid, centerX, centerY+4);

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

$(document).ready(function(){
    $('.plate-type-button').click(function(){
        $(this).parent().siblings('li').removeClass('active');
        $(this).parent().addClass('active');
        var target = $(this).attr('href').substr(1);
        updatePlate(target);
    });
});

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
