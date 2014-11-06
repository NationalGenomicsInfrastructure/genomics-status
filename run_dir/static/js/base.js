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
  
});