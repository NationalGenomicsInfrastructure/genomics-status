


const vSampleRequirementsMain = {
    /* Main sample requirements app
     */
    data() {
        return {
            // Main data holders
            // Representing current state (possibly not saved)
            sample_requirements: {},

            // Representing database versions
            draft_sample_requirements: null,
            published_sample_requirements: null,


            // Tracking changes
            changes: {},
            validation_msgs: {},

            new_sample_requirements: new Set(),

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
        cloneSampleRequirement(id) {
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
            /* Hacky way to be able to avoid typing all keys that a requirement should contain */
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
            this.sample_requirements[new_id] = new_sr
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
                this.new_sample_requirements.add(new_sr_id)
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
    created: function() {
        this.$root.fetchPublishedSampleRequirements(true)
    },
    computed: {
        version() {
            return this.$root.published_sample_requirements['Version']
        },
        release_date() {
            date = this.$root.published_sample_requirements['Issued at']
            if (!(date === undefined)) {
                return date.substring(0,10)
            }
        }
    },
    template:
        /*html*/`
        <template v-if="this.$root.published_data_loading">
          <v-sample-requirements-data-loading/>
        </template>
        <template v-else>
          <template v-if="this.$root.any_errors">
            <v-sample-requirements-error-display/>
          </template>
          <div class="row mb-3">
            <h2>Sample Requirements</h2>
            <h4>Version {{version}} - Released {{release_date}}</h4>
          </div>
          <v-requirements-table/>
        </template>
        `
})

app.component('v-requirements-table', {
    template:
        /*html*/`
        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th scope="col" rowspan="2" colspan="1">Name</th>
              <th scope="col" rowspan="2" colspan="1">Input material</th>
              <th scope="col" rowspan="2" colspan="1">QC recommendation</th>
              <th scope="col" rowspan="1" colspan="2">Quality requirement</th>
              <th scope="col" rowspan="1" colspan="3">Concentration</th>
              <th scope="col" rowspan="1" colspan="2">Volume</th>
              <th scope="col" rowspan="1" colspan="3">Amount</th>
            </tr>
            <tr>
              <th scope="col">Method</th>
              <th scope="col">RIN</th>
              <th scope="col">Min</th>
              <th scope="col">Max</th>
              <th scope="col">Unit</th>
              <th scope="col">Min</th>
              <th scope="col">Unit</th>
              <th scope="col">Min</th>
              <th scope="col">Recommended</th>
              <th scope="col">Unit</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(requirement_data, requirement_id) in this.$root.sample_requirements" :key="requirement_id">
              <v-requirement-table-row :requirement_data="requirement_data" :requirement_id="requirement_id"/>
            </template>
          </tbody>
        </table>
        `
    }
)

app.component('v-requirement-table-row', {
    /* component to display a single row of sample requirements table */
    props: ['requirement_id', 'requirement_data'],
    template:
        /*html*/`
        <tr>
            <th>{{this.requirement_data['Name']}}</th>
            <td>{{this.requirement_data['Input material']}}</td>
            <td>{{this.requirement_data['QC recommendation']}}</td>
            <td>{{this.requirement_data['Quality requirement']['Method']}}</td>
            <td>{{this.requirement_data['Quality requirement']['RIN']}}</td>
            <td>{{this.requirement_data['Concentration']['Minimum']}}</td>
            <td>{{this.requirement_data['Concentration']['Maximum']}}</td>
            <td>{{this.requirement_data['Concentration']['Unit']}}</td>
            <td>{{this.requirement_data['Volume']['Minimum']}}</td>
            <td>{{this.requirement_data['Volume']['Unit']}}</td>
            <td>{{this.requirement_data['Amount']['Minimum']}}</td>
            <td>{{this.requirement_data['Amount']['Recommended']}}</td>
            <td>{{this.requirement_data['Amount']['Unit']}}</td>
        </tr>
        `
    }
)

app.component('v-sample-requirements-data-loading', {
    /* A div with a bootstrap spinner. */
    template: /*html*/`
      <div class="spinner-grow" role="status"></div><span class="ml-3">Loading data...</span>`
 })

 app.component('v-sample-requirements-error-display', {
     /* A list of error messages */
     template: /*html*/`
       <template v-for="msg in this.$root.error_messages">
         <div class="alert alert-danger" role="alert">
           <h5 class="mt-2"><i class="far fa-exclamation-triangle mr-3"></i>{{msg}}</h5>
         </div>
       </template>`
  })


  app.component('v-sample-requirements-preview', {
      /* Main component of the sample requirements preview page.
       *
       * Serves a landing page where:
       *   - Changes are listed
       *   - A new draft can be created
       *   - The draft can be published
       *   - The draft can be deleted
       *   - The draft can be locked by a user
       */
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
        draft_last_modified_at() {
            datestring = this.$root.draft_sample_requirements['Last modified']
            return datestring.substring(0,10) + ', ' + datestring.substring(11,16)
        },
        draft_created_at() {
            datestring = this.$root.draft_sample_requirements['Created at']
            return datestring.substring(0,10) + ', ' + datestring.substring(11,16)
        },
        published_cc() {
            return this.$root.published_sample_requirements
        },
        published_at() {
            datestring = this.published_cc['Issued at']
            return datestring.substring(0,10) + ', ' + datestring.substring(11,16)
        },
        published_issued_by() {
            return this.$root.published_sample_requirements["Issued by user"]
        },
        published_version() {
            return this.$root.published_sample_requirements["Version"]
        }
      },
      created: function() {
          this.$root.fetchDraftSampleRequirements(true),
          this.$root.fetchPublishedSampleRequirements(false)
      },
      methods: {
          create_new_draft() {
              axios
                  .post('/api/v1/draft_sample_requirements')
                  .then(response => {
                      this.$root.draft_data_loading = true
                      this.$root.fetchDraftSampleRequirements(true)
                  })
                  .catch(error => {
                      this.$root.error_messages.push('Unable to create new draft, please try again or contact system administrator')
                  })
          },
          delete_draft() {
              axios
                  .delete('/api/v1/draft_sample_requirements')
                  .then(response => {
                      this.$root.draft_data_loading = true
                      this.$root.draft_sample_requirements = null
                      this.$root.fetchDraftSampleRequirements(true)
                  }).catch(error => {
                      this.$root.error_messages.push('Unable to delete draft, please try again or contact system administrator')
                  })
          },
          publish_draft() {
              axios
                  .post('/api/v1/sample_requirements_publish_draft')
                  .then(response => {
                      this.$root.published_data_loading = true
                      this.$root.draft_sample_requirements = null
                      this.$root.fetchPublishedSampleRequirements()
                  }).catch(error => {
                      this.$root.error_messages.push('Unable to publish sample requirements, please try again or contact system administrator')
                  })
          },
          reassign_lock() {
              axios
                  .post('/api/v1/sample_requirements_reassign_lock')
                  .then(response => {
                      this.$root.fetchDraftSampleRequirements(true)
                  })
                  .catch(error => {
                      this.$root.error_messages.push('Unable to reassign lock for draft, please try again or contact system administrator')
                  });
          },
          toggleDiscontinued() {
              this.$root.show_discontinued = !this.$root.show_discontinued
          }
      },
      template:
          /*html*/`
          <template v-if="this.$root.draft_data_loading || this.$root.published_data_loading">
            <template v-if="this.$root.any_errors">
              <v-sample-requirements-error-display/>
            </template>
            <v-sample-requirements-data-loading/>
          </template>
          <template v-else>
            <template v-if="this.$root.any_errors">
              <v-sample-requirements-error-display/>
            </template>
            <div class="row mb-3">
              <template v-if="draft_exists">
                <div class="col-9">
                  <h1>
                    <span id="page_title">New Sample Requirements</span>
                    <a class="btn btn-lg ml-5" :class="draft_locked_by_someone_else ? 'btn-secondary disabled' : 'btn-primary'" href="/sample_requirements_update"><i class="fas fa-edit mr-2"></i>Edit</a>
                    <button class="btn btn-lg ml-2" :class="draft_locked_by_someone_else ? 'btn-secondary disabled' : 'btn-success'" data-toggle="modal" data-target="#publish_draft_modal"><i class="far fa-paper-plane mr-2"></i>Publish</button>
                    <button class="btn btn-lg ml-2" :class="draft_locked_by_someone_else ? 'btn-danger disabled' : 'btn-danger'" data-toggle="modal" data-target="#delete_draft_modal"><i class="fas fa-trash-alt mr-2"></i>Delete</button>
                  </h1>
                  <p>
                    <span class="fw-bold">Last modified</span><span> by {{this.$root.draft_sample_requirements["Last modified by user"]}} at </span><span class="fst-italic"> {{draft_last_modified_at}}</span>
                    ---
                    <span class="fw-bold">Version {{published_version}} was published </span><span> by {{published_issued_by}} at </span><span class="fst-italic"> {{published_at}}</span>
                  </p>
                  <template v-if="draft_locked_by_someone_else">
                    <a class="btn btn-danger" @click="reassign_lock"><i class="fas fa-user-lock"></i> Reassign lock to you</a>
                    <p v-if="draft_locked_by_someone_else">Draft is currently locked by {{draft_locked_by}}</p>
                  </template>
                </div>
              </template>
              <template v-else>
                <h1>
                  <span id="page_title">New Sample Requirements</span>
                </h1>
                <p>
                <span class="fw-bold">Version {{published_version}} was published </span><span> by {{published_issued_by}} at </span><span class="fst-italic"> {{published_at}}</span>
                </p>
                <p> No draft sample requirements exists. </p>
                <p><button class="btn btn-success" @click="create_new_draft"><i class="fas fa-user-lock"></i> Create sample requirements</button></p>
              </template>
            </div>
            <template v-if="draft_exists">
              <div class="row">
                <div class="col-12">
                  <p>Changes here! <!-- <v-draft-changes-list :modal="false"/> --></p>
                </div>
              </div>
            </template>

            <template v-if="draft_exists">
              <div class="requirements_chooseable_div mt-2">
                <div class="row" id="table_h_and_search">
                  <h2 class="col mr-auto">Preview</h2>
                </div>
                <v-requirements-table/>
              </div>
            </template>

            <template v-if="draft_exists">
              <!--- Modals --->
              <div class="modal fade" id="publish_draft_modal" tabindex="-1" role="dialog" aria-labelledby="publishDraftModalHeader">
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h4 class="modal-title" id="publishDraftModalHeader">Publish new sample requirements</h4>
                      <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                      <p>Are you sure you want to publish the current draft?</p>
                      <p>This will then become the default sample requirements used for all quotes.</p>
                      <v-draft-changes-list :modal="true" :modal_id="'publish_draft_modal'"/>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-primary" @click="publish_draft" data-dismiss="modal">Publish New Sample Requirements</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal fade" id="delete_draft_modal" tabindex="-1" role="dialog" aria-labelledby="deleteDraftModalHeader">
                <div class="modal-dialog" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h4 class="modal-title" id="deleteDraftModalHeader">Delete new sample requirements</h4>
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
            </template>
          </template>
          `
      }
  )

  app.component('v-draft-changes-list', {
      /* A list of changes in the draft compared to the latest published sample requirements.
       *   - Slightly modified look if it is placed in a modal
       */
      props: ['modal', 'modal_id'],
      computed: {
          changes() {
              return this.$root.changes
          },
          no_changes() {
              return Object.keys(this.changes).length === 0
          }
      },
      methods: {
          is_new_requirement(id) {
              changes_data = this.changes[id]
              if (Object.keys(changes_data).length !== 0) {
                  return (Object.keys(changes_data)[0] == 'All')
              } else {
                  return false
              }
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
              <div :class="modal ? 'col-12' : 'col-6 border-left'">
                <h4>Sample Requirements</h4>
                <div class="row">
                  <template v-for="(changes_data, req_id) in changes" :key="req_id">
                    <div class="ml-3 mb-3">
                      <h5 class="col-12">
                        {{this.$root.all_requirements[comp_id]['Requirement name']}}:
                        <template v-if="is_new_requirement(req_id)">
                          <strong class="ml-2"> - New requirement!</strong>
                        </template>
                      </h5>
                      <template v-if="is_new_requirement(req_id)">
                        <div class="ml-3 mr-2">
                          <div v-for="(new_req_value, new_req_key) in changes_data['All'][0]" :key="new_req_key">
                            <strong>{{new_req_key}}:</strong> {{new_req_value}}
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="ml-3 mr-2" v-for="(comp_type_changes_data, type_key) in comp_changes_data" :key="type_key">
                          <strong class="mr-2">{{type_key}}:</strong>
                          {{comp_type_changes_data[1]}} <i class="fas fa-arrow-right"></i> {{comp_type_changes_data[0]}}
                        </div>
                      </template>
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
      /* A list of validation errors in the draft compared to the latest published sample requirements
       *   - Slightly modified look if it is placed in a modal
       */
      props: ['modal', 'modal_id'],
      computed: {
          messages() {
              return this.$root.validation_msgs
          },
          any_messages() {
              return (Object.keys(this.messages).length !== 0)
          }
      },
      methods: {
          scroll_to_on_page(event) {
              event.preventDefault();
              destination = event.target.dataset.scrollToLink
              scroll_to = function(dest) {
                  window.location.href = '#'
                  window.location.href = dest
              }
              if (this.modal) {

                  var myModalEl = document.getElementById(this.modal_id)
                  var modal = bootstrap.Modal.getInstance(myModalEl) // Returns a Bootstrap modal instance
                  myModalEl.addEventListener('hidden.bs.modal', function (event) {
                      scroll_to(destination)
                  })
                  modal.hide();
              } else {
                  scroll_to(destination)
              }
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
                <h4>Requirements</h4>
                <div class="row pr-4">
                  <template v-for="(validation_msgs_data, req_id) in messages" :key="req_id">
                    <div class="ml-3 mb-3">
                      <h5 class="col-12"><a href='#' :data-scroll-to-link="'#requirement_form_part_' + req_id" @click="scroll_to_on_page">{{this.$root.sample_requirements[req_id]['Name']}}:</a></h5>
                      <div class="ml-3" v-for="(type_validation_msgs_data, type_key) in validation_msgs_data" :key="type_key">
                        <ul v-for="validation_msg in type_validation_msgs_data">
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
        window.onbeforeunload = function(){
          /* This message will only show up on IE... But needs to return something */
          return 'Please make sure you have saved your changes before leaving'
        };
    },
    methods: {

        saveDraft() {
            axios.put('/api/v1/draft_sample_requirements', {
                components: this.$root.all_components,
                requirements: this.$root.all_requirements
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
            window.location.href = "/sample_requirements_preview"
        },
        newSampleRequirement(event) {
            event.preventDefault()
            new_id = this.$root.newSampleRequirement()
            this.$nextTick(function() {
                // Scroll to the new requirement
                window.location.href = '#'
                window.location.href = '#requirement_form_part_' + new_id;
            })
        }
    },
    template:
        /*html*/`
        <template v-if="this.$root.draft_data_loading">
          <v-sample-requirements-data-loading/>
        </template>
        <template v-else>
          <template v-if="this.$root.any_errors">
            <v-sample-requirements-error-display/>
          </template>
          <template v-if="!draft_exists">
            <h1>Update Sample Requirements</h1>
            <p>No draft exists, please return to <a href='/sample_requirements_preview'>the main page</a></p>
          </template>
          <template v-else>
            <template v-if="draft_locked_by_someone_else">
              <div class="alert alert-danger" role="alert">
                <h5 class="mt-2"><i class="far fa-exclamation-triangle mr-3"></i>The draft is locked by {{draft_locked_by}}, please reassign lock before attempting to make any changes.</h5>
              </div>
            </template>
            <h1>Update Sample Requirements</h1>
            <div class="link-target-offset" data-offset="0">
              <div class="card pt-3 px-3 bg-light">
                <div class="row">
                  <div class="col-md-7 mr-auto">
                    <h2>Edit draft Sample Requirements</h2>
                    <template v-if="save_message !== null">
                      <p class="text-danger" v-if="save_error"><strong>Error saving</strong> {{save_message}}</p>
                      <p class="text-success" v-else><strong>Saved!</strong> {{save_message}}</p>
                    </template>
                  </div>
                  <div class="row">
                    <div class="d-flex align-items-start flex-column col-auto mr-auto">
                      <div class="mb-auto">
                        <button class="btn btn-success btn-lg" @click="saveDraft"><i class="far fa-save"></i> Save </button>
                        <button class="btn btn-secondary btn-lg ml-2" @click="backToPreview"><i class="fas fa-window-close"></i> Leave </button>
                      </div>
                      <div>
                        <button class="btn btn-lg mb-3" :class="no_changes ? 'btn-secondary' : 'btn-warning'" data-toggle="modal" data-target="#sample_requirements_view_changes_modal">
                          <template v-if="no_changes">
                            No changes
                          </template>
                          <template v-else>
                            List changes<i v-if="is_invalid" class="fas fa-exclamation-triangle ml-1"></i>
                          </template>
                        </button>
                        <!----- Modal ----->
                        <div class="modal fade" id="sample_requirements_view_changes_modal" tabindex="-1" role="dialog" aria-labelledby="sample_requirements_view_changes_modal_header">
                          <div class="modal-dialog modal-lg" role="document">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h4 class="modal-title" id="sample_requirements_view_changes_modal_header">List of Changes and Validation Errors</h4>
                                <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
                              </div>
                              <div class="modal-body">
                                <template v-if="this.$root.no_validation_messages">
                                  <p>No validation erros found</p>
                                </template>
                                <template v-else>
                                  <p>The current draft contains validation errors, please fix these before publishing:</p>
                                  <v-draft-validation-msgs-list :modal="true" :modal_id="'sample_requirements_view_changes_modal'"/>
                                </template>
                                <v-draft-changes-list :modal="true" :modal_id="'sample_requirements_view_changes_modal'"/>
                              </div>
                              <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 class="mt-5 display-3">Sample Requirements <button class="btn btn-success btn-lg ml-2" @click="newSampleRequirement"><i class="fas fa-plus"></i> New Requirement</button></h1>
              <template v-for="(requirement_data, requirement_id) in this.$root.sample_requirements" :key="requirement_id">
                <v-requirement-form-part :requirement_id="requirement_id"/>
              </template>
            </div>
          </template>
        </template>
              `
})

app.component('v-requirement-form-part', {
    /* Representing an individual requirement on the update form */
    props: ['requirement_id'],
    computed: {
        requirement() {
            return this.$root.sample_requirements[this.requirement_id]
        },
        discontinued() {
            return (this.requirement['Status'] == 'Discontinued')
        },
        isNew() {
            return this.$root.new_sample_requirements.has(this.requirement_id)
        },
        validation_msgs() {
            if (this.requirement_id in this.$root.validation_msgs) {
                return this.$root.validation_msgs[this.requirement_id]
            } else {
                return null
            }
        },
        is_invalid() {
            return (this.validation_msgs !== null)
        },
    },
    methods: {
        discontinueRequirement() {
            this.$root.discontinueRequirement(this.requirement_id)
        },
        enableRequirement() {
            this.$root.enableRequirement(this.requirement_id)
            this.$nextTick(function() {
                // Scroll to the new requirement
                window.location.href = '#'
                window.location.href = '#requirement_form_part_' + this.requirement_id;
            })
        },
        cloneRequirement() {
            new_id = this.$root.cloneRequirement(this.requirement_id)
            if (this.discontinued) {
                this.$root.enableRequirement(new_id)
            }
            this.$nextTick(function() {
                // Scroll to the new requirement
                window.location.href = '#'
                window.location.href = '#requirement_form_part_' + new_id;
            })
        },
        removeRequirement() {
            if (!(this.isNew) ) {
                /* This should never happen, but better safe than sorry. */
                alert("Only new requirements are allowed to be removed, others should be discontinued")
            }
            this.$root.removeRequirement(this.requirement_id)
        }
    },
    template:
      /*html*/`
      <div :id="'requirement_form_part_' + requirement_id" class="my-3 link-target-offset" :class="[{'border-success border-2': isNew}, {'discontinued': discontinued}, {'card': true}]">
        <div class="card-header">
          <div class="row">
            <h5 :class="{'text-danger': discontinued, 'my-1': true}"> {{ requirement['Name'] }} {{ discontinued ? ' - Discontinued' : '' }}</h5>
            <span class="col-1" v-if="is_invalid">
              <div class="d-flex justify-content-end">
                <v-form-validation-tooltip :requirement_id="requirement_id"/>
              </div>
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-10">
              <div class="row my-1">
                <fieldset disabled class='col-md-1'>
                  <label class="form-label">
                    ID
                    <input class="form-control" v-model.number="requirement['REF_ID']" type="number">
                  </label>
                </fieldset>
                <label class="form-label col-md-6">
                  Name
                  <input class="form-control" v-model.text="requirement['Name']" type="text" :disabled="discontinued">
                </label>
              </div>
            </div>
            <div class="col-md-2 align-self-end pl-4">
              <button type="button" class="btn btn-outline-success w-100 mb-2" @click="this.cloneRequirement">Clone<i class="far fa-clone fa-lg text-success ml-2"></i></button>
              <div v-if="this.isNew" class="">
                <button type="button" class="btn btn-outline-danger w-100" @click="this.removeRequirement">Remove<i class="fas fa-times fa-lg text-danger ml-2"></i></button>
              </div>
              <div v-else class="">
                <button v-if="this.discontinued" type="button" class="btn btn-outline-danger w-100" @click="this.enableRequirement">Enable<i class="far fa-backward fa-lg text-danger ml-2"></i></button>
                <button v-else type="button" class="btn btn-outline-danger w-100" @click="this.discontinueRequirement">Discontinue<i class="fas fa-times fa-lg text-danger ml-2"></i></button>
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
    props: ['req_id'],
    computed: {
        validation_msgs() {
            if (this.req_id in this.$root.validation_msgs) {
                return_msg = ''
                for (msg_type in this.$root.validation_msgs[this.req_id]) {
                    validation_msgs = this.$root.validation_msgs[this.req_id[msg_type]]
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
          <i class="fas fa-exclamation-triangle"></i>
        </h3>`
    })

app.mount('#sample_requirements_main')
