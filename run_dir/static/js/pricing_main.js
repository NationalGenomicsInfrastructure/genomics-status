/* Does not follow the Vue style guide: https://v3.vuejs.org/style-guide/
feel free to update */
const vPricingMain = {
    data() {
        return {
            all_components: null,
            all_products: null,
            component_changes: Object(),
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
            product_changes: Object(),
            published_cost_calculator: null,
            published_data_loading: true,
            validation_msgs: Object({'products': {}, 'components': {}})
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
        },
        no_validation_messages() {
            return (Object.keys(this.validation_msgs['products']).length === 0) && (Object.keys(this.validation_msgs['components']).length === 0)
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
                      this.start_watching_for_validate()
                      this.validate()
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
        start_watching_for_validate() {
            this.$watch('all_products',
                function(newVal, oldVal) {
                    this.validate()
                }, {
                  deep: true
                }
            )
            this.$watch('all_components',
                function(newVal, oldVal) {
                    this.validate()
                }, {
                  deep: true
                }
            )
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
        },
        validate() {
            axios.post('/api/v1/pricing_validate_draft', {
                components: this.all_components,
                products: this.all_products
            }).then(response => {
                this.product_changes = response.data.changes['products']
                this.component_changes = response.data.changes['components']
                this.validation_msgs = response.data.validation_msgs
            })
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
    props: ['show_discontinued', 'quotable'],
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
            <th v-if="quotable">Quoting</th>
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
            <th v-if="quotable"></th>
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
            <product-table-row :product_id="product['REF_ID']" :quotable="quotable">
            </product-table-row>
        </template>
        </tbody>
      </table>
      `
})

app.component('product-table-row', {
    props: ['product_id', 'quotable'],
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
        changes() {
            if (this.product_id in this.$root.product_changes) {
                return this.$root.product_changes[this.product_id]
            } else {
                return null
            }
        },
        is_changes() {
            return (this.changes !== null)
        },
        validation_msgs() {
            if (this.product_id in this.$root.validation_msgs['products']) {
                return this.$root.validation_msgs['products'][this.product_id]
            } else {
                return null
            }
        },
        is_invalid() {
            return (this.validation_msgs !== null)
        },
        discontinued() {
            return (this.product['Status'] == 'Discontinued')
        },
        status_css() {
            return 'status_' + this.product['Status'].toLowerCase()
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
          <tr class="status_css" :class="{'table-danger pricing-tr-is-invalid': is_invalid, 'table-success pricing-tr-changed': is_changes}">
              <td v-if="quotable">
                  <a href="#" class="button add-to-quote" :data-product-id="product['REF_ID']" @click="add_to_quote"><i class="far fa-plus-square fa-lg"></i></a>
                  <span>({{quote_count}})</span>
              </td>
              <v-product-table-row-td td_key='REF_ID' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Category' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Type' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Name' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Components' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Alternative Components' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Full cost fee' :row_changes="this.changes" :product_id="this.product_id"/>
              <v-product-table-row-td td_key='Re-run fee' :row_changes="this.changes" :product_id="this.product_id"/>
              <td class="price_internal">
                  {{cost['cost'].toFixed(2)}}
              </td>
              <td class="price_academic">
                  {{cost['cost_academic'].toFixed(2)}}
              </td>
              <td class="full_cost">
                  {{cost['full_cost'].toFixed(2)}}
              </td>
              <v-product-table-row-td td_key='Comment' :row_changes="this.changes" :product_id="this.product_id"/>
          </tr>
        </template>
    `
})

app.component('v-product-table-row-td',  {
    props: ['td_key', 'row_changes', 'product_id'],
    data() {
        return { tooltip: null }
    },
    computed: {
        is_changes() {
             return ((this.row_changes !== null) && (this.td_key in this.row_changes))
        },
        changes() {
            if (this.row_changes !== null) {
                return this.row_changes[this.td_key]
            } else {
                return null
            }
        },
        is_components() {
            return (['Components', 'Alternative Components'].indexOf(this.td_key) !== -1)
        },
        is_regular_components() {
            return this.td_key == 'Components'
        },
        is_alternative_components() {
            return this.td_key == 'Alternative Components'
        },
        product() {
            return this.$root.all_products[this.product_id]
        },
        tooltip_html() {
          if (this.is_changes) {
            return_html = '<div class="row pricing-td-highlight-tooltip"><div class="col-5">'
            arrow_element = '</div><div class="col-2 d-flex align-self-center px-0"><h5><i class="fas fa-arrow-right"></i></h5></div>'
            if (typeof this.changes[0] == 'string') {
                return_html += `<p>${this.changes[1]}</p>`
                return_html += arrow_element
                return_html += '<div class="col-5">'
                return_html += `<p>${this.changes[0]}</p>`
                return_html += '</div></div>'
                return return_html
            } else {
                for ([prod_id, quantity_data] of Object.entries(this.changes[1])) {
                    return_html += '<p>' + quantity_data['quantity'] + ' x ' + this.$root.all_components[prod_id]['Product name'] + '</p>'
                }
                return_html += arrow_element
                return_html += '<div class="col-5">'
                for ([prod_id, quantity_data] of Object.entries(this.changes[0])) {
                    return_html += '<p>' + quantity_data['quantity'] + ' x ' + this.$root.all_components[prod_id]['Product name'] + '</p>'
                }
                /* return JSON.stringify(this.changes[1]) + '<i class="fas fa-arrow-right"></i>' + JSON.stringify(this.changes[0]) */
                return_html += '</div></div>'
                return return_html
            }
          }
        }
    },
    watch: {
        changes(newVal, oldVal) {
            if (this.is_changes) {
                this.tooltip = new bootstrap.Tooltip(this.$el)
            }
        }
    },
    template: /*html*/`
        <td :class="{'pricing-td-changed': is_changes}" data-toggle="tooltip" data-placement="top" :data-original-title="tooltip_html" data-animation=false data-html=true>
          <template v-if="is_components">
            <template v-if="this.td_key == 'Components'">
              <product-table-components :product_id="product_id" :type="'Regular'" :is_changes="is_changes">
              </product-table-components>
            </template>
            <template v-else>
              <product-table-components :product_id="product_id" :type="'Alternative'" :is_changes="is_changes">
              </product-table-components>
            </template>
          </template>
          <template v-else>
            <p>{{product[td_key]}}</p>
          </template>
        </td>
        `
    });

app.component('product-table-components', {
    props: ['product_id', 'type', 'is_changes'],
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
        },
        is_empty() {
            return (this.componentIds.length == 0)
        },
    },
    template: /*html*/`
        <template v-if="is_changes && is_empty">
          <h4><i class="fas fa-exclamation-triangle"></i></h4>
        </template>
        <template v-else>
          <template v-for="(component_data, comp_id) in components" :key="comp_id">
            <div>{{component_data['component']['Product name']}}</div>
          </template>
        </template>
      `
})

app.component('v-draft-changes-list', {
    props: ['modal'],
    computed: {
        product_changes() {
            return this.$root.product_changes
        },
        component_changes() {
            return this.$root.component_changes
        },
        no_changes() {
            return (Object.keys(this.product_changes).length === 0) && (Object.keys(this.component_changes).length === 0)
        }
    },
    template: /*html*/`
      <div v-if="no_changes" class="my-2">
        <h4>No changes between draft and published document.</h4>
      </div>
      <div v-else class="my-3 card">
        <div class="card-header">
          <a class="pricing_collapse_link" data-toggle="collapse" data-target="#changes_card_body" role="button" aria-expanded="true" aria-controls="#changes_card_body">
            <h4>Changes made: <i class="fas fa-caret-down fa-lg pl-1"></i></h4>
          </a>
        </div>
        <div class="card-body collapse show" id="changes_card_body">
          <div class="row">
            <div :class="modal ? 'col-12' : 'col-6'">
              <h4>Products</h4>
              <div class="row">
                <template v-for="(prod_changes_data, prod_id) in product_changes" :key="prod_id">
                  <div class="ml-3 mb-3">
                    <h5 class="col-12"><a :href="'#product_form_part_' + prod_id">{{this.$root.all_products[prod_id]['Name']}}:</a></h5>
                    <div class="ml-3" v-for="(prod_type_changes_data, type_key) in prod_changes_data" :key="type_key">
                      <strong class="mr-2">{{type_key}}:</strong>
                      <template v-if="(type_key == 'Components') || (type_key == 'Alternative Components')">
                        <div class="row">
                          <div class="col-4 border-right">
                            <div class="row" v-for="(prod_type_component_changes_data, component_id) in prod_type_changes_data[1]" :key="component_id">
                              <div class="col-3 ml-3">
                                <a href=""><span class="badge bg-secondary pricing_hoverable" :title="this.$root.all_components[component_id]['Product name']">{{component_id}}</span></a>
                              </div>
                              <div class="col-8">
                                Quantity: {{prod_type_component_changes_data['quantity']}}
                              </div>
                            </div>
                          </div>
                          <div class="col-auto d-flex align-items-center pl-1 pr-0">
                            <i class="fas fa-arrow-right"></i>
                          </div>
                          <div class="col-4">
                            <div class="row" v-for="(prod_type_component_changes_data, component_id) in prod_type_changes_data[0]" :key="component_id">
                              <div class="col-3 ml-2">
                                <span class="badge bg-success pricing_hoverable" :title="this.$root.all_components[component_id]['Product name']">{{component_id}}</span>
                              </div>
                              <div class="col-8">
                                Quantity: {{prod_type_component_changes_data['quantity']}}
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        {{prod_type_changes_data[1]}} <i class="fas fa-arrow-right"></i> {{prod_type_changes_data[0]}}
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div :class="modal ? 'col-12' : 'col-6 border-left'">
              <h4>Components</h4>
              <div class="row">
                <template v-for="(comp_changes_data, comp_id) in component_changes" :key="comp_id">
                  <div class="ml-3 mb-3">
                    <h5 class="col-12"><a :href="'#component_form_part_' + comp_id">{{this.$root.all_components[comp_id]['Product name']}}:</a></h5>
                    <div class="ml-3" v-for="(comp_type_changes_data, type_key) in comp_changes_data" :key="type_key">
                      <strong class="mr-2">{{type_key}}:</strong>
                      {{comp_type_changes_data[1]}} <i class="fas fa-arrow-right"></i> {{comp_type_changes_data[0]}}
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      `
})


app.component('v-draft-validation-msgs-list', {
    props: ['modal'],
    computed: {
        product_messages() {
            return this.$root.validation_msgs['products']
        },
        component_messages() {
            return this.$root.validation_msgs['components']
        },
        any_messages() {
            return (Object.keys(this.product_messages).length !== 0) || (Object.keys(this.component_messages).length !== 0)
        }
    },
    template: /*html*/`
      <div v-if="any_messages" class="my-3 card border-danger">
        <div class="card-header">
          <a class="pricing_collapse_link" data-toggle="collapse" data-target="#validation_msgs_card_body" role="button" aria-expanded="true" aria-controls="#validation_msgs_card_body">
            <h4><span class="badge bg-danger"><i class="fas fa-exclamation-triangle mr-2"></i>Validation errors:</span> <i class="fas fa-caret-down fa-lg pl-1"></i></h4>
          </a>
        </div>
        <div class="card-body collapse show" id="validation_msgs_card_body">
          <div class="row">
            <div :class="modal ? 'col-12' : 'col-6'">
              <h4>Products</h4>
              <div class="row pr-4">
                <template v-for="(prod_validation_msgs_data, prod_id) in product_messages" :key="prod_id">
                  <div class="ml-3 mb-3">
                    <h5 class="col-12"><a :href="'#product_form_part_' + prod_id">{{this.$root.all_products[prod_id]['Name']}}:</a></h5>
                    <div class="ml-3" v-for="(prod_type_validation_msgs_data, type_key) in prod_validation_msgs_data" :key="type_key">
                      <ul v-for="validation_msg in prod_type_validation_msgs_data">
                        <li class="fs-5">{{validation_msg}}</li>
                      </ul>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div :class="modal ? 'col-12' : 'col-6'">
              <h4>Components</h4>
              <div class="row pr-4">
                <template v-for="(comp_validation_msgs_data, comp_id) in component_messages" :key="comp_id">
                  <div class="ml-3 mb-3">
                    <h5 class="col-12"><a :href="'#component_form_part_' + comp_id">{{this.$root.all_components[comp_id]['Product name']}}:</a></h5>
                    <div class="ml-3" v-for="(comp_type_validation_msgs_data, type_key) in comp_validation_msgs_data" :key="type_key">
                      <ul v-for="validation_msg in comp_type_validation_msgs_data">
                        <li class="fs-5">{{validation_msg}}</li>
                      </ul>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      `
})