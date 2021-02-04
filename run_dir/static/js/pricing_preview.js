app.component('pricing-preview', {
    data: function() {
        return {
          show_discontinued: false
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
      },
      draft_last_modified_at() {
          datestring = this.$root.draft_cost_calculator['Last modified']
          return datestring.substring(0,10) + ', ' + datestring.substring(11,16)
      },
      draft_created_at() {
          datestring = this.$root.draft_cost_calculator['Created at']
          return datestring.substring(0,10) + ', ' + datestring.substring(11,16)
      },
      published_at() {
          datestring = this.$root.published_cost_calculator['Issued at']
          return datestring.substring(0,10) + ', ' + datestring.substring(11,16)
      }
    },
    created: function() {
        this.$root.fetchDraftCostCalculator(true),
        this.$root.fetchExchangeRates(),
        this.$root.fetchPublishedCostCalculator(false)
    },
    methods: {
        create_new_draft() {
            axios
              .post('/api/v1/draft_cost_calculator')
              .then(response => {
                  this.$root.draft_data_loading = true
                  this.$root.fetchDraftCostCalculator(true)
              })
        },
        delete_draft() {
            axios
              .delete('/api/v1/draft_cost_calculator')
              .then(response => {
                this.$root.draft_data_loading = true
                this.$root.draft_cost_calculator = null
                this.$root.fetchDraftCostCalculator(true)
              })
        },
        publish_draft() {
            axios
              .post('/api/v1/pricing_publish_draft')
              .then(response => {
                this.$root.published_data_loading = true
                this.$root.draft_cost_calculator = null
                this.$root.fetchPublishedCostCalculator()
              })
        },
        reassign_lock() {
            axios
              .post('/api/v1/pricing_reassign_lock')
              .then(response => {
                this.$root.fetchDraftCostCalculator(true)
              })
              .catch(error => {
                  this.error_message = error.response.data
              });
        },
        toggleDiscontinued() {
            this.reset_listjs()
            this.show_discontinued = !this.show_discontinued

            this.$nextTick(() => {
              this.init_listjs()
            })
        }
    },
    template:
        /*html*/`
        <template v-if="this.$root.draft_data_loading">
          <v-pricing-data-loading/>
        </template>
        <template v-else-if="this.$root.any_errors">
          <v-pricing-error-display/>
        </template>
        <template v-else>
          <div class="row mb-3">
            <template v-if="draft_exists">
              <div class="col-9">
                <h1>
                  <span id="page_title">New Cost Calculator</span>
                  <a class="btn btn-lg ml-5" :class="draft_locked_by_someone_else ? 'btn-secondary disabled' : 'btn-primary'" href="/pricing_update"><i class="fas fa-edit mr-2"></i>Edit</a>
                  <button class="btn btn-lg ml-2" :class="draft_locked_by_someone_else ? 'btn-secondary disabled' : 'btn-success'" data-toggle="modal" data-target="#publish_draft_modal"><i class="far fa-paper-plane mr-2"></i>Publish</button>
                  <button class="btn btn-lg ml-2" :class="draft_locked_by_someone_else ? 'btn-danger disabled' : 'btn-danger'" data-toggle="modal" data-target="#delete_draft_modal"><i class="fas fa-trash-alt mr-2"></i>Delete</button>
                </h1>
                <p>
                  <span class="fw-bold">Last modified</span><span> by {{this.$root.draft_cost_calculator["Last modified by user"]}} at </span><span class="fst-italic"> {{draft_last_modified_at}}</span>
                  ---
                  <span class="fw-bold">Version {{this.$root.published_cost_calculator["Version"]}} was published </span><span> by {{this.$root.published_cost_calculator["Issued by user"]}} at </span><span class="fst-italic"> {{published_at}}</span>
                </p>
                <template v-if="draft_locked_by_someone_else">
                  <a class="btn btn-danger" @click="reassign_lock"><i class="fas fa-user-lock"></i> Reassign lock to you</a>
                  <p v-if="draft_locked_by_someone_else">Draft is currently locked by {{draft_locked_by}}</p>
                </template>
                <a class="btn btn-large btn-secondary mt-5" href='/pricing_quote'>Temporary link to pricing_quote</a>
              </div>
              <div class="col-3">
                <exchange-rates :mutable="true" :issued_at="this.$root.exch_rate_issued_at"/>
                <button class="btn btn-link" id="more_options_btn" type="button" data-toggle="collapse" data-target="#more_options" aria-expanded="false" aria-controls="more_options">
                  More Options
                </button>
                <div class="collapse border-top py-3" id="more_options">
                  <template v-if="show_discontinued">
                    <button type="button" class="btn btn-success" id="toggle_discontinued" @click="toggleDiscontinued">Hide Discontinued Products <i class="fas fa-book-heart fa-lg pl-2"></i></button>
                  </template>
                  <template v-else>
                    <button type="button" class="btn btn-warning" id="toggle_discontinued" @click="toggleDiscontinued">Show Discontinued Products <i class="fas fa-exclamation-triangle fa-lg pl-2"></i></button>
                  </template>
                </div>
              </div>
            </template>
            <template v-else>
              <h1>
                <span id="page_title">New Cost Calculator</span>
              </h1>
              <p>
              <span class="fw-bold">Version {{this.$root.published_cost_calculator["Version"]}} was published </span><span> by {{this.$root.published_cost_calculator["Issued by user"]}} at </span><span class="fst-italic"> {{published_at}}</span>
              </p>
              <p> No draft cost calculator exists. </p>
              <p><button class="btn btn-success" @click="create_new_draft"><i class="fas fa-user-lock"></i> Create new draft</button></p>
            </template>
          </div>
          <template v-if="draft_exists">
            <div class="row">
              <div class="col-12">
                <v-draft-changes-list :modal="false"/>
              </div>
            </div>
          </template>

          <div id="alerts_go_here">
          </div>
          <v-draft-validation-msgs-list :modal="false"/>
          <template v-if="draft_exists">
            <div class="products_chooseable_div mt-2">
              <div class="row" id="table_h_and_search">
                <h2 class="col mr-auto">Preview</h2>
              </div>
              <v-products-table :show_discontinued="this.$root.show_discontinued" :quotable="false"/>
            </div>
          </template>
        </template>
        <!--- Modals --->
        <div class="modal fade" id="publish_draft_modal" tabindex="-1" role="dialog" aria-labelledby="publishDraftModalHeader">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title" id="publishDraftModalHeader">Publish new cost calculator</h4>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <template v-if="this.$root.no_validation_messages">
                  <p>Are you sure you want to publish the current draft?</p>
                  <p>This will then become the default cost calculator used for all quotes.</p>
                  <v-draft-changes-list :modal="true"/>
                </template>
                <template v-else>
                  <p>The current draft contains validation errors, please fix these before publishing:</p>
                  <v-draft-validation-msgs-list :modal="true"/>
                </template>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <template v-if="this.$root.no_validation_messages">
                  <button type="button" class="btn btn-primary" @click="publish_draft" data-dismiss="modal">Publish New Cost Calculator</button>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="modal fade" id="delete_draft_modal" tabindex="-1" role="dialog" aria-labelledby="deleteDraftModalHeader">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h4 class="modal-title" id="deleteDraftModalHeader">Delete new cost calculator</h4>
                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="alert alert-danger">
                  <h4>Are you sure you want to delete the current draft?</h4>
                  <p class="fw-bold">All changes made will be lost!</p>
                  <v-draft-changes-list :modal="true"/>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" @click="delete_draft" data-dismiss="modal">Delete Draft</button>
              </div>
            </div>
          </div>
        </div>
        `
})

app.mount('#pricing_preview_main')
