const vProjectsStatus = {
    data() {
        return {
            all_projects: {},
            sortBy: 'most_recent_date',
            descending: true,
            status_filter: ['All'],
            type_filter: ['All'],
            project_coordinator_filter: ['All'],
            search_value: '',
        }
    },
    computed: {
        visibleProjects() {
            /* Filters and sorts the projects */
            if (Object.keys(this.all_projects).length == 0) {
                return this.all_projects
            }

            let tempProjects = Object.entries(this.all_projects)

            // Process status filter
            if (!(this.status_filter.includes('All'))) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.status_filter.includes(project['status_fields']['status'])
                })
            }

            // Project type filter
            if (!(this.type_filter.includes('All'))) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.type_filter.includes(project['type'])
                })
            }

            // Project coordinator filter
            if (!(this.project_coordinator_filter.includes('All'))) {
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
        allStatuses() {
            let statuses = []
            for (let project in this.all_projects) {
                statuses.push(this.all_projects[project]['status_fields']['status'])
            }
            // Count the number of each status
            let statusCounts = {}
            for (let status of statuses) {
                if (status in statusCounts) {
                    statusCounts[status] += 1
                } else {
                    statusCounts[status] = 1
                }
            }
            return statusCounts
        },
        allStatusesVisible() {
            let statuses = []
            let visible_projects = this.visibleProjects
            for (let project in visible_projects) {
                statuses.push(visible_projects[project]['status_fields']['status'])
            }
            // Count the number of each status
            let statusCounts = {}
            for (let status of statuses) {
                if (status in statusCounts) {
                    statusCounts[status] += 1
                } else {
                    statusCounts[status] = 1
                }
            }
            return statusCounts
        },
        allTypes() {
            let types = []
            for (let project in this.all_projects) {
                types.push(this.all_projects[project]['type'])
            }
            // Count the number of each status
            let typeCounts = {}
            for (let type of types) {
                if (type in typeCounts) {
                    typeCounts[type] += 1
                } else {
                    typeCounts[type] = 1
                }
            }
            return typeCounts
        },
        allTypesVisible() {
            let types = []
            let visible_projects = this.visibleProjects
            for (let project in visible_projects) {
                types.push(visible_projects[project]['type'])
            }
            // Count the number of each type
            let typeCounts = {}
            for (let type of types) {
                if (type in typeCounts) {
                    typeCounts[type] += 1
                } else {
                    typeCounts[type] = 1
                }
            }
            return typeCounts
        },
        allProjectCoordinators() {
            let projectCoordinators = []
            for (let project in this.all_projects) {
                projectCoordinators.push(this.all_projects[project]['project_coordinator'])
            }
            // Count the number of each status
            let projectCoordinatorCounts = {}
            for (let projectCoordinator of projectCoordinators) {
                if (projectCoordinator in projectCoordinatorCounts) {
                    projectCoordinatorCounts[projectCoordinator] += 1
                } else {
                    projectCoordinatorCounts[projectCoordinator] = 1
                }
            }
            return projectCoordinatorCounts
        },
        allProjectCoordinatorsVisible() {
            let projectCoordinators = []
            let visible_projects = this.visibleProjects
            for (let project in visible_projects) {
                projectCoordinators.push(visible_projects[project]['project_coordinator'])
            }
            // Count the number of each project coordinator
            let projectCoordinatorCounts = {}
            for (let projectCoordinator of projectCoordinators) {
                if (projectCoordinator in projectCoordinatorCounts) {
                    projectCoordinatorCounts[projectCoordinator] += 1
                } else {
                    projectCoordinatorCounts[projectCoordinator] = 1
                }
            }
            return projectCoordinatorCounts
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
                })
                .catch(error => {
                    this.error_messages.push('Unable to fetch projects, please try again or contact a system administrator.')
                })
        },
        // Helper methods
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
        }
    }
}
const app = Vue.createApp(vProjectsStatus)

app.component('v-projects-status', {
    created: function() {
        this.$root.fetchProjects()
    },
    template:
    /*html*/`
    <div>
        <div class="row">
            <div class="col-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="sort_desc_check" v-model="this.$root.descending" />
                    <label class="form-check-label" for="sort_desc_check">Sort descending</label>
                </div>

                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="status_filter_all" value="All" v-model="this.$root.status_filter"/>
                    <label class="form-check-label" for="status_filter_all">All</label>
                </div>
                <template v-for="(nr_with_status, status) in this.$root.allStatuses">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" :id="'status_filter_'+status" :value="status" v-model="this.$root.status_filter"/>
                        <label class="form-check-label" :for="'status_filter_' + status">{{ status }} ({{this.$root.nrWithStatusVisible(status)}}/{{nr_with_status}})</label>
                    </div>
                </template>
            </div>
            <div class="col-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="type_filter_all" value="All" v-model="this.$root.type_filter"/>
                    <label class="form-check-label" for="type_filter_all">All</label>
                </div>
                <template v-for="(nr_with_type, type) in this.$root.allTypes">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" :id="'type_filter_'+type" :value="type" v-model="this.$root.type_filter"/>
                        <label class="form-check-label" :for="'type_filter_' + type">{{ type }} ({{this.$root.nrWithTypeVisible(type)}}/{{nr_with_type}})</label>
                    </div>
                </template>
            </div>
            <div class="col-4">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="project_coordinator_all" value="All" v-model="this.$root.project_coordinator_filter"/>
                    <label class="form-check-label" for="project_coordinator_all">All</label>
                </div>
                <template v-for="(nr_with_project_coordinator, project_coordinator) in this.$root.allProjectCoordinators">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" :id="'project_coordinator_'+project_coordinator" :value="project_coordinator" v-model="this.$root.project_coordinator_filter"/>
                        <label class="form-check-label" :for="'project_coordinator_' + project_coordinator">{{ project_coordinator }} ({{this.$root.nrWithProjectCoordinatorVisible(project_coordinator)}}/{{nr_with_project_coordinator}})</label>
                    </div>
                </template>
            </div>
        </div>

        <div class="row">
            <div class="col-6">
            <h4>Showing {{Object.keys(this.$root.visibleProjects).length}} of {{Object.keys(this.$root.all_projects).length}} projects</h4>
            </div>
            <div class="col-4">
                <div class="form-group">
                    <input type="text" class="form-control" v-model="this.$root.search_value" placeholder="Search" />
                </div>
            </div>
        </div>
        <template v-for="(project, project_id) in this.$root.visibleProjects" :key="project">
            <div class="card mb-5">
                <div class="card-header">
                    <div class="d-flex justify-content-between">
                        <h2 class="">
                            <a :href="'/project/' + project_id">{{ project_id }}: {{ project['project_name'] }}</a>
                        </h2>
                        <h3 class="position-relative">
                            <span :class="'badge bg-' + this.$root.projectTypeColor(project)">{{ project['type'] }}</span>
                        </h3>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <p> Dates: {{project['summary_dates']}}</p>
                        <p> Most recent date: {{this.$root.mostRecentDateArray(project)[0]}} : {{this.$root.mostRecentDateArray(project)[1]}}</p>
                        <p> Status: {{ project['status_fields']['status'] }}</p>
                        <p> Sequencing Platform: {{ project['sequencing_platform'] }}</p>
                        <p> Flowcell: {{ project['flowcell'] }}</p>
                        <p> Sequencing Setup: {{ project['sequencing_setup'] }}</p>
                        <p> Project Coordinator: {{ project['project_coordinator'] }}</p>
                    </div>
                </div>
            </div>
        </template>
    </div>`,
})

app.mount('#projects_status')