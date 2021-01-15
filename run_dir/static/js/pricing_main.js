/* Does not follow the Vue style guide: https://v3.vuejs.org/style-guide/
feel free to update */
const vPricingMain = {
    data() {
        return {
            all_components: null,
            all_products: null,
            current_user_email: null,
            draft_cost_calculator: null,
            draft_created_at: null,
            draft_data_loading: true,
            new_products: new Set(),
            new_components: new Set(),
            modal_product_id: "52", //Should probably be null when we handle that edge case
            modal_type: "Regular",
            USD_in_SEK: null,
            EUR_in_SEK: null,
            exch_rate_issued_at: null,
            show_discontinued: false,
            quote_prod_ids: {},
            quote_special_addition_value: 0,
            quote_special_addition_label: '',
            quote_special_percentage_value: 0.0,
            quote_special_percentage_label: '',
            price_type: 'cost_academic',
            published_cost_calculator: null,
            published_data_loading: true
        }
    },
    computed: {
        all_products_per_category() {
            prod_per_cat = {};
            for ([prod_id, product] of Object.entries(this.all_products)) {
                if ( this.new_products.has(prod_id) ) {
                    cat = "New products"
                } else {
                    cat = product['Category']
                }
                if (! (product['Status'] == 'Discontinued')) {
                    if (! (cat in prod_per_cat)) {
                        prod_per_cat[cat] = {}
                    }
                    prod_per_cat[cat][product['REF_ID']] = product
                }
            }
            return prod_per_cat
        },
        product_categories() {
            categories = new Set();
            for ([prod_id, product] of Object.entries(this.all_products)) {
                cat = product['Category']
                if (! (product['Status'] == 'Discontinued')) {
                    categories.add(product['Category'])
                }
            }
            return categories
        },
        product_types() {
            types = new Set();
            for ([prod_id, product] of Object.entries(this.all_products)) {
                cat = product['Type']
                if (! (product['Status'] == 'Discontinued')) {
                    types.add(product['Type'])
                }
            }
            return types
        },
        discontinued_products() {
            disco_products = {};
            for ([prod_id, product] of Object.entries(this.all_products)) {
                if (product['Status'] == 'Discontinued') {
                    disco_products[prod_id] = product
                }
            }
            return disco_products
        },
        all_components_per_category() {
            comp_per_cat = {};
            for ([comp_id, component] of Object.entries(this.all_components)) {
                if ( this.new_components.has(comp_id) ) {
                  cat = "New components"
                } else {
                  cat = component['Category']
                }
                if (! (component['Status'] == 'Discontinued')) {
                    if (! (cat in comp_per_cat)) {
                        comp_per_cat[cat] = {}
                    }
                    comp_per_cat[cat][component['REF_ID']] = component
                }
            }
            return comp_per_cat
        },
        component_categories() {
            categories = new Set();
            for ([comp_id, component] of Object.entries(this.all_components)) {
                cat = component['Category']
                if (! (component['Status'] == 'Discontinued')) {
                    categories.add(component['Category'])
                }
            }
            return categories
        },
        component_types() {
            types = new Set();
            for ([comp_id, component] of Object.entries(this.all_components)) {
                cat = component['Type']
                if (! (component['Status'] == 'Discontinued')) {
                    types.add(component['Type'])
                }
            }
            return types
        },
        discontinued_components() {
            disco_components = {};
            for ([comp_id, component] of Object.entries(this.all_components)) {
                if (component['Status'] == 'Discontinued') {
                    disco_components[comp_id] = component
                }
            }
            return disco_components
        },
        next_product_id() {
            all_ids = Object.keys(this.all_products)
            max_id = Math.max(...all_ids.map(x => parseInt(x)))
            return (1 + max_id).toString()
        },
        next_component_id() {
            all_ids = Object.keys(this.all_components)
            max_id = Math.max(...all_ids.map(x => parseInt(x)))
            return (1 + max_id).toString()
        }
    },
    methods: {
        showComponentsUpdateModal(event) {
            if (event) {
                this.modal_product_id = event.target.dataset.productId
                this.modal_type = event.target.dataset.type
            }
            var cModal = new bootstrap.Modal(document.getElementById('chooseComponentsModal'))
            cModal.show()
        },
        populatedComponents(product_id, type) {
            var product = this.all_products[product_id]
            var components = new Object();
            if (type == 'Alternative') {
                component_input = product['Alternative Components']
            } else {
                component_input = product['Components']
            }
            for ([comp_id, info] of Object.entries(component_input)) {
                components[comp_id] = {
                    'component': this.all_components[comp_id],
                    'quantity': info['quantity']
                }
            }
            return components
        },
        discontinueProduct(prod_id) {
            this.all_products[prod_id]['Status'] = 'Discontinued'
        },
        enableProduct(prod_id) {
            this.all_products[prod_id]['Status'] = 'Enabled'
        },
        discontinueComponent(comp_id) {
            console.log("Should disable comp_id: "+ comp_id)
            this.all_components[comp_id]['Status'] = 'Discontinued'
        },
        enableComponent(comp_id) {
            this.all_components[comp_id]['Status'] = 'Enabled'
        },
        cloneProduct(prod_id) {
            product = this.all_products[prod_id]
            new_prod = Object.assign({}, product)
            /* The assign creates a shallow copy, so we
               need to empty the component list */
            new_prod['Components'] = {}
            new_prod['Alternative Components'] = {}
            new_id = this.next_product_id
            new_prod['REF_ID'] = new_id
            this.all_products[new_id] = new_prod
            this.new_products.add(new_id)
        },
        removeProduct(prod_id) {
            /* meant to be used with new products only */
            delete this.all_products[prod_id]
            delete this.new_products[prod_id]
        },
        addProductComponent(product_id, component_id, type) {
            var product = this.all_products[product_id.toString()]
            if (type == 'Alternative') {
                key = 'Alternative Components'
            } else {
                key = 'Components'
            }

            /* Initialize object if it doesn't exist */
            if (product[key] == '') {
                product[key] = {}
            }
            product[key][component_id] = {'quantity': 1}
        },
        removeProductComponent(product_id, component_id, type) {
            var product = this.all_products[product_id]
            if (type == 'Alternative') {
              delete product['Alternative Components'][component_id]
            } else {
              delete product['Components'][component_id]
            }
        },
        cloneComponent(comp_id) {
            component = this.all_components[comp_id]
            new_comp = Object.assign({}, component)
            new_id = this.next_component_id
            new_comp['REF_ID'] = new_id
            this.all_components[new_id] = new_comp
            this.new_components.add(new_id)
        },
        removeComponent(comp_id) {
            /* meant to be used with new components only */
            delete this.all_components[comp_id]
            delete this.new_components[comp_id]
        },
        fetchDraftCostCalculator(assign_data) {
            axios
              .get('/api/v1/draft_cost_calculator')
              .then(response => {
                  data = response.data.cost_calculator
                  if (data !== null) {
                    this.draft_cost_calculator = data
                    if (assign_data) {
                      this.all_products = data.products
                      this.all_components = data.components
                    }
                  }
                  this.current_user_email = response.data['current_user_email']
                  this.draft_data_loading = false
              })
        },
        fetchExchangeRates(date) {
            url = '/api/v1/pricing_exchange_rates'
            if (date !== undefined) {
              url += '?date=' + date;
            }
            axios
              .get(url)
              .then(response => {
                  this.USD_in_SEK = response.data.USD_in_SEK
                  this.EUR_in_SEK = response.data.EUR_in_SEK
                  date = new Date(Date.parse(response.data['Issued at']))
                  this.exch_rate_issued_at = date.toISOString().substring(0, 10)
              })
        },
        fetchPublishedCostCalculator(assign_data) {
            axios
              .get('/api/v1/cost_calculator')
              .then(response => {
                  data = response.data.cost_calculator
                  if (data !== null) {
                    this.published_cost_calculator = data
                    if (assign_data) {
                      this.all_products = data.products
                      this.all_components = data.components
                    }
                  }
                  this.current_user_email = response.data['current_user_email']
                  this.published_data_loading = false
              })
        },
        componentCost(comp_id) {
            component = this.all_components[comp_id]
            currency = component['Currency']
            list_price = component['List price']
            if (currency == 'SEK') {
                sek_list_price = list_price
            } else {
                currency_key = currency + "_in_SEK"
                sek_list_price = this[currency_key] * list_price
            }
            sek_price = sek_list_price - sek_list_price*component['Discount']
            sek_price_per_unit = sek_price/component['Units']

            return {'sek_price': sek_price, 'sek_price_per_unit': sek_price_per_unit}
        },
        productCost(prod_id) {
            product = this.all_products[prod_id]
            if (product['is_fixed_price']) {
                cost = parseFloat(product['fixed_price']['price_in_sek']) || 0
                cost_academic = parseFloat(product['fixed_price']['price_for_academics_in_sek']) || 0
                full_cost = parseFloat(product['fixed_price']['full_cost_in_sek']) || 0
            } else {
                cost = 0
                for ([comp_id, info] of Object.entries(product['Components'])) {
                    componentCosts = this.componentCost(comp_id)
                    quantity = info['quantity']
                    cost += quantity * componentCosts['sek_price_per_unit']
                }
                cost_academic = cost + cost * product['Re-run fee']

                full_cost_fee = parseFloat(product['Full cost fee']) || 0
                full_cost = cost_academic + full_cost_fee
            }

            return {'cost': cost, 'cost_academic': cost_academic, 'full_cost': full_cost}
        }
    }
}

const app = Vue.createApp(vPricingMain)

/* Reusable components */

app.component('exchange-rates', {
  props: ['mutable', 'issued_at'],
  data() {
      return {
          issued_at_form_bound: this.issued_at
      }
  },
  computed: {
    USD_in_SEK() {
      val = this.$root.USD_in_SEK
      if (val === null) {
          return ""
      } else {
          return val.toFixed(2)
      }
    },
    EUR_in_SEK() {
      val = this.$root.EUR_in_SEK
      if (val === null) {
          return ""
      } else {
          return val.toFixed(2)
      }
    }
  },
  watch: {
      issued_at(newVal, oldVal) {
          this.issued_at_form_bound = newVal
      }
  },
  methods: {
    reload_exch_rates() {
        date = this.issued_at_form_bound;
        this.$root.fetchExchangeRates(date);
    }
  },
  template:
      /*html*/`
      <h4>Exchange rates</h4>
      <dl class="row">
        <dt class="col-md-4 text-right">1 USD</dt>
        <dd class="col-md-8"><span id='exch_rate_usd'>{{USD_in_SEK}}</span></dd>
        <dt class="col-md-4 text-right">1 EUR</dt>
        <dd class="col-md-8"><span id='exch_rate_eur'>{{EUR_in_SEK}}</span></dd>
        <dt class="col-md-4 text-right">Issued at</dt>
        <dd class="col-md-8"><span id='exch_rate_issued_at'>{{issued_at}}</span>
          <a v-if="mutable" href="#" data-toggle="modal" data-target="#exch_rate_modal"> (Change)</a>
        </dd>
      </dl>
      <template v-if="mutable">
        <!-- Exchange Rate Modal -->
        <div class="modal fade" id="exch_rate_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title" id="myModalLabel">Fetch historic exchange rate</h4>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>The most recent rates prior to the date chosen will be used.</p>
                <p>Latest date exchange rates: <input id="datepicker" type='date' v-model="issued_at_form_bound" data-date-format="yyyy-mm-dd"></p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                <button id='datepicker-btn' type="button" class="btn btn-primary" @click="reload_exch_rates" data-dismiss="modal">Apply Exchange Rates</button>
              </div>
            </div>
          </div>
        </div>
      </template>
      `,
})

app.component('v-products-table', {
    props: ['show_discontinued'],
    data: function() {
        return {
            dataTable: null
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.init_listjs()
        })
    },
    watch: {
      show_discontinued(new_val, old_val) {
        this.reset_listjs()

        /* have to wait for the table to be drawn */
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
      }
    },
    template: /*html*/`
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
      `
})

app.component('product-table-row', {
    props: ['product_id'],
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
        },
        quote_count() {
            if (this.product_id in this.$root.quote_prod_ids) {
                return this.$root.quote_prod_ids[this.product_id]
            } else {
                return 0
            }
        },
        discontinued() {
            return (this.product['Status'] == 'Discontinued')
        },
        visible() {
            return (this.$root.show_discontinued || !this.discontinued)
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
            if (!(this.product_id in this.$root.quote_prod_ids)) {
                this.$root.quote_prod_ids[this.product_id] = 0
            }
            this.$root.quote_prod_ids[this.product_id] += 1
        }
    },
    template: /*html*/`
        <template v-if="this.visible">
          <tr :class="'status_' + product['Status'].toLowerCase()">
              <td>
                  <a href="#" class="button add-to-quote" :data-product-id="product['REF_ID']" @click="add_to_quote"><i class="far fa-plus-square fa-lg"></i></a>
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
