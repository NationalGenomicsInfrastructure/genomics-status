/* Inject attributes needed for scrollspy */
document.getElementsByTagName("body")[0].setAttribute("data-offset", 75);
document.getElementsByTagName("body")[0].setAttribute("data-target", "#pricing_update_sidebar");
document.getElementsByTagName("body")[0].setAttribute("data-spy", "scroll");

window.onbeforeunload = function(){
  /* This message will only show up on IE... But needs to return something */
  return 'Please make sure you have saved your changes before leaving'
};

app.component('v-pricing-update', {
    /* Main component of the pricing update page.
     *
     * Serves a page where:
     *   - Products and components can be modified
     *   - New products and components can be added
     *   - Products and components can be discontinued
     *   - Changes need to be saved manually to be stored in the database.
     *   - Changes are validated live on the server to check for validation errors
     */
    data() {
        return {
            save_message: null,
            save_error: false,
            all_expanded: false,
            expand_button_text: 'Expand all (slow)'
        }
    },
    computed: {
        draft_exists() {
            return this.$root.draft_cost_calculator !== null
        },
        draft_locked_by() {
            return this.$root.draft_cost_calculator["Lock Info"]["Locked by"]
        },
        draft_locked_by_someone_else() {
            return this.draft_locked_by != this.$root.current_user_email
        }
    },
    created: function() {
        this.$root.fetchDraftCostCalculator(true)
        this.$root.fetchPublishedCostCalculator(false)
        this.$root.fetchExchangeRates()
    },
    methods: {
        saveDraft() {
            axios.put('/api/v1/draft_cost_calculator', {
                components: this.$root.all_components,
                products: this.$root.all_products
            })
            .then(response => {
                this.save_message = response.data.message;
                this.save_error = false;
            })
            .catch(error => {
                this.$root.error_messages.push('Unable to save draft, please try again or contact an system administrator.')
                this.save_message = error.response.data;
                this.save_error = true;
            });
        },
        backToPreview() {
            /* Redirect user to the preview page */
            window.location.href = "/pricing_preview"
        },
        toggleCollapse(event) {
            if (this.all_expanded) {
                $('.collapse').collapse('hide')
                this.all_expanded = false
                this.expand_button_text = 'Expand all (slow)'
            } else {
                $('.collapse').collapse('show')
                this.all_expanded = true
                this.expand_button_text = 'Collapse all (slow)'
            }
        }
    },
    template:
        /*html*/`
        <template v-if="this.$root.draft_data_loading">
          <v-pricing-data-loading/>
        </template>
        <template v-else>
          <template v-if="this.$root.any_errors">
            <v-pricing-error-display/>
          </template>
          <template v-if="!draft_exists">
            <h1>Update Cost Calculator</h1>
            <p>No draft exists, please return to <a href='/pricing_preview'>the main page</a></p>
          </template>
          <template v-else>
            <div class="row">
              <div v-if="draft_locked_by_someone_else" class="col-12">
                <div class="alert alert-danger" role="alert">
                  <h3>Warning</h3>
                  <p>The draft is locked by someone else, any changes will not be saved</p>
                  <a class="btn btn-lg btn-primary" href="/pricing_preview"><i class="fas fa-edit mr-2"></i>Back to preview</a>
                </div>
              </div>
              <div class="col-md-2">
                <nav id="pricing_update_sidebar" class="nav sidebar sticky-top">
                  <div class="position-sticky">
                    <nav class="nav nav-pills flex-column border-bottom">
                      <a class="nav-link my-1" href="#pricing_product_form_content">Top of the page</a>
                      <nav class="nav nav-pills flex-column">
                        <a class="nav-link ml-3 my-0 py-1" href="#changes_list">Changes</a>
                        <template v-if="!this.$root.no_validation_messages">
                          <a class="nav-link ml-3 my-0 py-1 text-danger" href="#validation_messages_list">Validation errors</a>
                        </template>
                      </nav>
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
                    <button class="btn btn-success btn-lg ml-3 mt-3 mb-2" @click="saveDraft"><i class="far fa-save"></i> Save</button>
                    <template v-if="save_message !== null">
                      <p class="text-danger ml-3" v-if="save_error"><strong>Error saving</strong> {{save_message}}</p>
                      <p class="text-success ml-3" v-else><strong>Saved!</strong> {{save_message}}</p>
                    </template>
                  </div>
                </nav>
              </div>

            <div class="col-md-10">
              <div id="pricing_product_form_content" class="link-target-offset" data-offset="0">
                <div class="card pt-3 px-3 bg-light">
                  <div class="row">
                    <div class="col-md-7 mr-auto">
                      <h2>Edit draft Cost Calculator</h2>
                      <template v-if="save_message !== null">
                        <p class="text-danger" v-if="save_error"><strong>Error saving</strong> {{save_message}}</p>
                        <p class="text-success" v-else><strong>Saved!</strong> {{save_message}}</p>
                      </template>
                      <div>
                        <button class="btn btn-secondary" @click="toggleCollapse"><i class="fas fa-caret-down"></i> {{expand_button_text}}</button>
                      </div>
                      <div class="mb-3 mt-5">
                        <button class="btn btn-success btn-lg" @click="saveDraft"><i class="far fa-save"></i> Save </button>
                        <button class="btn btn-secondary btn-lg ml-2" @click="backToPreview"><i class="fas fa-window-close"></i> Leave </button>
                      </div>
                    </div>
                    <div class="col-md-5">
                      <v-exchange-rates :mutable="false" :issued_at="this.$root.exch_rate_issued_at"/>
                    </div>
                  </div>
                  <div id="changes_list" class="link-target-offset">
                    <v-draft-changes-list :modal="false"/>
                  </div>
                  <div id="validation_messages_list" class="link-target-offset">
                    <v-draft-validation-msgs-list :modal="false"/>
                  </div>
                </div>
                <h2 class="mt-5" id="products_top">Products</h2>
                <template v-for="(category, cat_nr) in Object.keys(this.$root.all_products_per_category)">
                  <h3 :id="'products_cat_' + cat_nr" class="mt-4">{{category}}</h3>
                  <template v-for="product in this.$root.all_products_per_category[category]" :key="product['REF_ID']">
                    <v-product-form-part :product_id="product['REF_ID']"/>
                  </template>
                </template>
                <h2 class="mt-5" id="components_top">Components</h2>
                <template v-for="(category, cat_nr) in Object.keys(this.$root.all_components_per_category)">
                  <h3 :id="'components_cat_' + cat_nr" class="mt-4">{{category}}</h3>
                  <template v-for="component in this.$root.all_components_per_category[category]" :key="component['REF_ID']">
                    <v-component-form-part :component_id="component['REF_ID']"/>
                  </template>
                </template>
                <h2 class="mt-4" id="discontinued_top">Discontinued</h2>
                <h3 id="discontinued_products" class="mt-4">Products</h3>
                <template v-for="product in this.$root.discontinued_products" :key="product['REF_ID']">
                  <v-product-form-part :product_id="product['REF_ID']"/>
                </template>
                <h3 id="discontinued_components" class="mt-4">Components</h3>
                <template v-for="component in this.$root.discontinued_components" :key="component['REF_ID']">
                  <v-component-form-part :component_id="component['REF_ID']"/>
                </template>
              </div>
            </div>
          </div>
        </template>
      </template>
          `
})

app.component('v-product-form-part', {
    /* Representing an individual product on the update form */
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
    },
    methods: {
        discontinueProduct() {
            this.$root.discontinueProduct(this.product_id)
        },
        enableProduct() {
            this.$root.enableProduct(this.product_id)
        },
        cloneProduct() {
            new_id = this.$root.cloneProduct(this.product_id)
            this.$nextTick(function() {
                // Scroll to the new product
                window.location.href = '#'
                window.location.href = '#product_form_part_' + new_id;
            })
        },
        removeProduct() {
            if (!(this.isNew) ) {
                /* This should never happen, but better safe than sorry. */
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
      <div :id="'product_form_part_' + product_id" class="my-3 link-target-offset" :class="[{'border-success border-2': isNew}, {'discontinued': discontinued}, {'card': true}]">
        <div class="card-header">
          <div class="row">
            <a class="pricing_collapse_link col-auto mr-auto" :class="{'text-danger': is_invalid}" data-toggle="collapse" :data-target="'#collapseProduct' + product_id" role="button" aria-expanded="false" :aria-controls="'collapseProduct' + product_id">
              <h5 :class="{'text-danger': discontinued, 'my-1': true}"> {{ product['Name'] }} {{ discontinued ? ' - Discontinued' : '' }} <i class="fas fa-caret-down fa-lg pl-1"></i></h5>
            </a>
            <span class="col-1" v-if="is_invalid">
              <div class="d-flex justify-content-end">
                <v-form-validation-tooltip :product_id="product_id"/>
              </div>
            </span>
          </div>
        </div>
        <div :id="'collapseProduct' + product_id"  class="collapse card-body">
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
                <input class="form-control" :list="'categoryOptions' + product_id" v-model.text="product['Category']" type="text" :disabled="discontinued">
                <datalist :id="'categoryOptions' + product_id">
                  <option v-for="category in categories">{{category}}</option>
                </datalist>
              </label>
              <label class="form-label col-md-2">
                Product Type
                <input class="form-control" :list="'typeOptions' + product_id" v-model.text="product['Type']" type="text" :disabled="discontinued">
                <datalist :id="'typeOptions' + product_id">
                  <option v-for="type in types">{{type}}</option>
                </datalist>
              </label>
              <label class="form-label col-md-6">
                Product Name
                <input class="form-control" v-model.text="product['Name']" type="text" :disabled="discontinued">
              </label>
            </div>
            <div class="row align-items-top my-2">
              <div class="col-md-6 component-list-input">
                <label class="form-label" for="'products-' + product_id + '-components'">Components</label>
                <v-components-for-product :product_id="product_id" :type="'Regular'"/>
              </div>
              <div class="col-md-6 alt-component-list-input">
                <label class="form-label" for="'products-' + product_id + '-alternative_components'">Alternative Components</label>
                <v-components-for-product :product_id="product_id" :type="'Alternative'"/>
              </div>
            </div>
            <div class="row my-1">
              <label class="form-label col-md-2">
                Full Cost Fee
                <input class="form-control" v-model.text="product['Full cost fee']" type="text" :disabled="discontinued">
              </label>

              <label class="form-label col-md-2">
                Rerun Fee
                <input class="form-control" v-model.text="product['Re-run fee']" type="text" :disabled="discontinued">
              </label>

              <div class="form-check form-switch col-md-2 mt-3 pl-5">
                <input class="form-check-input" @click="makeFixedPriceDict" type="checkbox" v-model="product['is_fixed_price']" :disabled="discontinued"/>
                <label class="form-check-label">
                  Fixed Price
                </label>
              </div>

              <label class="form-label col-md-4">
                Comment
                <input class="form-control" v-model.text="product['Comment']" type="text" :disabled="discontinued">
              </label>
            </div>
            <div v-if="this.isFixedPrice" class="row">
              <h5>Fixed Price (SEK)</h5>
              <label class="form-label col-md-2">
                Internal
                <input class="form-control" v-model.text="product['fixed_price']['price_in_sek']" type="text" :disabled="discontinued">
              </label>

              <label class="form-label col-md-2">
                Swedish Academia
                <input class="form-control" v-model.text="product['fixed_price']['price_for_academics_in_sek']" type="text" :disabled="discontinued">
              </label>
              <label class="form-label col-md-2">
                Full Cost
                <input class="form-control" v-model.text="product['fixed_price']['full_cost_in_sek']" type="text" :disabled="discontinued">
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

app.component('v-form-validation-tooltip', {
    /* handles the warning triangle on individual product headers which can display a
     * list of validation errors for that specific product
     */
    props: ['product_id'],
    computed: {
        validation_msgs() {
            if (this.product_id in this.$root.validation_msgs['products']) {
                return_msg = ''
                for (msg_type in this.$root.validation_msgs['products'][this.product_id]) {
                    validation_msgs = this.$root.validation_msgs['products'][this.product_id][msg_type]
                    for (msg_index in validation_msgs) {
                        msg = '<p class="fs-5 pricing-normal-width-tooltip">' + validation_msgs[msg_index] + '</p>'
                        return_msg += msg
                    }
                }
                return return_msg
            } else {
                return null
            }
        }
    },
    data() {
        return {
            tooltip: null
        }
    },
    mounted() {
        this.$nextTick(function() {
            this.tooltip = new bootstrap.Tooltip(this.$el)
        })
    },
    watch: {
        validation_msgs(newVal, oldVal) {
            this.$nextTick(function() {
                this.tooltip = new bootstrap.Tooltip(this.$el)
            })
        }
    },
    template:  /*html*/`
        <h3 class="my-0 text-danger" data-toggle="tooltip" data-customClass="pricing-normal-width-tooltip" data-placement="top" :title="validation_msgs" data-html=true>
          <i class="fas fa-exclamation-triangle" :data-id="product_id"></i>
        </h3>`
    })

app.component('v-component-form-part', {
    /* Representing an individual component on the update form */
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
            new_id = this.$root.cloneComponent(this.component_id)
            this.$nextTick(function() {
                // Scroll to the new product
                window.location.href = '#'
                window.location.href = '#component_form_part_' + new_id;
            })
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
      <div :id="'component_form_part_' + component_id" class="my-3 link-target-offset" :class="[{'border-success border-2': isNew}, {'discontinued': discontinued}, {'card': true}]">
        <div class="card-header">
          <div class="row">
            <a class="pricing_collapse_link" data-toggle="collapse" :data-target="'#collapseComponent' + component_id" role="button" aria-expanded="false" :aria-controls="'collapseComponent' + component_id">
              <h5 :class="{'text-danger': discontinued, 'my-1': true}"> {{ component['Product name'] }} {{ discontinued ? ' - Discontinued' : '' }} <i class="fas fa-caret-down fa-lg pl-1"></i></h5>
            </a>
          </div>
        </div>
        <div :id="'collapseComponent' + component_id"  class="collapse card-body">
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
                    <input class="form-control" :list="'compCategoryOptions' + component_id" v-model.text="component['Category']" type="text" :disabled="discontinued">
                    <datalist :id="'compCategoryOptions' + component_id">
                      <option v-for="category in categories">{{category}}</option>
                    </datalist>
                  </label>
                  <label class="form-label col-md-2">
                    Product Type
                    <input class="form-control" :list="'compTypeOptions' + component_id" v-model.text="component['Type']" type="text" :disabled="discontinued">
                    <datalist :id="'compTypeOptions' + component_id">
                      <option v-for="type in types">{{type}}</option>
                    </datalist>
                  </label>
                  <label class="form-label col-md-6">
                    Component Name
                    <input class="form-control" v-model.text="component['Product name']" type="text" :disabled="discontinued">
                  </label>
                </div>
                <div class="row my-1">
                  <label class="form-label col-md-2">
                    Manufacturer
                    <input class="form-control" v-model.text="component['Manufacturer']" type="text" :disabled="discontinued">
                  </label>

                  <label class="form-label col-md-2">
                    Re-seller
                    <input class="form-control" v-model.text="component['Re-seller']" type="text" :disabled="discontinued">
                  </label>

                  <label class="form-label col-md-6">
                    Product #
                    <input class="form-control" v-model.text="component['Product #']" type="text" :disabled="discontinued">
                  </label>

                  <label class="form-label col-md-2">
                    Units
                    <input class="form-control" v-model.text="component['Units']" type="text" :disabled="discontinued">
                  </label>

                </div>
                <div class="row my-1">
                  <label class="form-label col-md-2">
                    Discount
                    <input class="form-control" v-model.text="component['Discount']" type="text" :disabled="discontinued">
                  </label>

                  <label class="form-label col-md-2">
                    List Price
                    <input class="form-control" v-model.text="component['List price']" type="text" :disabled="discontinued">
                  </label>

                  <label class="form-label col-md-2">
                    Currency
                    <select class="form-select" list="currencyList" v-model.text="component['Currency']" type="text" :disabled="discontinued">
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="SEK">SEK</option>
                  </label>

                  <label class="form-label col-md-6">
                    Comment
                    <input class="form-control" v-model.text="component['Comment']" type="text" :disabled="discontinued">
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
        </div>
      `
})


app.component('v-modal-component', {
    /* Representing the content of the modal where components are associated to a specific product */
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
          <template v-if="this.$root.draft_data_loading">
            <div>
              Loading
            </div>
          </template>
          <template v-else>
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
                          <v-component-table-row :product_id="this.$root.modal_product_id" :type="this.$root.modal_type" :added="true" :component_data="component_data" :component_id="comp_id"/>
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
                            <v-component-table-row :product_id="this.$root.modal_product_id" :type="this.$root.modal_type" :added="false" :component_data="component" :component_id="component['REF_ID']"/>
                          </template>
                        </template>
                      </tbody>
                    </table>
                  </template>
                </div>
              </form>
            </div>
          </template>
        `
})

app.component('v-components-for-product', {
    /* Representing the disabled input field for components associated to a specific product */
    props: ['product_id', 'type'],
    computed: {
        product() {
            return this.$parent.product
        },
        discontinued() {
            return (this.product['Status'] == 'Discontinued')
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
            if (event) {
                this.$root.modal_product_id = event.target.dataset.productId
                this.$root.modal_type = event.target.dataset.type
            }
            var cModal = new bootstrap.Modal(document.getElementById('chooseComponentsModal'))
            cModal.show()
        }
    },
    template: /*html*/`
            <div class="input-group">
              <fieldset disabled>
                <input class="form-control" :id="element_id" type="text" :value="componentIds">
              </fieldset>
              <button type="button" class="btn btn-primary edit-components" @click="this.showModalFn" :data-product-id="product_id" :data-type="type" :disabled="discontinued">Edit</button>
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
                  <v-component-table-row :product_id="product['REF_ID']" :type="type" :added="true" :component_data="component_data" :component_id="comp_id"/>
                </template>
              </tbody>
            </table>
               `
})

app.component('v-component-table-row', {
    /* Representing an individual component in the 'v-components-for-product' list*/
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
        product() {
            return this.$parent.product
        },
        discontinued() {
            return (this.product['Status'] == 'Discontinued')
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
    mounted() {
        /* Initializing tooltip, needed for dynamic content to have tooltips */
        this.tooltip = new bootstrap.Tooltip(this.$el)
    },
    methods: {
      updateQuantity(new_val) {
          new_val = parseInt(new_val)
          if (this.type == 'Alternative') {
              this.$root.all_products[this.product_id]['Alternative Components'][this.component_id]['quantity'] = new_val
          } else {
              this.$root.all_products[this.product_id]['Components'][this.component_id]['quantity'] = new_val
          }
      },
      addComponent(event) {
          if (event) {
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
    template: /*html*/`
      <tr data-toggle="tooltip" data-placement="top" :data-original-title="tooltip_html" data-animation=false data-html=true>
        <th scope="row">{{component_id}}</th>
        <td>{{component['Product name']}}</td>
        <td v-if="added">
          <!-- I was for some reason unable to solve this with regular v-model... -->
          <input class="form-control" type="number" min=1 :value="component_data['quantity']" @input="updateQuantity($event.target.value)" :disabled="discontinued"/>
        </td>
        <td class="pl-3 pt-2" v-if="added">
          <button class="btn mr-2" href="#" @click="this.removeComponent" :disabled="discontinued">
            <i class="far fa-times-square fa-lg text-danger"></i>
          </button>
        </td>
      </tr>
      `
})

app.mount('#pricing_update_main')
