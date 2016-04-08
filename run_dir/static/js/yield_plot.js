
window.current_plot_data=null;
window.current_plot_obj=null;
window.current_color_scheme=null;
window.current_instrument_list=null;
window.current_chemistries_list=null;

$(function(){
    init_page_js();
    refresh_plot();
});

function refresh_plot(){
    var params=get_parameters();
    if (window.current_plot_data==null){
        get_plot_data(search_string=params[0], key=params[2], name=params[3], display_by=params[1], inst_type_filter=params[4], inst_filter=params[5], color_type=params[6]);
    }else{
        make_plot(key=params[2], name=params[3], display_by=params[1], inst_type_filter=params[4], inst_filter=params[5],  color_type=params[6]);
    }

}
function make_plot(key, name, display_by, filter_inst_type, filter_inst, color_type){
    var toplot={
        chart: {
            type : 'column'
        },
        title: { 
            text : name+' of the recent flowcells'
        },
        legend : {
            enabled : false
        },
        yAxis: {
            min : 0, 
            title : {
              text : name
            }
        },
        credits: {
            enabled : false
        },
        xAxis: {
            type: 'category',  
            labels: {
                rotation: -90,
                    style: {
                        fontSize: '9px',
                        fontFamily: 'Verdana, sans-serif'
                    }
            }
        },
        series: [{
            name : name,
            data:[]
        }],
    };
    serie=build_series(window.current_plot_data, key, name, display_by, filter_inst_type, filter_inst,  color_type);
    toplot.series[0].data=serie;
    $("#main_plot").highcharts(toplot);
    window.current_plot_obj=toplot;
}

function build_series(data, key, name, display_by, filter_inst_type, filter_inst,  color_type){
    var serie=[];
    var tmp=[];
    var col_color="";
    var flowcell_link="/flowcells"
    for (d in data){
        tmp=data[d].id.split('_');
        flowcell_link="/flowcells/"+tmp[0]+'_'+tmp[tmp.length-1];
        if (color_type=='chemver'){
            col_color=color_by_chemistry(data[d].instrument.substr(0,1)+data[d].cver);
        }else if (color_type == 'inst'){
            col_color=color_by_instrument(data[d].instrument);
        }else{
            col_color=color_by_type(data[d].instrument);
        }
        if (filter_inst.length!=0){
            var skip=false;
            for (i in filter_inst){
                if (data[d].instrument.indexOf(filter_inst[i]) != -1){
                    skip=true;
                }
            }
            if (skip){
                continue;
            }
        }
        if (filter_inst_type.length!=0){
            var skip=false;
            for (i in filter_inst_type){
                if (data[d].instrument.indexOf(filter_inst_type[i]) != -1){
                    skip=true;
                }
            }
            if (skip){
                continue;
            }
        }
        if (display_by == "lane"){
            for (l in data[d].lanes){
                tmp=data[d].id.split('_');
                col_name=tmp[0]+'_'+tmp[tmp.length-1]+":"+data[d].lanes[l].lane;
                col={ 
                    name : col_name,
                    y : data[d].lanes[l][key],
                    color : col_color,
                    events : {
                        click : function(){window.open(flowcell_link)}
                    }
                };
                serie.push(col);
            }
        }else {
            //Default : by flowcell
            tmp=data[d].id.split('_');
            col_name=tmp[0]+'_'+tmp[tmp.length-1];
            col={ 
                name : col_name,
                y : data[d][key],
                color : col_color,
                events : {
                    click : function(){window.open(flowcell_link)}
                }
            };
            serie.push(col);
        }
    }
    return serie;
}

function get_plot_data(search_string="", key, name, display_by, filter_inst_type, filter_inst,  color_type){
        $.getJSON('/api/v1/flowcell_yield/'+search_string, function(data) {
            //update plot data
            window.current_plot_data=data;
            //update instrument list
            window.current_instrument_list=[];
            for (d in data){
                if (window.current_instrument_list.indexOf(data[d].instrument) == -1){
                    window.current_instrument_list.push(data[d].instrument);
                }
            }
            //update color scheme
            update_color_scheme();
            //set the instrument filters
            update_instrument_filters();
            //update chemistry list
            update_chemistries_list();
            //plot the damn data
            make_plot(key, name, display_by, filter_inst_type, color_type);
        });
}

function color_by_instrument(instrument){
    return current_color_scheme(window.current_instrument_list.indexOf(instrument)).hex();
}

function color_by_type(instrument){
    if (instrument.indexOf('E') != -1){
        return current_color_scheme(0).hex();
    } else if (instrument.indexOf('D') != -1){
        return current_color_scheme(window.current_instrument_list.length).hex();
    }else if (instrument.indexOf('M') != -1){
        return current_color_scheme(window.current_instrument_list.length / 2).hex();
    }else{
      return "#c3c3c3";
    }
}

function color_by_chemistry(chem){
    var id = Math.round(window.current_chemistries_list.indexOf(chem)*window.current_instrument_list.length/window.current_chemistries_list.length);
    return current_color_scheme(id).hex();
}

function get_parameters(){
     //first, the search string
     var search_string;
     var m_d_y;
     var first_half;
     var first_date;
     var second_half;
     var second_date;
     var dp=$('#inp_date_1').val();
     if (dp != ''){
         m_d_y=dp.split('/');  
         first_half=m_d_y[2].substr(2,2) + m_d_y[0] + m_d_y[1];
     }else{
         first_date=new Date();
         first_date.setMonth(first_date.getMonth()-1);
         first_half=first_date.toISOString().substr(2,2) + first_date.toISOString().substr(5,2) + first_date.toISOString().substr(8,2);
     }
     dp=$('#inp_date_2').val();
     if (dp != ''){
        m_d_y=dp.split('/');  
        second_half=m_d_y[2].substr(2,2) + m_d_y[0] +  m_d_y[1];
     }else{
        second_date=new Date();
        second_half=second_date.toISOString().substr(2,2) + second_date.toISOString().substr(5,2) + second_date.toISOString().substr(8,2);
     }
     search_string=first_half + '-' + second_half;

     //then, the display type 
     var display_type;
     if ($("#display_by_flowcell").hasClass('active')){
         display_type='flowcell'
     }else if($("#display_by_lane").hasClass('active')){
         display_type='lane'
     }
     //then, they key and name to display
     var key = $( "#key_select_form option:selected" ).val();
     var name= $( "#key_select_form option:selected" ).text();

     //The instrument_type_filter
     var inst_type_filter=[];
     $(".filter_inst_type").each(function(){
         if (! $(this).prop("checked")){
             inst_type_filter.push($(this).val());
         }
     });

     //the instrument filter
     var inst_filter=[];
     $(".filter_insts.disabled").each(function(){
         inst_filter.push($(this).attr('id').split('_')[2]);
     });
     //color type
     var color_by=$("#color_select option:selected").val();
     var ret=[search_string, display_type, key, name, inst_type_filter, inst_filter, color_by];

     return ret;
}

function init_page_js(){
    $('#datepick1').datepicker();
    $('#datepick2').datepicker();
    $('#submit_interval').click(function(e){
     e.preventDefault();
     window.current_plot_data=null;
     refresh_plot();
    });
    $("#display_type_buttons .btn").click(function(e){
        e.preventDefault();
        //datepicker messes up by adding eventlisteners to all buttons. 
        e.stopImmediatePropagation()
        $("#display_type_buttons .btn").removeClass('active');
        $(this).addClass("active");
        if ($(this).text() == 'Lane'){
            $(".key_select_lane").each(function(){
                $(this).prop( "disabled", false);
            });
        } else{
            $(".key_select_lane").each(function(){
                $(this).prop( "disabled", true);
            });
        }
        refresh_plot();
    });
    $("#key_select_form").change(function(e){
        e.preventDefault();
        e.stopImmediatePropagation()
        refresh_plot();
        
    });
    $(".filter_inst_type").each(function(e){
        $(this).prop('checked', true);
    });
    $(".filter_inst_type").change(function(e){
        e.stopImmediatePropagation()
        refresh_plot();
    });
    $("#color_select").change(function(e){
        e.stopImmediatePropagation()
        refresh_plot();
    });
    refresh_plot();
}

function update_color_scheme(){
    window.current_color_scheme=chroma.scale('RdYlBu').domain([0, window.current_instrument_list.length-1]);
}
function update_chemistries_list(){
    window.current_chemistries_list=[];
    var version="";
    for (d in window.current_plot_data){
        version = window.current_plot_data[d].instrument.substr(0,1) + window.current_plot_data[d].cver; 
        if ( window.current_chemistries_list.indexOf(version) == -1){
            window.current_chemistries_list.push(version);
        }
    }
}

function update_instrument_filters(){
    var html='<ul class="list-inline">';
    var my_inst_id='';
    var my_inst_name='';
    $.getJSON("/api/v1/instrument_names", function(data){
        for (i in window.current_instrument_list){
            my_inst_id=window.current_instrument_list[i];
            html+='<li class="filter_insts" id="inst_filter_'+my_inst_id+'"style="cursor:pointer;border-left: 5px solid '+color_by_instrument(my_inst_id)+';">';
            for (d in data){
            my_inst_name='';
                if(my_inst_id.indexOf(data[d].key)!= -1){
                    my_inst_name=data[d].value;
                    break;
                }
            }
            if (my_inst_name==''){
                my_inst_name=my_inst_id;
            }
            html+=my_inst_name + "</li>";

            html+=" ";
        }
        html+="</ul>";
        $("#inst_filter_div").html(html);
        
        $(".filter_insts").click(function(e){
            e.stopImmediatePropagation()
            if($(this).css('border-left').indexOf('rgb(195, 195, 195)')== -1){
                $(this).css('border-left', '5px solid #c3c3c3');
                $(this).addClass('disabled');
            }else{
                $(this).css('border-left', '5px solid '+color_by_instrument($(this).attr('id').split('_')[2]));
                $(this).removeClass('disabled');
            }
            refresh_plot();
        });
    });

}
