window.onbeforeunload = function(){
  /* This message will only show up on IE... But needs to return something */
  return 'Please make sure you have saved your changes before leaving'
};


const vSampleRequirementsMain = {
    /* Main sample requirements app
     */
    data() {
        return {
            // Main data holders
            // Representing current state (possibly not saved)
            sample_requirements: {},

            // Representing database versions
            draft_sample_requirements: {},
            published_sample_requirements: {},


            // Tracking changes
            changes: {},

            new_requirements: new Set(),

            // Convenience
            current_user_email: null,
            draft_data_loading: true,
            published_data_loading: true,
            error_messages: [],
        }
    },
    computed: {
        any_errors() {
            return (this.error_messages.length !== 0)
        },
        done_loading() {
            return (!this.draft_data_loading && !this.published_data_loading)
        },
        next_sample_requirement_id() {
            /* Returns the lowest unused sample requirement id */
            all_ids = Object.keys(this.sample_requirements)
            max_id = Math.max(...all_ids.map(x => parseInt(x)))
            return (1 + max_id).toString()
        }
    },
    methods: {
        // Data modification methods
        discontinueSampleRequirements(id) {
            this.sample_requirements[id]['Status'] = 'Discontinued'
        },
        enableSampleRequirements(id) {
            this.sample_requirements[id]['Status'] = 'Active'
        },
        cloneSampleRequirements(id) {
            sample_requirement = this.sample_requirements[id]
            new_sr = Object.assign({}, sample_requirement)

            new_id = this.next_sample_requirement_id
            new_sr['REF_ID'] = new_id
            this.sample_requirements[new_id] = new_sr
            this.new_sample_requirements.add(new_id)
            return new_id
        },
        newSampleRequirement() {
            new_id = this.next_sample_requirement_id
            /* Hacky way to be able to avoid typing all keys that a product should contain */
            old_id = parseInt(new_id) - 1
            new_id = this.cloneSampleRequirement(old_id)
            new_sr = {}
            Object.keys(this.sample_requirements[new_id]).forEach(function(key) {
                switch(key) {
                    case 'REF_ID':
                        new_sr[key] = new_id
                        break;
                    case 'Status':
                        new_sr[key] = 'Active'
                        break;
                    default:
                        new_sr[key] = ''
                }
            })
            this.sample_requirements[new_id] = new_product
            this.new_sample_requirements.add(new_id)
            return new_id
        },
        removeSampleRequirement(sr_id) {
            /* meant to be used with new sample requirements only */
            if (!(sr_id in this.new_product)) {
                this.error_messages.push('Cannot remove sample requirement that is not new, try discontinue instead.')
            } else {
                delete this.sample_requirements[sr_id]
                delete this.new_sample_requirements[sr_id]
            }
        },
        // Fetch methods
        fetchDraftSampleRequirements(assign_data) {
            axios
                .get('/api/v1/draft_sample_requirements')
                .then(response => {
                    data = response.data.sample_requirements
                    if (data !== null) {
                        this.draft_sample_requirements = data
                        if (assign_data) {
                            this.sample_requirements = data.sample_requirements
                        }
                    }
                    this.current_user_email = response.data['current_user_email']
                    this.draft_data_loading = false
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch draft sample requirements data, please try again or contact a system administrator.')
                    this.draft_data_loading = false
                })
        },
        fetchPublishedSampleRequirements(assign_data) {
            axios
                .get('/api/v1/sample_requirements')
                .then(response => {
                    data = response.data.sample_requirements
                    if (data !== null) {
                        this.published_sample_requirements = data
                        if (assign_data) {
                            this.sample_requirements = data.sample_requirements
                            console.log(this.sample_requirements)
                        }
                    }
                    this.current_user_email = response.data['current_user_email']
                    this.published_data_loading = false
                })
                .catch(error => {
                    this.$root.error_messages.push('Unable to fetch published sample requirements data, please try again or contact a system administrator.')
                    this.published_data_loading = false
                })
        },

        // Other methods
        assignNewItems() {
            /* When loading a draft where new sample requirements have been added,
             * this will figure out which sample requirements are 'new'.
             */
            draft_sr_ids = new Set(Object.keys(this.sample_requirements))

            published_sr_ids = new Set(Object.keys(this.published_sample_requirements))

            new_sr_ids = this.symmetricSetDifference(draft_sr_ids, published_sr_ids)

            for (let new_sr_id of new_sr_ids) {
                this.new_products.add(new_sr_id)
            }
        },
        sortSampleRequirements(first_sr, second_sr) {
            /* Comparison function used to sort sample requirements on name
             */
            if (first_sr['Name'] < second_sr['Name']) {
                return -1;
            } else if (first_sr['Name'] > second_sr['Name']) {
                return 1;
            } else {
                return 0;
            }
        },
        symmetricSetDifference(setA, setB) {
            /* Convenience method taken from
             * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
             */
            let _difference = new Set(setA)
            for (let elem of setB) {
                if (_difference.has(elem)) {
                    _difference.delete(elem)
                } else {
                    _difference.add(elem)
                }
            }
            return _difference
        }
    }
}

const app = Vue.createApp(vSampleRequirementsMain)

app.component('v-sample-requirements-view', {
    /* Component to view the current state of sample requirements */
    data() {
        return {
            sample_requirements_test: {"DNA, Illumina TruSeq PCR-free, 350bp, -, 1291": {
                                      "Amount": {
                                        "Minimum": 2200,
                                        "Recommended": 2200,
                                        "Unit": "ng"
                                      },
                                      "Concentration": {
                                        "Maximum": 300,
                                        "Minimum": 50,
                                        "Unit": "ng/uL"
                                      },
                                      "Input material": "DNA",
                                      "QC recommendation": "Gel",
                                      "Quality requirement": null,
                                      "Volume": {
                                        "Minimum": 20,
                                        "Unit": "uL"
                                      }
                                    }
                                }
        }
    },
    created: function() {
        this.$root.fetchPublishedSampleRequirements(true)
    },
    template:
        /*html*/`
        <h2>Sample Requirements</h2>
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th scope="col" class="col-md-2">Name</th>
              <th scope="col" class="col-md-7">Input material</th>
              <th scope="col" class="col-md-2">Conc (ng/&microl) Min</th>
              <th scope="col" class="col-md-1">Min vol (&microl)</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(requirement_data, requirement_id) in this.$root.sample_requirements" :key="requirement_id">
              <v-requirement-table-row :requirement_data="requirement_data" :requirement_id="requirement_id"/>
            </template>
          </tbody>
        </table>
        `
})

app.component('v-requirement-table-row', {
    /* component to display a single row of sample requirements table */
    props: ['requirement_id', 'requirement_data'],
    template:
        /*html*/`
        <tr>
            <th>{{this.requirement_data['Name']}}</th>
            <td>{{this.requirement_data['Input material']}}</td>
            <td>{{this.requirement_data['Concentration']['Minimum']}}</td>
            <td>{{this.requirement_data['Volume']['Minimum']}}</td>
        </tr>
        `
    }
)


app.component('v-sample-requirements-update', {
    /* Component to be able to update sample requirements.
     */
    data() {
        return {
            save_message: null,
            save_error: false,
        }
    },
    computed: {
        draft_exists() {
            return this.$root.draft_sample_requirements !== null
        },
        draft_locked_by() {
            return this.$root.draft_sample_requirements["Lock Info"]["Locked by"]
        },
        draft_locked_by_someone_else() {
            return this.draft_locked_by != this.$root.current_user_email
        },
        no_changes() {
            return (Object.keys(this.$root.changes).length === 0)
        },
        is_invalid() {
            return (Object.keys(this.$root.validation_msgs).length !== 0)
        },
    },
    created: function() {
        this.$root.fetchDraftSampleRequirements(true)
        this.$root.fetchPublishedSampleRequirements(false)
    },
    methods: {
        saveDraft() {
            axios.put('/api/v1/draft_sample_requirements', {
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
        newSampleRequirement(event) {
            event.preventDefault()
            new_id = this.$root.newSampleRequirement()
            this.$nextTick(function() {
                // Scroll to the new product
                window.location.href = '#'
                window.location.href = '#product_form_part_' + new_id;
            })
        },
        newComponent(event) {
            event.preventDefault()
            new_id = this.$root.newComponent()
            this.$nextTick(function() {
                // Scroll to the new product
                window.location.href = '#'
                window.location.href = '#component_form_part_' + new_id;
            })
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
    }
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
            categories = [...this.$root.product_categories]
            index_of_new = categories.indexOf('New products')
            if (index_of_new > -1) {
                categories.splice(index_of_new, 1)
            }
            return categories
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
            this.$nextTick(function() {
                // Scroll to the new product
                window.location.href = '#'
                window.location.href = '#product_form_part_' + this.product_id;
            })
        },
        cloneProduct() {
            new_id = this.$root.cloneProduct(this.product_id)
            if (this.discontinued) {
                this.$root.enableProduct(new_id)
            }
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
                <input class="form-control" v-model.number="product['Full cost fee']" type="number" :disabled="discontinued">
              </label>

              <label class="form-label col-md-2">
                Overhead
                <input class="form-control" v-model.number="product['Overhead']" type="number" :disabled="discontinued">
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
                <input class="form-control" v-model.number="product['fixed_price']['price_in_sek']" type="number" :disabled="discontinued">
              </label>

              <label class="form-label col-md-2">
                Swedish Academia
                <input class="form-control" v-model.number="product['fixed_price']['price_for_academics_in_sek']" type="number" :disabled="discontinued">
              </label>
              <label class="form-label col-md-2">
                Full Cost
                <input class="form-control" v-model.number="product['fixed_price']['full_cost_in_sek']" type="number" :disabled="discontinued">
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

app.mount('#sample_requirements_main')
