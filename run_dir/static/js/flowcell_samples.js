/*
File: flowcell_samples.js
URL: /static/js/flowcell_samples.js
Powers /flowcells/[FcID] - template is run_dir/design/flowcell_samples.html
*/

// Get data attributes
var flowcell = $('#flowcells-js').attr('data-flowcell');


for (var i = 1; i < 9; i++) {
    $("#lanes").append('<div id="lane_' + i + '" class="hidden"><h4>Lane ' + i + '</h4></div>')
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
            if (data['yields'][lid] !== 0){
                sbody = '<tr> \
                    <th>Total Yield (<abbr title="Megabases">Mb</abbr>):</th> \
                    <td>' + data['yields'][lid] + "</td> \
                </tr>";
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
                    </table>');
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
                                <th>Yield (<abbr title="Megabases">Mb</abbr>)</th> \
                                <th># Reads</th> \
                                <th>% &gt; Q30</th> \
                                <th>Barcode</th> \
                                <th>Index description</th> \
                            </tr>';
            for (samplerunid in data['lane'][lid]){
                var q30 = parseFloat(data['lane'][lid][samplerunid]['overthirty']);
                lbody += "<tr> \
                    <td>" + data['lane'][lid][samplerunid]['Project'] + "</td> \
                    <td>" + data['lane'][lid][samplerunid]['SampleName'] + '</td> \
                    <td class="text-right">' + data['lane'][lid][samplerunid]['yield'] + '</td> \
                    <td class="text-right">' + data['lane'][lid][samplerunid]['readsnb'] + '</td> \
                    <td class="text-right ';
                    if (q30 < 30) lbody += 'danger';
                    else if(q30 < 80) lbody += 'warning';
                    else if(q30 < 100) lbody += 'success';
                lbody += '">' + data['lane'][lid][samplerunid]['overthirty'] + "</td>\
                    <td>" + data['lane'][lid][samplerunid]['barcode'] + "</td> \
                    <td>" + data['lane'][lid][samplerunid]['desc'] + "</td> \
                </tr>";
            }
            lbody += '</tbody></table>';
            $('#lane_'+lid).removeClass('hidden').append(lbody);
        }

    }
    
    // Remove the loading text
    $('#loading_spinner').hide();
    $('#page_content').show();

    // console.log(data)
}).error(function(){
    // Flow cell not found - probably
    $('#page_content').html('<h1>Error - Flow Cell Not Found</h1><div class="alert alert-danger">Oops! Sorry about that, we can\'t find the flow cell <strong>'+flowcell+'</strong></div>');

    // Remove the loading text
    $('#loading_spinner').hide();
    $('#page_content').show();
});
