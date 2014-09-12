$.getJSON("/api/v1/flowcells", function(data) {
  var tbl_bdy = "";
  $.each(data, function(flowcell, info) {  
    var system="-";
    if (info['type']){
        system=info['type'].split(" ")[0];
    }
    var mode="-";
    if (info['mode']){
        mode=info['mode'];
    }
    var chem="-";
    if (info['fctype']){
        var ar=info['fctype'].split(" ");
        chem=ar[ar.length-1];
    }else if (info['kitver']){
        chem=info['kitver'].substr(info['kitver'].length-2);
        
    }
    var recipe='-';
    if (info['recipe']){
        recipe=info['recipe'];
    }
    var version='-';
    if (info['appver']){
        version=info['appver'];
    }
    var yield='-';
    if (info['yield']){
        yield=info['yield'];
    }



    var tbl_row = "<td>"
    tbl_row += "<a href='/flowcells/" + flowcell + "'>"
    tbl_row += info["run id"] + '</a></td>'
    tbl_row += '<td>' + info['startdate'] + '</td>'
    tbl_row += '<td>' + system+ '</td>'
    tbl_row += '<td>' + mode+ '</td>'
    tbl_row += '<td>' + chem+ '</td>'
    tbl_row += '<td>' + recipe + '</td>'
    tbl_row += '<td>' + version + '</td>'
    tbl_row += '<td>' + yield + '</td>'
    tbl_row += '<td>' + info['flowcell'] + '</td>'
    tbl_row += '<td>' + info['pos'] + '</td>'
    tbl_row += '<td>' + info['instrument'] + '</td>'
    tbl_bdy += "<tr>" + tbl_row + "</tr>";
  })

  $("#fc_table tbody").html(tbl_bdy);
})

