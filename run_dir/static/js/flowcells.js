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
        console.log(ar);
        chem=ar[ar.length-1];
    }

    var recipe='-';
    if (info['recipe']){
        recipe=info['recipe'];
    }


    var tbl_row = "<td>"
    tbl_row += "<a href='/flowcells/" + flowcell + "'>"
    tbl_row += info["run id"] + '</a></td>'
    tbl_row += '<td>' + info['startdate'] + '</td>'
    tbl_row += '<td>' + system+ '</td>'
    tbl_row += '<td>' + mode+ '</td>'
    tbl_row += '<td>' + chem+ '</td>'
    tbl_row += '<td>' + info['recipe'] + '</td>'
    tbl_row += '<td>' + info['appver'] + '</td>'
    tbl_row += '<td>' + info['flowcell'] + '</td>'
    tbl_row += '<td>' + info['pos'] + '</td>'
    tbl_row += '<td>' + info['instrument'] + '</td>'

    tbl_bdy += "<tr>" + tbl_row + "</tr>";
  })

  $("#fc_table tbody").html(tbl_bdy);
})

