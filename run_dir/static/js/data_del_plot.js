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
    var toplot = {
        chart: {
            type: 'line',
            events: {
                render: function() {
                    let series = this.series
                    let sum = 0
                    for(let i = 0; i < series.length; i++) {
                        if(series[i].visible){
                        for(let j = 0; j < series[i].data.length; j++) {
                            sum += series[i].data[j].y
                            }
                        }
                    }
                    if (sum === 0) return '0 Bytes';
                    const k = 1024;
                    const dm = 2 < 0 ? 0 : 2;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                    const i = Math.floor(Math.log(sum) / Math.log(k));
                    var c_sum = parseFloat((sum / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
                this.setTitle({text: "File size of projects, sum in bytes: " + c_sum}, false, false) 
                }
            }
        },
        title: {
            text : name+' of projects'
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
            type: 'datetime',
            title : {
              text : 'Date delivered'
            },
            labels: {
               enabled: false
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
    serie = build_series(window.current_plot_data, key, name, view_type, filter_inst_type);
    toplot.series = serie[1];
    toplot.xAxis.categories = serie[0];
    $("#main_plot").highcharts(toplot);
    window.current_plot_obj = toplot; 
}

function build_series(data, key, name, view_type, filter_inst_type){
    var series = [];
    var bioinfo_link="/bioinfo";
    var view_color = "";
    var series_name = "";
    var categories = [];
    for (d in data){
        var bioinfo_link="/bioinfo/"+d; 
        var project_name = data[d].project_name;
        var date_del = data[d].delivered;
        if (data[d].platform == null){
            continue;
        }else if (data[d].platform.includes('NovaSeq') && filter_inst_type.includes('NovaSeq')){
            continue;
        }else if (data[d].platform.includes('MiSeq') && filter_inst_type.includes('MiSeq')){
            continue;
        }else if (data[d].platform.includes('NextSeq') && filter_inst_type.includes('NextSeq')){
            continue;
        }else if (data[d].platform.includes('HiSeq') && filter_inst_type.includes('HiSeq')){
            continue;
        }  
        if (view_type == 'platform'){
            if (data[d].platform.includes('NovaSeq')){
                series_name = "NovaSeq";
            }else if (data[d].platform.includes('MiSeq')){
                series_name = "MiSeq";
            }else if (data[d].platform.includes('NextSeq')){
                series_name = "NextSeq";
            }else{
                series_name = "HiSeq";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'app'){
            if (data[d].app.includes('RNA')){
                series_name = "RNA-Seq";
            }else if (data[d].app.includes('WG')){
                series_name = "WG-reseq"; 
            }else if (data[d].app.includes('Target')){
                series_name = "Target-reseq"; 
            }else if (data[d].app.includes('Metagenomics')){
                series_name = "Metagenomics";
            }else if (data[d].app.includes('novo')){
                series_name = "de novo";
            }else if (data[d].app.includes('Epigenetics')){
                series_name = "Epigenetics";
            }else{
                series_name = "Other/undefined";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'typ'){
            if (data[d].typ == null){
                series_name = "Other/undefined";
            }else{
                series_name = data[d].typ;
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'delivery'){
            if (data[d].delivery == null){
                series_name = "Other/undefined";
            }else{
                series_name = data[d].delivery;
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'sample'){
            if (data[d].sample.includes('Finished')){
                series_name = "Finished Library";
            }else if (data[d].sample.includes('total')){
                series_name = "total RNA";
            }else if (data[d].sample.includes('Tissue')){
                series_name = "Tissue";
            }else if (data[d].sample.includes('Genomic')){
                series_name = "Genomic DNA";
            }else if (data[d].sample.includes('Amplicon')){
                series_name = "Amplicon";
            }else{
                series_name = "Other/undefined";
            }
            view_color = view_coloring(series_name);
        }else if (view_type == 'bp'){
            if (data[d].bp == 'Yes'){
                series_name = "BP bioinformatics";
            }else if (data[d].bp == 'No'){
                series_name = "No BP";
            }else if (data[d].bp == 'Special'){
                series_name = "Special";
            }else{
                series_name = "Other/undefined";
            }
            view_color = view_coloring(series_name);
            }
        if (!series.hasOwnProperty(series_name)){
            series[series_name] = {
                step: true,
                name: series_name,
                color: view_color,
                data: [],
            };
            series.length += 1; 
        }else{ 
            dp = {
                y: data[d][key],
                name: project_name + ': ' + "<i>" + date_del + "</i>",
                ownURL: bioinfo_link
            };
            series[series_name].data.push(dp);
            categories.push(date_del);
      }
      var proper_series = []
      for (s in series) {
          proper_series.push(series[s]);
      }
    }
  return [categories, proper_series];
}

function get_plot_data(key, name, view_type, search_string="", filter_inst_type){
    $.getJSON('/api/v1/proj_staged/'+search_string, function(data) {
        window.current_plot_data=data;
        update_color_schemes(data);
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
            return current_color_schemes[0].hex();
        case "All projects":
        case "MiSeq":
        case "WG-reseq":
        case "Application":
        case "total RNA":
        case "No BP":
            return current_color_schemes[1].hex();
        case "NextSeq":
        case "GRUS":
        case "Target-reseq":
        case "Tissue":
        case "Special":
            return current_color_schemes[2].hex();
        case "Metagenomics":
        case "Genomic DNA":
            return current_color_schemes[3].hex();
        case "de novo":
            return current_color_schemes[4].hex();
        case "Epigenetics":
        case "Production":
            return current_color_schemes[5].hex();
        case "Amplicon":
            return current_color_schemes[6].hex();
        default:
            return "#c3c3c3";
    }
}
//For the filesize summarization.
function sum(object, key) {
    return Object.entries(object).reduce((s, [k, v]) => {
        if (v && typeof v === 'object') return s + sum(v, key);
        return s;
    }, key in object ? object[key] : 0);
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
    key = 'filesize';
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

function update_color_schemes(){
    var pink = chroma('hotpink');
    var blue = chroma('blue');
    var green = chroma('green');
    var orange = chroma('orange');
    var purple = chroma('purple');
    var red = chroma('red');
    var turquoise = chroma('turquoise');
    window.current_color_schemes = [pink, blue, green, orange, purple, red, turquoise];
}
