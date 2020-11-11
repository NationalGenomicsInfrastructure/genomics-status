const all_products_reactive = Vue.reactive(global_products_json)
const all_components_reactive = Vue.reactive(global_components_json)

const ProductForm = {
    data() {
        return {
            all_components: all_components_reactive,
            all_products: all_products_reactive,
            new_products: new Set(),
            new_components: new Set(),
            modal_product_id: "52", //Should probably be null when we handle that edge case
            modal_type: "Regular"
        }
    },
    methods: {
        showModalFn(event) {
            if (event) {
                this.modal_product_id = event.target.dataset.productId
                this.modal_type = event.target.dataset.type
            }
            var myModal = new bootstrap.Modal(document.getElementById('myModal'))
            myModal.show()
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
    }
}

const app = Vue.createApp(ProductForm)

app.component('product-form-list', {
    template:
        /*html*/`
        <div class="row">
          <div class="col-md-2">
            <nav id="sidebar" class="nav sidebar">
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
          <div id="pricing_product_form_content" data-spy="scroll" data-target="#sidebar" data-offset="0" tabindex="0">
            <h2 id="products_top">Products</h2>
            <input type="submit" class="btn btn-primary">
            <template v-for="(category, cat_nr) in Object.keys(this.$root.all_products_per_category)">
              <h3 :id="'products_cat_' + cat_nr">{{category}}</h3>
              <template v-for="product in this.$root.all_products_per_category[category]" :key="product['REF_ID']">
                <product-form-part :product_id="product['REF_ID']">
                </product-form-part>
              </template>
            </template>
            <h2 id="components_top">Components</h2>
            <template v-for="(category, cat_nr) in Object.keys(this.$root.all_components_per_category)">
              <h3 :id="'components_cat_' + cat_nr">{{category}}</h3>
              <template v-for="component in this.$root.all_components_per_category[category]" :key="component['REF_ID']">
                <component-form-part :component_id="component['REF_ID']">
                </component-form-part>
              </template>
            </template>
            <h2 class="mt-4" id="discontinued_top">Discontinued</h2>
            <h3 id="discontinued_products">Products</h3>
            <template v-for="product in this.$root.discontinued_products" :key="product['REF_ID']">
              <div class="mx-2 my-3 p-3 card">
                <product-form-part :product_id="product['REF_ID']">
                </product-form-part>
              </div>
            </template>
            <h3 id="discontinued_components">Components</h3>
            <template v-for="component in this.$root.discontinued_components" :key="component['REF_ID']">
              <div class="mx-2 my-3 p-3 card">
                <component-form-part :component_id="component['REF_ID']">
                </component-form-part>
              </div>
            </template>
          </div>
        </div>
      </div>
        `
})

app.component('product-form-part', {
    props: ['product_id'],
    template:
      /*html*/`
      <div class="mx-2 my-3 p-3 card" :class="{ 'border-success border-2': isNew }">
        <div class="row">
          <h4 class="col-md-8 mr-auto"> {{ product['Name'] }} </h4>
          <button type="button" class="btn btn-sm btn-outline-success col-md-1" @click="this.cloneProduct">Clone</button>
          <div v-if="this.isNew" class="col-md-2 ml-2">
            <button type="button" class="btn btn-outline-danger" @click="this.removeProduct">Remove<i class="far fa-times-square fa-lg text-danger ml-2"></i></button>
          </div>
          <div v-else class="col-md-2 ml-2">
            <button v-if="this.discontinued" type="button" class="btn btn-sm btn-outline-danger" @click="this.enableProduct">Enable</button>
            <button v-else type="button" class="btn btn-outline-danger" @click="this.discontinueProduct">Discontinue<i class="far fa-times-square fa-lg text-danger ml-2"></i></button>
          </div>
        </div>
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
            Reagent Fee
            <input class="form-control" v-model.text="product['Reagent fee']" type="text">
          </label>

          <label class="form-label col-md-2">
            Full Cost Fee
            <input class="form-control" v-model.text="product['Full cost fee']" type="text">
          </label>

          <label class="form-label col-md-2">
            Rerun Fee
            <input class="form-control" v-model.text="product['Re-run fee']" type="text">
          </label>

          <label class="form-label col-md-2">
            Minimum Quantity
            <input class="form-control" v-model.text="product['Minimum Quantity']" type="text">
          </label>

          <label class="form-label col-md-4">
            Comment
            <input class="form-control" v-model.text="product['Comment']" type="text">
          </label>
        </div>
      </div>

        `,
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
        categories() {
            return this.$root.product_categories
        },
        types() {
            return this.$root.product_types
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
        }
    }
})

app.component('component-form-part', {
    props: ['component_id'],
    template:
      /*html*/`
      <div class="mx-2 my-3 p-3 card" :class="{ 'border-success border-2': isNew }">
        <div class="row">
          <h4 class="col-md-8 mr-auto"> {{ component['Product name'] }} </h4>
          <div class="col-md-1">
            <button type="button" class="btn btn-outline-success" @click="this.cloneComponent">Clone</button>
          </div>
          <div v-if="this.isNew" class="col-md-2">
            <button type="button" class="btn btn-outline-danger" @click="this.removeComponent">Remove<i class="far fa-times-square fa-lg text-danger ml-2"></i></button>
          </div>
          <div v-else class="col-md-2">
            <button v-if="this.discontinued" type="button" class="btn btn-outline-danger" @click="this.enableComponent">Enable</button>
            <button v-else type="button" class="btn btn-outline-danger" @click="this.discontinueComponent">Discontinue<i class="far fa-times-square fa-lg text-danger ml-2"></i></button>
          </div>
        </div>
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

      `,
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
    }
})


app.component('modal-component', {
    computed: {
        product() {
            return this.$root.all_products[this.$root.modal_product_id]
        },
        ComponentIds() {
            if (this.$root.modal_type == 'Alternative') {
                return Object.keys(this.product['Alternative Components'])
            } else {
                return Object.keys(this.product['Components'])
            }
        },
        Components() {
            var components = new Array();
            for (i in this.ComponentIds) {
                comp_id = this.ComponentIds[i]
                components.push(this.$root.all_components[comp_id])
            }
            return components
        }
      },
    template: /*html*/`
            <div class="modal-header">
              <h4 class="modal-title">{{this.product['Name']}}</h4>
              <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <h4> Edit {{this.$root.modal_type}} Components</h4>
              <form>
                <div class="row">
                  <h5>Selected Components</h5>
                  <template v-for="component in this.Components" :key="component['REF_ID']">
                    <span>
                      <a class="mr-2" href="#" @click="this.removeComponent">
                        <i class="far fa-times-square fa-lg text-danger" :data-component-id="component['REF_ID']"></i>
                      </a>
                      {{component['Product name']}}
                    </span><br>
                  </template>
                </div>
                <div class="row">
                  <h5>All components</h5>
                  <template v-for="category in Object.keys(this.$root.all_components_per_category)" :key="category">
                    <h3>{{category}}</h3>
                    <template v-for="component in this.$root.all_components_per_category[category]" :key="component['REF_ID']">
                      <template v-if="component['Status'] != 'Discontinued'">
                        <span>
                          <a clas="mr-2" href="#" @click="this.addComponent">
                            <i class="far fa-plus-square fa-lg text-success" :data-component-id="component['REF_ID']"></i>
                          </a>
                          {{ component['Product name']}}
                        </span><br>
                      </template>
                    </template>
                  </template>
                </div>
              </form>
            </div>
        `,
    methods: {
        removeComponent(event) {
            if (event) {
                comp_id = event.target.dataset.componentId
                if (this.$parent.modal_type == 'Alternative') {
                    delete this.product['Alternative Components'][comp_id]
                } else {
                    delete this.product['Components'][comp_id]
                }
            }
        },
        addComponent(event) {
            if (event) {
                comp_id = event.target.dataset.componentId
                if (this.$parent.modal_type == 'Alternative') {
                    key = 'Alternative Components'
                } else {
                    key = 'Components'
                }

                if (this.product[key] == '') {
                    this.product[key] = {}
                }
                this.product[key][comp_id] = {'quantity': 1}
            }
        }
    }
})

app.component('components', {
    template: /*html*/`
            <div class="input-group">
              <fieldset disabled>
                <input class="form-control" :id="element_id" type="text" :value="ComponentIds">
              </fieldset>
              <button type="button" class="btn btn-primary edit-components" @click="this.showModalFn" :data-product-id="product_id" :data-type="type">Edit</button>
            </div>
            <div class="component-display">
              <template v-for="component in Components" :key="component['REF_ID']">
                {{component["REF_ID"]}}: {{component["Product name"]}}<br>
              </template>
            </div>
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
        ComponentIds() {
            if (this.type == 'Alternative') {
                return Object.keys(this.product['Alternative Components'])
            } else {
                return Object.keys(this.product['Components'])
            }
        },
        Components() {
            var components = new Array();
            for (i in this.ComponentIds) {
                comp_id = this.ComponentIds[i]
                components.push(this.$parent.$parent.$parent.all_components[comp_id])
            }
            return components
        }
    },
    methods: {
        showModalFn(event) {
            this.$parent.$parent.$parent.showModalFn(event)
        }
    },
    props: ['product_id', 'type']
})

app.mount('#pricing_update_main')
