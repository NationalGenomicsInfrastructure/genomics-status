
// Globals
project_data = [];

// Wait for page to load
$(function(){
    
    $('#meta_key_selector select').change(function(){
        // Clear previous results
        if($('#proj_meta_plot').highcharts()) {
            $('#proj_meta_plot').highcharts().destroy();
        }
        $('#proj_meta_plot').html('<p class="text-center text-muted">Please select two variables</p>');
        $('#proj_meta_correlation').text('NA');
        
        var sect1 = $('#proj_meta_yvalue option:selected').data('section');
        var key1 = $('#proj_meta_yvalue').val();
        var sect2 = $('#proj_meta_xvalue option:selected').data('section');
        var key2 = $('#proj_meta_xvalue').val();
        
        if(key1 != '' && key2 != ''){
            plot_meta(sect1, key1, sect2, key2);
        }
    });
    
    $('#project_chooser').submit(function(e){
        e.preventDefault();
        
        // Destroy previous work
        // Clear previous results
        if($('#proj_meta_plot').highcharts()) {
            $('#proj_meta_plot').highcharts().destroy();
        }
        $('#proj_meta_plot').html('<p class="text-center text-muted">Please select two variables</p>');
        $('#proj_meta_correlation').text('NA');
        $('#proj_meta_yvalue, #proj_meta_xvalue').prop('disabled', true).html('<option value="">[ select value ]</option>');
        
        // Collect the user supplied project IDs
        var projects_str = $('#projects_meta_input').val();
        var projects_raw = projects_str.split(/[\s+,;]/);
        
        // Clean up the user input
        var projects = [];
        for (var i = 0; i < projects_raw.length; i++) {
            var pid = projects_raw[i];
            pid = pid.replace(/[^P\d]/, '');
            if(/P\d{3,5}/.test(pid)){
                projects.push(pid);
            } else {
                $('#status_box').removeClass().addClass('alert alert-danger');
                $('#status_box span').html('Error - project <code>'+projects_raw[i]+"</code> (<code>"+pid+"</code>) doesn't look like a project ID.");
                return;
            }
        }
        
        // Update the status box
        var completed_ajax = 0;
        var num_samples = 0;
        $('#status_box').removeClass().addClass('alert alert-info');
        $('#status_box span').html('Loading '+projects.length+' projects: <code>'+projects.join('</code>, <code>')+'</code>.'+
             '<div class="progress" style="margin: 15px 0 0;"><div id="project_status_pbar" class="progress-bar" style="width: 0%;">'+
             '<span id="project_status_counter">0</span> projects loaded (<span id="project_status_sample_counter">0</span> samples)</div></div>');
        
        // Ajax caller function
        var ajax_caller = function(pid) {
            var this_url = '/api/v1/project/'+pid;
            return $.getJSON(this_url, function(data) {
                project_data[pid] = data;
                completed_ajax++;
                num_samples += Object.keys(data).length;
                $('#project_status_counter').text(completed_ajax);
                $('#project_status_pbar').css('width', ((completed_ajax/projects.length)*100)+'%' )
                $('#project_status_sample_counter').text(num_samples);
            });
        };
        
        // Kick off all of the JSON ajax calls
        var ajax_calls = [];
        for (var i = 0; i < projects.length; i++) {
            ajax_calls.push( ajax_caller( projects[i] ) );
        }
        
        // Fire when all of the data has been loaded
        $.when.apply(this, ajax_calls).done(function() {
            // Update the status box
            $('#status_box').removeClass().addClass('alert alert-success');
            $('#status_box span').html(completed_ajax+' projects loaded ('+num_samples+' samples). <span id="second_level_stats"></span>');
            
            // Collect available shared keys
            numeric_keys = {'base': [], 'library_prep': []};
            for (var pid in project_data){
                for (var s_name in project_data[pid]){
                    for (var attr in project_data[pid][s_name]){
                        // Library prep fields
                        if (attr == 'library_prep'){
                            var lp = project_data[pid][s_name][attr];
                            var lib_keys = Object.keys(lp);
                            var ll = lib_keys.sort().pop();
                            var validation = lp[ll]['library_validation'];
                            var val_keys = Object.keys(validation);
                            var lv = val_keys.sort().pop();
                            for (var l_attr in validation[lv]){
                                if(validation[lv][l_attr].constructor === Number){
                                    if(numeric_keys['library_prep'].indexOf(l_attr) == -1) {
                                        numeric_keys['library_prep'].push(l_attr);
                                    }
                                }    
                            }
                        }
                        
                        
                        // 1D Nested arrays
                        else if(project_data[pid][s_name][attr].constructor === Object){
                            // Create array if we haven't seen this before
                            if(!numeric_keys.hasOwnProperty(attr)){
                                numeric_keys[attr] = [];
                            }
                            for (var s_attr in project_data[pid][s_name][attr]){
                                if(project_data[pid][s_name][attr][s_attr].constructor === Number){
                                    if(numeric_keys[attr].indexOf(s_attr) == -1) {
                                        numeric_keys[attr].push(s_attr);
                                    }
                                }    
                            }
                            // Delete if no numeric keys found
                            if(numeric_keys[attr].length == 0){
                                delete numeric_keys[attr];
                            }
                        }
                        // Base level keys
                        else if(project_data[pid][s_name][attr].constructor === Number){
                            if(numeric_keys['base'].indexOf(attr) == -1) {
                                numeric_keys['base'].push(attr);
                            }
                        }
                    }
                }
            };
            
            for (var sect in numeric_keys){
                var group = $('<optgroup label="'+sect+'" />');
                for (var key in numeric_keys[sect]){
                    group.append('<option data-section="'+sect+'" value="'+numeric_keys[sect][key]+'">'+numeric_keys[sect][key]+'</option>')
                }
                group.appendTo($('#proj_meta_yvalue, #proj_meta_xvalue'));
                $('#proj_meta_yvalue, #proj_meta_xvalue').prop('disabled', false);
            }
            
            console.log(project_data);
        });
        
    });
});

function plot_meta(sect1, key1, sect2, key2){
    $('#proj_meta_plot').html('<p class="text-center text-muted">Loading plot..</p>');
    var data = [];
    var y_sum = 0;
    var x_sum = 0;
    var y_sqsum = 0;
    var x_sqsum = 0;
    var p_sum = 0;
    var num_samps = 0;
    var skipped_samples = [];
    for (var pid in project_data){
        var ds = {
            name: pid,
            data: []
        };
        for (var s_name in project_data[pid]){
            var dp = { name: s_name };
            try {
                if(sect1 == 'base'){
                    dp['y'] = project_data[pid][s_name][key1];
                } else {
                    dp['y'] = project_data[pid][s_name][sect1][key1];
                }
                if(sect2 == 'base'){
                    dp['x'] = project_data[pid][s_name][key2];
                } else {
                    dp['x'] = project_data[pid][s_name][sect2][key2];
                }
                ds.data.push(dp);
                y_sum += parseFloat(dp['y']);
                if(parseFloat(dp['y']).isNaN()){
                    console.log('Not a number: '+dp['y']);
                }
                x_sum += parseFloat(dp['x']);
                y_sqsum += Math.pow(parseFloat(dp['y']), 2);
                x_sqsum += Math.pow(parseFloat(dp['x']), 2);
                p_sum += parseFloat(dp['y']) * parseFloat(dp['x']);
                num_samps += 1;
                console.log('Adding to num samps');
            } catch(e) {
                skipped_samples.push(s_name);
            }
        }
        data.push(ds);
    }
    
    // List skipped samples
    if(skipped_samples.length > 0){
        $('#skipped_status_tip').html('<strong>Warning:</strong> '+skipped_samples.length+' samples skipped.'+
            ' <button class="btn btn-default btn-sm" onClick="$(\'#skipped_samples_list\').slideToggle();">show / hide</button>'+
            '<pre id="skipped_samples_list" style="display:none;">'+skipped_samples.join("\n")+'</pre>');
    } else {
        $('#skipped_status_tip').html('<strong>Success:</strong> No samples skipped!');
    }
    if(data.length == 0){
        $('#proj_meta_plot').text('No data to show');
    }
    
    // Finish calculating the correlation coefficient
    var corr_co = 0;
    var num = p_sum - (y_sum * x_sum / num_samps);
    var den = Math.sqrt((y_sqsum - Math.pow(y_sum, 2) / num_samps) * (x_sqsum - Math.pow(x_sum, 2) / num_samps));
    if (den !== 0){
        corr_co = num / den;
    }
    console.log('Correlation: '+corr_co);
    console.log('num: '+num);
    console.log('den: '+den);
    console.log('p_sum: '+p_sum);
    console.log('y_sum: '+y_sum);
    console.log('x_sum: '+x_sum);
    console.log('num_samps: '+num_samps);
    $('#proj_meta_correlation').text(corr_co.toFixed(3))
    
    var ytitle = sect1+': '+key1;
    var xtitle = sect2+': '+key2;
    $('#proj_meta_plot').highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy',
            height: 800
        },
        title: {
            text: 'Comparing '+ytitle+' against '+xtitle
        },
        yAxis: {
            title: {
                text: ytitle
            }
        },
        xAxis: {
            title: {
                text: xtitle
            },
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            y: 30
        },
        tooltip: {
            useHTML: true,
            headerFormat: ' <span style="font-size: 30px"><b>{point.point.name}</b></span><br>',
            pointFormat: '<b>'+ytitle+':</b> {point.y}<br><b>'+xtitle+':</b> {point.x}',
            
            useHTML: true,
            headerFormat: '<span style="font-size: 15px; font-weight:bold;">{point.point.name}</span><table>',
            pointFormat: '<tr><td style="font-weight:bold; padding:5px;">'+ytitle+':</td><td style="text-align: right; padding:5px;">{point.y}</td></tr>'+
                '<tr><td style="font-weight:bold; padding:5px;">'+xtitle+':</td><td style="text-align: right; padding:5px;">{point.x}</td></tr>',
            footerFormat: '</table>',
            valueDecimals: 2
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 4,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
            }
        },
        series: data
    });
}