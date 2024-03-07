const vProjectsStatus = {
    data() {
        return {
            projects: [],
            sortBy: 'most_recent_date',
            sortOrder: 'desc',
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

            if (this.sortOrder == 'desc') {
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
        <template v-for="project in this.$root.orderedFilteredProjects" :key="project">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{ project['project_name'] }}</h5>
                    <p> Dates: {{project['summary_dates']}}</p>
                    <p> Most recent date: {{this.$root.mostRecentDateArray(project)[0]}} : {{this.$root.mostRecentDateArray(project)[1]}}</p>
                    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                    <a href="#" class="btn btn-primary">Go somewhere</a>
                </div>
            </div>
        </template>
    </div>`,
})

app.mount('#projects_status')