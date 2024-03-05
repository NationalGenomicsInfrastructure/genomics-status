const vProjectsStatus = {}
const app = Vue.createApp(vProjectsStatus)

app.component('v-projects-status', {
    data() {
        return {
            projects: ['P1']
        }
    },
    template:
    /*html*/`
    <div>
        <h1>Projects Status</h1>
        <ul>
            <li v-for="project in projects" :key="project">
                {{ project }}
            </li>
        </ul>
    </div>`,
})

app.mount('#projects_status')