const vProjectsStatus = {
    data() {
        return {
            all_projects: {},
            sortBy: 'most_recent_date',
            descending: true,
            status_filter: ['All'],
        }
    },
    computed: {
        visibleProjects() {
            /* Filters and sorts the projects */
            if (Object.keys(this.all_projects).length == 0) {
                return this.all_projects
            }

            let tempProjects = Object.entries(this.all_projects)

            // Process search input
            if (this.searchValue != '' && this.searchValue) {
                tempProjects = tempProjects.filter((item) => {
                    return item.project_name
                    .toUpperCase()
                    .includes(this.searchValue.toUpperCase())
                })
            }

            // Process status filter
            if (!(this.status_filter.includes('All'))) {
                tempProjects = tempProjects.filter(([project_id, project]) => {
                    return this.status_filter.includes(project['status_fields']['status'])
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
        <input type="checkbox" id="sort_desc_check" v-model="this.$root.descending" />
        <label for="checkbox">
            <template v-if=this.$root.descending>
                Sort descending
            </template>
            <template v-else>
                Sort ascending
            </template>
        </label>
        <p> All statuses: {{ this.$root.allStatuses }}</p>

        <label>All</label>
        <input type="checkbox" value="All" v-model="this.$root.status_filter"/>
        <template v-for="(nr_with_status, status) in this.$root.allStatuses">
            <label>{{ status }}</label>
            <input type="checkbox" :value="status" v-model="this.$root.status_filter"/>
        </template>

        <template v-for="(project, project_id) in this.$root.visibleProjects" :key="project">
            <div class="card my-5">
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
                        <p> Project all: {{ project }}</p>
                    </div>
                </div>
            </div>
        </template>
    </div>`,
})

app.mount('#projects_status')