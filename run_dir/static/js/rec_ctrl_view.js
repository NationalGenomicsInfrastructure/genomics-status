$('.rin-button').on('click', function(){
      $('.rcplate td').each(function(){
              $(this).text( $(this).data('rin') );
                });
});
$('.sid-button').on('click', function(){
      $('.rcplate td').each(function(){
              $(this).text( $(this).data('sid') );
                });
});
$('.conc-button').on('click', function(){
      $('.rcplate td').each(function(){
          if ($(this).data('conc') != ""){
              $(this).text( $(this).data('conc') + " ng/uL");
          }else{
              $(this).text("");
          }
                });
});
