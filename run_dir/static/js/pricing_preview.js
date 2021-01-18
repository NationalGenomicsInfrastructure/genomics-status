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
            this.new_draft_being_created = true
            axios
              .post('/api/v1/draft_cost_calculator')
              .then(response => {
                  this.$root.draft_data_loading = true
                  this.$root.fetchDraftCostCalculator(true)
                  this.new_draft_being_created = false
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
        <div class="row mb-3">
          <h1 class="col-md-11"><span id="page_title">Cost Calculator</span></h1>
        </div>
          <div class="row">
            <div class="col-3">
              <div class="card">
                <template v-if="this.$root.draft_data_loading">
                  <div>
                    Loading!
                  </div>
                </template>
                <template v-else>
                  <div class="card-header">
                    <h3>
                      <span>Draft</span>
                      <small v-if="draft_exists">
                        <span class="badge bg-primary float-right mt-1">Version {{this.$root.draft_cost_calculator["Version"]}}</span>
                      </small>
                    </h3>
                  </div>
                  <div class="card-body">
                    <template v-if="draft_exists">
                      <dl class="dl-horizontal">
                        <dt>Created by</dt>
                        <dd>{{this.$root.draft_cost_calculator["Created by user"]}}</dd>
                        <dt>Created at</dt>
                        <dd>{{draft_created_at}}</dd>
                        <dt>Last modified</dt>
                        <dd>{{draft_last_modified_at}}</dd>
                      </dl>
                      <template v-if="draft_locked_by_someone_else">
                        <p>Draft is currently locked by {{draft_locked_by}}</p>
                        <a class="btn btn-primary" href="/pricing_update">Edit draft anyway</a>
                      </template>
                      <template v-else>
                        <p>Locked by you!</p>
                        <a class="btn btn-primary" href="/pricing_update">Edit draft</a>
                        <button class="btn btn-success ml-2" data-toggle="modal" data-target="#publish_draft_modal">Publish draft</button>
                      </template>
                    </template>
                    <template v-else>
                      <p>No draft exists</p>
                      <button class="btn btn-primary" @click="create_new_draft">Start new draft</button>
                    </template>
                  </div>
                  <div class="modal fade" id="publish_draft_modal" tabindex="-1" role="dialog" aria-labelledby="publishDraftModalHeader">
                    <div class="modal-dialog" role="document">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h4 class="modal-title" id="publishDraftModalHeader">Publish new cost calculator</h4>
                          <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                          <p>Are you sure you want to publish the current draft?</p>
                          <p>This will then become the default cost calculator used for all quotes.</p>
                        </div>
                        <div class="modal-footer">
                          <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                          <button id='datepicker-btn' type="button" class="btn btn-primary" @click="publish_draft" data-dismiss="modal">Publish New Cost Calculator</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <template v-if="this.$root.published_data_loading">
              <div>
                Loading!
              </div>
            </template>
            <template v-else>
              <div class="col-3">
                <div class="card">
                  <div class="card-header">
                    <h3>
                      <span>Current</span>
                      <small>
                        <span class="badge bg-primary float-right mt-1">Version {{this.$root.published_cost_calculator["Version"]}}</span>
                      </small>
                    </h3>
                  </div>
                  <div class="card-body">
                    <template v-if="this.$root.published_data_loading">
                      <div>
                        Loading!
                      </div>
                    </template>
                    <template v-else>
                      <dl class="dl-horizontal">
                        <dt>Published by</dt>
                        <dd>{{this.$root.published_cost_calculator["Issued by user"]}}</dd>
                        <dt>Valid from</dt>
                        <dd>{{published_at}}</dd>
                      </dl>
                    </template>
                  </div>
                </div>
              </div>
            </template>
            <div class="col-4 offset-2">
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
          </div>
          <div id="alerts_go_here">
          </div>
          <template v-if="draft_exists">
            <div class="products_chooseable_div">
              <div class="row" id="table_h_and_search">
                <h2 class="col mr-auto">Current Draft</h2>
              </div>
              <v-products-table :show_discontinued="this.$root.show_discontinued"/>
            </div>
          </template>
        `
})

app.mount('#pricing_preview_main')
