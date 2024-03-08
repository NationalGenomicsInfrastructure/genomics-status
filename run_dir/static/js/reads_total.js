
// Used by reads_total.html

function plot_summary_chart(data, sample_names){
    $('#reads_total_summary_chart').highcharts({
        credits:{enabled: false},
        chart: { type: 'column' },
        title: { text: 'Sample Read Counts' },
        subtitle: { text: 'Click a bar to see that sample' },
        xAxis: { categories: sample_names },
        yAxis: {
            min: 0,
            title: { text: '# Clusters' },
            reversedStacks: false
        },
        plotOptions: {
            column: { stacking: 'normal',
                        borderWidth: 0,
                        groupPadding: 0.1
                    },
            series: {
                cursor: 'pointer',
                point: { events: { click: function () {
                    $('.sample_table').removeClass('highlighted');
                    $('#'+this.category).addClass('highlighted');
                    location.href = '#'+this.category;
                } } }
            }
        },
        series: data
    });
}

function create_summary_table(ar_s, ar_c){
    var tbl = '<table class="table table-hover"><tr class="darkth"><th>Sample</th><th>Clusters</th></tr>';
    var sum = 0;
    var num_samples = 0;
    for (index in ar_s){
        sum += ar_c[index];
        num_samples += 1;
        tbl += '<tr><td><a href="#'+ar_s[index]+'" class="plink text-decoration-none">'+ar_s[index]+'</a></td><td class="text-right thousands">'+ar_c[index]+'</td></tr>';
    }
    tbl+='<tr class="darkth"><th>Total ('+num_samples+' samples)</th><th class="text-right thousands">'+ sum +'</th></tr>';
    tbl+="<table>";
    $('#summary_table').html(tbl);

}
function update_all_totals(){
    var ar_samples = Array();
    var ar_clusters = Array();
    var data = [
        { name: 'q30&gt;threshold', data: [], color: '#78b560'},
        { name: 'q30&lt;threshold', data: [], color: '#e8cd4c'},
        { name: 'Not Selected', data: [], color: '#dddddd' }
    ];
    $(".reads_table").each(function(){
        var checked = 0;
        var unchecked = 0;
        var w_q30 = 0;
        var s_name = $(this).find(".sample_name").text();
        var threshold = parseInt($(this).find(".threshold").text());
        $(this).find(".reads_data").each(function(){
            var count = parseInt($(this).find(".clusters").text());
            if ($(this).find(".reads_check").prop("checked") == true){
                w_q30 += parseFloat($(this).find(".myq30").text()) * count ;
                checked += count;
            } else {
                unchecked += count;
            }
        });
        if (checked > 0 ){
            w_q30 = w_q30 / checked;
        }else{
            w_q30 = -1;
        }
        ar_samples.push(s_name);
        ar_clusters.push(checked);
        if (w_q30 >= threshold){
            data[1].data.push(checked);
            data[0].data.push(0);
        }else {
            data[0].data.push(checked);
            data[1].data.push(0);
        }
        data[2].data.push(unchecked);
        $(this).find(".reads_total").text(checked);
    });
    create_summary_table(ar_samples, ar_clusters);

    plot_summary_chart(data, ar_samples);
}

// Top form submitted - go to new project
$('#reads_form').submit(function(e){
    e.preventDefault();
    if($('#reads_query').val() == ''){
        alert('Error - search term cannot be empty');
    } else {
        location.href = "/reads_total/" + $('#reads_query').val();
    }
});

//check/uncheck all
$("#check_all").click(function(){
    var search_string=$('#check_key').val();
    $(".reads_check").each(function(){
        if ($(this).data("sfc").indexOf(search_string) != -1){
            $(this).prop('checked',true);
        }
    });
    update_all_totals();
});
$("#uncheck_all").click(function(){
    var search_string=$('#check_key').val();
    $(".reads_check").each(function(){
        if ($(this).data("sfc").indexOf(search_string) != -1){
            $(this).prop('checked',false);
        }
    });
    update_all_totals();
});
// On page load
$(function(){
    update_all_totals();

    // Update page when a checkbox changed
    $('.reads_check').click(update_all_totals);

    // Project link clicked
    $('#summary_table').on('click', '.plink', function(){
        $('.sample_table').removeClass('highlighted');
        $($(this).attr('href')).addClass('highlighted');
    });

    // Download table as a file
    $('#rt_summary_download').click(function(e){
        e.preventDefault();
        var dl_text = '';
        $('#summary_table table tr').each(function(){
            var cells = [];
            $(this).find('th, td').each(function(){
                cells.push($(this).text());
            });
            dl_text += cells.join("\t") + "\n";
        });
        var fblob = new Blob([dl_text], {type: "text/plain;charset=utf-8"});
        saveAs(fblob, $('#rt_query').text()+"_reads_total.txt");
    });
});
