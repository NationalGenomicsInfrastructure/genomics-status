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
        <p>Hello from Vue</p>
    </div>`,
})

app.mount('#projects_status')