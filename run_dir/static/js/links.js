
function get_link_url() {
  const link_id_reference = {  
    'flowcell': $('#flowcells-js').attr('data-flowcell'), 
    'flowcell_ont': $('#flowcells-js').attr('data-flowcell'), 
    'workset': $('#workset-js').attr('data-workset-id'), 
    'project': $('#projects-js').attr('data-project')
  };
  let link_url = '';
  if(typeof $('#ln-js').data('link-type') !== 'undefined'){
    const link_type = $('#ln-js').data('link-type');
    const link_id = link_id_reference[link_type];
     //URL for the links
     if (link_type==="workset"){
      link_url = '/api/v1/workset_links/' + link_id;
     }else if (link_type==="flowcell"){
      link_url = '/api/v1/flowcell_links/' + link_id;
     }else if (link_type==="project"){
      link_url='/api/v1/links/' + link_id;
    }
  }
  return link_url;
}

function load_links() {
  link_url=get_link_url();
  var link_icon = {'deviation':'exclamation-circle text-danger', 'other':'file text-primary', 'project_folder': 'folder-open'};
  $("#existing_links").empty();
  $("#existing_links_projinfo").empty();
  $("#links_tab").hide();
  $.getJSON(link_url, function(data) {
    $("#links_tab").show();
    if ('old_links' in data) {
      data = data['old_links'];
    }
    $.each(data, function(key, link) {
      var link_href = link['url'] === "" ? "" : (' href="' + link['url'] + '"');
      var date = key.replace(/-/g, '/');
      date = date.replace(/\.\d{6}/, '');
      date = new Date(date);
      $("#existing_links_projinfo").append('<tr><td>'+
      '<div><a class="pr-2"'+link_href+' target="_blank">'+
        '<span style="font-size:18px;" class="fa fa-'+link_icon[link['type'].toLowerCase()]+'"></span></a>'+
        '<span class="align-top"><a class="text-decoration-none" "'+link_href+' target="_blank"'+'>'+link['title']+'</a>'
        +'</td><td>'+link['desc']+'<small> &nbsp;<a class="text-decoration-none" href="mailto:'+link['email']+'">'+link['user']+'</a>'+
        ' - '+date.toDateString()+'</span></td></tr>');
      $("#existing_links").append('<div class="link_wrapper"> \
                                    <div class="container"> \
                                    <div class="row justify-content-center">  \
                                      <div class="col-1 pr-0"> \
                                        <a class="float-right"'+link_href+' target="_blank"><i style="font-size:18px;" class="fa fa-'+link_icon[link['type'].toLowerCase()]+'"></i> \
                                        </a> \
                                      </div> \
                                      <div class="col-9"> \
                                        <h4> \
                                          <a class="text-decoration-none" "'+link_href+' target="_blank">'+link['title']+'</a> \
                                          <small> \
                                          <a class="text-decoration-none" href="mailto:'+link['email']+'">'+link['user']+'</a> - '+date.toDateString()+' \
                                          </small> \
                                        </h4> '+link['desc']+' \
                                      </div> \
                                    </div> \
                                    </div> \
                                   </div>');
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
