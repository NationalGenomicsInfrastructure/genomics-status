import { vRunningNotesTab, vRunningNoteSingle } from './running_notes_component.js'


const vRunningNotesListDecoupled = {
    name: 'v-running-notes-list-decoupled',
    props: {
        current_user_name: "",
        current_user_email: "",
    },
    data() {
        return {
            running_notes: {},
            projects_metadata: {},
            filter_choice: 'tagged',
            include_production: true,
            include_application: true,
            include_others: true,
            assigned_lab_responsible: true,
            assigned_bioinfo_responsible: true,
            assigned_project_coordinator: true,
            assigned_bp_responsible: true,
            include_self_written: false,
            include_tagged: true,
        }
    },
    computed: {
        // Filters
        filterAll() {
            // Do not apply any filter
            return this.filter_choice === 'all';
        },
        filterOnAssigned() {
            return this.filter_choice === 'assigned';
        },
        filterOnTagged() {
            return this.filter_choice === 'tagged';
        },
        filterOnType() {
            return this.filter_choice === 'type';
        },
        numberOfFetchedRunningNotes() {
            return Object.keys(this.running_notes).length;
        },
        numberOfVisibleRunningNotes() {
            return this.visibleRunningNotes.length;
        },
        userTaggedName() {
            return this.current_user_email.split('@')[0];
        },
        visibleRunningNotes() {
            const runningNotesArray = Object.values(this.running_notes);

            if (this.filterAll) {
                return runningNotesArray;
            }

            if (this.filterOnTagged) {
                return runningNotesArray.filter(running_note => {
                    // Filter based on who created the running note
                    let self_written_bool = (this.include_self_written && running_note.email === this.current_user_email)
                    // Filter on who is tagged in the running note
                    let user_tagged_bool = (this.include_tagged && this.userTaggedName in this.taggedUsersFromRunningNote(running_note))

                    // Keep running notes if either of the above is true
                    return self_written_bool || user_tagged_bool;
                })
            }

            // Filter based on projects, filter the projects first
            let projects_to_include = [];
            if (this.filterOnType) {
                for (let project in this.projects_metadata) {
                    if (this.include_production && this.projects_metadata[project].type === 'Production') {
                        projects_to_include.push(project);
                        continue
                    }
                    if (this.include_application && this.projects_metadata[project].type === 'Application') {
                        projects_to_include.push(project);
                        continue
                    }
                    if (this.include_other_types) {
                        projects_to_include.push(project);
                        continue
                    }
                }
            }

            if (this.filterOnAssigned) {
                for (let project in this.projects_metadata) {
                    if (this.assigned_lab_responsible && this.projects_metadata[project].lab_responsible === this.current_user_name) {
                        projects_to_include.push(project);
                        continue;
                    }
                    if (this.assigned_bioinfo_responsible && this.projects_metadata[project].bioinfo_responsible === this.current_user_name) {
                        projects_to_include.push(project);
                        continue;
                    }
                    if (this.assigned_project_coordinator && this.projects_metadata[project].project_coordinator === this.current_user_name) {
                        projects_to_include.push(project);
                        continue;
                    }
                    if (this.assigned_bp_responsible && this.projects_metadata[project].bp_responsible === this.current_user_name) {
                        projects_to_include.push(project);
                        continue;
                    }
                }
            }

            return runningNotesArray.filter(running_note => {
                return projects_to_include.includes(running_note.parent);
            });
        }
    },
    methods: {
        async fetchRunningNotes(skip = 0) {
            axios
                .get(`/api/v1/latest_running_notes_with_meta?skip=${skip}&limit=20`)
                .then(response => {
                    let data = response.data;
                    if (data !== null) {
                        this.running_notes = Object.assign({}, this.running_notes, data.running_notes);
                        this.projects_metadata = Object.assign({}, this.projects_metadata, data.projects_metadata);
                    }
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch running notes, please try again or contact a system administrator.');
                });
        },
        taggedUsersFromRunningNote(running_note) {
            const regex = /@([a-zA-Z0-9.-]+)/g;
            const matches = running_note.note.matchAll(regex);

            const tagged_users = Array.from(matches, match => match[1])
            return tagged_users;

        }
    },
    mounted() {
        this.fetchRunningNotes(0);
    },
    template: /*html*/`
        <div>
            <div class="row">
                <h3 class="col">Latest Running Notes <small>Showing {{numberOfVisibleRunningNotes}} of {{numberOfFetchedRunningNotes}}</small></h3>
                <div class="col-auto ml-auto">
                    <div class="btn-group mb-2" role="group" aria-label="Basic radio toggle button group">
                        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" value="all" v-model="filter_choice">
                        <label class="btn btn-outline-primary" for="btnradio1">All</label>

                        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off" value="type" v-model="filter_choice">
                        <label class="btn btn-outline-primary" for="btnradio2">Project Type</label>

                        <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off" value="assigned" v-model="filter_choice">
                        <label class="btn btn-outline-primary" for="btnradio3">Assigned</label>

                        <input type="radio" class="btn-check" name="btnradio" id="btnradio4" autocomplete="off" value="tagged" v-model="filter_choice">
                        <label class="btn btn-outline-primary" for="btnradio4">@</label>
                    </div>
                </div>
            </div>
            <template v-if="filterOnType">
                <div class="row mx-0">
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="productionSwitch" v-model="include_production">
                        <label class="form-check-label" for="productionSwitch">Production</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="applicationSwitch" v-model="include_application">
                        <label class="form-check-label" for="applicationSwitch">Application</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="controlSwitch" v-model="include_controls">
                        <label class="form-check-label" for="controlSwitch">Control</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="internalTypeSwitch" v-model="include_internal">
                        <label class="form-check-label" for="internalTypeSwitch">Internal</label>
                    </div>
                </div>
            </template>
            <template v-else-if="filterOnAssigned" class="mt-0">
                <div class="row mx-0">
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="labSwitch" v-model="assigned_lab_responsible">
                        <label class="form-check-label" for="labSwitch">Lab Responsible</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="bioinfoSwitch" v-model="assigned_bioinfo_responsible">
                        <label class="form-check-label" for="bioinfoSwitch">Bioinfo Responsible</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="pcSwitch" v-model="assigned_project_coordinator">
                        <label class="form-check-label" for="pcSwitch">Project Coordinator</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="bpSwitch" v-model="assigned_bp_responsible">
                        <label class="form-check-label" for="bpSwitch">BP Responsible</label>
                    </div>
                </div>
            </template>
            <template v-else-if="filterOnTagged" class="mt-0">
                <div class="row mx-0">
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="taggedSwitch" v-model="include_tagged">
                        <label class="form-check-label" for="taggedSwitch">@{{this.userTaggedName}}</label>
                    </div>
                    <div class="form-check form-switch mt-0 mb-2 col-3">
                        <input class="form-check-input" type="checkbox" id="selfWrittenSwitch" v-model="include_self_written">
                        <label class="form-check-label" for="selfWrittenSwitch">Written by you</label>
                    </div>
                </div>
            </template>
          <template v-for="running_note in visibleRunningNotes">
              <v-running-note-single :running_note_obj="running_note" :compact="false" :partition_id="running_note.parent"/>
          </template>
          <button class="btn btn-primary mb-3" @click="fetchRunningNotes(skip=numberOfFetchedRunningNotes)">Load More</button>
        </div>
    `,
}

const vIndex = {}

const app = Vue.createApp(vIndex)
app.component('v-running-notes-list-decoupled', vRunningNotesListDecoupled)
app.component('v-running-note-single', vRunningNoteSingle)
app.mount('#vue_index_main')