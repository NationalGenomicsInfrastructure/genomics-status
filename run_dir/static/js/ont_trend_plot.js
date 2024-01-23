window.current_plot_data=null;
window.current_plot_obj=null;
window.current_color_schemes=null;
window.current_instrument_list=null;
window.current_flowcells_list=null;
window.current_months_list=null;

$(function(){
    init_page_js();
});

function refresh_plot(){
    var params=get_parameters();
    if (window.current_plot_data==null){
        get_plot_data(search_string = params[0], key = params[1], name = params[2], filter_inst_type  =params[3], color_type = params[4], plot_type = params[5]);
    }else{
        get_plot_data(search_string = params[0], key = params[1], name = params[2], filter_inst_type = params[3], color_type = params[4], plot_type = params[5]);
        make_plot(key = params[1], name = params[2], filter_inst_type = params[3], color_type = params[4], plot_type = params[4]);
    }

}

function make_plot(key, name, filter_inst_type, color_type, plot_type){
    function sum_values(series) {
        sum = 0
        for (let i = 0; i < series.length; i++){
            if (series[i].visible){
                for (let j = 0; j < series[i].data.length; j++){
                    const y_val = series[i].data[j].y;
                    if (!isNaN(y_val) && isFinite(y_val)) {
                        sum += y_val;
                    }
                }
            }
        }
        return format_value(sum);
    }
    function format_value(value) {
        if (value === 0) return '0 ' + name;
        const k = 1000;
        const sizes = [name, 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
        const i = Math.floor(Math.log(value) / Math.log(k));
        return parseFloat((value / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    var toplot={
        chart: {
            type: plot_type,
            events: {
                render: function(){
                    this.setTitle({ text: 'Accumulated ' + name.trim() + ': ' + sum_values(this.series)}, true);
                }
            }
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
            useHTML: true
        },
        credits: {
            enabled : false
        },
        xAxis: {
            type: 'datetime',
            labels: {
                enabled: true,
                formatter: function() {
                    return Highcharts.dateFormat('%Y-%m-%d', this.value);
                },
                rotation: -45
            },
            tickInterval: 10 * 24 * 3600 * 1000,
            categories: []
        },
        time: {
            timezone: 'Europe/Stockholm',
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

    if (key == "basecalled_pass_bases") {
        toplot.tooltip.formatter = function () {
                const name = this.point.name;
                const color = this.point.color;
                const series_name = this.series.name || '';
                const y_value = typeof this.y !== 'undefined' ? this.y : '';
                const passed_reads = typeof this.point.passed_reads !== 'undefined' ? format_value(this.point.passed_reads) : '';
                const sample_name = this.point.sample_name || '';
    
                return `<span style="color: ${color}">\u25CF</span><small>${name}</small><br />
                    <b>${series_name}</b>: ${y_value}<br>
                    <b>Basecalled Pass Read Count:</b> ${passed_reads}<br>
                    <b>Sample Name:</b> ${sample_name}`;
        }
    }

    if (key == "basecalled_pass_read_count") {
        toplot.tooltip.formatter = function () {
            const name = this.point.name;
            const color = this.point.color;
            const series_name = this.series.name || '';
            const y_value = typeof this.y !== 'undefined' ? this.y : '';
            const passed_bases = typeof this.point.passed_bases !== 'undefined' ? format_value(this.point.passed_bases) : '';
            const sample_name = this.point.sample_name || '';

            return `<span style="color: ${color}">\u25CF</span><small>${name}</small><br />
                <b>${series_name}</b>: ${y_value}<br>
                <b>Basecalled Pass Base Count:</b> ${passed_bases}<br>
                <b>Sample Name:</b> ${sample_name}`;
        }
    }

    var serie = build_series(window.current_plot_data, key, name, color_type, filter_inst_type);
    toplot.series = serie[1];
    toplot.xAxis.categories = serie[0];
    $("#ont_main_plot").highcharts(toplot);
    window.current_plot_obj = toplot;
}   

function build_series(data, key, name, color_type, filter_inst_type){
    var series = [];
    var flowcell_link="/flowcells_ont";
    var categories = [];
    for (d in data){
        var tmp=data[d].TACA_run_path.split('/');
        var fcid=tmp[2];
        var col_color = "";
        var series_name = "";
        var flowcell_link="/flowcells_ont/"+fcid;
        var passed_reads = parseInt(data[d].basecalled_pass_read_count);
        var passed_bases = parseInt(data[d].basecalled_pass_bases);
        var fc_type = data[d].flow_cell_type;
        var instrument = data[d].instrument;
        var sample_name = data[d].sample_name;
        //Instrument filter for MN19414 and PromethION
        if (typeof instrument === 'string' && filter_inst_type && ((instrument.indexOf('M') !== -1 
            && filter_inst_type.includes('M')) || (instrument.indexOf('P') !== -1 && filter_inst_type.includes('P')))) {
            continue;
        }
        //Add series names for default flowcell type view, color by month and instrument
        switch (color_type) {
            case 'fcver':
                if (fc_type){
                    if (fc_type.includes('FLG001')){
                        series_name = "FLO-FLG001";
                    }
                    if (fc_type.includes('FLG114')){
                        series_name = "FLO-FLG114";
                    }
                    if (fc_type.includes('PRO002')){
                        series_name = "FLO-PRO002";
                    }
                    if (fc_type.includes('PRO114M')){
                        series_name = "FLO-PRO114M";
                    }else{
                        series_name = fc_type;
                        col_color = color_by_flowcell(fc_type);
                    }
                }else{
                    continue;
                }
                break;
            case 'month':
                series_name = fcid.substr(2,4);
                col_color = color_by_month(series_name);
                break;
            default:
                if (instrument){
                    col_color=color_by_type(instrument);
                    if (instrument.indexOf('P') != -1){
                        series_name = "PromethION 24";
                    }else if (instrument.indexOf('M') != -1){
                        series_name = "MN19414";
                    }else{
                        series_name = "Undefined series";
                    }
                }else{
                    continue;
                }
                break;
        }
        //Create series
        if (!series.hasOwnProperty(series_name)) {
            series[series_name] = {
                step: true,
                name: series_name,
                color: col_color,
                data: [],
            };
            series.length += 1;
        }
        if (key == 'basecalled_pass_bases'){//Base display
            dp = {
                x: Date.parse(x_axis_date),
                y: passed_bases,
                name: fcid,
                ownURL: flowcell_link,
                passed_reads: passed_reads,
                sample_name: sample_name
            };
        }else{//Read display
            dp = {
                x: Date.parse(x_axis_date),
                y: passed_reads,
                name: fcid,
                ownURL: flowcell_link,
                passed_bases: passed_bases,
                sample_name: sample_name
            };
        }
        series[series_name].data.push(dp);
        var x_axis_date = fcid.substr(0, 4) + '-' + fcid.substr(4, 2) + '-' + fcid.substr(6, 2);
        categories.push(x_axis_date);
        // Stupid hackery to get a proper JS array for HCharts
        var proper_series = []
        for (s in series) {
            proper_series.push(series[s]);
        }
    }
    return [categories, proper_series];
}

function get_plot_data(search_string="", key, name, filter_inst_type, color_type, plot_type){
        //Show loading screen before api call
        show_loading();
        $.getJSON('/api/v1/ont_plot/'+search_string, function(data) {
            //Hide screen when data loaded
            hide_loading();
            //Update plot data
            window.current_plot_data=data;
            //Update flowcell type list
            update_flowcells_list();
            //Update months list
            update_months_list();
            //Update color schemes
            update_color_schemes(data);
             //Update instrument list
            update_instrument_list();
            //Plot the data
            make_plot(key, name, filter_inst_type, color_type, plot_type);
        });
}
//Color by instrument
function color_by_type(instrument){
    if (instrument.indexOf('P') != -1){
        return current_color_schemes[0](0).hex();
    }else if (instrument.indexOf('M') != -1){
        return current_color_schemes[0](1).hex();
    }else{
        return "#c3c3c3";
    }
}
//Color by month
function color_by_month(fcid){
    return window.current_color_schemes[2](window.current_months_list.indexOf(fcid.substr(0,4))).hex();
}
//Color by flowcell type
function color_by_flowcell(series_name){
    if (series_name == 'FLO-FLG001'){
        return current_color_schemes[1](0).hex();
    }else if (series_name == 'FLO-PRO002'){
        return current_color_schemes[1](1).hex();
    }else if (series_name == 'FLO-PRO114M'){
        return current_color_schemes[1](2).hex();
    }else{
        return current_color_schemes[1](3).hex();
    }
}

function get_parameters(){
    //First, the search string
    var search_string;
    var m_d_y;
    var first_half;
    var first_date;
    var second_half;
    var second_date;
    var dp=$('#ont_inp_date_1').val();
    if (dp != ''){
        y_m_d=dp.split('-');
        first_half=y_m_d[0].substr(2,2) + y_m_d[1] + y_m_d[2];
    }else{
        first_date=new Date();
        first_date.setYear(first_date.getYear()-1);
        first_half=first_date.toISOString().substr(2,2) + first_date.toISOString().substr(5,2) + first_date.toISOString().substr(8,2);
    }
    dp=$('#ont_inp_date_2').val();
    if (dp != ''){
        y_m_d=dp.split('-');
        second_half=y_m_d[0].substr(2,2) + y_m_d[1] + y_m_d[2];
    }else{
        second_date=new Date();
        second_half=second_date.toISOString().substr(2,2) + second_date.toISOString().substr(5,2) + second_date.toISOString().substr(8,2);
    }
    search_string=first_half + '-' + second_half;

    var plot_type;
    if ($("#plot_lines").hasClass('active')){
        plot_type='line'
    }else if($("#plot_scatter").hasClass('active')){
        plot_type='scatter'
    }

    //then, the key and name to display
    var key = $( "#key_select_form option:selected" ).val();
    var name = $( "#key_select_form option:selected" ).text();

    //The instrument type filter
    var filter_inst_type=[];
    $(".filter_inst_type").each(function(){
        if (! $(this).prop("checked")){
            filter_inst_type.push($(this).val());
        }
    });
    //Color type
    var color_by=$("#color_select option:selected").val();

    var ret=[search_string, key, name, filter_inst_type, color_by, plot_type];

    return ret;
}

function init_page_js(){
    $('#ont_datepick1').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
    $('#ont_datepick2').datepicker({autoclose: true,
    format: 'yyyy-mm-dd',
    todayBtn: true,
    todayHighlight: true,
    weekStart: 1,
    daysOfWeekHighlighted: "0,6" });
        var my_date=new Date();
        $('#ont_inp_date_2').val(my_date.toISOString().substr(0,10));
        my_date.setYear(my_date.getFullYear()-1);
        $('#ont_inp_date_1').val(my_date.toISOString().substr(0,10));
    $('#submit_interval').click(function(e){
        e.preventDefault();
        window.current_plot_data=null;
        refresh_plot();
    });
    $("#plot_type_buttons .btn").click(function(e){
        e.preventDefault();
        //Datepicker messes up by adding eventlisteners to all buttons
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
//Update months data
function update_months_list(){
    window.current_months_list=[];
    for (d in window.current_plot_data){
        if (window.current_plot_data[d].read_count){
            var path = window.current_plot_data[d].TACA_run_path.split('/');
            var fcid = path[2];
            if (window.current_months_list.indexOf(fcid.substr(2,4)) == -1){
                window.current_months_list.push(fcid.substr(2,4));
            }
        }
    }
}
//Add colors to series
function update_color_schemes(){
    var inst_type_cs = chroma.scale(['#00cccc','#7866df']).domain([0, 1]);
    var chem_cs = chroma.scale(['#11ad11', '#ff00ae', '#0052cc', '#ffb700']).domain([0, 3]);
    var month_cs = chroma.scale(['yellow', 'lightblue', 'pink', 'orange']).domain([0, window.current_months_list.length-1]);
    window.current_color_schemes=[inst_type_cs, chem_cs, month_cs];
}
//Update flowcell types list
function update_flowcells_list(){
    window.current_flowcells_list=[];
    var version="";
    for (d in window.current_plot_data){
        if (window.current_plot_data[d].flow_cell_type){
            var id = window.current_flowcells_list.indexOf(version);
            version = window.current_plot_data[d].flow_cell_type;
        }else{
            var id = window.current_flowcells_list.indexOf(version);
            version = "Undefined FC type";
        }
        if ( window.current_flowcells_list.indexOf(version) == -1){
            window.current_flowcells_list.push(version);
        }
    }
    window.current_flowcells_list.sort();
}
//Update instrument data
function update_instrument_list(){
    window.current_instrument_list=[];
    for (d in window.current_plot_data){
        if (window.current_instrument_list.indexOf(window.current_plot_data[d].instrument) == -1){
            window.current_instrument_list.push(window.current_plot_data[d].instrument);
        }
    }
}

//Show loading spinner screen
function show_loading() {
    $("#loading").show();
}

//Hide loading spinner screen
function hide_loading() {
    $("#loading").hide();
}
