
window.current_plot_data=null;
window.current_plot_obj=null;
window.current_color_schemes=null;
window.current_instrument_list=null;
window.current_chemistries_list=null;
window.current_months_list=null;

$(function(){
    init_page_js();
});

function refresh_plot(){
    var params=get_parameters();
    if (window.current_plot_data==null){
        get_plot_data(search_string=params[0], key=params[2], name=params[3], display_by=params[1], inst_type_filter=params[4], inst_filter=params[5], color_type=params[6], plot_type=params[7]);
    }else{
        make_plot(key=params[2], name=params[3], display_by=params[1], inst_type_filter=params[4], inst_filter=params[5],  color_type=params[6], plot_type=params[7]);
    }

}

function make_plot(key, name, display_by, filter_inst_type, filter_inst, color_type, plot_type){
    var toplot={
        chart: {
            type: plot_type
        },
        title: {
            text : name+' of the recent flowcells'
        },
        yAxis: {
            min : 0,
            title : {
                text : name
            }
        },
        legend: {
            title: {
                text: 'Click to hide:',
                align: 'center'
                }
        },
        plotOptions : {
            series : {
                turboThreshold: 0,
                point: {
                    events: {
                        click: function() {
                            window.open(this.options.ownURL)
                        }
                    }
                }
            }
        },
        tooltip: {
            useHTML: true,
            headerFormat: '<span style="color:{point.color}">\u25CF</span><small>{point.key}</small><br />',
            pointFormat: '{series.name} : <b>{point.y}</b>'
        },
        credits: {
            enabled : false
        },
        xAxis: {
            type: 'category',
            labels: {
                enabled: false,
            },
            categories: []
        },
        series: [{
            name : name,
            data:[]
        }],
        exporting: {
            csv: {
                itemDelimiter: ';'
            }
        }
    };

    //Styling the default view
    if (color_type == "chemver" && key == "total_clusters" && display_by == "flowcell"){
        toplot.yAxis={
            title: {
                enabled: true,
                text: 'Clusters',
            },
            labels: {
                formatter: function() {
                    return this.value.toExponential(2);
                }
            },
            plotLines: [{
                color: '#ffb700',
                dashStyle: 'longdash',
                value: 650000000,
                width: 1,
                label: {
                    text: 'NovaSeq SP threshold to pass',
                    align: 'right'
                }
                }, {
                    color: '#ff00ae',
                    dashStyle: 'longdash',
                    value: 1300000000,
                    width: 1,
                    label: {
                        text: 'NovaSeq S1 threshold to pass',
                        align: 'right'
                    }
                }, {
                    color: '#0080ff',
                    dashStyle: 'longdash',
                    value: 3300000000,
                    width: 1,
                    label: {
                        text: 'NovaSeq S2 threshold to pass',
                        align: 'right'
                    }
                }, {
                    color: '#11ad11',
                    dashStyle: 'longdash',
                    value: 8000000000,
                    width: 1,
                    zIndex: 1,
                    label: {
                        text: 'NovaSeq S4 threshold to pass',
                        align: 'right'
                    }
                }, {
                    color: '#8400ff',
                    dashStyle: 'longdash',
                    value: 2000000000,
                    width: 1,
                    zIndex: 1,
                    label: {
                        text: 'NovaSeqXPlus 10B threshold to pass',
                        align: 'right'
                    }
                }]
            }
    };
    serie=build_series(window.current_plot_data, key, name, display_by, filter_inst_type, filter_inst, color_type);
    toplot.series=serie[1];
    toplot.xAxis.categories = serie[0];
    $("#main_plot").highcharts(toplot);
    window.current_plot_obj=toplot;

}

function build_series(data, key, name, display_by, filter_inst_type, filter_inst, color_type){

    var series = [];
    var flowcell_link="/flowcells";
    var categories = [];
    for (d in data){
        var tmp=data[d].id.split('_');
        var fcid=tmp[0]+'_'+tmp[tmp.length-1];
        var col_color = "";
        var series_name = "";
        var flowcell_link="/flowcells/"+fcid;
        //Seq platform filter
        if (data[d].instrument.indexOf('M') != -1 && filter_inst_type.includes('M')){
            continue;
        }else if (data[d].instrument.indexOf('A') != -1 && filter_inst_type.includes('A')){
            continue;
        }else if (data[d].instrument.indexOf('VH') != -1 && filter_inst_type.includes('VH')){
            continue;
        }else if (data[d].instrument.indexOf('LH') != -1 && filter_inst_type.includes('LH')){
            continue;
        }
        // Set colours and the name of data series
        if (color_type=='chemver'){
            if (data[d].cver.includes('S4')){
                series_name = "S4";
                }
            if (data[d].cver.includes('S2')){
                series_name = "S2";
                }
            if (data[d].cver.includes('S1')){
                series_name = "S1";
                }
            if (data[d].cver.includes('SP')){
                series_name = "SP";
                }
            if (data[d].cver.includes('Version2')){
                series_name = "MiSeq v2";
                }
            if (data[d].cver.includes('Version3')){
                series_name = "MiSeq v3";
                }
            if (data[d].mode == '2'){
                series_name = "MiSeq Nano";
                }
            if (data[d].cver.includes('2000')){
                series_name = "NextSeq 2000";
                }
            if (data[d].cver.includes('10B')){
                series_name = "10B";
                }
            if (data[d].cver.includes('1.5B')){
                series_name = "1.5B";
                }
            if (data[d].cver.includes('25B')){
                series_name = "25B";
                }

            if (series_name == 'MiSeq Nano'){
                col_color = color_by_chemistry('nano');
            }else{
                col_color = color_by_chemistry(data[d].cver);
            }
        }else if (color_type == 'month'){
            series_name = data[d].id.substr(0,4);
            col_color=color_by_month(data[d].id);
        }else if (color_type == 'inst'){
            series_name = data[d].instrument;
            col_color=color_by_instrument(series_name);
            if (filter_inst.includes(data[d].instrument)) {
                continue;
            }
        }else{
            col_color=color_by_type(data[d].instrument);
            if (data[d].instrument.indexOf('M') != -1){
                series_name = "MiSeq";
            }else if (data[d].instrument.indexOf('A') != -1){
                series_name = "NovaSeq 6000";
            }else if (data[d].instrument.indexOf('VH') != -1){
                series_name = "NextSeq 2000";
            }else if (data[d].instrument.indexOf('LH') != -1){
                series_name = "NovaSeqXPlus";
            }else{
                continue;
            }
        }
        // Create series
        if (!series.hasOwnProperty(series_name)) {
            series[series_name] = {
                step: true,
                name: series_name,
                color: col_color,
                data: [],
            };
            series.length += 1;
        }
        if (display_by == "lane"){ //Lane display
            for (l in data[d].lanes){
                fcid_lane = fcid +":"+ data[d].lanes[l].lane;
                if (key in data[d].lanes[l]){
                    value=data[d].lanes[l][key];
                }
                dp = {
                    y: value,
                    name: fcid_lane,
                    ownURL: flowcell_link
                };
                series[series_name].data.push(dp);
                categories.push(fcid_lane);
            }
        }else{ // Flowcell display
            dp = {
                y: data[d][key],
                name: fcid,
                ownURL: flowcell_link
            };
            series[series_name].data.push(dp);
            categories.push(fcid);
        }
        // Stupid hackery to get a proper JS array for HCharts
        var proper_series = []
        for (s in series) {
            proper_series.push(series[s]);
        }
    }
    return [categories, proper_series];
}

function get_plot_data(search_string="", key, name, display_by, filter_inst_type, filter_inst, color_type){
        $.getJSON('/api/v1/flowcell_yield/'+search_string, function(data) {
            //update plot data
            window.current_plot_data=data;
            //update instrument list
            update_instrument_list();
            //update chemistry list
            update_chemistries_list();
            //update months list
            update_months_list();
            //update color schemes
            update_color_schemes(data);
            //set the instrument filters
            update_instrument_filters();
            //plot the damn data
            make_plot(key, name, display_by, filter_inst_type, filter_inst, color_type, plot_type);
        });
}
function color_by_instrument(instrument){
    return current_color_schemes[1](window.current_instrument_list.indexOf(instrument)).hex();
}

function color_by_type(instrument){
    if (instrument.indexOf('M') != -1){
        return current_color_schemes[0](0).hex();
    }else if (instrument.indexOf('A') != -1){
        return current_color_schemes[0](1).hex();
    }else if (instrument.indexOf('VH') != -1){
        return current_color_schemes[0](2).hex();
    }else if (instrument.indexOf('LH') != -1){
        return current_color_schemes[0](3).hex();
    }else{
        return "#c3c3c3";
    }
}
function color_by_month(id){
    return current_color_schemes[3](window.current_months_list.indexOf(id.substr(0,4))).hex()
}

function color_by_chemistry(series_name){
    version = window.current_plot_data[d].instrument.substr(0,1) + series_name;
    var id = window.current_chemistries_list.indexOf(version);
	return current_color_schemes[2](id).hex();
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
            y_m_d=dp.split('-');
            first_half=y_m_d[0].substr(2,2) + y_m_d[1] + y_m_d[2];
        }else{
            first_date=new Date();
            first_date.setYear(first_date.getYear()-1);
            first_half=first_date.toISOString().substr(2,2) + first_date.toISOString().substr(5,2) + first_date.toISOString().substr(8,2);
        }
        dp=$('#inp_date_2').val();
        if (dp != ''){
            y_m_d=dp.split('-');
            second_half=y_m_d[0].substr(2,2) + y_m_d[1] + y_m_d[2];
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

        var plot_type;
        if ($("#plot_lines").hasClass('active')){
            plot_type='line'
        }else if($("#plot_scatter").hasClass('active')){
            plot_type='scatter'
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

        var ret=[search_string, display_type, key, name, inst_type_filter, inst_filter, color_by, plot_type];

        return ret;
    }

function init_page_js(){
    $('#datepick1').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
    $('#datepick2').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
        var my_date=new Date();
        $('#inp_date_2').val(my_date.toISOString().substr(0,10));
        my_date.setYear(my_date.getFullYear()-1);
        $('#inp_date_1').val(my_date.toISOString().substr(0,10));
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
    $("#plot_type_buttons .btn").click(function(e){
        e.preventDefault();
        //datepicker messes up by adding eventlisteners to all buttons.
        e.stopImmediatePropagation()
        $("#plot_type_buttons .btn").removeClass('active');
        $(this).addClass("active");
        refresh_plot();
    });
    $("#key_select_form").change(function(e){
        e.preventDefault();
        e.stopImmediatePropagation()
        refresh_plot();
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

function update_months_list(){
    window.current_months_list=[];
    for (d in window.current_plot_data){
        if (window.current_months_list.indexOf(window.current_plot_data[d].id.substr(0,4)) == -1){
            window.current_months_list.push(window.current_plot_data[d].id.substr(0,4));
        }
    }
}
function update_color_schemes(){
    var inst_type_cs=chroma.scale(['#90ee90','#7866df','#ad00af','#ff0000']).domain([0, 3]);
    var inst_cs=chroma.scale(['lightgreen', 'blue', 'red']).domain([0, window.current_instrument_list.length-1]);
    var chem_cs = chroma.scale(['#ff00ae', '#0080ff', '#11ad11', '#ffb700', '#8400ff', '#00b7d4', '#a34929', '#a84da8', '#575757', '#0300bf']).domain([0, 9])
    var month_cs=chroma.scale(['yellow', 'lightblue', 'pink', 'orange']).domain([0,window.current_months_list.length-1]);
    window.current_color_schemes=[inst_type_cs, inst_cs, chem_cs, month_cs];
}
function update_chemistries_list(){
    window.current_chemistries_list=[];
    var version="";
    for (d in window.current_plot_data){
        if (window.current_plot_data[d].mode == '2'){
            // MiSeq Nano is special (cver collides with MiSeq Version 2)
            version = 'Mnano'
        } else {
            version = window.current_plot_data[d].instrument.substr(0,1) + window.current_plot_data[d].cver;
        };
        if ( window.current_chemistries_list.indexOf(version) == -1){
            window.current_chemistries_list.push(version);
        }
    }
    window.current_chemistries_list.sort();
}

function update_instrument_list(){
    window.current_instrument_list=[];
    for (d in window.current_plot_data){
        if (window.current_instrument_list.indexOf(window.current_plot_data[d].instrument) == -1){
            window.current_instrument_list.push(window.current_plot_data[d].instrument);
        }
    }
}
function update_instrument_filters(){
    var html='<label class="mb-2">Filter out instruments</label> <ul class="list-inline"> ';
    var html_hiseq='<label class="mb-2">Filter out old instruments</label> <ul class="list-inline"> ';
    var my_inst_id='';
    var my_inst_name='';
    var old_inst=['D00415', 'ST-E00269', 'ST-E00198', 'ST-E00201', 'D00410', 'ST-E00214', 'ST-E00266'];
    $.getJSON("/api/v1/instrument_names", function(data){
        for (i in window.current_instrument_list){
            my_inst_id=window.current_instrument_list[i];
      	    if (old_inst.indexOf(my_inst_id) == -1){
		            html+='<li class="filter_insts list-inline-item pl-1" id="inst_filter_'+my_inst_id+'"style="cursor:pointer;border-left: 5px solid '+color_by_instrument(my_inst_id)+';">';
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
            else {
		        html_hiseq+='<li class="filter_insts list-inline-item pl-1" id="inst_filter_'+my_inst_id+'"style="cursor:pointer;border-left: 5px solid '+color_by_instrument(my_inst_id)+';">';
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
                html_hiseq+=my_inst_name + "</li>";
                html_hiseq+=" ";
            }
	    }
        html+="</ul>";
        html_hiseq+="</ul>";
        if(html_hiseq.indexOf("</li>") >= 0){
            html+=html_hiseq
        }
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
