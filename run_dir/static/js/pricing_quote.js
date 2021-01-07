app.component('pricing-preview', {
    data: function() {
        return {
          dataTable: null,
          show_discontinued: false,
          quote_prod_ids: {},
          price_type: 'cost_academic'
        }
    },
    computed: {
      any_quote() {
        return Object.keys(this.quote_prod_ids).length
      },
      data_loading() {
          return this.$root.data_loading
      },
      quote_cost() {
        cost_sum = 0
        cost_academic_sum = 0
        full_cost_sum = 0
        for ([prod_id, prod_count] of Object.entries(this.quote_prod_ids)) {
          cost_sum += prod_count * this.productCost(prod_id)['cost'];
          cost_academic_sum += prod_count * this.productCost(prod_id)['cost_academic'];
          full_cost_sum +=  prod_count * this.productCost(prod_id)['full_cost'];
        }
        return {'cost': cost_sum.toFixed(2),
                'cost_academic': cost_academic_sum.toFixed(2),
                'full_cost': full_cost_sum.toFixed(2)}
      },
    },
    watch: {
      data_loading(new_val, old_val) {
        /* have to wait for the table to be drawn */
        this.$nextTick(() => {
          this.init_listjs()
        })
      }
    },
    methods: {
        add_prod_to_quote(prod_id) {
            if (!(prod_id in this.quote_prod_ids)) {
                this.quote_prod_ids[prod_id] = 0
            }
            this.quote_prod_ids[prod_id] += 1
        },
        productCost(prod_id) {
            // Returns a {'cost': cost, 'cost_academic': cost_academic, 'full_cost': full_cost}
            return this.$root.productCost(prod_id)
        },
        init_listjs() {
            this.dataTable = $('#pricing_products_table').DataTable({
              "paging":false,
              "info":false,
              "order": [[ 1, "asc" ]]
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
        },
        reset_listjs() {
            $('#pricing_products_table').DataTable().destroy();
            $('#pricing_products_table_filter').remove();
        },
        toggle_discontinued() {
            this.reset_listjs()
            this.show_discontinued = !this.show_discontinued

            this.$nextTick(() => {
              this.init_listjs()
            })
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
                  <input type="radio" name="price_type" v-model="price_type" value="cost_academic" checked> Swedish academia
                </label>
                <label class="radio-inline p-2">
                  <input type="radio" name="price_type" v-model="price_type" value="full_cost"> Industry and non-Swedish academia
                </label>
                <label class="radio-inline p-2">
                  <input type="radio" name="price_type" v-model="price_type" value="cost"> Internal
                </label>
              </div>

              <button class="btn btn-link" id="more_options_btn" type="button" data-toggle="collapse" data-target="#more_options" aria-expanded="false" aria-controls="more_options">
                More Options
              </button>
              <div class="collapse border-top py-3" id="more_options">
                <template v-if="show_discontinued">
                  <button type="button" class="btn btn-success" @click="toggle_discontinued">Hide Discontinued Products <i class="fas fa-book-heart fa-lg pl-2"></i></button>
                </template>
                <template v-else>
                  <button type="button" class="btn btn-warning" @click="toggle_discontinued">Show Discontinued Products <i class="fas fa-exclamation-triangle fa-lg pl-2"></i></button>
                </template>
              </div>
            </div>
            <div class="col-4">
              <exchange-rates :mutable="true" :issued_at="this.$root.exch_rate_issued_at"/>
            </div>
          </div>
          <div id="alerts_go_here">
          </div>
          <template v-if="this.any_quote">
            <div class="row py-2" id="current_quote">
              <div class="col-md-8 col-xl-6 quote_lcol_header">
                <h3>Products</h3>
                <span class="help-block">
                  To use fractions of units, please use full stop and not decimal comma.
                </span>
                <div id='product_warnings'></div>
                <ul class="list-unstyled">
                  <template v-for="(prod_count, prod_id) in this.quote_prod_ids" :key="prod_id">
                    <quote-list-product :product_id="prod_id" :product_count="prod_count" :price_type="price_type"/>
                  </template>
                </ul>
              </div>
              <div class="col-md-4 col-xl-6 border-left">
                <h3>Totals</h3>
                <ul class="quote-totals-list list-unstyled">
                  <dl class="quote_totals">
                    <p :class="{'text-muted': (price_type != 'cost_academic')}">
                      <dt>Swedish academia:</dt>
                      <dd>{{quote_cost['cost_academic']}} SEK</dd>
                    </p>
                    <p :class="{'text-muted': (price_type != 'full_cost')}">
                      <dt>Industry and non-Swedish academia:</dt>
                      <dd>{{quote_cost['full_cost']}} SEK</dd>
                    </p>
                    <p :class="{'text-muted': (price_type != 'cost')}">
                      <dt>Internal projects:</dt>
                      <dd>{{quote_cost['cost']}} SEK</dd>
                    </p>
                  </dl>
                </ul>
              </div>
            </div>
          </template>
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
                  <product-table-row :product_id="product['REF_ID']" :show_discontinued="this.show_discontinued">
                  </product-table-row>
              </template>
              </tbody>
            </table>
          </div>
        </template>
        `
})

app.component('quote-list-product', {
    props: ['product_id', 'price_type'],
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
        },
        productCost() {
            // Returns a {'cost': cost, 'cost_academic': cost_academic, 'full_cost': full_cost}
            return this.$root.productCost(this.product_id)
        },
        cost() {
            return (this.product_count * this.productCost[this.price_type]).toFixed(2)
        },
        product_count() {
            return this.$parent.quote_prod_ids[this.product_id]
        }
    },
    methods: {
        remove_from_quote() {
            delete this.$parent.quote_prod_ids[this.product_id]
        }
    },
    template: /*html*/`
      <li class="my-1 row d-flex align-items-center">
        <div class="col-auto  pr-0">
          <a href='#' @click="remove_from_quote"><i class="far fa-times-square fa-lg text-danger"></i></a>
        </div>
        <div class="col-1">
          <input class="form-control" v-model="this.$parent.quote_prod_ids[product_id]" min=0>
        </div>
        <span class="col-7">{{product.Name}}</span>
        <span class="col-2">{{cost}} SEK</span>
      </li>
    `
})

app.component('product-table-row', {
    props: ['product_id', 'show_discontinued'],
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
        },
        quote_count() {
            if (this.product_id in this.$parent.quote_prod_ids) {
                return this.$parent.quote_prod_ids[this.product_id]
            } else {
                return 0
            }
        },
        discontinued() {
            return (this.product['Status'] == 'Discontinued')
        },
        visible() {
            return (this.show_discontinued || !this.discontinued)
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
    methods: {
        add_to_quote() {
            this.$parent.add_prod_to_quote(this.product_id)
        }
    },
    template: /*html*/`
        <template v-if="this.visible">
          <tr :class="'status_' + product['Status'].toLowerCase()">
              <td>
                  <a href="#" class="button" @click="add_to_quote"><i class="far fa-plus-square fa-lg"></i></a>
                  <span>({{quote_count}})</span>
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
        </template>
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
