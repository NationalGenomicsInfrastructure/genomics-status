const vProjectsStatus = {
    data() {
        return {
            all_projects: {},
            sticky_running_notes: {},
            error_messages: [],
            sortBy: 'most_recent_date',
            card_columns: 'application',
            descending: true,
            search_value: '',
            // Filters
            status_filter: [],
            include_all_statuses: true,
            type_filter: [],
            include_all_types: true,
            project_coordinator_filter: [],
            include_all_project_coordinators: true,
            application_filter: [],
            include_all_applications: true,
        }
    },
    computed: {
        visibleProjects() {
            /* Filters and sorts the projects */
            if (Object.keys(this.all_projects).length == 0) {
                return this.all_projects
            }

            let tempProjects = Object.entries(this.all_projects)

            // Process application filter
            if (!this.include_all_applications) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.application_filter.includes(project['application'])
                })
            }

            // Process status filter
            if (!this.include_all_statuses) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.status_filter.includes(project['status_fields']['status'])
                })
            }

            // Project type filter
            if (!this.include_all_types) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.type_filter.includes(project['type'])
                })
            }

            // Project coordinator filter
            if (!this.include_all_project_coordinators) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.project_coordinator_filter.includes(project['project_coordinator'])
                })
            }

            // Search filter
            if (this.search_value != '' && this.search_value) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return JSON.stringify(project)
                    .toUpperCase()
                    .includes(this.search_value.toUpperCase())
                })
            }

            // Sort by most recent date
            tempProjects = tempProjects.sort((a, b) => {
                let proj_a = this.all_projects[a[0]]
                let proj_b = this.all_projects[b[0]]

                if (this.sortBy == 'most_recent_date') {
                    /* First deal with missing dates */
                    if ((this.mostRecentDate(proj_a) == undefined) && (this.mostRecentDate(proj_b) == undefined)) {
                        return 0
                    }
                    if (this.mostRecentDate(proj_a) == undefined) {
                        // Missing dates will be the most recent
                        return 1
                    } else if (this.mostRecentDate(proj_b) == undefined){
                        return -1
                    }
                    /* Then deal with actual dates */
                    if (this.mostRecentDate(proj_a) > this.mostRecentDate(proj_b)) {
                        return 1
                    } else if (this.mostRecentDate(proj_a) < this.mostRecentDate(proj_b)) {
                        return -1
                    }
                    return 0
                };
            })

            if (this.descending == true) {
                tempProjects = tempProjects.reverse()
            }

            return Object.fromEntries(tempProjects)
        },
        allColumnValues() {
            /* Returns a dictionary with card column as key and the project_ids as values */
            let columnValues = {}
            for (let project_id in this.visibleProjects) {
                let project = this.visibleProjects[project_id]
                let columnValue = project[this.card_columns]
                if (columnValue in columnValues) {
                    columnValues[columnValue].push(project_id)
                } else {
                    columnValues[columnValue] = [project_id]
                }
            }
            return columnValues
        },
        allApplications() {
            return this.itemCounts(this.all_projects, 'application')
        },
        allApplicationsVisible() {
            return this.itemCounts(this.visibleProjects, 'application')
        },
        allStatuses() {
            return this.itemCounts(this.all_projects, ['status_fields', 'status'])
        },
        allStatusesVisible() {
            return this.itemCounts(this.visibleProjects, ['status_fields', 'status'])
        },
        allTypes() {
            return this.itemCounts(this.all_projects, 'type')
        },
        allTypesVisible() {
            return this.itemCounts(this.visibleProjects, 'type')
        },
        allProjectCoordinators() {
            return this.itemCounts(this.all_projects, 'project_coordinator')
        },
        allProjectCoordinatorsVisible() {
            return this.itemCounts(this.visibleProjects, 'project_coordinator')
        },
        sorting_icon() {
            if (this.descending) {
                return 'fa-arrow-down-wide-short'
            } else {
                return 'fa-arrow-up-wide-short '
            }
        }
    },
    methods: {
        // Fetch methods
        fetchProjects() {
            axios
                .get('/api/v1/projects?list=pending,reception_control,review,ongoing&type=All')
                .then(response => {
                    data = response.data
                    if (data !== null) {
                        this.all_projects = data
                    }
                    this.fetchStickyRunningNotes()
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch projects, please try again or contact a system administrator.')
                })
        },
        async fetchStickyRunningNotes() {
            const sleep = (delay) => new Promise((resolve) => setTimeout(resolve,delay))

            if (Object.keys(this.all_projects).length === 0){
                // Wait for projects to be fetched even though the request should already have returned
                await sleep(1000);
            }
            axios
                .post('/api/v1/latest_sticky_run_note', {project_ids: Object.keys(this.all_projects)})
                .then(response => {
                    data = response.data
                    if (data !== null) {
                        this.sticky_running_notes = data
                    }
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch sticky running notes, please try again or contact a system administrator.')
                })
        },
        // Helper methods
        itemCounts(list, key) {
            /* 
                Returns a dictionary with the counts of each unique item in the list 
                key is either a string with a key or an array with two keys
            */
            let items = []
            for (let item in list) {
                if (key instanceof Array) {
                    items.push(list[item][key[0]][key[1]])
                } else {
                    items.push(list[item][key])
                }
            }

            let itemCounts = {}
            for (let item of items) {
                if (item in itemCounts) {
                    itemCounts[item] += 1
                } else {
                    itemCounts[item] = 1
                }
            }
            return itemCounts
        },
        mostRecentDate(project) {
            let mostRecentKeyArray = this.mostRecentDateArray(project)
            return mostRecentKeyArray[1]
        },
        mostRecentDateArray(project) {
            if ('summary_dates' in project == false) {
                return []
            };
            let summaryDates = project['summary_dates'];
            if (Object.keys(summaryDates).length == 0) {
                return []
            };

            let mostRecentKey = Object.keys(summaryDates).reduce((a, b) => summaryDates[a] > summaryDates[b] ? a : b);
            return [mostRecentKey, summaryDates[mostRecentKey]]
        },
        nrWithApplicationVisible(application) {
            if (application in this.allApplicationsVisible) {
                return this.allApplicationsVisible[application]
            }
            return 0
        },
        nrWithStatusVisible(status) {
            if (status in this.allStatusesVisible) {
                return this.allStatusesVisible[status]
            }
            return 0
        },
        nrWithTypeVisible(type) {
            if (type in this.allTypesVisible) {
                return this.allTypesVisible[type]
            }
            return 0
        },
        nrWithProjectCoordinatorVisible(project_coordinator) {
            if (project_coordinator in this.allProjectCoordinatorsVisible) {
                return this.allProjectCoordinatorsVisible[project_coordinator]
            }
            return 0
        },
        projectTypeColor(project) {
            let type = project['type']
            if (type == 'Application') {
                return 'success'
            } else if (type == 'Production') {
                return 'primary'
            } else if (type == 'Facility') {
                return 'info'
            } else if (type == 'Single-Cell') {
                return 'warning'
            } else {
                return 'secondary'
            }
        },
        projectStatusColor(project) {
            let status = project['status_fields']['status']
            if (status == 'Pending') {
                return 'secondary'
            } else if (status == 'Reception Control') {
                return 'info'
            } else if (status == 'Ongoing') {
                return 'primary'
            }
            return 'warning'
        },
        toggleSorting() {
            this.descending = !this.descending
        }
    }
}
const app = Vue.createApp(vProjectsStatus)

app.component('v-projects-status', {
    methods: {
        selectFilterValue(event, include_all_key) {
            /* A method to save a click on the 'All' switch when trying to filter */
            if ((event.target.tagName == 'LABEL') || (event.target.tagName == 'INPUT')) {
                this.$root[include_all_key] = false
            }
        }
    },
    created: function() {
        this.$root.fetchProjects()
    },
    template:
    /*html*/`
    <div>
        <div class="card p-3">
            <div class="row">
                <div class="col-4">
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
                <div class="col-4">
                    <h4>Type</h4>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" id="type_all_switch" v-model="this.$root.include_all_types">
                        <label class="form-check-label" for="project_coordinator_all_switch">All</label>
                    </div>
                    <template v-for="(nr_with_type, type) in this.$root.allTypes">
                        <div class="form-check" @click="(event) => selectFilterValue(event, 'include_all_types')">
                            <input class="form-check-input" type="checkbox" :id="'type_filter_'+type" :value="type" v-model="this.$root.type_filter" :disabled="this.$root.include_all_types"/>
                            <label class="form-check-label" :for="'type_filter_' + type">{{ type }} ({{this.$root.nrWithTypeVisible(type)}}/{{nr_with_type}})</label>
                        </div>
                    </template>
                </div>
                <div class="col-4">
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
                <div class="col-4">
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
            </div>
        </div>
        <template v-if="Object.keys(this.$root.visibleProjects).length == 0">
            <p>No projects</p>
        </template>
        <template v-else>
            <div class="row mt-5 mb-2">
                <div class="col-8">
                <h4>
                    <i :class="'fa-solid ' + this.$root.sorting_icon + ' mr-2'" @click="this.$root.toggleSorting"></i>
                    Showing {{Object.keys(this.$root.visibleProjects).length}} of {{Object.keys(this.$root.all_projects).length}} projects in {{Object.keys(this.$root.allColumnValues).length}} columns
                </h4>
                </div>
                <div class="col-4">
                    <div class="form-group">
                        <input type="text" class="form-control" v-model="this.$root.search_value" placeholder="Search" />
                    </div>
                </div>
            </div>
            <div class="project_status_board overflow-scroll">
                <div class="row flex-nowrap">
                    <template v-for="(project_ids_for_value, value) in this.$root.allColumnValues">
                        <div class="col-4 col-xxl-3">
                            <h2>{{ value }}</h2>
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
})

app.mount('#projects_status')


app.component('v-project-card', {
    props: ['project_id'],
    computed: {
        hasSummaryDates() {
            return ('summary_dates' in this.project) && (Object.keys(this.project['summary_dates']).length > 0)
        },
        project() {
            return this.$root.all_projects[this.project_id]
        }
    },
    template: 
    /*html*/`

    <div class="card my-2">
        <div class="card-header">
            <div class="d-flex justify-content-between align-center">
                <h5 class="my-1">
                    <a href='#' data-toggle="collapse" :data-target="'#collapse_' + project_id" aria-expanded="false" :aria-controls="'#collapse_' + project_id">
                        {{ project['project_name'] }}
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
        </div>
        <div :id="'collapse_' + project_id" class="collapse card-body">
            <div class="row">
                <h6>
                    <a class="" :href="'/project/' + project_id">
                        Project page
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </h6>
                <template v-if="project_id in this.$root.sticky_running_notes">
                    <v-projects-running-notes :latest_running_note_obj="this.$root.sticky_running_notes[project_id]" :sticky="true"></v-projects-running-notes>
                </template>
                <div>
                    <span>{{ project['sequencing_platform'] }}</span>
                    <span class="border border-light-subtle mx-1"></span>
                    <span>{{ project['flowcell'] }}</span>
                    <span class="border border-light-subtle mx-1"></span>
                    <span>{{ project['sequencing_setup'] }}</span>

                    <dt>Project Coordinator:</dt>
                    <dd>{{ project['project_coordinator'] }}</dd>
                </div>
                <div>
                    <h5>Project Timeline</h5>
                    <dl class="dl-horizontal">
                        <template v-if="hasSummaryDates">
                            <template v-for="(date, date_name) in project['summary_dates']">
                                <dt>{{ date_name }}</dt>
                                <dd>{{ date }}</dd>
                            </template>
                        </template>
                        <template v-else>
                            <p>No dates available</p>
                        </template>
                    </dl>
                </div>
            </div>

            <template v-if="project['latest_running_note']">
                <v-projects-running-notes :latest_running_note_obj="project['latest_running_note']" :sticky="false"></v-projects-running-notes>
            </template>
        </div>
    </div>`,
})

app.component('v-projects-running-notes', {
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
            let timestamp;
            if (this.sticky == true) {
                timestamp = this.getRunningNoteProperty('timestamp');
            } else {
                timestamp = this.getRunningNoteProperty('created_at_utc');
            }

            // Create a new Date object using the timestamp
            let date = new Date(timestamp);

            // Format the date to a readable string in the local time zone
            return date.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        },
        formatted_note() {
            if (this.note == undefined) {
                return ''
            }
            // make_markdown is from an external package
            return make_markdown(this.note)
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
        <div class="card border border-alert">
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
})