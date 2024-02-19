/*
File: base.js
URL: /static/js/base.js
Basic Javascript functions to run on every page in Genomics Status
*/

// Don't do anything until the page has loaded
$(document).ready(function(){

  // Make the page title reflect the page contents
  if($('#page_title').length > 0 && document.title == 'Genomics Status'){
    document.title = $('#page_title').text() + ' : Genomics Status';
  }

  // Activate bootstrap hover tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
                                  boundary: 'window',
                                  html: true
                                })
  })

  // Main navigation - #depreciated_header is the list separator
  // that describes the depreciated pages in the dropdown
  $('#depreciated_header').click(function(e){
      e.preventDefault();
  });



  // AWESOME SEARCH BOX THINGY
  // Plug in the typeahead search box
  var projectSearch = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: '/api/v1/project_search/%QUERY',
      limit: 10
  });
  projectSearch.initialize();

  var flowcellSearch = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: '/api/v1/flowcell_search/%QUERY'
  });
  flowcellSearch.initialize();

  var worksetSearch = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: '/api/v1/workset_search/%QUERY'
  });
  worksetSearch.initialize();

  $('.statusdb-search .typeahead').typeahead({
      minLength: 3,
      highlight: true,
  }, {
      name: 'project-search',
      displayKey: 'name',
      source: projectSearch.ttAdapter(),
      templates: {
          empty: '<div class="empty-message">No projects found</div>'
      }
  }, {
      name: 'flowcell-search',
      displayKey: 'name',
      source: flowcellSearch.ttAdapter(),
      templates: {
          empty: '<div class="empty-message">No flow cells found</div>'
      }
  },{
      name: 'workset-search',
      displayKey: 'name',
      source: worksetSearch.ttAdapter(),
      templates: {
          empty: '<div class="empty-message">No Worksets found</div>'
      }
  }).bind('typeahead:selected', function(obj, datum, name) {
      var url = datum.url;
      window.location.href = url;
  });

  // Show and hide a spinner on the ajax event
  $('.statusdb-search .input-spinner').hide();
  $(document).ajaxSend(function(event, jqXHR, settings) {
      $('.input-spinner').show();
  });

  $(document).ajaxComplete(function(event, jqXHR, settings) {
      $('.statusdb-search .input-spinner').hide();
  });


});


// HELPER FUNCTIONS FOR FORMATTING
function auto_format(value, samples_table){
  // Default value for function
  samples_table = (typeof samples_table === "undefined") ? false : samples_table;

  var orig = value;
  var returnstring;
  if(typeof value == 'string'){
    value = value.toLowerCase().trim();
  }

  // Put all False / Failed / Fail into labels
  if(value === false ||
				(typeof value == 'string' && (
            value == 'false' ||
            value == 'failed' ||
            value == 'fail' ||
            value == 'none' ||
            value == 'no' ||
            value == 'no' ||
            value == 'n/a' ||
            value == 'aborted' ))){
    returnstring = '<span class="badge bg-danger sentenceCase">'+value+'</span> ';
  }

  // Put all False / Failed / Fail into labels
  else if(value === true ||
				(typeof value == 'string' && (
            value == 'true' ||
            value == 'passed' ||
            value == 'pass' ||
            value == 'yes' ||
            value == 'finished' ||
            value == 'p'))){
    returnstring = '<span class="badge bg-success sentenceCase">'+value+'</span> ';
  }

  // Put all unknowns into labels
  else if(value === true ||
			  (typeof value == 'string' && (
            value == 'unknown'))){
    returnstring = '<span class="badge bg-secondary sentenceCase">'+value+'</span> ';
  }

  // Warning labels
  else if(typeof value == 'string' && (
            value == 'in progress')){
    returnstring = '<span class="badge bg-warning sentenceCase">'+value+'</span> ';
  }

  // Dates
  else if(samples_table && typeof value == 'string' && value.split('-').length == 3 && value.length == 10){
    returnstring = '<span class="badge bg-date sentenceCase">'+value+'</span> ';
  }

  // Put all undefined into labels
  else if((typeof value == 'string' && value == 'undefined') ||
          (typeof value == 'string' && value == 'null') ||
          (typeof value == 'string' && value == 'nan') ||
          typeof value == 'undefined' || typeof value == 'null' || typeof value == 'NaN'){
    returnstring = '-';
  }

  else {
    returnstring = orig;
  }

  if(samples_table){
    return returnstring + '<br>';
  } else {
    return returnstring;
  }
}

//
// MARKDOWN
//
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});
//Fix for the whole text getting inserted as heading ids and messing up the headings
marked.Renderer.prototype.heading =function(text,level,raw){
    return"<h"+level+'>'+text+"</h"+level+">\n"
};
function make_project_links(s){
  // Searches for P[\d+] and replaces with a link to the project page
  s = s.replace(/([\W])(P[\d]{3,5})(?!\w)/g, '$1<a class="text-decoration-none" href="/project/$2">$2</a>');

  // Searches for FlowCell IDs and replaces with a link (Most complicated regex ever)
  // - $1 = Captures a non-word character (javascript can't do lookbehind)
  // - $2 = Matches flowcell date - eg 150505
  // - $3 = Matches optional flowcell chunk - eg. _D00450_0168
  // - $4 = Matches remaining flowcell ID - eg. _AC6H3RANXX or _AC6H3RANXX-SDVLKCH
  // - Not capture lookahead to make sure that were not followed by any more word characters
  // Replaces with link to flowcell ID without internal chunk
  // Example: 150505_D00450_0168_AC6H3RANXX links to 150505_AC6H3RANXX
  s = s.replace(/([\W])(\d{6,8})(_(?:ST-)?\w{5,10}_\d{3,4})(_\w{8,12}(?:\-\w{3,8})?)(?!\w)/g, '$1<a class="text-decoration-none" href="/flowcells/$2$4">$2$3$4</a>');

  // Searches for ONT FlowCell IDs and replaces with a link (modified from Illumina FCs)
  // - $1 = Captures a non-word character (javascript can't do lookbehind)
  // - $2 = Matches flowcell date - eg 20230621
  // - $3 = Matches 4 digit chunk - eg. _1629
  // - $4 = Matches remaining flowcell ID - eg. _MN19414 or _3G
  // - $5 = Matches remaining flowcell ID - eg. _APT766 or _PAO31800
  // - $6 = Matches remaining flowcell ID - eg. _494e1a8c
  // - Not capture lookahead to make sure that were not followed by any more word characters
  // Example: 20230621_1629_MN19414_APT766_494e1a8c or 20230815_1205_3G_PAO31800_201c040e
  s = s.replace(/([\W])(\d{8})(_\d{4})(_\w{2,8})(_\w{6,8})(_\w{8})(?!\w)/g, '$1<a class="text-decoration-none" href="/flowcells_ont/$2$3$4$5$6">$2$3$4$5$6</a>');
  
  return s;
}
function create_user_tags(s){
  // Searches for @\w+ and replaces with a mail link
  s = s.replace(/(@)([a-zA-Z0-9.-]+)/g, '<a class="text-decoration-none" href="mailto:$2@scilifelab.se">$1$2</a>');
  return s;
}
function check_img_sources(obj){
  // Sort out any missing images
  // pass some images, eg $('#running_note_preview_body img')
  // Has to be called AFTER the code has been inserted into the DOM
  pathArray = window.location.href.split( '/' );
  var missing_img_src = pathArray[0]+'//'+pathArray[2]+'/static/img/missing_image.png';
  $(obj).on('error', function () {
    if($(this).is('img') && $(this).attr('src') !== missing_img_src){
      $(this).attr('src', missing_img_src);
    }
  });
}
function make_markdown(s){
  s = marked(s);
  s = make_project_links(s);
  s = create_user_tags(s);
  return '<div class="mkdown">'+s+'</div>';
}



//
// FORMATTING STUFF
//

// Give long numbers spacing between the 1000s, without adding anything
// so that they can still be copied into excel easily
// Solution: wrap thousand groups in span elements that have margins
function nice_numbers (count) {
  // Strip out the commas that are sometimes given server-side
  var count = count.toString().replace(/,/g,'');
  // loop through thousands from the end, wrapping in the span
  var parsed = '';
  while(m = count.match((/\d{3}$/))){
    parsed = '<span class="thousand_group">' + m[0] + '</span>' + parsed;
    count = count.replace(/\d{3}$/, '');
  }
  // Add on whatever is remaining in the string.
  parsed = count + parsed;
  return parsed;
}

function auto_samples_cell (id, val){
  // Column returns an array
  if (val instanceof Array){
    cell = '<td class="' + id + '">' 
    if (val.length === 0)
      cell = cell + '-';
    $.each(val, function(key, val){
        cell += auto_format(val, true) + ' ';
    });
    return cell + '</td>';
  }

  // Numeric value - right align
  else if (!isNaN(parseFloat(val)) && isFinite(val)){
    // Give numbers spaces in thousands separator
    val = nice_numbers(val);
    return '<td class="' + id + ' text-right">' + auto_format(val, true) + '</td>';
  }

  // Single value
  else {
    return '<td class="' + id + '">' + auto_format(val, true) + '</td>';
  }
}

function formatDateTime(d, printTime){
  if(typeof d.getMonth !== 'function'){
    d = new Date(d);
  }
  var dd = d.getDate();
  var mm = d.getMonth()+1; //January is 0!
  if(dd<10) { dd='0'+dd }
  if(mm<10) { mm='0'+mm }
  var returnstring = d.getFullYear()+'-'+mm+'-'+dd;
  if(printTime){
    returnstring += ', '+d.getHours()+':'+d.getMinutes();
  }
  return returnstring;
}

//Is there any standar method to do this?
var max_str = function(strs) {
  var max = strs[0];
  for (var i=0; i < strs.length; i++) {
    if (parseInt(strs[i].split('-')[1]) > parseInt(max.split('-')[1])) {
      max = strs[i];
    }
  }
  return max
}

// Round number to the given number of decimals
var round_floats = function(n, p) {
  if (typeof(n) == 'number') {
    // If it's a float...
    if (Math.round(n) != n) {
      n = n.toFixed(p);
    }
  }
  return n;
}
