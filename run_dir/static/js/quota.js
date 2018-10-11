// when generate javascript in the template, strings are escaped.
// need to unescape them again to execute js
function normalize_data(data) {
  data = data.replace(/u\&#39;/g, "'");
  data = data.replace(/\&#39;/g, "'");
  data = JSON.stringify(data);
  data = JSON.parse(data);
  data = JSON.parse(data); // one more time, i don't know why but otherwise it doesn't work
  return data;
}

function plot_chart(title, plot_data, limit_data, max_x_value, div_id) {
    // Get timestamp for 2 months ago
    var d = new Date();
    d.setMonth(d.getMonth() - 2);
    d.setHours(0,0,0);
    d = d.getTime();

    $('#'+div_id).highcharts({
        chart: {
            zoomType: 'x',
            backgroundColor: null
        },
        title: { text: title },
        legend: { enabled: false },
        xAxis: {
            title: { text: 'Date' },
            type: 'datetime',
            min: d,
        },
        yAxis: {
            min: 0,
            max: max_x_value,
            title: { text: 'Storage (Tb)' },
        },
        tooltip: {
            pointFormat: '<strong>{series.name}</strong>: {point.y:,.2f} Tb',
        },
        series: [
            {
                name: 'Usage',
                data: plot_data,
                type: 'area'
            },
            {
                name: 'Quota',
                data: limit_data,
                dashStyle: 'Dash',
                color: 'red',
                type: 'line',
                marker: {
                    enabled: false
                }
            }
        ]
    });
};
// Reset x-min to show all data
$('#show_all_data').click(function(){
    var d = null;
    if($(this).text() == 'Show all data'){
        $('#show_all_text').text('Showing all data.');
        $(this).text('Show last two months');
    } else {
        // Get timestamp for 2 months ago
        d = new Date();
        d.setMonth(d.getMonth() - 2);
        d.setHours(0,0,0);
        d = d.getTime();
        $('#show_all_text').text('Showing data from last two months.');
        $(this).text('Show all data');
    }
    $('.uppmax_plot').each(function(){
        if (d == null) {
            d = $(this).attr('data-min-time');
        }
        try {
            $(this).highcharts().xAxis[0].update({min: d});
        } catch(err) {
            console.log('Setting limits for "'+$(this).attr('id')+'" didn\'t work - probably not yet loaded.');
        }
    });
});
$(document).ready(function(){
    // Highlight plots if clicked from the navigation
    $('body').on('click', '.quota-nav li a', function(){
       var target = $(this).attr('href');
       $('.highlighted').removeClass('highlighted');
       $(target).addClass('highlighted');
    });
});