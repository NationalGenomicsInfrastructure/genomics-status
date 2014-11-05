/*
File: base.js
URL: /static/js/base.js
Basic Javascript functions to run on every page in Genomics Status
*/

// Don't do anything until the page has loaded
$(document).ready(function(){
  
  // Make the page title reflect the page contents
  // Get the heading without the child elements
  var page_title = $('h1:first').clone().children().remove().end().text().trim();
  if(page_title.length > 3){
    document.title = page_title + ' : Genomics Status';
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