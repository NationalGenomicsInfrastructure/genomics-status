
    //
    // PROJ META COMPARE
    //
    // This was a little side project that got a little out of hand. Hopefully
    // the code isn't too unclear. It's purely JS and HTML, no Python here.
    //
    // How it works ***TO BE UPDATED***:
    // - Either the page is prepopulated with project IDs, or the user types them in
    // - The data is retrieved for every project using the API using the
    //   load_projects_meta() function
    // - This is parsed. Numeric fields are listed in the select dropdowns
    //   if they're 1 or 2 deep, or in the `library_prep` section (special case)
    // - When an X and Y value is selected, it's plotted with HighCharts using
    //   the plot_meta() function
    // - A correlation score is calculated from the data in the plot using calc_corr_score()
    //   and recaculated when something changes
    // - Data can be downloaded through the pmeta_download() function



    // Globals
    project_data = {};
    var id_tosave = [];
    var sel = '';
    key_min = {'base': {}, 'library_prep': {}, 'rna_meta' :{}};
    key_max = {'base': {}, 'library_prep': {}, 'rna_meta' :{}};
    xLogAxis = 'linear';
    yLogAxis = 'linear';

    // Wait for page to load
    $(function(){
        // AWESOME SEARCH BOX THINGY
        // Plug in the typeahead search box
        var projectSearch = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: '/api/v1/project_search/%QUERY',
        limit: 10
        });
        projectSearch.initialize();

        $('.statdb-search .typeahead').typeahead({
        minLength: 3,
        highlight: true,
        }, {
        name: 'project-search',
        displayKey: 'name',
        source: projectSearch.ttAdapter(),
        templates: {
            empty: '<div class="empty-message">No projects found</div>'
        }
        }).bind('typeahead:selected', function(obj, datum, name) {
            let proj_id = datum.url.split('/')[2];
            $('#projects_meta_input').val('');
            $('#del_pid_badges').append('<button class="btn badge rounded-pill bg-secondary mx-1" id="' + proj_id +  '">' + proj_id + ' x' + '</button>');
            id_tosave.push(proj_id);
            $("#del_pid_badges > button").on("click", function() {
                let but_id = $("#"+$(this).attr('id'));
                sel = but_id.text().split(' ')[0];
                delete project_data[sel];
                id_tosave = id_tosave.filter( function(el) {
                    return sel.indexOf(el) < 0;
                });
                load_projects_meta(id_tosave);
                but_id.remove();
            });
            load_projects_meta(id_tosave);
            $("#projects_meta_input").typeahead('val', '');
        });
        // Show and hide a spinner on the ajax event
        $('.statdb-search .input-spinner').hide();
        $(document).ajaxSend(function(event, jqXHR, settings) {
            $('.input-spinner').show();
        });
        // Check to see if project ID box is filled on page load and submit if so.
        if($('#projects_meta_input').val() === ''){
            id_tosave.push('P10851', 'P10264');
            load_projects_meta(id_tosave);
        }

        // Select dropdown box is changed
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

        // Download all data button
        $('#projMeta_downloadAll').click(function(e){
            e.preventDefault();
            pmeta_download();
        });

        // Copy to clipboard button
        new Clipboard('#projMeta_copyRaw', {
            text: function(trigger) {
                return JSON.stringify(project_data, null, "  ");
            }
        });

        // Change between log and linear axes
        $('.meta_xLogLin_buttons button').click(function(e){
            e.preventDefault();
            $('.meta_xLogLin_buttons button').removeClass('active');
            $(this).addClass('active');
            if($(this).val() == 'log'){ xLogAxis = 'logarithmic'; }
            else { xLogAxis = 'linear'; }
            $('#proj_meta_plot').highcharts().xAxis[0].update({ type: xLogAxis});
        });
        $('.meta_yLogLin_buttons button').click(function(e){
            e.preventDefault();
            $('.meta_yLogLin_buttons button').removeClass('active');
            $(this).addClass('active');
            if($(this).val() == 'log'){ yLogAxis = 'logarithmic'; }
            else { yLogAxis = 'linear'; }
            $('#proj_meta_plot').highcharts().yAxis[0].update({ type: yLogAxis});
        });

    });

    setTimeout(function() {
        def_graph_load();
        project_data = {};
    }, 1000);

    //Setting default graph on load
    function def_graph_load(){
        $('#del_pid_badges').append('<button class="btn badge rounded-pill bg-secondary mx-1" id="P10851">P10851 x</button><button class="btn badge rounded-pill bg-secondary mx-1" id="P10264">P10264 x</button>');
        $("#del_pid_badges > button").on("click", function() {
            let but_id = $("#"+$(this).attr('id'));
            sel = but_id.text().split(' ')[0];
            delete project_data[sel];
            id_tosave = id_tosave.filter( function(el) {
                return sel.indexOf(el) < 0;
            });
            load_projects_meta(id_tosave);
            but_id.remove();
        });
        plot_meta({'y': ['base', 'customer_conc'], 'x': ['base', 'customer_conc'],'color': ['base', 'customer_conc']})
    }

    // Main function that fires when project IDs are filled in and the form
    // is submitted. Loads page.
    function load_projects_meta(id_tosave){

        // Destroy previous work
        // Clear previous results
        if($('#proj_meta_plot').highcharts()) {
            $('#proj_meta_plot').highcharts().destroy();
        }
        $('#proj_meta_plot').html('<p class="text-center text-muted">Please select an X and a Y variable.</p>');
        $('#proj_meta_correlation').text('?');
        $('#projMeta_downloadAll, #projMeta_copyRaw').prop('disabled', true);
        $('#proj_meta_yvalue, #proj_meta_xvalue').prop('disabled', true).html('<option value="">[ select value ]</option>');
        $('#proj_meta_colvalue').prop('disabled', true).html('<option data-section="" value="">Project</option>');

        // Clean up the user input
        var projects = [];
        for (var i = 0; i < id_tosave.length; i++) {
            var pid = id_tosave[i];
            pid = pid.replace(/[^P\d]/, '');
            if(/P\d{3,5}/.test(pid)){
                projects.push(pid);
            } else {
                $('#status_box').removeClass().addClass('alert alert-danger');
                $('#status_box span').html('Error - project <code>'+id_tosave[i]+"</code> (<code>"+pid+"</code>) doesn't look like a project ID.");
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
                num_samples += Object.keys(data).length;
            });
        };
        //RNA ajax caller function:
        var RNA_caller = function(pid){
            var rna_url = '/api/v1/rna_report/'+pid;
            return $.getJSON(rna_url, function(rna_data){
                if (! jQuery.isEmptyObject(rna_data)){
                    for (sample in rna_data){
                        project_data[pid][sample]['rna_meta']=rna_data[sample];
                    }
                }
                completed_ajax++;
                $('#project_status_counter').text(completed_ajax);
                $('#project_status_pbar').css('width', ((completed_ajax/projects.length)*100)+'%' )
                $('#project_status_sample_counter').text(num_samples);
            }).fail(function( jqXHR, textStatus, errorThrown ) {console.log("failed "+textStatus);});
        }
        // Kick off all of the JSON ajax calls
        var ajax_calls = [];
        for (var i = 0; i < projects.length; i++) {
            ajax_calls.push( ajax_caller( projects[i] ) );
        }
        //when they are done, start the second round of ajax calls
        $.when.apply(this, ajax_calls).done(function() {
            rna_calls = [];
            for (var i = 0; i < projects.length; i++) {
                rna_calls.push( RNA_caller( projects[i] ) );
            }
            // Fire when all of the data has been loaded
            $.when.apply(this, rna_calls).done(function() {
                // Update the status box
                $('#status_box').removeClass().addClass('alert alert-success mt-4 text-center');
                $('#status_box span').html(completed_ajax+' projects loaded ('+num_samples+' samples). <strong id="second_level_stats">Next: choose X and Y values to plot</strong>');

                // Collect available shared keys
                numeric_keys = {'base': [], 'library_prep': [], 'rna_meta' : []};
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
                            else if(attr == 'rna_meta'){
                                for (var key in project_data[pid][s_name]['rna_meta']){
                                    if (numeric_keys['rna_meta'].indexOf(key) == -1){
                                        numeric_keys['rna_meta'].push(key);
                                        key_min['rna_meta'][key]=null;
                                        key_max['rna_meta'][key]=null;
                                    }
                                    key_min['rna_meta'][key]=Math.min(key_min['rna_meta'][key], project_data[pid][s_name]['rna_meta'][key]);
                                    key_max['rna_meta'][key]=Math.max(key_min['rna_meta'][key], project_data[pid][s_name]['rna_meta'][key]);

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
                                key_max['base'][attr] = Math.max(project_data[pid][s_name][attr], key_max['base'][attr]);
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
                }

                // Remove disabled states
                $('#proj_meta_yvalue, #proj_meta_xvalue, #proj_meta_colvalue, #projMeta_downloadAll, #projMeta_copyRaw').prop('disabled', false);

            });
        });
    }



    // Function to create new meta scatter plot.
    function plot_meta(keys){
        $('#proj_meta_plot').html('<p class="text-center text-muted">Loading plot..</p>');
        var data = [];
        var num_data = 0;
        var skipped_samples = [];
        var proj_skipped = {};
        // Create chroma colour scale if we're using colour
        var cscale;
        var docol = false;
        if(keys['color'][1] !== ''){
            docol = true;
            var cmin = key_min[ keys['color'][0] ][ keys['color'][1] ];
            var cmax = key_max[ keys['color'][0] ][ keys['color'][1] ];
            cscale = chroma.scale('RdYlBu').domain([cmin, cmax]);
        }
        for (var pid in project_data){
            var ds = {
                name: pid,
                data: []
            };
            proj_skipped[pid] = 0;
            for (var s_name in project_data[pid]){
                var dp = { name: s_name };
                var smissing = false;
                for (var kt in keys){
                    try {
                        var thisval;
                        // Base level values
                        if(keys[kt][0] == 'base'){
                            thisval = project_data[pid][s_name][keys[kt][1]];
                        }
                        // Library Prep values - take latest
                        else if (keys[kt][0] == 'library_prep'){
                            var lp = project_data[pid][s_name]['library_prep'];
                            var lib_keys = Object.keys(lp);
                            var ll = lib_keys.sort().pop();
                            var validation = lp[ll]['library_validation'];
                            var val_keys = Object.keys(validation);
                            var lv = val_keys.sort().pop();
                            thisval = validation[lv][keys[kt][1]];
                        }
                        // Single nested values
                        else {
                            thisval = project_data[pid][s_name][ keys[kt][0] ][ keys[kt][1] ];
                        }
                        // store xy values in object
                        if(kt !== 'color'){
                            dp[kt] = thisval;
                        }
                        // Convert colour keys into hex values
                        else if(kt == 'color' && docol == true){
                            dp[kt] = cscale(thisval).css();
                        }
                    } catch(e) {
                        if(kt == 'x' || kt == 'y' || docol == true){
                            proj_skipped[pid] += 1;
                            skipped_samples.push(s_name);
                            smissing = true;
                        }
                    }
                }
                if(!smissing){
                    ds.data.push(dp);
                    num_data += 1;
                }
            }
            data.push(ds);
        }

        // No samples plotted - something went wrong
        if(num_data == 0){
        $('#proj_meta_plot').html('<div class="alert alert-danger"><strong>Error:</strong> No data found to plot. Please try another combination.</div>');
        return false;
        }

        // List skipped samples
        if(skipped_samples.length > 0){
            var stat_string = '<strong>Warning:</strong> '+skipped_samples.length+' samples out of ' + (num_data + skipped_samples.length) + ' skipped:<br>';
            $.each(proj_skipped, function(pid, count){
            if(count > 0){
                stat_string += '<code>'+pid+'</code>: '+count+' out of ' + Object.keys(project_data[pid]).length + ' samples skipped<br>';
            }
            });
            stat_string += ' <br><button class="btn btn-outline-dark btn-sm" onClick="$(\'#skipped_samples_list\').slideToggle();">show / hide hidden sample names</button>'+
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
                height: 530,
                plotBorderWidth: 1,
                plotBackgroundColor: '#FAFAFA',
                events: {
                    load: function(event) {
                        calc_corr_score(this.series);
                    },
                    redraw: function(event) {
                        calc_corr_score(this.series);
                    }
                }
            },
            title: {
                text: '<span class="meta_plot_cats"><i>"'+ytitle+'"</i></span> compared to <span class="meta_plot_cats"><i>"'+xtitle+'"</i></span>',
                useHTML: true,
                align: 'center',
                x: 60
            },
            credits: {
                enabled: false
            },
            yAxis: {
                title: {
                    text: ytitle
                },
                type: xLogAxis,
                lineWidth: 1,
                gridLineWidth: 0
            },
            xAxis: {
                title: {
                    text: xtitle
                },
                type: yLogAxis,
            },
            legend: {
                layout: 'horizontal',
                align: 'right',
                verticalAlign: 'top'
            },
            exporting: {
                buttons: {
                    contextButton: {
                        align: 'left',
                        y: 5,
                        verticalAlign: 'top'
                    }
                }
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
                        lineWidth: docol ? 1 : 0,
                        lineColor: '#999',
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
            if(plot_data[s]['visible'] == true){
                for (var d in plot_data[s]['data']){
                    var xval = plot_data[s]['data'][d]['x'];
                    var yval = plot_data[s]['data'][d]['y'];
                    if(xval !== undefined && yval !== undefined){
                        x_sum += xval;
                        y_sum += yval;
                        x_sqsum += Math.pow(xval, 2);
                        y_sqsum += Math.pow(yval, 2);
                        p_sum += parseFloat(yval) * parseFloat(xval);
                        num_samps += 1;
                    }
                }
            }
        }

        // Calculate the correlation coefficient
        var corr_co = 0;
        var num = p_sum - (y_sum * x_sum / num_samps);
        var den = Math.sqrt((y_sqsum - Math.pow(y_sum, 2) / num_samps) * (x_sqsum - Math.pow(x_sum, 2) / num_samps));
        if (den !== 0){
            corr_co = num / den;
        }
        var lclass = 'secondary';
        if(corr_co > 0.8 || corr_co < -0.8){ lclass = 'success'; }
        else if(corr_co > 0.6 || corr_co < -0.6){ lclass = 'info'; }
        else if(corr_co > 0.4 || corr_co < -0.4){ lclass = 'secondary'; }
        else if(corr_co > 0.2 || corr_co < -0.2){ lclass = 'warning'; }
        else if(isNaN(corr_co)){ lclass = 'danger'; }
        $('#proj_meta_correlation').html('<span class="badge bg-'+lclass+'">'+corr_co.toFixed(3)+'</span> ('+num_samps+' samples)');
    }



    // Download all of the data
    function pmeta_download(){

        // Get the keys (headers)
        var keys = [];
        $('#proj_meta_yvalue option').each(function(){
            var tval = $(this).val();
            var tsect = $(this).data('section');
            if(tval !== ''){ keys.push([tsect, tval]); }
        });

        // Build the data structure
        var data = [];
        for (var pid in project_data){
            for (var s_name in project_data[pid]){
                var trow = [];
                trow.push(s_name);
                for (var k in keys){
                    var kt = keys[k][0];
                    var key = keys[k][1];
                    console.log(pid+' - '+s_name+' - '+kt+' - '+key);
                    try {
                        // Base level values
                        if(kt == 'base'){
                            trow.push( project_data[pid][s_name][key] );
                        }
                        // Library Prep values - take latest
                        else if (kt == 'library_prep'){
                            var lp = project_data[pid][s_name]['library_prep'];
                            var lib_keys = Object.keys(lp);
                            var ll = lib_keys.sort().pop();
                            var validation = lp[ll]['library_validation'];
                            var val_keys = Object.keys(validation);
                            var lv = val_keys.sort().pop();
                            trow.push( validation[lv][key] );
                        }
                        // Single nested values
                        else {
                            trow.push( project_data[pid][s_name][kt][key] );
                        }
                    } catch(e){
                        trow.push('');
                    }
                }
                data.push(trow);
            }
        }
        // Add the header row
        keys.unshift('Sample_Name');
        data.unshift(keys);
        // Concat to a string
        var dstring = '';
        for (var i in data){
            dstring += data[i].join("\t")+"\n";
        }
        // Save
        var fblob = new Blob([dstring], {type: "text/plain;charset=utf-8"});
        saveAs(fblob, "proj_meta_data.txt");
    }
