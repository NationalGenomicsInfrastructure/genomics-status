
//globals are on purpose
var wsdata={};
var posdata=[];
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
var margin_left=108;
var margin_top=84;
var interval=67;
var max_x=858;
var max_y=556;

window.pools_nb=6;
window.projects=[]

$(function(){
    init_page_js();
});

function  init_page_js(){

   $("#wait1").hide();
   $("#wait2").hide();

   $("#sub_pools_number").click(function(e){
    $("#wait1").show();
       e.preventDefault();
       submit_base_data();
   });
}
function submit_base_data(){
    //fetch data from LIMS 
    $("#second_step").html("");
    $.getJSON("/api/v1/load_workset_samples", $("#lims_url").val(), function(data){
        wsdata=data;
        //if no pool number given, assume one per project
       if ($("#pools_number").val() != ''){
           window.pools_nb=parseInt($("#pools_number").val());
       }else{
           window.pools_nb=0; 
           window.projects=[]
           var pj='';
           for (s in data.samples){
               pj=s.split('_')[0];
               if (window.projects.indexOf(pj)==-1){
                   window.pools_nb++;
                   window.projects.push(pj);
               }
           }
           window.projects.sort();
           $("#pools_number").val(window.pools_nb);
       }
       //first div, projects comments
       var project_comments_div='<div id="project_comments_div"><table class="table table-striped table-bordered"><tr><th>Project</th><th>Comment</th></tr>';
       for (pc in data['comments']){
           project_comments_div+='<tr><td>'+make_project_links(pc)+'</td><td>'+make_markdown(data['comments'][pc])+'</td></tr>';
       }
       project_comments_div+='</table></div>';
       $("#second_step").append(project_comments_div);
       //second div, search box for third div
       var sorted_samples=Object.keys(data['samples']).sort();
       var sample_search_div='<div id="sample_search_div" style="margin-bottom:10px;"><form class="form-inline""><input id="sample_search_string" class="form-control" type="text" style="margin-right:10px;"/><select id="sample_pool_select" style="margin-right:10px;">';
        for (i=1;i<=window.pools_nb;i++){
            sample_search_div+='<option value="'+i+'"> Pool '+i+'</option>';
            }
       sample_search_div+='</select><button id="submit_set_pool" class="btn btn-submit">Set</button>';
       sample_search_div+='<button class="btn btn-default pull-right" id="add_pool_btn">Add pool</button></form></div>'
       $("#second_step").append(sample_search_div);
       var samples_div='<div id="samples_div"><table class="table table-striped table-bordered"><tr><th>Sample</th><th>Chooser</th><th>Amount</th><th>Previous Preps</th><th>Library info</th><th>Platform</th></tr>';
       //third div, table with sample information and pool select. 
       for (d in sorted_samples){
            samples_div+='<tr>';
            samples_div+='<td>'+sorted_samples[d]+'</td>';
            samples_div+='<td><form><select data-sample="'+sorted_samples[d]+'" class="pool_select" id="pool_select_'+sorted_samples[d]+'">';
            for (i=1;i<=window.pools_nb;i++){
                samples_div+='<option value="'+i+'"';
                //if no pools were given, auto select one pool per project
                if (window.projects.length!=0 && window.projects.indexOf(sorted_samples[d].split('_')[0]) +1 == i){
                    samples_div+=" selected";
                }
                samples_div+='> Pool '+i+'</option>';
            }
            samples_div+='</select></form></td>';
            samples_div+='<td>'+data['samples'][sorted_samples[d]]['amount']+' ng</td>';
            samples_div+='<td><ul>';
            for (ws in data['samples'][sorted_samples[d]]['previous_preps']){
                samples_div+='<li><a href="/workset/'+ws+'">'+ws+'</a> : ';
                samples_div+='<span class="basic_rule" data-rule="'+sorted_samples[d]+'@'+data['samples'][sorted_samples[d]]['previous_preps'][ws]['position']+'">'+data['samples'][sorted_samples[d]]['previous_preps'][ws]['position']+'</span> ';
                samples_div+=data['samples'][sorted_samples[d]]['previous_preps'][ws]['amount']+' ng</li>';
            }
            samples_div+='</ul></td>';
            samples_div+='<td>'+data['samples'][sorted_samples[d]]['lib_method']+'</td>';
            samples_div+='<td>'+data['samples'][sorted_samples[d]]['seq_pl']+'</td>';
            samples_div+='</tr>';
       } 
       samples_div+='</table></div>';
       $("#second_step").append(samples_div);
       //fourth div, pool summary
       var html_content="";
       var html_rules="";
       var html_type="";
       var div='<table id="final_table" class="table table-striped table-bordered"><tr><th></th><th>Samples</th><th>Type</th>';//<th>Rules</th></tr>';
       for (i=1;i<=window.pools_nb;i++){
           div+="<tr><td>Pool&nbsp;"+i+"</td>";
           div+='<td><ul class="list-inline" id="content_pool_'+i+'"></ul></td>';
           div+='<td><select id="type_pool_'+i+'"><option value="hiseq">Hiseq/Miseq</option><option value="hiseqx">HiseqX</option></select></td>';
           div+='</tr>';

       }
       div+="</table>";
       $("#second_step").append(div);
       //fifth div : rules
       var rules_div='<div id="rules_div"><form><input type="textarea" class="form-control" id="final_rules" ></textarea></form></div>';
       $("#second_step").append(rules_div);
       //update the rules, only one per sample
       var seen_rules=[];
       $(".basic_rule").each(function(){
           var sample=$(this).data('rule').split("@")[0]
           if (seen_rules.indexOf(sample)==-1){
               seen_rules.push(sample);
               $("#final_rules").val($("#final_rules").val()+' '+$(this).data('rule'));
           }
       
       });
       //put the samples in the right pools
       for (d in sorted_samples){
             var pool=$("#pool_select_"+sorted_samples[d]).val();
             $("#content_pool_"+pool).append('<li id="label_'+sorted_samples[d]+'">'+sorted_samples[d]+'</li>');
       }
        //set up trigger for the search box
       $("#submit_set_pool").click(function(e){
        e.preventDefault(); 
        e.stopImmediatePropagation();
        var search_string=$("#sample_search_string").val();
        var pool=$("#sample_pool_select option:selected").val();
        var sample;
        $(".pool_select").each(function(){
            sample=$(this).data('sample');
            if (sample.indexOf(search_string)!= -1){
                $(this).val(pool);
                pools_update(sample, pool);
            }
        });
       });

       $("#add_pool_btn").click(function(e){
           e.preventDefault();
           window.pools_nb++;
           $("#sample_pool_select").append($('<option>', {
                   value: window.pools_nb,
                   text: 'Pool '+window.pools_nb
           }));
           $(".pool_select").each(function(){
               $(this).append($('<option>', {
                   value: window.pools_nb,
                   text: 'Pool '+window.pools_nb
               }));
           });
           var added_row='';
           added_row+="<tr><td>Pool&nbsp;"+window.pools_nb+"</td>";
           added_row+='<td><ul class="list-inline" id="content_pool_'+window.pools_nb+'"></ul></td>';
           added_row+='<td><select id="type_pool_'+i+'"><option value="hiseq">Hiseq/Miseq</option><option value="hiseqx">HiseqX</option></select></td>';
           added_row+='</tr>';
           $('#final_table tr:last').after(added_row);

       });

       //trigger for changing one sample's pool select
       $(".pool_select").change(function(){
           var sn=$(this).data('sample');
           var pool=$(this).find(":selected").val();
           pools_update(sn, pool);
       });
        //adding the next button
       $("#second_step").append('<div class="row text-center"><button class="btn btn-default" id="sub_second_step" >Next</button></div>');
       $("#sub_second_step").click(function(e){
           if(validate_pools()){
               start_main();
           }
       });
    $("#wait1").hide(); 
    });
}
function validate_pools(){
    if (Object.keys(wsdata.samples).length >96){
        alert("More than 96 samples detected, aborting.");
        return false
    }
    var hsp=0;
    var hxp=0
    var mysamples;
    var type;
    for (i=1;i<=window.pools_nb;i++){
        mysamples=[];
        type=$( "#type_pool_"+i+" option:selected" ).val();
        $("#content_pool_"+i+" li").each(function(idx, el){mysamples.push($(el).text());});
        if (type == 'hiseqx'){
            hxp++;
            if (mysamples.length > 12){
                alert("This tool cannot handle HiseqX pools bigger than 12 samples (pool "+i+")");
                return false;
            }
        }else{
            hsp++;
        }
        if (hxp>8){
            alert("This tool cannot handle more than 8 HiseqX pools");
            return false
        }
    }
    return true
}
function pools_update(sn, pool){
           $("#label_"+sn).remove();
           $("#content_pool_"+pool).append('<li id="label_'+sn+'">'+sn+'</li>');
}
function start_main(){
    $("#wait2").show(); 
    var data={};
    var key="";
    data['rules']=$('#final_rules').val();
    data['pools']={};
    data['pools']['hiseq']=[];
    data['pools']['hiseqx']=[];
    for (i=1;i<=window.pools_nb;i++){
        mysamples=[];
        type=$( "#type_pool_"+i+" option:selected" ).val();
        $("#content_pool_"+i+" li").each(function(idx, el){mysamples.push($(el).text());});
        data['pools'][type].push(mysamples);
    }
    $.ajax({
        url : "/api/v1/generate_workset",
        dataType   : 'json',
        contentType: 'application/json; charset=UTF-8',
        data:JSON.stringify(data),
        type       : 'POST'
    }).done(function(return_data){
        $("#wait2").hide(); 
        window.posdata=return_data;
        setupPlate(return_data);
        var btn="<button class='btn btn-primary' id='submit_lims'>Submit to the LIMS</button>";
        $("#submit_lims_div").append(btn);
        $("#submit_lims").click(function(e){
            $("#submit_lims").attr("disabled", true);
            $("#submit_lims").text("Submitting...");
            var send_data={lims_url:$("#lims_url").val(), mat:window.posdata};
             $.ajax({
                 url : "/api/v1/ws_pl_to_lims",
                 dataType   : 'json',
                 contentType: 'application/json; charset=UTF-8',
                 data:JSON.stringify(send_data),
                 type       : 'POST'
             }).done(function(status_data){
                $("#submit_lims").attr("disabled", false);
                $("#submit_lims").text("Submit to the LIMS");


             });
        
        });

    });
}
function setupPlate(data){
    ctx.fillStyle = 'black';
    ctx.font = '12pt Calibri';
    ctx.textAlign = 'center';
    for (var i = margin_left; i <= max_x; i+=interval){
        ctx.fillText((i-margin_left)/interval+1, i, margin_top/2);
    }
    for (var i = margin_top; i <= max_y; i+=interval){
        ctx.fillText(String.fromCharCode((i-margin_top)/interval+65), margin_left/2, i);
    }

    var colors=chroma.cubehelix().lightness([0.3, 0.6]).scale().correctLightness().colors(window.pools_nb);
    var sn;
    var pool;
    console.log(data);
    for (var i = margin_left; i <= max_x; i+=interval){
        for (var j=margin_top; j<=max_y; j+=interval){
            sn=data[(j-margin_top)/interval][(i-margin_left)/interval];
            if (sn!=''){
                pool=$("#pool_select_"+sn).val();
                drawWell(i, j, sn, colors[pool-1], chroma(colors[pool-1]).darken(2).hex());
            }else{
                drawWell(i, j, sn, '#ededed', '#333333');
            }
        }
    }
}
function drawWell(centerX, centerY, sid, col1, col2){
    ctx.beginPath();
    ctx.arc(centerX,centerY,24,0,2*Math.PI);

    ctx.fillStyle=col1;
    ctx.strokeStyle=col2;
    ctx.fill()
    ctx.fillStyle=col2;
    ctx.font = '8pt Calibri';
    ctx.textAlign = 'center';
    ctx.fillText(sid, centerX, centerY+4);

    ctx.stroke();
}
