const vProjectsRunningNotes = {
    props: ['latest_running_note_obj', 'sticky'],
    methods: {
        getRunningNoteProperty(key){
            if (this.latest_running_note !== undefined) {
                if (key in this.latest_running_note) {
                    return this.latest_running_note[key]
                }
            }
            return undefined
        }
    },
    computed: {
        categories() {
            return this.getRunningNoteProperty('categories')
        },
        categories_labels() {
            if (this.categories == undefined) {
                return ''
            }
            // The generate_category_label method is defined in running_notes.js
            return generate_category_label(this.categories)
        },
        created_at_utc() {
            return this.getRunningNoteProperty('created_at_utc')
        },
        formattedTimeStamp() {
            // Get the timestamp from the running note
            let timestamp = this.created_at_utc;

            // Create a new Date object using the timestamp
            let date = new Date(timestamp);

            // Get the current date
            let now = new Date();

            // Calculate the difference in seconds
            let diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) {
                return 'Just now';
            }

            let diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} minutes ago`;
            }

            let diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} hours ago`;
            }

            let diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} days ago`;
        },
        formatted_note() {
            if (this.note == undefined) {
                return ''
            }
            return marked.parse(this.note)
        },
        latest_running_note() {
            // Check if running note is an object
            if (typeof this.latest_running_note_obj == 'object') {
                return this.latest_running_note_obj
            }
            let latest_running_note_json = JSON.parse(this.latest_running_note_obj)
            return Object.values(latest_running_note_json)[0];
        },
        note() {
            return this.getRunningNoteProperty('note')
        },
        user() {
            return this.getRunningNoteProperty('user')
        }
    },
    template:
    /*html*/`
    <div class="pb-3">
        <div class="card">
            <div class="card-header bi-project-note-header">
                <span>{{ this.user }}</span> - <span class="todays_date">{{ formattedTimeStamp }}</span>
                <template v-if="categories">
                - <span v-html="categories_labels"/>
                </template>
            </div>
            <div class="card-body bi-project-note-text">
                <div class="running-note-body text-muted" v-html="formatted_note"/>
            </div>
        </div>
    </div>
    `,
}

export const vProjectDetails = {
    name: 'v-project-details',
    // The single_project_mode is to be used when only a single project is used for the app
    // and the project cards are not shown
    props: ['project_id', 'as_modal', 'single_project_mode'],
    computed: {
        project_data() {
            return this.$root.project_details[this.project_id]
        }
    },
    created: function() {
        console.log('Single project created');
        if (this.single_project_mode && !this.$root.single_project_mode) {
            // Enable single project mode on app level
            this.$root.single_project_mode = true;
        }
        if (this.$root.single_project_mode) {
            this.$root.fetchProjectDetails(this.project_id);
        }
    },
    template: 
    /*html*/`
        <div class="row" v-if='project_data'>
            <div class="col-12">
                <div :class="{ 'modal-header': as_modal }">
                    <h1 :class="{ 'modal-title': as_modal }" id="projectDetailsModalLabel">
                    <a :href="'/project_new/' + project_id">{{project_id}}</a>, {{project_data.project_name}}
                    <span class="text-muted ml-4"><a class="badge rounded-pill bg-secondary text-decoration-none" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">{{project_data['customer_project_reference']}}</a></span>
                    </h1>
                </div>
                <small><span class="badge" id="project_status_alert"></span></small>
                    <a href="#" class="btn btn-outline-dark btn-xs float-right mt-4" id="show_order_timeline">
                        <span id="show_orderdates_btn" style="display:none;">Show</span>
                        <span id="hide_orderdates_btn">Hide</span> order dates on timeline
                    </a>
                </h1>
                <h2><span class="badge bg-secondary w-100 mt-3">{{project_data.status}}status</span></h2>
            </div>
            <div class="col-4">
                <h4>Library preparation</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Number of samples:</dt>                    <dd class="col-7 mb-0">{{ project_data.sample_units_ordered }}</dd>
                    <dt class="col-5 text-right">Sample type:</dt>                          <dd class="col-7 mb-0">{{ project_data.sample_type }}</dd>
                    <dt class="col-5 text-right">Library construction method:</dt>          <dd class="col-7 mb-0">{{ project_data.library_construction_method }}</dd>
                    <dt class="col-5 text-right">Library prep option:</dt>                  <dd class="col-7 mb-0">{{ project_data.library_prep_option }}</dd>
                    <dt class="col-5 text-right">Library type (ready-made libraries):</dt>  <dd class="col-7 mb-0">{{ project_data['library_type_(ready-made_libraries)'] }}</dd>
                </dl>
                <h4>Sequencing</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Number of lanes ordered:</dt>  <dd class="col-7 mb-0">{{ project_data.lanes_ordered }}</dd>
                    <dt class="col-5 text-right">Sequencing platform:</dt>      <dd class="col-7 mb-0">{{ project_data.sequencing_platform }}</dd>
                    <dt class="col-5 text-right">Flowcell:</dt>                 <dd class="col-7 mb-0">{{ project_data.flowcell }}</dd>
                    <dt class="col-5 text-right">Flowcell option:</dt>          <dd class="col-7 mb-0">{{ project_data.flowcell_option }}</dd>
                    <dt class="col-5 text-right">Sequencing setup:</dt>         <dd class="col-7 mb-0">{{ project_data.sequencing_setup }}</dd>
                    <dt class="col-5 text-right">Custom primer:</dt>            <dd class="col-7 mb-0">{{ project_data.custom_primer }}</dd>
                    <dt class="col-5 text-right">Low diversity:</dt>            <dd class="col-7 mb-0">{{ project_data.low_diversity }}</dd>
                    <dt class="col-5 text-right">PhiX %:</dt>                   <dd class="col-7 mb-0">{{ project_data.phix_percentage }}</dd>
                </dl>
            </div>
            <div class="col-4">
                <h4>Bioinformatics</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Reference genome</dt>       <dd class="col-7 mb-0">{{ project_data.reference_genome }}</dd>
                    <dt class="col-5 text-right">Organism</dt>               <dd class="col-7 mb-0">{{ project_data.organism }}</dd>
                    <dt class="col-5 text-right">Best practice analysis</dt> <dd class="col-7 mb-0">{{ project_data.best_practice_bioinformatics }}</dd>
                </dl>
                <h4>Links</h4>
                <h3><span class="badge bg-secondary w-100 text-muted"><h3><a class="text-decoration-none" target="_blank" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">Order portal</a></h3></span>
                
            </div>
            <div class="col-4">
                <h2>Project comment</h2>
                <p>{{ project_data.project_comment }}</p>
            </div>

            <h2>Status</h2>
            <div class="col-4">
                <h4>Reception Control</h4>
                <dl class="row">
                    <dt class="col-5 text-right">Number of samples ordered</dt> <dd class="col-7 mb-0">{{ project_data.sample_units_ordered }}</dd>
                    <dt class="col-5 text-right">Number of lanes ordered</dt>   <dd class="col-7 mb-0">{{ project_data.lanes_ordered }}</dd>
                    <dt class="col-5 text-right">Failed samples</dt>           <dd class="col-7 mb-0">{{ project_data.failed_samples }}</dd>
                    <dt class="col-5 text-right">Passed samples</dt>           <dd class="col-7 mb-0">{{ project_data.passed_samples }}</dd>
                    <dt class="col-5 text-right">Open date</dt>                <dd class="col-7 mb-0">{{ project_data.open_date }}</dd>
                    <dt class="col-5 text-right">QC start date</dt>            <dd class="col-7 mb-0">{{ project_data.qc_start_date }}</dd>
                </dl>
            </div>
            <div class="col-4">
                <h4>Library QC</h4>
            </div>
            <div class="col-4">
                <h4>Sequencing and Bioinformatics</h4>
            </div>
            <!-- TABS -->
            <div>
                <ul class="nav nav-tabs" id="myTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="project-details-tab" data-toggle="tab" data-target="#project-details-pane" type="button" role="tab" aria-controls="project-details-pane" aria-selected="true">Project information</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="project-samples-tab" data-toggle="tab" data-target="#project-samples-pane" type="button" role="tab" aria-controls="project-samples-pane" aria-selected="false">Samples</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="project-running-notes-tab" data-toggle="tab" data-target="#project-running-notes-pane" type="button" role="tab" aria-controls="project-running-notes-pane" aria-selected="false" disabled>Running Notes</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="project-user-communication-tab" data-toggle="tab" data-target="#project-user-communication-pane" type="button" role="tab" aria-controls="project-user-communication-pane" aria-selected="false" disabled>User communication</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="project-links-tab" data-toggle="tab" data-target="#project-links-pane" type="button" role="tab" aria-controls="project-links-pane" aria-selected="false" disabled>Links</button>
                    </li>
                </ul>
                <div class="tab-content" id="myTabContent">
                    <div class="tab-pane fade show active" id="project-details-pane" role="tabpanel" aria-labelledby="project-details-tab" tabindex="0">Content 1</div>
                    <div class="tab-pane fade" id="project-samples-pane" role="tabpanel" aria-labelledby="project-samples-tab" tabindex="0">Content 2</div>
                    <div class="tab-pane fade" id="project-running-notes-pane" role="tabpanel" aria-labelledby="project-running-notes-tab" tabindex="0">Content 3</div>
                    <div class="tab-pane fade" id="project-user-communication-pane" role="tabpanel" aria-labelledby="project-user-communication-tab" tabindex="0">Content 4</div>
                    <div class="tab-pane fade" id="project-links-pane" role="tabpanel" aria-labelledby="project-links-tab" tabindex="0">Content 5</div>
                </div>
            </div>

        </div>
    `,
}

export const vProjectCard = {
    props: ['project_id'],
    components: {
        vProjectsRunningNotes,
        vProjectDetails
    },
    computed: {
        hasSummaryDates() {
            return ('summary_dates' in this.project) && (Object.keys(this.project['summary_dates']).length > 0)
        },
        project() {
            return this.$root.all_projects[this.project_id]
        },
        project_comment() {
            if (this.project['project_comment'] == undefined) {
                return ''
            }
            return marked.parse(this.project['project_comment'])
        },
        project_name() {
            if ('project_name' in this.project) {
                return this.project['project_name']
            }
            return ''
        }
    },
    template: 
    /*html*/`

    <div class="card my-2" @click=this.$root.fetchProjectDetails(this.project_id)>
        <div class="card-body">
            <div class="d-flex justify-content-between align-center mb-3">
                <h5 class="my-1">
                    <a class="text-decoration-none" href='#' data-toggle="modal" :data-target="'#modal_' + project_id" aria-expanded="false" :aria-controls="'#collapse_' + project_id">
                        {{ project_name }}
                    </a>

                </h5>
                <div class="col-3">
                    <div class="d-flex justify-content-end">
                        <h5 class="my-1">
                            <span :class="'badge bg-' + this.$root.projectTypeColor(project)">{{ project['type'][0] }}</span>
                        </h5>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="">
                    <template v-if="project_id in this.$root.sticky_running_notes">
                        <v-projects-running-notes :latest_running_note_obj="this.$root.sticky_running_notes[project_id]" :sticky="true"></v-projects-running-notes>
                    </template>
                </div>

                <!-- Modal -->
                <div class="modal fade" :id="'modal_' + project_id" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-body">
                                <!-- This shows the project page -->
                                <v-project-details :project_id="project_id" :single_project_mode="false"/>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary">Save changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`,
}

export const vProjectCards = {
    name: 'v-projects-cards',
    components: {
        vProjectCard
    },
    methods: {
        selectFilterValue(event, include_all_key) {
            /* A method to save a click on the 'All' switch when trying to filter */
            if ((event.target.tagName == 'LABEL') || (event.target.tagName == 'INPUT')) {
                this.$root[include_all_key] = false
            }
        }
    },
    created: function() {
        this.$root.fetchProjects();
    },
    template:
    /*html*/`
    <div class="mx-2">
        <h1>Projects Status</h1>
        <div class="card p-3">
            <div class="row row-cols-4">
                <div class="col">
                    <h4>Status</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="status_all_switch" v-model="this.$root.include_all_statuses"/>
                        <label class="form-check-label" for="status_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_status, status) in this.$root.allStatuses">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_statuses')">
                            <input class="form-check-input" type="checkbox" :id="'status_filter_'+status" :value="status" v-model="this.$root.status_filter" :disabled="this.$root.include_all_statuses"/>
                            <label class="form-check-label" :for="'status_filter_' + status">{{ status }} ({{this.$root.nrWithStatusVisible(status)}}/{{nr_with_status}})</label>
                        </div>
                    </template>
                </div>
                <div class="col">
                    <h4>Type</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="type_all_switch" v-model="this.$root.include_all_types">
                        <label class="form-check-label" for="type_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_type, type) in this.$root.allTypes">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_types')">
                            <input class="form-check-input" type="checkbox" :id="'type_filter_'+type" :value="type" v-model="this.$root.type_filter" :disabled="this.$root.include_all_types"/>
                            <label class="form-check-label" :for="'type_filter_' + type">{{ type }} ({{this.$root.nrWithTypeVisible(type)}}/{{nr_with_type}})</label>
                        </div>
                    </template>
                </div>
                <div class="col">
                    <h4>Project Coordinator</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="project_coordinator_all_switch" v-model="this.$root.include_all_project_coordinators">
                        <label class="form-check-label" for="project_coordinator_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_project_coordinator, project_coordinator) in this.$root.allProjectCoordinators">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_project_coordinators')">
                            <input class="form-check-input" type="checkbox" :id="'project_coordinator_'+project_coordinator" :value="project_coordinator" v-model="this.$root.project_coordinator_filter" :disabled="this.$root.include_all_project_coordinators"/>
                            <label class="form-check-label" :for="'project_coordinator_' + project_coordinator">{{ project_coordinator }} ({{this.$root.nrWithProjectCoordinatorVisible(project_coordinator)}}/{{nr_with_project_coordinator}})</label>
                        </div>
                    </template>
                </div>
                <div class="col">
                    <h4>Application</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="application_all_switch" v-model="this.$root.include_all_applications">
                        <label class="form-check-label" for="application_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_application, application) in this.$root.allApplications">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_applications')">
                            <input class="form-check-input" type="checkbox" :id="'application_filter_'+application" :value="application" v-model="this.$root.application_filter" :disabled="this.$root.include_all_applications"/>
                            <label class="form-check-label" :for="'application_filter_' + application">{{ application }} ({{this.$root.nrWithApplicationVisible(application)}}/{{nr_with_application}})</label>
                        </div>
                    </template>
                </div>
                <div class="col">
                    <h4>Columns</h4>
                    <select id="card_columns" class="form-select" aria-label="Category to use as columns" v-model="this.$root.card_columns">
                        <option :value="['application']">Application</option>
                        <option :value="['type']">Type</option>
                        <option :value="['project_coordinator']">Project Coordinator</option>
                        <option :value="['status_fields', 'status']">Status</option>
                    </select>
                </div>
                <div class="col">
                    <h4>Sort by</h4>
                    <select id="sort_by" class="form-select" aria-label="Sort by" v-model="this.$root.sortBy">
                        <option value="most_recent_date">Most recent date</option>
                        <option value="project_id">Project ID</option>
                    </select>
                </div>
            </div>
        </div>
        <template v-if="Object.keys(this.$root.visibleProjects).length == 0">
            <template v-if="Object.keys(this.$root.all_projects).length == 0">
                <div class="d-flex justify-content-center m-5">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h3 class="ml-2">Loading projects...</h3>
                </div>
            </template>
            <template v-else>
                <p>No projects</p>
            </template>
        </template>

        <template v-else>
            <div class="row mt-5 border-bottom border-light-subtle">
                <div class="col-8">
                    <h4 my-1>
                        <i :class="'fa-solid ' + this.$root.sorting_icon + ' mr-2'" @click="this.$root.toggleSorting"></i>
                        Showing {{Object.keys(this.$root.visibleProjects).length}} of {{Object.keys(this.$root.all_projects).length}} projects in {{Object.keys(this.$root.allColumnValues).length}} columns
                    </h4>
                </div>
                <div class="col-4">
                    <div class="form-group">
                        <input type="text" class="form-control my-1" v-model="this.$root.search_value" placeholder="Search" />
                    </div>
                </div>
            </div>
            <div class="project_status_board overflow-scroll bg-white py-3">
                <div class="row flex-nowrap">
                    <template v-for="(project_ids_for_value, value) in this.$root.allColumnValues">
                        <div class="col-3 col-xxl-2 mx-3 pt-4 border bg-light rounded-3 align-self-start">
                            <h3 my-4>{{ value }}</h3>
                            <div class="row row-cols-1">
                                <div class="col">
                                    <template v-for="project_id in project_ids_for_value" :key="project_id">
                                        <v-project-card v-if="project_id in this.$root.visibleProjects" :project_id="project_id"></v-project-card>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </div>`,
}


