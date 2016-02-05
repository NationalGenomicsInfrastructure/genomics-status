
// Wait for page to load
$(function(){
    
    // Colour the table on page load
    colour_table_cells();

    // Select box is updated
    $("#display_select").change(function(){
        change_plate_data($(this).val());
    });
    
    // Cursor pressed
    $(document).keydown(function(e) {
        // left or up
        if(e.which == 37 || e.which == 38){
            var next_el = $("#display_select option:selected").prev();
        }
        // right or down
        if(e.which == 39 || e.which == 40){
            var next_el = $("#display_select option:selected").next();
        }
        if(next_el.is('option')){
            $("#display_select").val(next_el.val());
            change_plate_data(next_el.val());
        }
    });

    function change_plate_data(dtype){
        if (dtype == "sid"){
            $('.rcplate td').each(function(){
                try{
                  $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['sample_name'] );
                }catch(err){
                  $(this).text("");
                }
            });
        }
        if (dtype == "conc"){
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
        if (dtype == "amount"){
            $('.rcplate td').each(function(){
                try{
              $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['amount_(ng)'].toFixed(2) + " ng" );
                }catch(err){
                  $(this).text("");
                }
            });
        }
        if (dtype == "rin"){
            $('.rcplate td').each(function(){
                try{
              $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['rin'].toFixed(3) );
                }catch(err){
                  $(this).text("");
                }
            });
        }
        if (dtype == "reads"){
            $('.rcplate td').each(function(){
                try{
              $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['details']['total_reads_(m)'].toFixed(2) + " M" );
                }catch(err){
                  $(this).text("");
                }
            });
        }
        if (dtype == "qc"){
            $('.rcplate td').each(function(){
                try{
              $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['initial_qc']['initial_qc_status']);
                }catch(err){
                  $(this).text("");
                }
            });
        }
        if (dtype == "cust_name"){
            $('.rcplate td').each(function(){
                try{
              $(this).text(sdata[$(this).data('plate')][$(this).data('pos')]['customer_name']);
                }catch(err){
                  $(this).text("");
                }
            });
        }
        
        
        colour_table_cells();
    }
    
    function colour_table_cells(){
        // Colour code table cells using chroma.js
        $('.rcplate').each(function(){
            var table = $(this);
            
            // Get the max and min values
            var maxval = undefined;
            var minval = undefined;
            table.find('td').each(function(){
                var tdval = parseFloat( $(this).text().replace(/[^\d\.-]/g,'') );
                if(!isNaN(tdval)){
                    if(maxval == undefined){ maxval = tdval }
                    else { maxval = Math.max(tdval, maxval); }
                    if(minval == undefined){ minval = tdval }
                    else { minval = Math.min(tdval, minval); }
                }
            });

            // Go through table cells again, adding colour
            var scale = chroma.scale('RdYlBu').domain([minval, maxval]);
            table.find('tr td').each(function(){
                var tdval = parseFloat($(this).text().replace(/[^\d\.-]/g,''));
                var col = '#ffffff';
                if(maxval !== undefined && minval !== undefined){
                    // col = scale(tdval).luminance(0.7).css();
                    var rgb = scale(tdval).rgb();
                    for (i in rgb){
                      rgb[i] = 255+(rgb[i]-255)*0.3;
                      if(rgb[i] > 255){ rgb[i] = 255; }
                      if(rgb[i] < 0){ rgb[i] = 0; }
                    }
                    col = chroma.rgb(rgb).hex();
                }
                if($(this).text() == 'PASSED'){ col = '#dff0d8'; }
                if($(this).text() == 'FAILED'){ col = '#f2dede'; }
                $(this).css('background-color', col);
            });
        });
    }

});