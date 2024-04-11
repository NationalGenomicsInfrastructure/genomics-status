import vProjectDetails from './project_details_vue_component.js'

const vProjectPage = {}

const app = Vue.createApp(vProjectPage)

app.component('v-project-details', vProjectDetails)

app.mount('#project_details')