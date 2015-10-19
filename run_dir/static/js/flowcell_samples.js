/*
File: flowcell_samples.js
URL: /static/js/flowcell_samples.js
Powers /flowcells/[FcID] - template is run_dir/design/flowcell_samples.html
*/

// Get data attributes
var flowcell = $('#flowcells-js').attr('data-flowcell');

function display_undetermined(lane){
    $("#table_ud_lane_" + lane + ':first').slideToggle();
}

for (var i = 1; i < 9; i++) {
    $("#lanes").append('<div id="lane_' + i + '" class="hidden sublane"><h4>Lane ' + i + '<span id="button_lane_' + i + '"></span></h4></div>')
};

$.getJSON("/api/v1/flowcell_info2/"+flowcell, function(data) {

    load_running_notes()
    load_links()

    // Fill in the main table with summary information
    var tbody = '<tr> \
                     <th>Sequencing done</th> \
                     <td>' + data['seqdone'] + '</td> \
                 </tr> \
                 <tr> \
                     <th>Demultiplex</th>';
    if(data.hasOwnProperty("demuldone")){
        tbody += '<td><span class="label label-success">Done</label></td>';
    } else {
        tbody += '<td><span class="label label-warning"">Pending</span></td></tr>';
    }
    tbody += "</tr>";
    if(data.hasOwnProperty("plist")){
        tbody += "<tr> \
            <th>Projects :</th>\
            <td>" + data["plist"].join(", ") + "</td>\
        </tr>";
    }
    $("#fc_info tbody").html(tbody);

    // If demultiplexed, get additional information for each lane
    if(data.hasOwnProperty("demuldone")){

        // First table - Overall lane stats
        for (lid=1; lid<9; lid++){
            var sbody = '';
            if ('lanedata'in data && lid in data['lanedata']){
                sbody = '<tr> \
                    <th>Total Yield (<abbr title="Megabases">Mb</abbr>):</th> \
                    <td class="text-left" >' + nice_numbers(data['lanedata'][lid]['yield']) + '</td> \
                    <th>Total clusters :</th> \
                    <td class="text-left">' + nice_numbers(data['lanedata'][lid]['clustersnb']) + '</td> \
                    <th>% bases > Q30:</th> \
                    <td class="text-left ';
                q30=data['lanedata'][lid]['overthirty']
                if (q30 < 30) sbody += 'danger';
                else if(q30 < 80) sbody += 'warning';
                else if(q30 < 100) sbody += 'success';
                sbody+='">' + q30 + '%</td> \
                    <th>Mean Quality Score:</th> \
                    <td class="text-left">' + data['lanedata'][lid]['mqs'] + '</td> \
                    <th>% perfect barcode :</th> \
                    <td class="text-left">' + data['lanedata'][lid]['perf'] + '%</td> \
                </tr>';
            } else if (data['yields'][lid] != 0){
                    sbody='<tr><th>Total Yield (<abbr title="Megabases">Mb</abbr>):</th> \
                    <td>' + data['yields'][lid]+ '</td></tr>';
            }
            status = data['seq_qc'][lid];
            if (status !== '0'){
                if(status == 'PASSED') status = '<span class="label label-success">Passed</span>';
                if(status == 'UNKNOWN') status = '<span class="label label-default">Unknown</span>';
                if(status == 'FAILED') status = '<span class="label label-danger">Failed</span>';
                sbody+="<tr> \
                    <th>Sequencing QC:</th> \
                    <td>" + status + "</td> \
                </tr>";
            }
            for(i=1; i < 4; i++){
                if(data.hasOwnProperty('err'+i)){
                    sbody += "<tr> \
                        <th>Read " + i + " Error rate :</th> \
                        <td>" + data['err'+i][lid] + "</td> \
                    </tr>";
                }
            }
            // Add the table if it has some content
            if(sbody.length > 0){
                $('#lane_'+lid).removeClass('hidden').append(' \
                    <table class="table table-bordered narrow-headers no-margin" id="summary_lane_' + lid + '""> \
                        <tbody> \
                            ' + sbody + ' \
                        </tbody> \
                    </table>&nbsp;');
            }
        }

        // Second table - Project Samples in each lane
        for (lid in data['lane']){
            if(data['lane'][lid].length == 0){
                continue;
            }
            var lbody='<table class="table table-bordered" id="table_lane_' + lid + '"> \
                        <tbody> \
                            <tr> \
                                <th>Project Name</th> \
                                <th>Sample Name</th> \
                                <th>Yield (<abbr title="Megabases">Mb</abbr>)</th>';

            if (data['lane'][lid][0].hasOwnProperty('readsnb')){
                lbody+='<th># Reads</th>';
            }else if(data['lane'][lid][0].hasOwnProperty('clustersnb')){
                lbody+='<th># Clusters</th>';
            }

            lbody+='<th>% &gt; Q30</th> \
                    <th>Barcode</th>';
            if (data['lane'][lid][0].hasOwnProperty('desc')){
                lbody+='<th>Index description</th>';
            }
            if (data['lane'][lid][0].hasOwnProperty('lanepc')){
                lbody+='<th>% of the lane</th>';
            }
            if (data['lane'][lid][0].hasOwnProperty('mqs')){
                lbody+='<th>Mean QualityScore</th>';
            }
            lbody+='</tr>';

            var total_undetermined_claster_number = 0;

            for (samplerunid in data['lane'][lid]){
                var q30 = parseFloat(data['lane'][lid][samplerunid]['overthirty']);
                if (data['lane'][lid][samplerunid]['SampleName'] == 'Undetermined') {
                    total_undetermined_claster_number = parseInt(data['lane'][lid][samplerunid]['clustersnb'].replace(/,/g, ''));
                }
                lbody += "<tr> \
                    <td>" + data['lane'][lid][samplerunid]['Project'] + "</td> \
                    <td>" + data['lane'][lid][samplerunid]['SampleName'] + '</td> \
                    <td class="text-right">' + nice_numbers(data['lane'][lid][samplerunid]['yield']) + '</td>'
                    if (data['lane'][lid][0].hasOwnProperty('readsnb')){
                        lbody+='<td class="text-right">' + nice_numbers(data['lane'][lid][samplerunid]['readsnb']) + '</td>'
                    }else if(data['lane'][lid][0].hasOwnProperty('clustersnb')){
                        lbody+='<td class="text-right">' + nice_numbers(data['lane'][lid][samplerunid]['clustersnb']) + '</td>'
                    }

                lbody+='<td class="text-right ';
                if (q30 < 30) lbody += 'danger';
                else if(q30 < 80) lbody += 'warning';
                else if(q30 < 100) lbody += 'success';
                lbody += '">' + data['lane'][lid][samplerunid]['overthirty'] + " %</td>\
                    <td>" + data['lane'][lid][samplerunid]['barcode'] + "</td>";
                if (data['lane'][lid][0].hasOwnProperty('desc')){
                    lbody+="<td>" + data['lane'][lid][samplerunid]['desc'] + "</td>";
                }
                if (data['lane'][lid][0].hasOwnProperty('lanepc')){
                    lbody+="<td>" + data['lane'][lid][samplerunid]['lanepc'].toFixed(2) + " %</td>";
                }
                if (data['lane'][lid][0].hasOwnProperty('mqs')){
                    lbody+="<td>" + data['lane'][lid][samplerunid]['mqs'] + "</td>";
                }
                lbody += "</tr>";
            }
            lbody += '</tbody></table>';
            $('#lane_'+lid).append(lbody);
            if ('undetermined' in data) {
                var ludtable='<table class="undetermined" id="table_ud_lane_' + lid + '" style="display:none;">';
                var button='<button id="ud_button_lane_' +lid + '" class="undetermined-btn btn btn-info btn-sm" \
                           type="button" onclick="display_undetermined(' + lid + ')" >Show Undetermined</button>';
                var keys = [];
                for(var key in data['undetermined'][lid]) keys.push(key);
                var ordered_keys=keys.sort(function(a,b){return data['undetermined'][lid][b]-data['undetermined'][lid][a]});
                var total = -1;
                for (ud in ordered_keys){
                    // Try to look for exact barcode matches with Ns in
                    // eg. highlight ATTACNNN if ATTACTCG was a barcode for this lane
                    // probably doesn't work with double barcodes and will highlight
                    // potentially unuseful sequences such as NNNNNNNN. Sorry about that.
                    var unmatched = ordered_keys[ud];
                    var hl = '';
                    for (samplerunid in data['lane'][lid]){
                        var bc = data['lane'][lid][samplerunid]['barcode'];
                        if (bc == 'unknown') { continue; }
                        bc = '^('+bc.split('').join('|N)(')+'|N)$';
                        if(ordered_keys[ud].match(bc)){
                            hl = ' class="undetermined-highlight"';
                        }
                    }
                    // Make count nice and work out percentage
                    var count = parseInt(data['undetermined'][lid][ordered_keys[ud]]);
                    var percentage = (100 * count/total_undetermined_claster_number).toFixed(2);

                    count = nice_numbers(count);
                    if(total == -1) {
                        ludtable += "<tr><th>Total</th><th>"+nice_numbers(total_undetermined_claster_number)+"</th><th>(100%)</span></th></tr>";
                        total = parseInt(data['undetermined'][lid][ordered_keys[ud]]);
                        $('#lane_'+lid).append(ludtable);
                    }
                    ludtable += "<tr"+hl+"><td><samp>"+unmatched+"</samp></td><td>"+count+'</td><td>('+percentage+"%)</span></td></tr>";

                }
                ludtable+="</dl>";
                $('#button_lane_'+lid).append(button);
                $('#lane_'+lid).append(ludtable);
            }
            $('#lane_'+lid).removeClass('hidden');
        }

    }

    // Remove the loading text
    $('#loading_spinner').hide();
    $('#page_content').show();
}).error(function(){
    // Flow cell not found - probably
    $('#page_content').html('<h1>Error - Flow Cell Not Found</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t find the flow cell <strong>'+flowcell+'</strong></div>');

    // Remove the loading text
    $('#loading_spinner').hide();
    $('#page_content').show();
});
