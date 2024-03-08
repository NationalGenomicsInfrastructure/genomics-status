const vProjectsStatus = {
    data() {
        return {
            projects: [],
            sortBy: 'most_recent_date',
            descending: true,
        }
    },
    computed: {
        orderedFilteredProjects() {
            if (this.projects.length == 0) {
                return this.projects
            }

            let tempProjects = this.projects

            // Process search input
            if (this.searchValue != '' && this.searchValue) {
                tempProjects = tempProjects.filter((item) => {
                    return item.project_name
                    .toUpperCase()
                    .includes(this.searchValue.toUpperCase())
                })
            }

            // Sort by most recent date
            tempProjects = Object.fromEntries(
                Object.entries(tempProjects).sort((a, b) => {
                    let proj_a = this.projects[a[0]]
                    let proj_b = this.projects[b[0]]

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
            )

            if (this.descending == true) {
                tempProjects = Object.fromEntries(Object.entries(tempProjects).reverse())
            }

            return tempProjects
        }
    },
    methods: {
        // Fetch methods
        fetchProjects() {
            axios
                .get('/api/v1/projects?list=ongoing&type=All')
                .then(response => {
                    data = response.data
                    if (data !== null) {
                        this.projects = data
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
        <template v-for="(project, project_id) in this.$root.orderedFilteredProjects" :key="project">
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
                        <p> Status: {{ project['status'] }}</p>
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