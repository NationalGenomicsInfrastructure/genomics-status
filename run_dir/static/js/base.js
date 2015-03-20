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
