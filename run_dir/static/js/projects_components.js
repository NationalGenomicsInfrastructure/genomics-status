export const vProjectsRunningNotes = {
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

export const vProjectDataField = {
    name: 'v-project-data-field-tooltip',
    // A single dt field with a dd field
    props: ['field_name', 'project_data'],
    computed: {
        field_source() {
            if (this.project_data['field_sources'] == undefined) {
                return ''
            }
            return this.project_data['field_sources'][this.field_name]
        },
        data_value() {
            if (this.field_name in this.project_data) {
                return this.project_data[this.field_name]
            } else {
                return '-' // Missing value
            }
        }
    },
    mounted: function() {
        // Init bootstrap tooltip
        this.$nextTick(function () {
            this.tooltip = new bootstrap.Tooltip(this.$el);
        })
    },
    template:
    /*html*/`
        <span data-toggle="tooltip" data-html="true" data-placement="right" :title="field_source">{{data_value}}</span>
    `
}

export const vProjectDetails = {
    name: 'v-project-details',
    // The single_project_mode is to be used when only a single project is used for the app
    // and the project cards are not shown
    props: ['project_id', 'as_modal', 'single_project_mode'],
    computed: {
        project_data() {
            return this.$root.project_details[this.project_id]
        },
        project_data_exists() {
            return this.project_data != undefined
        },
        project_samples() {
            return this.$root.project_samples[this.project_id]
        },
        project_comment() {
            if (this.project_data['project_comment'] == undefined) {
                return ''
            }
            return marked.parse(this.project_data['project_comment'])
        },
        status_bg_class() {
            if (this.project_data['status'] == 'Aborted') {
                return 'bg-danger'
            } else if (this.project_data['status'] == 'Closed') {
                return 'bg-success'
            } else if (this.project_data['status'] == 'Ongoing') {
                return 'bg-info'
            } else if (this.project_data['status'] == 'Reception Control') {
                return 'bg-warning'
            } else if (this.project_data['status'] == 'Pending') {
                return 'bg-light text-dark'
            }
        }
    },
    created: function() {
        if (this.single_project_mode && !this.$root.single_project_mode) {
            // Enable single project mode on app level
            this.$root.single_project_mode = true;
        }
        if (this.$root.single_project_mode) {
            this.$root.fetchProjectDetails(this.project_id);
            this.$root.fetchStickyRunningNotes(this.project_id);
        }
    },
    template: 
    /*html*/`
        <template v-if="project_data_exists">
            <div class="row">
                <div class="col-12">
                    <div :class="{ 'modal-header': as_modal}">
                        <div class="row">
                            <h1 :class="{ 'modal-title': as_modal }" id="projectDetailsModalLabel" style="white-space: nowrap;">
                                <a :href="'/project_new/' + project_id" class="text-decoration-none"  style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{project_id}}</a>, {{project_data.project_name}}
                                <small class="text-muted ml-4">
                                    NGI Portal: <a class="text-decoration-none text-wrap" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">{{project_data['customer_project_reference']}}</a>
                                </small>
                            </h1>
                        </div>
                    </div>
                    <small><span class="badge" id="project_status_alert"></span></small>
                        <a href="#" class="btn btn-outline-dark btn-xs float-right mt-4" id="show_order_timeline">
                            <span id="show_orderdates_btn" style="display:none;">Show</span>
                            <span id="hide_orderdates_btn">Hide</span> order dates on timeline
                        </a>
                    </h1>
                    <h2><span :class="'badge w-100 mt-3 ' + status_bg_class">{{project_data.status}}</span></h2>
                </div>
                <div class="col-4">
                    <h4>Library preparation</h4>
                    <dl class="dl-horizontal">
                        <div class="dt-dd-pair">
                            <dt>Sample units ordered:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sample_units_ordered'" :project_data="project_data" :data_value="project_data['sample_units_ordered']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                        <dt>Sample type:</dt>
                        <dd>
                            <v-project-data-field-tooltip :field_name="'sample_type'" :project_data="project_data" :data_value="project_data['sample_type']"></v-project-data-field-tooltip>
                        </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Library construction method:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'library_construction_method'" :project_data="project_data" :data_value="project_data['library_construction_method']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Library prep option:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'library_prep_option'" :project_data="project_data" :data_value="project_data['library_prep_option']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Library type (ready-made libraries):</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'library_type_(ready-made_libraries)'" :project_data="project_data" :data_value="project_data['library_type_(ready-made_libraries)']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Number of lanes ordered:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sequence_units_ordered_(lanes)'" :project_data="project_data" :data_value="project_data['sequence_units_ordered_(lanes)']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                    </dl>
                    <h4>Sequencing</h4>
                    <dl class="dl-horizontal">
                        <div class="dt-dd-pair">
                            <dt>Number of lanes ordered:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sequence_units_ordered_(lanes)'" :project_data="project_data" :data_value="project_data['sequence_units_ordered_(lanes)']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Sequencing platform:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sequencing_platform'" :project_data="project_data" :data_value="project_data['sequencing_platform']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Flowcell:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'flowcell'" :project_data="project_data" :data_value="project_data['flowcell']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Flowcell option:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'flowcell_option'" :project_data="project_data" :data_value="project_data['flowcell_option']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Sequencing setup:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sequencing_setup'" :project_data="project_data" :data_value="project_data['sequencing_setup']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Custom primer:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'custom_primer'" :project_data="project_data" :data_value="project_data['custom_primer']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Low diversity:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'low_diversity'" :project_data="project_data" :data_value="project_data['low_diversity']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>PhiX %:</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'phix_percentage'" :project_data="project_data" :data_value="project_data['phix_percentage']"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                    </dl>
                    </div>
                    <div class="col-4">
                        <h4>Bioinformatics</h4>
                        <dl class="dl-horizontal">
                            <div class="dt-dd-pair">
                                <dt>Reference genome</dt>
                                <dd>
                                    <v-project-data-field-tooltip :field_name="'reference_genome'" :project_data="project_data" :data_value="project_data['reference_genome']"></v-project-data-field-tooltip>
                                </dd>
                            </div>
                            <div class="dt-dd-pair">
                                <dt>Organism</dt>
                                <dd>
                                    <v-project-data-field-tooltip :field_name="'organism'" :project_data="project_data" :data_value="project_data['organism']"></v-project-data-field-tooltip>
                                </dd>
                            </div>
                            <div class="dt-dd-pair">
                                <dt>Best practice analysis</dt>
                                <dd>
                                    <v-project-data-field-tooltip :field_name="'best_practice_bioinformatics'" :project_data="project_data" :data_value="project_data['best_practice_bioinformatics']"></v-project-data-field-tooltip>
                                </dd>
                            </div>
                        </dl>
                    <h4>Links</h4>
                    <h2>
                        <button class="btn btn-lg w-100 btn-outline-primary" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">Order portal</button>
                    </h2>
                    <div class="dropdown">
                        <h2 class="mt-2">
                            <button class="btn btn-lg w-100 btn-outline-primary dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="false">Reports</button>
                            <ul class="dropdown-menu w-100">
                                <li><a class="dropdown-item" href="first adress">Report 1</a></li>
                            </ul>
                        </h2>
                    </div>
                    
                </div>
                <div class="col-4">
                    <h4>Project comment</h4>
                    <p v-html="project_comment"></p>
                    <h4>Latest sticky note</h4>
                    <template v-if="project_id in this.$root.sticky_running_notes">
                        <v-projects-running-notes :latest_running_note_obj="this.$root.sticky_running_notes[project_id]" :sticky="true"></v-projects-running-notes>
                    </template>
                    <template v-else>
                        <p>-</p>
                    </template>

                </div>
            </div>
            <div class="row mt-5">
                <h2>Status</h2>
                <div class="col-4">
                    <h4>Reception Control</h4>
                    <dl class="dl-horizontal">
                        <div class="dt-dd-pair">
                            <dt>Number of sample units ordered</dt> 
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sample_units_ordered'" :project_data="project_data" :data_value="project_data.sample_units_ordered"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Number of samples imported</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'no_samples'" :project_data="project_data" :data_value="project_data.no_samples"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Failed samples</dt>                        
                            <dd>
                                <v-project-data-field-tooltip :field_name="'failed_samples'" :project_data="project_data" :data_value="project_data.failed_samples"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Passed samples</dt>           
                            <dd>
                                <v-project-data-field-tooltip :field_name="'passed_initial_qc'" :project_data="project_data" :data_value="project_data.passed_initial_qc"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Open date</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'open_date'" :project_data="project_data" :data_value="project_data.open_date"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>QC start date</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'first_initial_qc_start_date'" :project_data="project_data" :data_value="project_data.first_initial_qc_start_date"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                    </dl>
                </div>
                <div class="col-4">
                    <h4>Library QC</h4>
                    <dl class="dl-horizontal">
                        <div class="dt-dd-pair">
                            <dt>Number of samples in progress</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'in_progress'" :project_data="project_data" :data_value="project_data.in_progress"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Passed samples</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'passed_library_qc'" :project_data="project_data" :data_value="project_data.passed_library_qc"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Queue date</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'queued'" :project_data="project_data" :data_value="project_data.queued"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Library prep start</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'library_prep_start'" :project_data="project_data" :data_value="project_data.library_prep_start"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Library QC finished</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'qc_library_finished'" :project_data="project_data" :data_value="project_data.qc_library_finished"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                    </dl>
                </div>
                <div class="col-4">
                    <h4>Sequencing and Bioinformatics</h4>
                    <dl class="dl-horizontal">
                        <div class="dt-dd-pair">                        
                            <dt>Number of lanes ordered</dt>  
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sequence_units_ordered_(lanes)'" :project_data="project_data" :data_value="project_data['sequence_units_ordered_(lanes)']"></v-project-data-field-tooltip>    
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Number of lanes sequenced</dt> 
                            <dd>
                                <v-project-data-field-tooltip :field_name="'lanes_sequenced'" :project_data="project_data" :data_value="project_data.lanes_sequenced"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Sequencing start</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'sequencing_start_date'" :project_data="project_data" :data_value="project_data.sequencing_start_date"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>All samples sequenced</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'all_samples_sequenced'" :project_data="project_data" :data_value="project_data.all_samples_sequenced"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>All raw data delivered</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'all_raw_data_delivered'" :project_data="project_data" :data_value="project_data.all_raw_data_delivered"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Analysis completed</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'best_practice_analysis_completed'" :project_data="project_data" :data_value="project_data.best_practice_analysis_completed"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                        <div class="dt-dd-pair">
                            <dt>Close date</dt>
                            <dd>
                                <v-project-data-field-tooltip :field_name="'close_date'" :project_data="project_data" :data_value="project_data.close_date"></v-project-data-field-tooltip>
                            </dd>
                        </div>
                    </dl>
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
                        <div class="tab-pane fade show active" id="project-details-pane" role="tabpanel" aria-labelledby="project-details-tab" tabindex="0">Content 1
                        </div>
                        <div class="tab-pane fade" id="project-samples-pane" role="tabpanel" aria-labelledby="project-samples-tab" tabindex="0">Content 2</div>
                        <div class="tab-pane fade" id="project-running-notes-pane" role="tabpanel" aria-labelledby="project-running-notes-tab" tabindex="0">Content 3</div>
                        <div class="tab-pane fade" id="project-user-communication-pane" role="tabpanel" aria-labelledby="project-user-communication-tab" tabindex="0">Content 4</div>
                        <div class="tab-pane fade" id="project-links-pane" role="tabpanel" aria-labelledby="project-links-tab" tabindex="0">Content 5</div>
                    </div>
                </div>

            </div>
        </template>
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
                                <v-project-details :project_id="project_id" :single_project_mode="false" :as_modal="true"/>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
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
            <div class="row row-cols-5">
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
                    <h4>Library Construction Method</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="library_construction_method_all_switch" v-model="this.$root.include_all_library_construction_methods">
                        <label class="form-check-label" for="library_construction_method_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_library_construction_method, library_construction_method) in this.$root.allLibraryConstructionMethods">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_library_construction_methods')">
                            <input class="form-check-input" type="checkbox" :id="'library_construction_method_filter_'+library_construction_method" :value="library_construction_method" v-model="this.$root.library_construction_method_filter" :disabled="this.$root.include_all_library_construction_methods"/>
                            <label class="form-check-label" :for="'library_construction_method_filter_' + library_construction_method">{{ library_construction_method }} ({{this.$root.nrWithLibraryConstructionMethodVisible(library_construction_method)}}/{{nr_with_library_construction_method}})</label>
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
                        <option :value="['library_construction_method']">Library Construction Method</option>
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


