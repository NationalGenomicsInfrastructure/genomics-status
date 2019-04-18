
function get_link_url() {
    //URL for the notes
    if ('lims_step' in window && lims_step !== null){
        note_url='/api/v1/workset_links/' + lims_step
    }else if ('flowcell' in window && flowcell!== null){
        note_url='/api/v1/flowcell_links/' + flowcell;
    }else {
        note_url='/api/v1/links/' + project
    }
    return note_url;
}

function load_links() {
  link_url=get_link_url();
  var link_icon = {'Deviation':'exclamation-sign text-danger', 'Other':'file text-primary'};
  $("#existing_links").empty();
  $.getJSON(link_url, function(data) {
    $.each(data, function(key, link) {
      var link_href = link['url'] === "" ? "" : (' href="' + link['url'] + '"');
      var date = key.replace(/-/g, '/');
      date = date.replace(/\.\d{6}/, '');
      date = new Date(date);
      $("#existing_links").append('<tr><td>'+
      '<div class="media"><a class="media-left"'+link_href+'>'+
        '<span style="font-size:18px;" class="glyphicon glyphicon-'+link_icon[link['type']]+'"></span></a>'+
        '<span class="media-left"><a "'+link_href+'>'+link['title']+'</a>'
        +'</td><td>'+link['desc']+'<small> &nbsp;<a href="mailto:'+link['email']+'">'+link['user']+'</a>'+
        ' - '+date.toDateString()+'</span></td></tr>');
    });
  });
}

$("#link_form").submit(function(e) {
  e.preventDefault();
  var type = $('#new_link_type option:selected').val();
  var title = $('#new_link_title').val();
  var url = $('#new_link_url').val();
  var desc = $('#new_link_desc').val();
  link_url=get_link_url();

  if (title && type) {
    $.ajax({
      async: false,
      type: 'POST',
      url: link_url,
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
