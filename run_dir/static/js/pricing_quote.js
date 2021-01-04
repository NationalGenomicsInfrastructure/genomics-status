app.component('pricing-preview', {
    data: function() {
        return {
          dataTable: null
        }
    },
    computed: {
        data_loading() {
            return this.$root.data_loading
        }
    },
    watch: {
      data_loading(new_val, old_val) {
        this.$nextTick(() => {
          this.init_listjs()
        })
      }
    },
    methods: {
        init_listjs() {
            this.dataTable = $('#pricing_products_table').DataTable({
              "paging":false,
              "info":false,
              "order": [[ 0, "desc" ]]
            });

            this.dataTable.columns().every( function () {
                var that = this;
                $( 'input', this.footer() ).on( 'keyup change', function () {
                    that
                    .search( this.value )
                    .draw();
                } );
            } );

            $('#pricing_products_table_filter').addClass('col-md-2');
            $("#pricing_products_table_filter").appendTo("#table_h_and_search");
            $('#pricing_products_table_filter label input').appendTo($('#pricing_products_table_filter'));
            $('#pricing_products_table_filter label').remove();
            $('#pricing_products_table_filter input').addClass('form-control p-2 mb-2 float-right');
            $("#pricing_products_table_filter input").attr("placeholder", "Search table...");
          }
        },
    template:
        /*html*/`
        <div class="row">
          <h1 class="col-md-11"><span id="page_title">Project Quote</span></h1>
        </div>
        <template v-if="this.data_loading">
          <div>
            Loading!
          </div>
        </template>
        <template v-else>
          <div class="row">
            <div class="col-8 quote_lcol_header">
              <div class="radio" id="price_type_selector">
                <label class="radio-inline py-2 pr-2">
                  <input type="radio" name="price_type" value="sweac" checked> Swedish academia
                </label>
                <label class="radio-inline p-2">
                  <input type="radio" name="price_type" value="full"> Industry and non-Swedish academia
                </label>
                <label class="radio-inline p-2">
                  <input type="radio" name="price_type" value="internal"> Internal
                </label>
              </div>
              <span id='other_cost_container' class='other_updateable py-2 pr-2'>
                  <label for='other_cost_input'>Other cost</label>
                  <input id='other_cost_input' placeholder='SEK'>
              </span>
              <span id='discount_container' class='other_updateable py-2'>
                  <label for='discount_input'>Discount</label>
                  <input id='discount_input' placeholder='%'>
              </span>
              <div class="form-text text-muted text-sm">
                  Other cost is applied directly to all three price types. Discount is applied last.
              </div>

              <button class="btn btn-link" id="more_options_btn" type="button" data-toggle="collapse" data-target="#more_options" aria-expanded="false" aria-controls="more_options">
                More Options
              </button>
              <div class="collapse border-top py-3" id="more_options">
                <button type="button" class="btn btn-warning" id="toggle_discontinued">Show Discontinued Products <i class="fas fa-exclamation-triangle fa-lg pl-2"></i></button>
              </div>
            </div>
            <div class="col-4">
              <exchange-rates :mutable="true" :issued_at="this.$root.exch_rate_issued_at"/>
            </div>
          </div>
          <div id="alerts_go_here">
          </div>
          <div class="row py-2" id="current_quote">
            <div class="col-md-8 col-xl-6 quote_lcol_header">
              <h3>Products</h3>
              <span class="help-block">
                To use fractions of units, please use full stop and not decimal comma.
              </span>
              <div id='product_warnings'></div>
              <ul class="quote-product-list list-unstyled">
              </ul>
            </div>
            <div class="col-md-4 col-xl-6 border-left">
              <h3>Totals</h3>
              <ul class="quote-totals-list list-unstyled">
              </ul>
            </div>
          </div>
          <div class="products_chooseable_div">
            <div class="row" id="table_h_and_search">
              <h2 class="col mr-auto">Available Products</h2>
            </div>
            <table class="table table-sm sortable" id="pricing_products_table">
              <thead class="table-light">
                <tr class="sticky">
                  <th>Quoting</th>
                  <th class="sort" data-sort="id">ID</th>
                  <th class="sort" data-sort="category">Category</th>
                  <th class="sort" data-sort="type">Type</th>
                  <th class="sort" data-sort="name">Name</th>
                  <th class="sort" data-sort="components">Components</th>
                  <th class="sort" data-sort="alternative_components">Alternative Components</th>
                  <th calss="sort" data-sort="full_cost_fee">Full Cost Fee</th>
                  <th class="sort" data-sort="overhead">Overhead</th>
                  <th class="sort" data-sort="price_internal">Internal Price (SEK)</th>
                  <th class="sort" data-sort="price_academic">Academic</th>
                  <th class="sort" data-sort="full_cost">Full Cost</th>
                  <th class="sort" data-sort="comment">Comment</th>
                </tr>
              </thead>
              <tfoot class="table-light">
                <tr>
                  <th></th>
                  <th class="sort" data-sort="id"><input class="form-control search search-query" type="text" placeholder="Search ID" /></th>
                  <th class="sort" data-sort="category"><input class="form-control search search-query" type="text" placeholder="Search Category" /></th>
                  <th class="sort" data-sort="type"><input class="form-control search search-query" type="text" placeholder="Search Type" /></th>
                  <th class="sort" data-sort="name"><input class="form-control search search-query" type="text" placeholder="Search Name" /></th>
                  <th class="sort" data-sort="components"><input class="form-control search search-query" type="text" placeholder="Search Components" /></th>
                  <th class="sort" data-sort="alternative_components"><input class="form-control search search-query" type="text" placeholder="Search Alternative Components" /></th>
                  <th calss="sort" data-sort="full_cost_fee"><input class="form-control search search-query" type="text" placeholder="Search Alternative Components" /></th>
                  <th class="sort" data-sort="overhead"><input class="form-control search search-query" type="text" placeholder="Search Overhead" /></th>
                  <th class="sort" data-sort="price_internal"><input class="form-control search search-query" type="text" placeholder="Search Internal Price (SEK)" /></th>
                  <th class="sort" data-sort="price_academic"><input class="form-control search search-query" type="text" placeholder="Search Academic Price" /></th>
                  <th class="sort" data-sort="full_cost"><input class="form-control search search-query" type="text" placeholder="Search Full Cost" /></th>
                  <th class="sort" data-sort="comment"><input class="form-control search search-query" type="text" placeholder="Search Comment" /></th>
                </tr>
              </tfoot>
              <tbody class="list" id='pricing_products_tbody'>
              <template v-for="product in this.$root.all_products" :key="product['REF_ID']">
                <product-table-row :product_id="product['REF_ID']">
                </product-table-row>
              </template>
              </tbody>
            </table>
          </div>
        </template>
        `
})

app.component('product-table-row', {
    props: ['product_id'],
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
        },
        discontinued() {
            return (this.product['Status'] == 'Discontinued')
        },
        isNew() {
            return this.$root.new_products.has(this.product_id)
        },
        isFixedPrice() {
            return this.product.is_fixed_price
        },
        categories() {
            return this.$root.product_categories
        },
        types() {
            return this.$root.product_types
        },
        cost() {
            // Returns a {'cost': cost, 'cost_academic': cost_academic, 'full_cost': full_cost}
            return this.$root.productCost(this.product_id)
        }
    },
    template: /*html*/`
      <tr class="status_{{product['Status'].lower()}}">
          <td>
              <a href="#0" class="button add-to-quote" data-product-id="{{product['REF_ID']}}"><i class="far fa-plus-square fa-lg"></i></a>
              <span>(<span id="count_in_table_{{product['REF_ID']}}">0</span>)</span>
          </td>
          <td class="id">
              {{product['REF_ID']}}
          </td>
          <td class="category">
              {{product['Category']}}
          </td>
          <td class="type">
              {{product['Type']}}
          </td>
          <td class="name">
              {{product["Name"]}}
          </td>
          <td class="components">
            <product-table-components :product_id="product_id" :type="'Regular'">
            </product-table-components>
          </td>
          <td class="alternative_components">
            <product-table-components :product_id="product_id" :type="'Alternative'">
            </product-table-components>
          </td>
          <td class="full_cost_fee">
              {{product["Full cost fee"]}}
          </td>
          <td class="overhead">
              {{product["Re-run fee"]}}
          </td>
          <td class="price_internal">
              {{cost['cost'].toFixed(2)}}
          </td>
          <td class="price_academic">
              {{cost['cost_academic'].toFixed(2)}}
          </td>
          <td class="full_cost">
              {{cost['full_cost'].toFixed(2)}}
          </td>
          <td class="comment">
              {{product["Comment"]}}
          </td>
      </tr>
    `
})

app.component('product-table-components', {
    props: ['product_id', 'type'],
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
        },
        componentIds() {
            if (this.type == 'Alternative') {
                return Object.keys(this.product['Alternative Components'])
            } else {
                return Object.keys(this.product['Components'])
            }
        },
        components() {
            return this.$root.populatedComponents(this.product['REF_ID'], this.type)
        }
    },
    template: /*html*/`
        <template v-for="(component_data, comp_id) in components" :key="comp_id">
          <div>{{component_data['component']['Product name']}}</div>
        </template>
      `
})

app.mount('#pricing_quote_main')
