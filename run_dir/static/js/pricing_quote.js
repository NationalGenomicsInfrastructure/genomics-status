// Globals
var productsInQuote = [];
var allProducts;
var quoteProdEl = $('.quote-product-list');
var quoteTotEl = $('.quote-totals-list');


$( document ).ready(function() {
  /* Initialize active elements */
  $("#datepicker").datepicker()
  $("#datepicker-btn").click(function(e) {
      var date = $("#datepicker").val();
      var original_html = $(this).text();
      $(this).html('<span class="glyphicon glyphicon-refresh glyphicon-spin"></span> <em>Loading...</em>');
      var that = this;
      tableLoad(date, allProducts, function() {
          $(that).html(original_html);
          $("#exch_rate_modal").modal('hide');
          generateQuoteList();
          /* Fetch used exchange rate to update html*/
          $.getJSON('/api/v1/pricing_exchange_rates?date='+date, function(data){
              $("#exch_rate_usd").text(parseFloat(data['USD_in_SEK']).toFixed(2));
              $("#exch_rate_eur").text(parseFloat(data['EUR_in_SEK']).toFixed(2));
              $("#exch_rate_issued_at").text(data['Issued at'].substring(0,10));
          });
      });

      $("#success-alert").fadeTo(5000, 500).slideUp(500, function(){
          $("#success-alert").slideUp(500);
      });
  });

  $('#price_type_selector input').change(function(e) {
      /* Regenerate the quote list to show the new prices */
      generateQuoteList();
  });

  tableLoad(null, null, function(){
      /* need to wait until table has loaded before initializing the dataTable */
      init_listjs();
  });
});

function tableLoad(date=null, products=null, _callback=null) {
  // Table is loaded dynamically to enable switching of exchange rate date
  products_tbody_url = '/pricing_quote_tbody'
  products_url = '/api/v1/pricing_products'

  if (date !== null){
      products_tbody_url += '?date=' + date
      products_url += '?date=' + date
  };

  $('#pricing_products_tbody').load(products_tbody_url, function(){
    $.getJSON(products_url, function(data){
      allProducts = data;
        // Initialize all quantities as 0 unless already modified products
        // are given
      for (var key in allProducts) {
        if (products !== null){
          allProducts[key].quantity = products[key].quantity;
          /* Reset the number on table row */
          updateTableCounts(products[key]);
        } else {
          allProducts[key].quantity = 0;
        }
      };
      /* Reload data when date changes */
      resetCurrentQuote();

      if (products !== null){
          generateQuoteList();
      }


      // Activate the add-to-quote buttons
      $('.add-to-quote').on('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        product_id = $(this).attr('data-product-id')
        addToQuote(product_id);
        $('#current_quote').show();
      });

    });

    if (_callback !== null){
      _callback();
    };
  });
};

function resetCurrentQuote(){
  $('#current_quote').hide();
  quoteProdEl.html('');
  quoteTotEl.html('');
  $('#product_warnings').html('');
}

// Add one item of the product to the quote
function addToQuote(id) {
  var obj = allProducts[id];
  obj.quantity++;
  updateTableCounts(obj);
  generateQuoteList();
}

function generateQuoteList() {
  /* Everytime the list changes, it is regenerated */
  resetCurrentQuote();
  var empty = true;
  price_type = $("input[name='price_type']:checked").val();
  var totalCostSweAc = 0;
  var totalCostInternal = 0;
  var overhead = parseInt($('#overhead_value').first().html());
  for (var product_id in allProducts) {
    var product = allProducts[product_id];
    var warning_txt = '';
    if (product.quantity > 0) {
      /* check correct number of units */
      class_string = ''
      if (product["Minimum Quantity"] !== ''){
          if (product.quantity % parseInt(product["Minimum Quantity"]) !== 0) {
              class_string = ' class="text-danger"'
              warning_txt = `Quantity for ` + product.Name + ` is not a multiple of its minimum quantity: ` + product["Minimum Quantity"]
          }
      }
      empty = false;
      var li = `<li data-quantity=${product.quantity}` + class_string + ` data-product-id=${product_id}>` +
        `<a href='#' class='remove_product' data-product-id=${product.REF_ID}><i class="glyphicon glyphicon-remove text-danger"></i></a> ` +
        `<input class='quantity_updateable' data-product-id=${product.REF_ID} min=0 value=${product.quantity}> ` +
        `<span class='quote_product_name'>${product.Name}</span>` +
        `<span class='quote_product_prices_line'><span class='quote_product_price'>`
      switch(price_type) {
          case "internal":
            li += `${(product.price_internal * product.quantity).toFixed(0)}`;
            break;
          case "sweac":
            li += `${(product.price_external * product.quantity).toFixed(0)}`;
            break;
          case "nonswe":
            li += `${(product.price_external * product.quantity * (1+overhead)).toFixed(0)}`;
      }
      li += ` SEK</span></span></li>`;
      totalCostSweAc += product.price_external * product.quantity;
      totalCostInternal += product.price_internal * product.quantity;

      quoteProdEl.append(li);
      applyWarning(warning_txt);
    }
  }
  other_cost = parseFloat($('#other_cost_input').val());
  other_cost = isNaN(other_cost) ? 0 : other_cost;

  discount = parseFloat($('#discount_input').val());
  discount = isNaN(discount) ? 0 : discount;
  discount_factor = 1-(discount/100.0);

  totalCostInternal += other_cost;
  totalCostInternal = totalCostInternal * discount_factor

  totalCostNonSwe = (other_cost + totalCostSweAc * (1+overhead)) * discount_factor;

  // Add to SweAc cost last since it would affect nonswe cost otherwise
  totalCostSweAc += other_cost;
  totalCostSweAc = totalCostSweAc * discount_factor

  /* Only show quote if non-empty */
  if (!empty){
    $('#current_quote').show();
    var totals_div = document.createElement("dl");
    totals_div.setAttribute("class", "quote_totals");
    var p = document.createElement("p");
    if (price_type !== 'sweac'){
      p.setAttribute('class', 'text-muted')
    }
    p.innerHTML = `<dt class='quote_totals_def quote_sweac'>Swedish academia:</dt><dd class='quote_totals_val quote_sweac'>${Math.ceil(totalCostSweAc)} SEK</dd>`;
    totals_div.append(p);

    var p = document.createElement("p");
    if (price_type !== 'nonswe'){
      p.setAttribute('class', 'text-muted')
    }
    p.innerHTML = `<dt class='quote_totals_def quote_nonswe'>Industry and non-Swedish academia:</dt><dd class='quote_totals_val quote_nonswe'>${Math.ceil(totalCostNonSwe)} SEK</dd>`;
    totals_div.append(p);

    var p = document.createElement("p");
    if (price_type !== 'internal'){
      p.setAttribute('class', 'text-muted')
    }
    p.innerHTML = `<dt class='quote_totals_def quote_internal'>Internal projects:</dt><dd class='quote_totals_val quote_internal'>${Math.ceil(totalCostInternal)} SEK</dd>`;
    totals_div.append(p);

    quoteTotEl.append(totals_div);
  }

  function updateQuantity(product, new_quantity){
    if ((new_quantity.length === 0) || (new_quantity < 0)) {
      // Invalid value given
      $("ul").find(`li[data-product-id='${product.REF_ID}']`).addClass("text-danger");
      var warning_txt=`Incorrectly entered value for ` + product.Name
      applyWarning(warning_txt);
      return;
    }
    product.quantity = new_quantity;

    updateTableCounts(product);
    generateQuoteList();
  }

  $('.other_updateable').change(function(e) {
      generateQuoteList();
  })

  $('.quantity_updateable').change(function(e) {
    var product_id = $(this).data('product-id');
    var new_quantity = parseFloat($(this).val());
    // Check that the number makes sense
    if (! isNaN(new_quantity)) {
        updateQuantity(allProducts[product_id], new_quantity);
    }
  });

  $('.remove_product').on('click', function(e) {
    $(this).parent('li').remove();
    var product_id = $(this).data('product-id');
    updateQuantity(allProducts[product_id], 0)
  });

  // generateCartButtons()
}

function applyWarning(warning_txt){
  if (warning_txt !== '') {
    var warning_html = ``+
      `<div class="alert alert-warning alert-dismissable" role="alert">`+
        `<button type="button" class="close" data-dismiss="alert" aria-label="Close">`+
          `<span aria-hidden="false">&times;</span>`+
        `</button>`+
        `<h4>Warning</h4>`+
        `<p>`+warning_txt+`</p>`+
      `</div>`;
    $('#product_warnings').append(warning_html);
  };
}

function updateTableCounts(product) {
  $(`#count_in_table_${product.REF_ID}`).html(product.quantity);
}

// Initialize sorting and searching javascript plugin
function init_listjs() {
    // Setup - add a text input to each footer cell
    $('#pricing_products_table tfoot th').each( function () {
      var title = $('#pricing_products_table thead th').eq( $(this).index() ).text();
      $(this).html( '<input size=10 type="text" placeholder="Search '+title+'" />' );
    } );

    var table = $('#pricing_products_table').DataTable({
      "paging":false,
      "info":false,
      "order": [[ 0, "desc" ]]
    });

    //Add the bootstrap classes to the search thingy
    $('div.dataTables_filter input').addClass('form-control search search-query');
    $('#pricing_products_table_filter').addClass('form-inline pull-right');
    $("#pricing_products_table_filter").appendTo("h1");
    $('#pricing_products_table_filter label input').appendTo($('#pricing_products_table_filter'));
    $('#pricing_products_table_filter label').remove();
    $("#pricing_products_table_filter input").attr("placeholder", "Search table...");
    // Apply the search
    table.columns().every( function () {
        var that = this;
        $( 'input', this.footer() ).on( 'keyup change', function () {
            that
            .search( this.value )
            .draw();
        } );
    } );
}
