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
    props: ['project_id', 'as_modal', 'single_project_mode', 'user'],
    data: function() {
        return {
            active_tab: 'project-running-notes-pane'
        }
    },
    computed: {
        project_data() {
            return this.$root.project_details[this.project_id]
        },
        project_data_exists() {
            return this.project_data != undefined
        },
        running_notes() {
            if (this.project_id in this.$root.running_notes) {
                return this.$root.running_notes[this.project_id]
            }
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
    methods: {
        switchTab(tab_name) {
            // Check if disabled
            if (this.$refs[tab_name].classList.contains('disabled')) {
                return
            }

            // deactivate old tab
            this.$refs[this.active_tab].classList.remove('show', 'active');
            this.$refs[this.active_tab + '-btn'].classList.remove('active');

            // Activate new tab
            this.$refs[tab_name].classList.add('show', 'active');
            this.$refs[tab_name + '-btn'].classList.add('active');
            this.active_tab = tab_name;
        },
        pressEnter(event) {
            // Check if typing in input
            if ((event.target.tagName === 'INPUT') || (event.target.tagName === 'TEXTAREA')) {
                return
            }
            // Open new running note form
            if (this.active_tab == 'project-running-notes-pane') {
                this.$refs['project-running-notes-pane-component'].toggleNewNoteForm()
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
            this.$root.fetchAllUsers();
        }
    },
    mounted: function() {
        document.addEventListener('keyup', this.handleKeyUpDetails);
    },
    emits: ['closeModal'],
    template: 
    /*html*/`
        <template v-if="project_data_exists">
            <div class="row">
                <div class="col-12">
                    <div :class="{ 'modal-header': as_modal}">
                        <h1 :class="{ 'modal-title': as_modal, 'col': true }" id="projectDetailsModalLabel" style="white-space: nowrap;">
                            <a :href="'/project_new/' + project_id" class="text-decoration-none"  style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{project_id}}</a>, {{project_data.project_name}}
                            <small class="text-muted ml-4">
                                NGI Portal: <a class="text-decoration-none text-wrap" :href="'https://ngisweden.scilifelab.se/orders/order/' + project_data['portal_id']" target="_blank">{{project_data['customer_project_reference']}}</a>
                            </small>
                        </h1>
                        <template v-if="as_modal">
                            <button type="button" class="btn-close" @click="$emit('closeModal')"></button>
                        </template>
                    </div>
                    <small><span class="badge" id="project_status_alert"></span></small>
                        <a href="#" class="btn btn-outline-dark btn-xs float-right mt-4" id="show_order_timeline">
                            <span id="show_orderdates_btn" style="display:none;">Show</span>
                            <span id="hide_orderdates_btn">Hide</span> order dates on timeline
                        </a>
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
                        <v-running-note-single :running_note_obj="this.$root.sticky_running_notes[project_id]" :sticky="true" :compact="True"></v-running-note-single>
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
                            <button class="nav-link active" ref="project-running-notes-pane-btn" @click="switchTab('project-running-notes-pane')" type="button" role="tab" aria-controls="project-running-notes-pane" aria-selected="true">Running Notes</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" ref="project-details-pane-btn" @click="switchTab('project-details-pane')" type="button" role="tab" aria-controls="project-details-pane" aria-selected="false">Project information</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" ref="project-samples-pane-btn" @click="switchTab('project-samples-pane')" type="button" role="tab" aria-controls="project-samples-pane" aria-selected="false">Samples</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" ref="project-user-communication-pane-btn" @click="switchTab('project-user-communication-pane')" type="button" role="tab" aria-controls="project-user-communication-pane" aria-selected="false">User communication</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" ref="project-links-pane-btn" @click="switchTab('project-links-pane')" type="button" role="tab" aria-controls="project-links-pane" aria-selected="false">Links</button>
                        </li>
                    </ul>
                    <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade show active" ref="project-running-notes-pane" role="tabpanel" aria-labelledby="project-running-notes-pane-btn" tabindex="0">
                            <v-running-notes-tab :user="this.user" ref="project-running-notes-pane-component" :partition_id="project_id" :all_users="this.$root.all_users" note_type="project"></v-running-notes-tab>
                        </div>
                        <div class="tab-pane fade" ref="project-details-pane" role="tabpanel" aria-labelledby="project-details-pane-btn" tabindex="0">Content 1</div>
                        <div class="tab-pane fade" ref="project-samples-pane" role="tabpanel" aria-labelledby="project-samples-pane-btn" tabindex="0">Content 2</div>
                        <div class="tab-pane fade" ref="project-user-communication-pane" role="tabpanel" aria-labelledby="project-user-communication-pane-btn" tabindex="0">Content 4</div>
                        <div class="tab-pane fade" ref="project-links-pane" role="tabpanel" aria-labelledby="project-links-pane-btn" tabindex="0">Content 5</div>
                    </div>
                </div>

            </div>
        </template>
    `,
}

export const vProjectCard = {
    props: ['project_id', 'next_project_id', 'previous_project_id', 'user'],  
    data: function() {
        return {
            modal: null
        }
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
    methods: {
        closeModal() {
            return new Promise((resolve, reject) => {
                // Remove modal-open class from body
                this.$root.open_modal_card = this;

                $(this.$el).on('hidden.bs.modal', function (e) {
                    resolve();
                });

                this.modal.hide();
            });
        },
        openModal() {
            this.$root.fetchProjectDetails(this.project_id);
            this.$nextTick(function () {
                // Add modal-open class to body
                this.$root.open_modal_card = this;
                this.modal.show();
            })
        },
        pressEnter(event) {
            this.$refs.project_details_component.pressEnter(event);
        }
    },
    mounted: function() {
        // Init bootstrap modal
        this.modal = new bootstrap.Modal(this.$refs.modal);
    },
    template: 
    /*html*/`
    <div class="card my-2">
        <div class="card-body">
            <div class="d-flex justify-content-between align-center mb-3">
                <h5 class="my-1">
                    <a class="text-decoration-none" href='#' @click=openModal>
                        {{ project_name }}
                    </a>

                </h5>
                <div class="col">
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
                        <v-running-note-single :running_note_obj="this.$root.sticky_running_notes[project_id]" :sticky="true" :compact="False"></v-running-note-single>
                    </template>
                </div>
            </div>
            <div class="col">
                <div class="d-flex">
                    <h5>
                        <span :class="'badge bg-' + this.$root.projectStatusColor(project)">{{ project['status_fields']['status'] }}</span>
                    </h5>
                </div>
            </div>
            <div>
                <!-- Modal -->
                <div class="modal" :id="'modal_' + project_id" tabindex="-1" ref="modal" :data-next-project-id="next_project_id" :data-previous-project-id="previous_project_id" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-body">
                                <!-- This shows the project page -->
                                <v-project-details :project_id="project_id" ref="project_details_component" :user="this.user" :single_project_mode="false" :as_modal="true" @close-modal="closeModal"/>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
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
    props: ['user'],
    components: {
        vProjectCard
    },
    methods: {
        selectFilterValue(event, include_all_key) {
            /* A method to save a click on the 'All' switch when trying to filter */
            if ((event.target.tagName == 'LABEL') || (event.target.tagName == 'INPUT')) {
                this.$root[include_all_key] = false
            }
        },
        findNextDivWithClass(element, className) {
            while (element) {
                element = element.nextElementSibling;
                if (element && element.tagName === 'DIV' && element.classList.contains(className)) {
                    return element;
                }
            }
            return null;
        },
        changeModal(event, direction) {
            // Check if modal is open
            let open_modal = this.$root.open_modal_card;
            if (open_modal != null) {
                let next_modal_project_id = null

                if (direction == 'down') {
                // Find next div with class modal
                    next_modal_project_id = open_modal.next_project_id;
                } else if (direction == 'up') {
                    // Find previous div with class modal
                    next_modal_project_id = open_modal.previous_project_id;
                }

                if (next_modal_project_id != null) {
                    let ref_name = 'project_card_' + next_modal_project_id;
                    open_modal.closeModal().then(() => {
                        this.$refs[ref_name][0].openModal();
                    });
                }
            }
        },
        handleKeyUp(event) {
            // Check if typing in input
            if ((event.target.tagName === 'INPUT') || (event.target.tagName === 'TEXTAREA')) {
                return
            }
            if (event.key === 'j') {
                this.changeModal(event, 'down')
            } else if (event.key === 'k') {
                this.changeModal(event, 'up')
            } else if (event.key === 'Enter') {
                let open_modal = this.$root.open_modal_card;
                if (open_modal != null) {
                    open_modal.pressEnter(event)
                }
            }
        }
    },
    created: function() {
        this.$root.fetchProjects();
        this.$root.fetchAllUsers();
    },
    mounted: function() {
        document.addEventListener('keyup', this.handleKeyUp);
    },
    template:
    /*html*/`
    <div class="mx-2">
        <h1>Projects Status</h1>
        <div class="card p-3">
            <div class="row row-cols-6">
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
                    <h4>Lab Responsible</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="lab_responsible_all_switch" v-model="this.$root.include_all_lab_responsibles">
                        <label class="form-check-label" for="lab_responsible_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_lab_responsible, lab_responsible) in this.$root.allLabResponsibles">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_lab_responsibles')">
                            <input class="form-check-input" type="checkbox" :id="'lab_responsible_filter_'+lab_responsible" :value="lab_responsible" v-model="this.$root.lab_responsible_filter" :disabled="this.$root.include_all_lab_responsibles"/>
                            <label class="form-check-label" :for="'lab_responsible_filter_' + lab_responsible">{{ lab_responsible }} ({{this.$root.nrWithLabResponsibleVisible(lab_responsible)}}/{{nr_with_lab_responsible}})</label>
                        </div>
                    </template>
                </div>
                <div class="col">
                    <h4>Columns</h4>
                    <select id="card_columns" class="form-select" aria-label="Category to use as columns" v-model="this.$root.card_columns">
                        <option :value="['application']">Application</option>
                        <option :value="['type']">Type</option>
                        <option :value="['project_coordinator']">Project Coordinator</option>
                        <option :value="['lab_responsible']">Lab Responsible</option>
                        <option :value="['status_fields', 'status']">Status</option>
                        <option :value="['library_construction_method']">Library Construction Method</option>
                    </select>
                </div>
                <div class="col">
                    <h4>Sort by</h4>
                    <select id="sort_by" class="form-select" aria-label="Sort by" v-model="this.$root.sortBy">
                        <option value="most_recent_date">Most recent date</option>
                        <option value="project_id">Project ID</option>
                        <option value="status">Status</option>
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
                                    <template v-for="(project_id, index) in project_ids_for_value" :key="project_id">
                                        <v-project-card v-if="project_id in this.$root.visibleProjects" :user="this.user" :project_id="project_id" :ref="'project_card_' + project_id" :next_project_id="project_ids_for_value[index + 1]" :previous_project_id="project_ids_for_value[index-1]"></v-project-card>
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


