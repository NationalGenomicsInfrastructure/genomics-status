const vProjectCreationForm = {
    data() {
        return {
            json_form: {},
            error_messages: []
        }
    },
    computed: {
        description() {
            return this.json_form.description
        }
    },
    methods: {
        fetch_form(version) {
            let url = '/api/v1/project_creation_form'
            if (version !== undefined) {
                url = url + '?version=' + version
            }
            axios
                .get(url)
                .then(response => {
                    this.json_form = response.data
                })
                .catch(error => {
                    this.error_messages.push('Error fetching form. Please try again or contact a system adminstrator.');
                    console.log(error)
                })
            },
    },
    mounted() {
        this.fetch_form()
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <template v-if="error_messages.length > 0">
                        <div class="alert alert-danger" role="alert">
                            <h3 v-for="error in error_messages">{{ error }}</h3>
                        </div>
                    </template>
                    <h1>Project Creation Form</h1>
                    <p>Form for creating a project</p>
                    <div>
                        <pre>{{ json_form }}</pre>
                    </div>
                </div>
            </div>
        </div>`
}


const app = Vue.createApp(vProjectCreationForm)
app.mount('#v_project_creation')