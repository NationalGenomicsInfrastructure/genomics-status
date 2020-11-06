const all_products_reactive = Vue.reactive(global_products_json)
const all_components_reactive = Vue.reactive(global_components_json)

const ProductForm = {
    data() {
        return {
            all_components: all_components_reactive,
            all_products: all_products_reactive,
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
        }
    },
    computed: {
        all_products_per_category() {
            prod_per_cat = {};
            for ([prod_id, product] of Object.entries(this.all_products)) {
                cat = product['Category']
                if (! (cat in prod_per_cat)) {
                    prod_per_cat[cat] = {}
                }
                prod_per_cat[cat][product['REF_ID']] = product
            }
            return prod_per_cat
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
                  <a class="nav-link active" href="#products_top">Products</a>
                  <nav class="nav nav-pills flex-column">
                    <template v-for="(category, cat_nr) in Object.keys(this.$root.all_products_per_category)" :key="category">
                      <a class="nav-link ml-2 my-2" :href="'#products_cat_' + cat_nr">{{category}}</a>
                    </template>
                  </nav>
                </nav>
              </div>
            </nav>
          </div>

        <div class="col-md-10">
          <div id="pricing_product_form_content" data-spy="scroll" data-target="#sidebar" data-offset="0" tabindex="0">
            <h2 id="products_top">Products</h2>
              <input type="submit" class="btn btn-primary">
              <template v-for="(category, cat_nr) in Object.keys(this.$root.all_products_per_category)" :key="category">
                <h3 :id="'products_cat_' + cat_nr">{{category}}</h3>
                <template v-for="product in this.$root.all_products_per_category[category]" :key="product['REF_ID']">
                  <div class="mx-2 my-3 p-3 card">
                    <product-form-part :product_id="product['REF_ID']">
                    </product-form-part>
                  </div>
                </template>
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
        <h4> {{ product['Name'] }} </h4>
        <div class="row my-1">
          <fieldset disabled class='col-md-1'>
            <label class="form-label">
              ID
              <input class="form-control" v-model.number="product['REF_ID']" type="number">
            </label>
          </fieldset>
          <label class="form-label col-md-3">
            Category
            <input class="form-control" v-model.text="product['Category']" type="text">
          </label>
          <label class="form-label col-md-2">
            Product Type
            <input class="form-control" v-model.text="product['Type']" type="text">
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

        `,
    computed: {
        product() {
            return this.$root.all_products[this.product_id]
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
                  <template v-for="(component, component_id) in this.$parent.all_components" :key="component['REF_ID']">
                    <template v-if="component['Status'] != 'Discontinued'">
                      <span>
                        <a clas="mr-2" href="#" @click="this.addComponent">
                          <i class="far fa-plus-square fa-lg text-success" :data-component-id="component['REF_ID']"></i>
                        </a>
                        {{ component['Product name']}}
                      </span><br>
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
