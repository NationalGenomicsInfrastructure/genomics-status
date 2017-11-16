window.the_second_coming_of_jesus=null;
window.current_plot_data=null;
window.current_plot_obj=null;
window.current_instrument_list=null;
window.current_instrument_types={"Hiseq":[],"Miseq":[],"HiseqX":[]};

$(function(){
    init_page_js();
});

function obtain_data(start_date, end_date, group_level, display_type){
     get_plot_data(start_date, end_date, group_level, display_type).then(function(data){return get_instrument_lists(data)});

}
function refresh_plot(){
    var params=get_parameters();
    get_plot_data(start_date=params[0], end_date=params[1], group_level=params[2], display_type=params[3]).done(function(data){
     get_instrument_lists(data).done(function(data){
         make_plot(start_date=params[0], end_date=params[1], group_level=params[2], display_type=params[3])})
    });
}
function make_plot(start_date, end_date, group_level,display_type){
    var x_title = null;
    var time_labels = null;
    var x_date_format = null;
    switch(group_level){
      case 2:
          x_title = "Year";
          time_labels={millisecond: '%Y'};
          x_date_format = '%Y';
          break;
      case 3:
          x_title = "Month";
          time_labels={month: '%Y-%m'};
          x_date_format = '%Y-%m';
          break;
      case 5:
          x_title = "Day";
          time_labels={month: '%Y-%m-%d'};
          x_date_format = '%Y-%m-%d';
          break;
      default:
          x_title = "Week Number";
          time_labels={month: '%Y-%m'};
          x_date_format = '%Y-%m-%d';
          break;
    }
    var toplot={
        chart: {
            type : 'bar'
        },
        title: { 
            text : ' Number of the flowcells per '+display_type
        },
        legend : {
             layout: 'vertical',
             align: 'right',
             verticalAlign: 'middle'
        },
        yAxis: {
            min : 0, 
            title: "Number of flowcells"
        },
        plotOptions : {
            series : {
                stacking:'normal',
                turboThreshold: 0
            },

        },
        tooltip: {
            useHTML: true,
            headerFormat: '<span style="color:{point.color}">\u25CF</span><small>{series.name}</small><br />{point.key}',
            pointFormat: ': <b>{point.y}</b>',
            xDateFormat: x_date_format
        },
        credits: {
            enabled : false
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats:time_labels, 
            title : x_title,
        },
        series: [{
            name : name,
            data:[]
        }],
    };
    if (display_type == "instrument"){
      series=build_instrument_series(start_date, end_date, group_level);
    }else{
      series=build_type_series(start_date, end_date, group_level);
    }
    toplot.series=series;
    $("#main_plot").highcharts(toplot);
    window.current_plot_obj=toplot;
}
function build_type_series(start_date, end_date, group_level){
    var data=window.current_plot_data;
    var categories=[];
    var series=[];
    var holder={'Hiseq':{}, 'Miseq':{}, 'HiseqX':{}, 'NovaSeq':{}}
    var key = null;
  for (d in data){
      try {
          key = get_date_key(data[d], group_level);
          holder_object = holder[window.current_instrument_types[data[d][0]]];
          if (key in holder_object){
              holder_object[key]= holder_object[key] + data[d][group_level];
          }else{
              holder_object[key]= data[d][group_level];
          }
      }
      catch(err) {
          console.log(err);
      }
    }
    var series = [];
    if (Object.keys(holder.Hiseq).length !== 0 && holder.Hiseq.constructor === Object){
    series.push({'name':'Hiseq', data:build_points(holder.Hiseq), marker:{enabled : true}});
    }
    if (Object.keys(holder.Miseq).length !== 0 && holder.Miseq.constructor === Object){
    series.push({'name':'Miseq', data:build_points(holder.Miseq), marker:{enabled : true}});
    }
    if (Object.keys(holder.HiseqX).length !== 0 && holder.HiseqX.constructor === Object){
    series.push({'name':'HiseqX', data:build_points(holder.HiseqX), marker:{enabled : true}});
    }
    if (Object.keys(holder.NovaSeq).length !== 0 && holder.NovaSeq.constructor === Object){
    series.push({'name':'NovaSeq', data:build_points(holder.NovaSeq), marker:{enabled : true}});
    }
    return series;
}
function compare_points(a,b){
    return a.x-b.x;
}
function build_points(obj){
    points=[];
    for (key in obj){
        points.push({y:obj[key], x:parseInt(key,10)});
    }
    points.sort(compare_points);
    return points;

}
function get_date_key(row, group_level){
    var key = null;
    if (group_level == 5){
        key = new Date(parseInt(row[1],10), parseInt(row[2],10)-1, parseInt(row[4],10));
    }else if (group_level == 3 ){
        key = new Date(parseInt(row[1],10), parseInt(row[2],10)-1, 2);
    }else if (group_level == 2 ){
        key = new Date(parseInt(row[1],10),1,1);
    }else{
        var day = (1 + (parseInt(row[3],10) - 1) * 7);
        key = new Date(parseInt(row[1],10), 0, day);
        var dow = key.getDay();
        if (dow <= 4){
            key.setDate(key.getDate() - key.getDay() +1);
        }else{
            key.setDate(key.getDate() - key.getDay() +8);
        }
    }
    return key.getTime();
}
function build_instrument_series(start_date, end_date, group_level){
    data = window.current_plot_data;
    var series=[];
    var holder={}
    var key = null;
    for (d in data){
        key = get_date_key(data[d], group_level);
        instrument_name = window.current_instrument_list[data[d][0]];
        if (instrument_name == undefined){
            instrument_name = data[d][0];
            console.log("Please update the instruments database with " +data[d][0]);
        }

        if (!(instrument_name in holder)){
        holder[instrument_name] = [];
        }
        holder[instrument_name].push({y:data[d][group_level], x:key});
    }
    for (r in holder){
        holder[r].sort(compare_points);
        series.push({'name':r, data:holder[r]})
    }
    return series;
}

function get_plot_data(start_date, end_date, group_level, display_type){
            return $.getJSON('/api/v1/flowcell_count/?group_level='+group_level+'&start_date='+start_date+'&end_date='+end_date+'&display_type='+display_type, function(data) {
                window.current_plot_data=data;
                return data
            });
}

function get_parameters(){
     var first_half;
     var first_date;
     var second_half;
     var second_date;
     var dp=$('#inp_date_1').val();
     if (dp != ''){
         start_date=dp;
     }else{
         first_date=new Date();
         first_date.setYear(first_date.getYear()-1);
         start_date=first_date.toISOString().substr(0,10);
     }
     dp=$('#inp_date_2').val();
     if (dp != ''){
         end_date=dp;
     }else{
        second_date=new Date();
        end_date=second_date.toISOString().substr(0,10);
     }

     //then, the display type 
     var display_type;
     var display_type = $( "#display_select option:selected" ).val();
     var group_level = parseInt($( "#display_time_select option:selected" ).val(),10);

     var ret=[start_date, end_date, group_level, display_type];

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
    $("#display_select_form").change(function(e){
        e.preventDefault();
        e.stopImmediatePropagation()
        refresh_plot();
        
    });
    refresh_plot();
}

function get_instrument_lists(plot_data){
        return $.getJSON("/api/v1/instrument_names", function(data){
            current_instrument_list = {};
            current_instrument_types={};
            for (d in plot_data){
                if (!(plot_data[d][0] in current_instrument_list)){
                    for (r in data){
                      if (data[r].key == plot_data[d][0]){
                        current_instrument_list[plot_data[d][0]]=data[r].value;
                      }
                    }
                }
                if (plot_data[d][0].indexOf("D") != -1){
                    current_instrument_types[plot_data[d][0]] = 'Hiseq';
                }
                else if (plot_data[d][0].indexOf("M") != -1){
                    current_instrument_types[plot_data[d][0]] = 'Miseq';
                }
                else if (plot_data[d][0].indexOf("E") != -1){
                    current_instrument_types[plot_data[d][0]] = 'HiseqX';
                }
                else if (plot_data[d][0].indexOf("E") != -1){
                    current_instrument_types[plot_data[d][0]] = 'NovaSeq';
                }
            }
        window.current_instrument_list=current_instrument_list;
        window.current_instrument_types=current_instrument_types;
        return [current_instrument_list, current_instrument_types]
        });
}
