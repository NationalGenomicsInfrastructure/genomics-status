
//this doesnt seem attached to the select. do it. 
$("#display_select").change(function(){
    console.log($(this).val());

    if ($(this).val() == "sid"){
        $('.rcplate td').each(function(){
            try{
              $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['sample_name'] );
            }catch(err){
              $(this).text("");
            }
        });
    }
    if ($(this).val() == "conc"){
        $('.rcplate td').each(function(){
            try{
              conc=sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['concentration'].toFixed(2);
              conc_units=sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['conc_units']
              $(this).text(conc+ " " + conc_units);
            }catch(err){
              $(this).text("");
            }
        });
    }
    if ($(this).val() == "amount"){
        $('.rcplate td').each(function(){
            try{
          $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['amount_(ng)'].toFixed(2) + " ng" );
            }catch(err){
              $(this).text("");
            }
        });
    }
    if ($(this).val() == "rin"){
        $('.rcplate td').each(function(){
            try{
          $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['rin'].toFixed(3) );
            }catch(err){
              $(this).text("");
            }
        });
    }
    if ($(this).val() == "reads"){
        $('.rcplate td').each(function(){
            try{
          $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['details']['total_reads_(m)'].toFixed(2) + " M" );
            }catch(err){
              $(this).text("");
            }
        });
    }
    if ($(this).val() == "qc"){
        $('.rcplate td').each(function(){
            try{
          $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['initial_qc_status']);
            }catch(err){
              $(this).text("");
            }
        });
    }
    if ($(this).val() == "cust_name"){
        $('.rcplate td').each(function(){
            try{
          $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['customer_name']);
            }catch(err){
              $(this).text("");
            }
        });
    }

});



