$('.cronjob-expand').click(function(e){
    e.preventDefault();
    e.stopImmediatePropagation();
    if ($(this).find('span.glyphicon').hasClass('glyphicon-chevron-right')) {
        $(this).closest('tr').nextUntil('tr.server').show();
        $(this).find('span.glyphicon').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
    } else {
        $(this).closest('tr').nextUntil('tr.server').hide();
        $(this).find('span.glyphicon').addClass('glyphicon-chevron-right').removeClass('glyphicon-chevron-down');
    }
});
