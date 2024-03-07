const vProjectsStatus = {
    data() {
        return {
            projects: ['P1']
        }
    },
    methods: {
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
        <h1>Projects Status</h1>
        <template v-for="project in this.$root.projects" :key="project">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{ project['project_name'] }}</h5>
                    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                    <a href="#" class="btn btn-primary">Go somewhere</a>
                </div>
            </div>
        </template>
    </div>`,
})

app.mount('#projects_status')