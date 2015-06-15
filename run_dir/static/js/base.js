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
  $('body').tooltip({
		selector: '[data-toggle="tooltip"]',
		container: 'body',
		html: true
	});

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
      remote: '/api/v1/project_search/%QUERY'
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
    returnstring = '<span class="label label-danger sentenceCase">'+value+'</span> ';
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
    returnstring = '<span class="label label-success sentenceCase">'+value+'</span> ';
  }

  // Put all unknowns into labels
  else if(value === true ||
				  (typeof value == 'string' && (
            value == 'unknown'))){
    returnstring = '<span class="label label-default sentenceCase">'+value+'</span> ';
  }

  // Warning labels
  else if(typeof value == 'string' && (
            value == 'in progress')){
    returnstring = '<span class="label label-warning sentenceCase">'+value+'</span> ';
  }

  // Dates
  else if(samples_table && typeof value == 'string' && value.split('-').length == 3 && value.length == 10){
    returnstring = '<span class="label label-date sentenceCase">'+value+'</span> ';
  }

  // Put all undefined into labels
  else if((typeof value == 'string' && value == 'undefined') ||
          (typeof value == 'string' && value == 'null') ||
          (typeof value == 'string' && value == 'nan') ||
          typeof value == 'undefined' || typeof value == 'null' || typeof value == 'NaN'){
    returnstring = '<span class="label label-undefined sentenceCase">'+value+'</span> ';
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
function make_project_links(s){
  // Searches for P[\d+] and replaces with a link to the project page
  s = s.replace(/([ ,.:-])(P[\d]{3,5})([ ,.:-])/, '$1<a href="/project/$2">$2</a>$3');
  // Searches for FlowCell IDs and replaces with a link
  s = s.replace(/([ ,.:-])(\d{6})(_\w{5,10}_\d{3,4})(_\w{8,12}[\-\w{3,8}]?)([ ,.:-])/g, '$1<a href="/flowcells/$2$4">$2$3$4</a>$5');
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
  return '<div class="mkdown">'+s+'</div>';
}



//
// FORMATTING STUFF
//

function auto_samples_cell (id, val){
  // Column returns an array
  if (val instanceof Array){
    cell = '<td class="' + id + '">';
    $.each(val, function(key, val){
      cell += auto_format(val, true) + ' ';
    });
    return cell + '</td>';
  }

  // Numeric value - right align
  else if (!isNaN(parseFloat(val)) && isFinite(val)){
    // Give numbers spaces in thousands separator
    val = val.toLocaleString(['fr-FR', 'en-US']);
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
