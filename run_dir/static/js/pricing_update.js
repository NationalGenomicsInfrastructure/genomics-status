const all_products_reactive = Vue.reactive(global_products_json)
const all_components_reactive = Vue.reactive(global_components_json)

/* Inject attributes needed for scrollspy */
document.getElementsByTagName("body")[0].setAttribute("data-spy", "scroll");
document.getElementsByTagName("body")[0].setAttribute("data-target", "#pricing_update_sidebar");

const PricingUpdate = {
    data() {
        return {
            all_components: all_components_reactive,
            all_products: all_products_reactive,
            new_products: new Set(),
            new_components: new Set(),
            modal_product_id: "52", //Should probably be null when we handle that edge case
            modal_type: "Regular",
            USD_in_SEK: null,
            EUR_in_SEK: null,
            exch_rate_issued_at: null
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
    mounted: function() {
        this.fetchExchangeRates()
    },
    methods: {
        showModalFn(event) {
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
        fetchExchangeRates() {
            axios
              .get('/api/v1/pricing_exchange_rates')
              .then(response => {
                  this.USD_in_SEK = response.data.USD_in_SEK
                  this.EUR_in_SEK = response.data.EUR_in_SEK
                  this.exch_rate_issued_at = response.data['Issued at']
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

const app = Vue.createApp(PricingUpdate)

app.component('product-form-list', {
    template:
        /*html*/`
        <div class="row">
          <div class="col-md-2">
            <nav id="pricing_update_sidebar" class="nav sidebar sticky-top">
              <div class="position-sticky">
                <nav class="nav nav-pills flex-column">
                  <a class="nav-link my-1" href="#products_top">Products</a>
                  <nav class="nav nav-pills flex-column">
                    <template v-for="(category, cat_nr) in Object.keys(this.$root.all_products_per_category)" :key="category">
                      <a class="nav-link ml-3 my-0 py-1" :href="'#products_cat_' + cat_nr">{{category}}</a>
                    </template>
                  </nav>
                  <a class="nav-link my-1" href="#components_top">Components</a>
                  <nav class="nav nav-pills flex-column">
                    <template v-for="(category, cat_nr) in Object.keys(this.$root.all_components_per_category)" :key="category">
                      <a class="nav-link ml-3 my-0 py-1" :href="'#components_cat_' + cat_nr">{{category}}</a>
                    </template>
                  </nav>
                  <a class="nav-link my-1" href="#discontinued_top">Discontinued</a>
                  <nav class="nav nav-pills flex-column">
                    <a class="nav-link ml-3 my-0 py-1" href="#discontinued_products">Products</a>
                    <a class="nav-link ml-3 my-0 py-1" href="#discontinued_components">Components</a>
                  </nav>
                </nav>
              </div>
            </nav>
          </div>

        <div class="col-md-10">
          <div id="pricing_product_form_content" data-offset="0" tabindex="0">
            <div class="card p-3 mb-3 bg-light">
              <div class="row">
                <h2 class="col-md-5 mr-auto">Edit draft Cost Calculator</h2>
                <div class="col-md-5">
                  <exchange-rates></exchange-rates>
                </div>
              </div>
            </div>
            <h2 id="products_top">Products</h2>
            <template v-for="(category, cat_nr) in Object.keys(this.$root.all_products_per_category)">
              <h3 :id="'products_cat_' + cat_nr" class="mt-3">{{category}}</h3>
              <template v-for="product in this.$root.all_products_per_category[category]" :key="product['REF_ID']">
                <product-form-part :product_id="product['REF_ID']">
                </product-form-part>
              </template>
            </template>
            <h2 class="mt-4" id="components_top">Components</h2>
            <template v-for="(category, cat_nr) in Object.keys(this.$root.all_components_per_category)">
              <h3 :id="'components_cat_' + cat_nr" class="mt-3">{{category}}</h3>
              <template v-for="component in this.$root.all_components_per_category[category]" :key="component['REF_ID']">
                <component-form-part :component_id="component['REF_ID']">
                </component-form-part>
              </template>
            </template>
            <h2 class="mt-4" id="discontinued_top">Discontinued</h2>
            <h3 id="discontinued_products" class="mt-3">Products</h3>
            <template v-for="product in this.$root.discontinued_products" :key="product['REF_ID']">
              <product-form-part :product_id="product['REF_ID']">
              </product-form-part>
            </template>
            <h3 id="discontinued_components" class="mt-3">Components</h3>
            <template v-for="component in this.$root.discontinued_components" :key="component['REF_ID']">
              <component-form-part :component_id="component['REF_ID']">
              </component-form-part>
            </template>
          </div>
        </div>
      </div>
        `
})

app.component('exchange-rates', {
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
    },
    issued_at() {
      val = this.$root.exch_rate_issued_at
      if (val === null) {
          return ""
      } else {
          date = new Date(Date.parse(val))
          return date.toDateString()
      }
    }
  },
  template:
      /*html*/`
      <h4>Exchange rates</h4>
      <dl class="row">
        <dt class="col-md-4 text-right">1 USD</dt>
        <dd class="col-md-8"><span>{{USD_in_SEK}}</span></dd>
        <dt class="col-md-4 text-right">1 EUR</dt>
        <dd class="col-md-8"><span>{{EUR_in_SEK}}</span></dd>
        <dt class="col-md-4 text-right">Issued at</dt>
        <dd class="col-md-8"><span>{{issued_at}}</span></dd>
      </dl>`,
})

app.component('product-form-part', {
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
    methods: {
        discontinueProduct() {
            this.$root.discontinueProduct(this.product_id)
        },
        enableProduct() {
            this.$root.enableProduct(this.product_id)
        },
        cloneProduct() {
            this.$root.cloneProduct(this.product_id)
        },
        removeProduct() {
            if (! (this.isNew) ) {
                alert("Only new products are allowed to be removed, others should be discontinued")
            }
            this.$root.removeProduct(this.product_id)
        },
        makeFixedPriceDict() {
            if (!('fixed_price' in this.product)) {
                this.$root.all_products[this.product_id]['fixed_price'] = { "price_in_sek": 0, "price_for_academics_in_sek": 0, "full_cost_in_sek": 0 }
            }
        }
    },
    template:
      /*html*/`
      <div class="my-2 p-2" :class="[{'border-success border-2': isNew}, {'discontinued': discontinued}, {'card': true}]">
        <div class="row">
          <a class="pricing_update_collapse_link" data-toggle="collapse" :href="'#collapseProduct' + product_id" role="button" aria-expanded="false" :aria-controls="'collapseProduct' + product_id">
            <h5 :class="{'text-danger': discontinued, 'col-md-6 my-1': true}"> {{ product['Name'] }} {{ discontinued ? ' - Discontinued' : '' }} </h5>
          </a>
        </div>
        <div :id="'collapseProduct' + product_id"  class="collapse">
          <div class="row">
          <div class="col-md-10">
            <div class="row my-1">
              <fieldset disabled class='col-md-1'>
                <label class="form-label">
                  ID
                  <input class="form-control" v-model.number="product['REF_ID']" type="number">
                </label>
              </fieldset>
              <label class="form-label col-md-3">
                Category
                <input class="form-control" :list="'categoryOptions' + product_id" v-model.text="product['Category']" type="text">
                <datalist :id="'categoryOptions' + product_id">
                  <option v-for="category in categories">{{category}}</option>
                </datalist>
              </label>
              <label class="form-label col-md-2">
                Product Type
                <input class="form-control" :list="'typeOptions' + product_id" v-model.text="product['Type']" type="text">
                <datalist :id="'typeOptions' + product_id">
                  <option v-for="type in types">{{type}}</option>
                </datalist>
              </label>
              <label class="form-label col-md-6">
                Product Name
                <input class="form-control" v-model.text="product['Name']" type="text">
              </label>
            </div>
            <div class="row align-items-top my-2">
              <div class="col-md-6 component-list-input">
                <label class="form-label" for="'products-' + product_id + '-components'">Components</label>
                <components :product_id="product_id" :type="'Regular'">
                </components>
              </div>
              <div class="col-md-6 alt-component-list-input">
                <label class="form-label" for="'products-' + product_id + '-alternative_components'">Alternative Components</label>
                <components :product_id="product_id" :type="'Alternative'">
                </components>
              </div>
            </div>
            <div class="row my-1">
              <label class="form-label col-md-2">
                Full Cost Fee
                <input class="form-control" v-model.text="product['Full cost fee']" type="text">
              </label>

              <label class="form-label col-md-2">
                Rerun Fee
                <input class="form-control" v-model.text="product['Re-run fee']" type="text">
              </label>

              <div class="form-check form-switch col-md-2 mt-3 pl-5">
                <input class="form-check-input" @click="makeFixedPriceDict" type="checkbox" v-model="product['is_fixed_price']"/>
                <label class="form-check-label">
                  Fixed Price
                </label>
              </div>

              <label class="form-label col-md-4">
                Comment
                <input class="form-control" v-model.text="product['Comment']" type="text">
              </label>
            </div>
            <div v-if="this.isFixedPrice" class="row">
              <h5>Fixed Price (SEK)</h5>
              <label class="form-label col-md-2">
                Internal
                <input class="form-control" v-model.text="product['fixed_price']['price_in_sek']" type="text">
              </label>

              <label class="form-label col-md-2">
                Swedish Academia
                <input class="form-control" v-model.text="product['fixed_price']['price_for_academics_in_sek']" type="text">
              </label>
              <label class="form-label col-md-2">
                Full Cost
                <input class="form-control" v-model.text="product['fixed_price']['full_cost_in_sek']" type="text">
              </label>
            </div>
          </div>
          <div class="col-md-2 align-self-end pl-4">
            <div class="pb-3">
              <h4>Current Cost:</h4>
              <dt>Internal</dt>
              <dd>{{cost['cost'].toFixed(2)}} SEK</dd>
              <dt>Swedish Academia</dt>
              <dd>{{cost['cost_academic'].toFixed(2)}} SEK</dd>
              <dt>Full Cost</dt>
              <dd>{{cost['full_cost'].toFixed(2)}} SEK</dd>
            </div>
            <button type="button" class="btn btn-outline-success w-100 mb-2" @click="this.cloneProduct">Clone<i class="far fa-clone fa-lg text-success ml-2"></i></button>
            <div v-if="this.isNew" class="">
              <button type="button" class="btn btn-outline-danger w-100" @click="this.removeProduct">Remove<i class="fas fa-times fa-lg text-danger ml-2"></i></button>
            </div>
            <div v-else class="">
              <button v-if="this.discontinued" type="button" class="btn btn-outline-danger w-100" @click="this.enableProduct">Enable<i class="far fa-backward fa-lg text-danger ml-2"></i></button>
              <button v-else type="button" class="btn btn-outline-danger w-100" @click="this.discontinueProduct">Discontinue<i class="fas fa-times fa-lg text-danger ml-2"></i></button>
            </div>
          </div>
          </div>
        </div>
      </div>

        `
})

app.component('component-form-part', {
    props: ['component_id'],
    computed: {
        component() {
            return this.$root.all_components[this.component_id]
        },
        discontinued() {
            return (this.component['Status'] == 'Discontinued')
        },
        isNew() {
            return this.$root.new_components.has(this.component_id)
        },
        categories() {
            return this.$root.component_categories
        },
        types() {
            return this.$root.component_types
        },
        cost() {
            return this.$root.componentCost(this.component_id)
        }
    },
    methods: {
        enableComponent() {
            this.$root.enableComponent(this.component_id)
        },
        discontinueComponent() {
            this.$root.discontinueComponent(this.component_id)
        },
        cloneComponent() {
            this.$root.cloneComponent(this.component_id)
        },
        removeComponent() {
            if (! (this.isNew) ) {
                alert("Only new components are allowed to be removed, others should be discontinued")
            } else {
                this.$root.removeComponent(this.component_id)
            }
        }
    },
    template:
      /*html*/`
      <div class="my-2 p-2" :class="[{'border-success border-2': isNew}, {'discontinued': discontinued}, {'card': true}]">
        <div class="row">
          <a class="pricing_update_collapse_link" data-toggle="collapse" :href="'#collapseComponent' + component_id" role="button" aria-expanded="false" :aria-controls="'collapseComponent' + component_id">
            <h5 :class="{'text-danger': discontinued, 'col-md-6 my-1': true}"> {{ component['Product name'] }} {{ discontinued ? ' - Discontinued' : '' }}</h5>
          </a>
        </div>
        <div :id="'collapseComponent' + component_id"  class="collapse">
          <div class="row">
            <div class="col-md-10">
            <h5>{{ component['Last Updated']}}</h5>
            <div class="row my-1">
              <fieldset disabled class='col-md-1'>
                <label class="form-label">
                  ID
                  <input class="form-control" v-model.number="component['REF_ID']" type="number">
                </label>
              </fieldset>
              <label class="form-label col-md-3">
                Category
                <input class="form-control" :list="'compCategoryOptions' + component_id" v-model.text="component['Category']" type="text">
                <datalist :id="'compCategoryOptions' + component_id">
                  <option v-for="category in categories">{{category}}</option>
                </datalist>
              </label>
              <label class="form-label col-md-2">
                Product Type
                <input class="form-control" :list="'compTypeOptions' + component_id" v-model.text="component['Type']" type="text">
                <datalist :id="'compTypeOptions' + component_id">
                  <option v-for="type in types">{{type}}</option>
                </datalist>
              </label>
              <label class="form-label col-md-6">
                Component Name
                <input class="form-control" v-model.text="component['Product name']" type="text">
              </label>
            </div>
            <div class="row my-1">
              <label class="form-label col-md-2">
                Manufacturer
                <input class="form-control" v-model.text="component['Manufacturer']" type="text">
              </label>

              <label class="form-label col-md-2">
                Re-seller
                <input class="form-control" v-model.text="component['Re-seller']" type="text">
              </label>

              <label class="form-label col-md-4">
                Product #
                <input class="form-control" v-model.text="component['Product #']" type="text">
              </label>

              <label class="form-label col-md-2">
                Units
                <input class="form-control" v-model.text="component['Units']" type="text">
              </label>

              <label class="form-label col-md-2">
                Min Quantity
                <input class="form-control" v-model.text="component['Min Quantity']" type="text">
              </label>

            </div>
            <div class="row my-1">
              <label class="form-label col-md-2">
                Discount
                <input class="form-control" v-model.text="component['Discount']" type="text">
              </label>

              <label class="form-label col-md-2">
                List Price
                <input class="form-control" v-model.text="component['List price']" type="text">
              </label>

              <label class="form-label col-md-2">
                Currency
                <input class="form-control" v-model.text="component['Currency']" type="text">
              </label>

              <label class="form-label col-md-6">
                Comment
                <input class="form-control" v-model.text="component['Comment']" type="text">
              </label>
            </div>
          </div>
          <div class="col-md-2 align-self-end pl-4">
            <div class="pb-3">
              <h4>Current Cost:</h4>
              <dt>Cost</dt>
              <dd>{{cost['sek_price'].toFixed(2)}} SEK</dd>
              <dt>Per Unit</dt>
              <dd>{{cost['sek_price_per_unit'].toFixed(2)}} SEK</dd>
            </div>
            <button type="button" class="btn btn-outline-success w-100 mb-2" @click="this.cloneComponent">Clone<i class="far fa-clone fa-lg text-success ml-2"></i></button>
            <div v-if="this.isNew">
              <button type="button" class="btn btn-outline-danger w-100" @click="this.removeComponent">Remove<i class="fas fa-times fa-lg text-danger ml-2"></i></button>
            </div>
            <div v-else>
              <button v-if="this.discontinued" type="button" class="btn btn-outline-danger w-100" @click="this.enableComponent">Enable</button>
              <button v-else type="button" class="btn btn-outline-danger w-100" @click="this.discontinueComponent">Discontinue<i class="fas fa-times fa-lg text-danger ml-2"></i></button>
            </div>
          </div>
        </div>
      </div>
      `
})


app.component('modal-component', {
    computed: {
        product() {
            return this.$root.all_products[this.$root.modal_product_id]
        },
        componentIds() {
            if (this.$root.modal_type == 'Alternative') {
                return Object.keys(this.product['Alternative Components'])
            } else {
                return Object.keys(this.product['Components'])
            }
        },
        quantities() {
            if (this.$root.modal_type == 'Alternative') {
                return this.product['Alternative Components']
            } else {
                return this.product['Components']
            }
        },
        components() {
            return this.$root.populatedComponents(this.$root.modal_product_id, this.$root.modal_type)
        }
    },
    template: /*html*/`
            <div class="modal-header">
              <h2 class="modal-title">{{this.product['Name']}}</h2>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h3> Edit {{this.$root.modal_type}} Components</h3>
              <form>
                <div class="row border-bottom pb-3">
                  <h4>Selected Components</h4>
                    <table v-if="Object.entries(components).length" class="table table-sm table-hover ml-4 w-75">
                      <thead>
                        <tr>
                          <th scope="col" class="col-md-2">ID</th>
                          <th scope="col" class="col-md-7">Name</th>
                          <th scope="col" class="col-md-2">#</th>
                          <th scope="col" class="col-md-1">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="(component_data, comp_id) in components" :key="comp_id">
                          <component-table-row :product_id="this.$root.modal_product_id" :type="this.$root.modal_type" :added="true" :component_data="component_data" :component_id="comp_id"></component-table-row>
                        </template>
                      </tbody>
                    </table>
                </div>
                <div class="row pt-3">
                  <h4>All components</h4>
                  <template v-for="category in Object.keys(this.$root.all_components_per_category)" :key="category">
                    <h5>{{category}}</h5>
                    <table class="table table-sm table-hover w-75 ml-4">
                      <thead>
                        <tr>
                          <th scope="col" class="col-md-2">ID</th>
                          <th scope="col" class="col-md-7">Name</th>
                          <th scope="col" class="col-md-1">Add</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template v-for="component in this.$root.all_components_per_category[category]" :key="component['REF_ID']">
                          <template v-if="component['Status'] != 'Discontinued'">
                            <component-table-row :product_id="this.$root.modal_product_id" :type="this.$root.modal_type" :added="false" :component_data="component" :component_id="component['REF_ID']"></component-table-row>
                          </template>
                        </template>
                      </tbody>
                    </table>
                  </template>
                </div>
              </form>
            </div>
        `
})

app.component('components', {
    template: /*html*/`
            <div class="input-group">
              <fieldset disabled>
                <input class="form-control" :id="element_id" type="text" :value="componentIds">
              </fieldset>
              <button type="button" class="btn btn-primary edit-components" @click="this.showModalFn" :data-product-id="product_id" :data-type="type">Edit</button>
            </div>
            <table v-if="Object.entries(components).length" class="table table-sm table-hover">
              <thead>
                <tr>
                  <th scope="col" class="col-md-2">ID</th>
                  <th scope="col" class="col-md-7">Name</th>
                  <th scope="col" class="col-md-2">#</th>
                  <th scope="col" class="col-md-1">Remove</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(component_data, comp_id) in components" :key="comp_id">
                  <component-table-row :product_id="product['REF_ID']" :type="type" :added="true" :component_data="component_data" :component_id="comp_id"></component-table-row>
                </template>
              </tbody>
            </table>
               `,
    computed: {
        product() {
            return this.$parent.product
        },
        element_id() {
            if (this.type == 'Alternative') {
                return "products-" + this.product_id + "-alternative_components"
            } else {
                return "products-" + this.product_id + "-components"
            }
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
    methods: {
        showModalFn(event) {
            this.$root.showModalFn(event)
        }
    },
    props: ['product_id', 'type']
})

app.component('component-table-row', {
  template: /*html*/`
    <tr data-toggle="tooltip" data-placement="top" :data-original-title="tooltip_html" data-animation=false data-html=true>
      <th scope="row">{{component_id}}</th>
      <td>{{component['Product name']}}</td>
      <td v-if="added">
        <!-- I was for some reason unable to solve this with regular v-model... -->
        <input class="form-control" type="number" min=1 :value="component_data['quantity']" @input="updateQuantity($event.target.value)"/>
      </td>
      <td class="pl-3 pt-2" v-if="added">
        <a class="mr-2" href="#" @click="this.removeComponent">
          <i class="far fa-times-square fa-lg text-danger"></i>
        </a>
      </td>
      <td class="pl-3 pt-2" v-if="!added">
        <a class="mr-2" href="#" @click="this.addComponent">
          <i class="far fa-plus-square fa-lg text-success"></i>
        </a>
      </td>

    </tr>
    `,
  props: ['component_data', 'component_id', 'product_id', 'type', 'added'],
  data() {
      return { tooltip: null }
  },
  computed: {
      component() {
          if (this.added) {
            var component = this.component_data['component']
          } else {
            var component = this.component_data
          }
          return component
      },
      tooltip_html() {
          component = this.component
          return `
            <strong>Name: </strong>${component['Product name']}<br>
            <strong>Category: </strong>${component['Category']}<br>
            <strong>Type: </strong>${component['Type']}<br>
            <strong>Manufacturer: </strong>${component['Manufacturer']}<br>
            <strong>Re-seller: </strong>${component['Re-seller']}<br>
            <strong>Product #: </strong>${component['Product #']}<br>
            <strong>Units: </strong>${component['Units']}<br>
            <strong>Min quantity: </strong>${component['Min Quantity']}<br>
            <strong>Discount: </strong>${component['Discount']}<br>
            <strong>List price: </strong>${component['List price']}<br>
            <strong>Cost: </strong>${this.cost['sek_price'].toFixed(2)} SEK<br>
            <strong>Per Unit: </strong>${this.cost['sek_price_per_unit'].toFixed(2)} SEK<br>
            `
      },
      cost() {
          return this.$root.componentCost(this.component_id)
      }
  },
  methods: {
    updateQuantity(new_val) {
        if (this.type == 'Alternative') {
          this.$root.all_products[this.product_id]['Alternative Components'][this.component_id]['quantity'] = new_val
        } else {
          this.$root.all_products[this.product_id]['Components'][this.component_id]['quantity'] = new_val
        }
    },
    addComponent(event) {
        if (event) {
          console.log(this.product_id)
          this.$root.addProductComponent(this.product_id, this.component_id, this.type)
        }
    },
    removeComponent(event) {
        /* This took me some time to figure out - the problem is that the bootstrap tooltip would
        remain open forever if it's not actively removed like this */
        if (event) {
          tooltip = bootstrap.Tooltip.getInstance(this.$el)
          tooltip_el = this.$el
          that = this
          function whenHidden() {
              tooltip_el.removeEventListener('hidden.bs.tooltip', whenHidden)
              that.$root.removeProductComponent(that.product_id, that.component_id, that.type)
          }
          /* Wait until tooltip is actually hidden before removing the component */
          tooltip_el.addEventListener('hidden.bs.tooltip', whenHidden)
          tooltip.hide()
        }
    }
  },
  mounted() {
      /* Initializing tooltip, needed for dynamic content to have tooltips */
      this.tooltip = new bootstrap.Tooltip(this.$el)
  }
})

app.mount('#pricing_update_main')
