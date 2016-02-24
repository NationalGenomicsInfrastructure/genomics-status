
//
// TODO
//
// 1. Get data colouration to work
// 2. Create a data export button
// 3. Copy currently visible data to clipboard?
// 4. Buttons for log axes




// Globals
project_data = [];
key_min = {'base': {}, 'library_prep': {}};
key_max = {'base': {}, 'library_prep': {}};

// Wait for page to load
$(function(){
    
    // Check to see if project ID box is filled on page load and submit if so.
    if($('#projects_meta_input').val() !== ''){
      load_projects_meta();
    }
    
    // Load data when form is submitted
    $('#project_chooser').submit(function(e){
        e.preventDefault();
        load_projects_meta();
    });
    
    $('#meta_key_selector select').change(function(){
        // Clear previous results
        if($('#proj_meta_plot').highcharts()) {
            $('#proj_meta_plot').highcharts().destroy();
        }
        $('#proj_meta_plot').html('<p class="text-center text-muted">Please select an X and a Y variable</p>');
        $('#proj_meta_correlation').text('?');
        
        var sect1 = $('#proj_meta_yvalue option:selected').data('section');
        var key1 = $('#proj_meta_yvalue').val();
        var sect2 = $('#proj_meta_xvalue option:selected').data('section');
        var key2 = $('#proj_meta_xvalue').val();
        var sect3 = $('#proj_meta_colvalue option:selected').data('section');
        var key3 = $('#proj_meta_colvalue').val();
        
        if(key1 != '' && key2 != ''){
            plot_meta({
              'y': [sect1, key1],
              'x': [sect2, key2],
              'color': [sect3, key3],
            });
        }
    });
    
});


// Main function that fires when project IDs are filled in and the form
// is submitted. Loads page.
function load_projects_meta(){
  
  // Destroy previous work
  // Clear previous results
  if($('#proj_meta_plot').highcharts()) {
      $('#proj_meta_plot').highcharts().destroy();
  }
  $('#proj_meta_plot').html('<p class="text-center text-muted">Please select an X and a Y variable.</p>');
  $('#proj_meta_correlation').text('?');
  $('#proj_meta_yvalue, #proj_meta_xvalue').prop('disabled', true).html('<option value="">[ select value ]</option>');
  $('#proj_meta_colvalue').prop('disabled', true).html('<option data-section="" value="">Project</option>');
  
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
      $('#status_box span').html(completed_ajax+' projects loaded ('+num_samples+' samples). <strong id="second_level_stats">Next: choose X and Y values to plot</strong>');
      
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
                                  key_min['library_prep'][l_attr] = null;
                                  key_max['library_prep'][l_attr] = null;
                              }
                              key_min['library_prep'][l_attr] = Math.min(validation[lv][l_attr], key_min['library_prep'][l_attr]);
                              key_max['library_prep'][l_attr] = Math.max(validation[lv][l_attr], key_min['library_prep'][l_attr]);
                          }    
                      }
                  }
                  
                  // 1D Nested arrays
                  else if(project_data[pid][s_name][attr].constructor === Object){
                      // Create array if we haven't seen this before
                      if(!numeric_keys.hasOwnProperty(attr)){
                          numeric_keys[attr] = [];
                          key_min[attr] = {};
                          key_max[attr] = {};
                      }
                      for (var s_attr in project_data[pid][s_name][attr]){
                          if(project_data[pid][s_name][attr][s_attr].constructor === Number){
                              if(numeric_keys[attr].indexOf(s_attr) == -1) {
                                  numeric_keys[attr].push(s_attr);
                                  key_min[attr][s_attr] = null;
                                  key_max[attr][s_attr] = null;
                              }
                              key_min[attr][s_attr] = Math.min(project_data[pid][s_name][attr][s_attr], key_min[attr][s_attr]);
                              key_max[attr][s_attr] = Math.max(project_data[pid][s_name][attr][s_attr], key_max[attr][s_attr]);
                          }    
                      }
                      // Delete if no numeric keys found
                      if(numeric_keys[attr].length == 0){
                          delete numeric_keys[attr];
                          delete key_min[attr];
                          delete key_max[attr];
                      }
                  }
                  // Base level keys
                  else if(project_data[pid][s_name][attr].constructor === Number){
                      if(numeric_keys['base'].indexOf(attr) == -1) {
                          numeric_keys['base'].push(attr);
                          key_min['base'][attr] = null;
                          key_max['base'][attr] = null;
                      }
                      key_min['base'][attr] = Math.min(project_data[pid][s_name][attr], key_min['base'][attr]);
                      key_max['base'][attr] = Math.max(project_data[pid][s_name][attr], key_min['base'][attr]);
                  }
              }
          }
      };
      for (var sect in numeric_keys){
          var group = $('<optgroup label="'+sect+'" />');
          for (var key in numeric_keys[sect]){
              group.append('<option data-section="'+sect+'" value="'+numeric_keys[sect][key]+'">'+numeric_keys[sect][key]+'</option>');
          }
          group.appendTo($('#proj_meta_yvalue, #proj_meta_xvalue, #proj_meta_colvalue'));
          $('#proj_meta_yvalue, #proj_meta_xvalue, #proj_meta_colvalue').prop('disabled', false);
      }
      
      console.log(project_data);
  });
}



// Function to create new meta scatter plot.
function plot_meta(keys){
    $('#proj_meta_plot').html('<p class="text-center text-muted">Loading plot..</p>');
    var data = [];
    var num_data = 0;
    var skipped_samples = [];
    var proj_skipped = {};
    for (var pid in project_data){
        var ds = {
            name: pid,
            data: []
        };
        proj_skipped[pid] = 0;
        for (var s_name in project_data[pid]){
            var dp = { name: s_name };
            try {
                for (var kt in keys){
                    // Base level values
                    if(keys[kt][0] == 'base'){
                        dp[kt] = project_data[pid][s_name][keys[kt][1]];
                    }
                    // Library Prep values - take latest
                    else if (keys[kt][0] == 'library_prep'){
                        var lp = project_data[pid][s_name]['library_prep'];
                        var lib_keys = Object.keys(lp);
                        var ll = lib_keys.sort().pop();
                        var validation = lp[ll]['library_validation'];
                        var val_keys = Object.keys(validation);
                        var lv = val_keys.sort().pop();
                        dp[kt] = validation[lv][keys[kt][1]];
                    }
                    // Colour - no value (projects)
                    else if(kt == 'color' && keys[kt][1] == ''){
                      // do nothing
                    }
                    // Single nested values
                    else {
                        dp[kt] = project_data[pid][s_name][ keys[kt][0] ][ keys[kt][1] ];
                    }
                }
                ds.data.push(dp);
                num_data += 1;
            } catch(e) {
                proj_skipped[pid] += 1;
                skipped_samples.push(s_name);
            }
        }
        data.push(ds);
    }
    
    // No samples plotted - sometihng went wrong
    if(num_data == 0){
      $('#proj_meta_plot').html('<div class="alert alert-danger"><strong>Error:</strong> No data found to plot. Please try another combination.</div>');
      return false;
    }
    
    // List skipped samples
    if(skipped_samples.length > 0){
        var stat_string = '<strong>Warning:</strong> '+skipped_samples.length+' samples out of ' + num_data + ' skipped:<br>';
        $.each(proj_skipped, function(pid, count){
          if(count > 0){
            stat_string += '<code>'+pid+'</code>: '+count+' out of ' + Object.keys(project_data[pid]).length + ' samples skipped<br>';
          }
        });
        stat_string += ' <button class="btn btn-default btn-sm" onClick="$(\'#skipped_samples_list\').slideToggle();">show / hide all samples</button>'+
        '<pre id="skipped_samples_list" style="display:none;">'+skipped_samples.join("\n")+'</pre>'
        $('#skipped_status_tip').html(stat_string);
    } else {
        $('#skipped_status_tip').html('<strong>Good news:</strong> ' + num_data + ' samples plotted, none skipped!');
    }
    if(data.length == 0){
        $('#proj_meta_plot').text('No data to show');
    }
    
    var ytitle = keys['y'][0]+': '+keys['y'][1];
    var xtitle = keys['x'][0]+': '+keys['x'][1];
    $('#proj_meta_plot').highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy',
            height: 800,
            events: {
                load: function(event) {
                    calc_corr_score(this.series);
                }
            }
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

// Function to calculate a correlation score. Takes a HighCharts
// series object
function calc_corr_score(plot_data){
  
  // Initialise variables
  var y_sum = 0;
  var x_sum = 0;
  var y_sqsum = 0;
  var x_sqsum = 0;
  var p_sum = 0;
  var num_samps = 0;
  
  // Loop through all of the data points
  for (var s in plot_data){
      for (var d in plot_data[s]['data']){
          var xval = plot_data[s]['data'][d]['x'];
          var yval = plot_data[s]['data'][d]['y'];
          x_sum += xval;
          y_sum += yval;
          x_sqsum += Math.pow(xval, 2);
          y_sqsum += Math.pow(yval, 2);
          p_sum += parseFloat(yval) * parseFloat(xval);
          num_samps += 1;
      }
  }
  
  // Calculate the correlation coefficient
  var corr_co = 0;
  var num = p_sum - (y_sum * x_sum / num_samps);
  var den = Math.sqrt((y_sqsum - Math.pow(y_sum, 2) / num_samps) * (x_sqsum - Math.pow(x_sum, 2) / num_samps));
  if (den !== 0){
      corr_co = num / den;
  }
  var lclass = 'default';  
  if(corr_co > 0.8 || corr_co < -0.8){ lclass = 'success'; }
  else if(corr_co > 0.6 || corr_co < -0.6){ lclass = 'info'; }
  else if(corr_co > 0.4 || corr_co < -0.4){ lclass = 'default'; }
  else if(corr_co > 0.2 || corr_co < -0.2){ lclass = 'warning'; }
  else if(corr_co.isNaN()){ lclass = 'danger'; }
  $('#proj_meta_correlation').html('<span class="label label-'+lclass+'">'+corr_co.toFixed(3)+'</span>');
}