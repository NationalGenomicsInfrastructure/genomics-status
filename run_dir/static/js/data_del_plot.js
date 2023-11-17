window.current_plot_data = null;
window.current_plot_obj = null;
window.current_view_schemes = null;

$(function(){
    init_page_js();
});

function refresh_plot(){
    var params = get_parameters();
    if (window.current_plot_data == null){
        get_plot_data(key=params[0], name=params[1], view_type=params[2], search_string=params[3], inst_type_filter=params[4]);
    }else{
        make_plot(key=params[0], name=params[1], view_type=params[2], inst_type_filter=params[4]);
    }
}

function make_plot(key, name, view_type, filter_inst_type){

    function formatBytes(bytes){
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    function sumFilesize(series){
        sum = 0
        for (let i = 0; i < series.length; i++){
            if (series[i].visible){
                for (let j = 0; j < series[i].data.length; j++){
                    sum += series[i].data[j].y
                }
            }
        }
        return formatBytes(sum);
    }

    var toplot = {
        chart: {
            type: 'scatter',
            events: {
                render: function(){
                    this.setTitle({text: "File size of projects: " + sumFilesize(this.series)}, false, false)
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
        credits: {
            enabled: false
        },
        xAxis: {
            type: 'category',
            labels: {
                enabled: false,
            },
            title : {
                text: 'Close Date'
            },
            categories: []
        },
        series: [{
            name: name,
            data: []
        }],
        title: {
            text: function() { return name+' of projects, sum in bytes: ' +  sumFilesize(series, data, true); }
        },
        tooltip: {
            shared: true,
            useHTML: true,
            headerFormat: '<span style="color:{point.color}">\u25CF</span><small>{point.key}</small><br />',
            pointFormatter: function () { return this.series.name + ', ' + this.pm + ': ' + '<b>' + formatBytes(this.y, true) + '</b>'},
        },
        exporting: {
            csv: {
                itemDelimiter: ';'
            }
        }
    };
    serie = build_series(window.current_plot_data, key, name, view_type, filter_inst_type);
    toplot.series = serie[1];
    toplot.xAxis.categories = serie[0];
    $("#main_plot").highcharts(toplot);
    window.current_plot_obj = toplot;
}

function build_series(data, key, name, view_type, filter_inst_type){
    var series = [];
    var view_color = "";
    var series_name = "";
    var categories = [];
    for (d in data){
        var bioinfo_link="/bioinfo/"+data[d][0];
        var project_name = data[d][1].project_name;
        var date_close = data[d][1].close_date;
        sequencing_platforms = ['NovaSeq', 'MiSeq', 'NextSeq', 'HiSeq'];	
	    if (data[d][1].sequencing_platform == null && filter_inst_type.length > 0){
	        continue;
	    }
	    for (var p in sequencing_platforms){
	        if (data[d][1].sequencing_platform !== undefined && data[d][1].sequencing_platform.includes(p) && filter_inst_type.includes(p)){
	            continue;
	        }
	    }
        if (data[d][1].sequencing_platform == null){
            continue;
        }else if (data[d][1].sequencing_platform.includes('NovaSeq') && filter_inst_type.includes('NovaSeq')){
            continue;
        }else if (data[d][1].sequencing_platform.includes('MiSeq') && filter_inst_type.includes('MiSeq')){
            continue;
        }else if (data[d][1].sequencing_platform.includes('NextSeq') && filter_inst_type.includes('NextSeq')){
            continue;
        }else if (data[d][1].sequencing_platform.includes('HiSeq') && filter_inst_type.includes('HiSeq')){
            continue;
        }  
        if (view_type == 'sequencing_platform'){
            if (data[d][1].sequencing_platform == null){
                series_name = "Other/undefined";
            }else if (data[d][1].sequencing_platform.includes('NovaSeq')){
                series_name = "NovaSeq";
            }else if (data[d][1].sequencing_platform.includes('MiSeq')){
                series_name = "MiSeq";
            }else if (data[d][1].sequencing_platform.includes('NextSeq')){
                series_name = "NextSeq";
            }else{
                series_name = "HiSeq";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'application'){
            if (data[d][1].application == null){
                series_name = "Other/undefined";
            }else if (data[d][1].application.includes('RNA')){
                series_name = "RNA-Seq";
            }else if (data[d][1].application.includes('WG')){
                series_name = "WG-reseq"; 
            }else if (data[d][1].application.includes('Target')){
                series_name = "Target-reseq"; 
            }else if (data[d][1].application.includes('Metagenomics')){
                series_name = "Metagenomics";
            }else if (data[d][1].application.includes('novo')){
                series_name = "de novo";
            }else if (data[d][1].application.includes('Epigenetics')){
                series_name = "Epigenetics";
            }else{
                series_name = "Other/undefined";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'type'){
            if (data[d][1].type == null){
                series_name = "Other/undefined";
            }else{
                series_name = data[d][1].type;
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'delivery_type'){
            if (data[d][1].delivery_type == null){
                series_name = "Other/undefined";
            }else if (data[d][1].delivery_type == "HDD with raw data"){
                series_name = "HDD";
            }else if (data[d][1].delivery_type == "GRUS with raw data"){
                series_name = "GRUS";
            }else if (data[d][1].delivery_type == "In-house"){
                series_name = "In-house";
            }else{
                series_name = data[d][1].delivery_type;
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'sample_type'){
            if (data[d][1].sample_type == null){
                series_name = "Other/undefined";
            }else if (data[d][1].sample_type.includes('Finished')){
                series_name = "Finished Library";
            }else if (data[d][1].sample_type.includes('total')){
                series_name = "total RNA";
            }else if (data[d][1].sample_type.includes('Tissue')){
                series_name = "Tissue";
            }else if (data[d][1].sample_type.includes('Genomic')){
                series_name = "Genomic DNA";
            }else if (data[d][1].sample_type.includes('Amplicon')){
                series_name = "Amplicon";
            }else{
                series_name = "Other/undefined";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'best_practice_bioinformatics'){
            if (data[d][1].best_practice_bioinformatics == null){
                series_name = "Other/undefined";
            }else if (data[d][1].best_practice_bioinformatics == 'Yes'){
                series_name = "BP bioinformatics";
            }else if (data[d][1].best_practice_bioinformatics == 'No'){
                series_name = "No BP bioinformatics";
            }else if (data[d][1].best_practice_bioinformatics == 'Special'){
                series_name = "Special";
            }else{
                series_name = "Other/undefined";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'reference_genome'){
            if (data[d][1].reference_genome == null){
                series_name = "Other";
            }else if (data[d][1].reference_genome.includes('Human')){
                series_name = "Human";
            }else {
                series_name = "Other";
            }
            view_color = view_coloring(series_name);
        }
        if (!series.hasOwnProperty(series_name)){
            series[series_name] = {
                name: series_name,
                color: view_color,
                data: [],
            };
            series.length += 1;
        }
        dp = {
            y: data[d][1][key],
            name: date_close,
            pm: project_name,
            ownURL: bioinfo_link
        };
        series[series_name].data.push(dp);
        categories.push(date_close);
        // Hackery to get a proper JS array for HCharts
        var proper_series = Object.values(series)
    }
    return [categories, proper_series];
}

function get_plot_data(key, name, view_type, search_string="", filter_inst_type){
    $.getJSON('/api/v1/proj_staged/'+search_string, function(data) {
        window.current_plot_data=data;
        make_plot(key, name, view_type, filter_inst_type);
    });
}
//Since we have been confused by the coloring in the past, I set a few default colors to re-use for simplicity.
function view_coloring(series_name){
    switch(series_name){
        case "NovaSeq":
        case "HDD":
        case "RNA-Seq":
        case "Finished Library":
        case "BP bioinformatics":
            return chroma('hotpink').hex();
        case "All projects":
        case "MiSeq":
        case "WG-reseq":
        case "Application":
        case "total RNA":
        case "No BP bioinformatics":
        case "In-house":
            return chroma('blue').hex();
        case "NextSeq":
        case "GRUS":
        case "Target-reseq":
        case "Tissue":
        case "Special":
            return chroma('green').hex();
        case "Metagenomics":
        case "Genomic DNA":
            return chroma('orange').hex();
        case "de novo":
            return chroma('purple').hex();
        case "Epigenetics":
        case "Production":
            return chroma('#CD3E10').hex();
        case "Amplicon":
            return chroma('turquoise').hex();
        case "Human":
            return chroma('#CD3E10').hex();
        default:
            return "#ace600";
    }
}
function get_parameters(){
    var search_string;
    var m_d_y;
    var first_half;
    var first_date;
    var second_half;
    var second_date;
    var dp=$('#inp_date_1').val();
    if (dp != ''){
        first_half = dp;
    }else{
        first_date=new Date();
        first_date.setYear(first_date.getYear()-1);
        first_half=first_date.toISOString() + first_date.toISOString().substr(5,2) + first_date.toISOString().substr(8,2);
    }
    dp=$('#inp_date_2').val();
    if (dp != ''){
        second_half = dp;
    }else{
        second_date=new Date();
        second_half=second_date.toISOString() + second_date.toISOString().substr(5,2) + second_date.toISOString().substr(8,2);
    }
    search_string = first_half + '--' + second_half;

    //The key could also be set as a variable.
    key = 'filesize_in_bytes';
    name = 'File size';
    var view_type = $("#view_select option:selected").val();
    var inst_type_filter=[];
    $(".filter_inst_type").each(function(){
        if (!$(this).prop("checked")){
            inst_type_filter.push($(this).val());
        }
    });

    var types = [key, name, view_type, search_string, inst_type_filter];
    return types;
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
    $("#key_select_form").change(function(e){
        e.preventDefault();
        e.stopImmediatePropagation()
        refresh_plot();
    });
    $(".filter_inst_type").change(function(e){
        e.stopImmediatePropagation()
        refresh_plot();
    });
    $("#view_select").change(function(e){
        e.stopImmediatePropagation()
        refresh_plot();
    });
    refresh_plot();
}

