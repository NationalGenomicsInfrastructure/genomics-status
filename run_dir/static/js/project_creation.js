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
        },
        instruction() {
            return this.json_form.instruction
        },
        fields() {
            return this.json_form.fields
        },
        title() {
            return this.json_form.title
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
                    this.json_form = response.data.form
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
                    <h1>Json Forms:</h1>
                    <json-forms
                      :data="data"
                      :schema="schema"
                      :uischema="uischema"
                      :renderers="renderers"
                      @change="onChange"
                    />
                    <template v-if="error_messages.length > 0">
                        <div class="alert alert-danger" role="alert">
                            <h3 v-for="error in error_messages">{{ error }}</h3>
                        </div>
                    </template>
                    <h1>{{ title }}</h1>
                    <h2>{{ description }}</h2>
                    <p>{{ instruction }}</p>

                    <div>
                        <template v-for="field in fields">
                            <template v-if="field.type === 'group'">
                                <div>
                                    <h4>{{ field.label }}</h4>
                                    <template v-for="subfield in field.fields">
                                        <v-form-field :field="subfield"></v-form-field>
                                    </template>
                                </div>
                            </template>
                            <template v-else>
                                <v-form-field :field="field"></v-form-field>
                            </template>
                        </template>
                    </div>
                    <div>
                        <pre>{{ json_form }}</pre>
                    </div>
                </div>
            </div>
        </div>`
}

const vFormField = {
    name: 'v-form-field',
    props: ['field'],
    template: 
        /*html*/`
        <div>
            <template v-if="field.type === 'select'">
                <label :for="field.identifier" class="form-label">{{ field.label }}</label>
                <select class="form-select" :aria-label="field.description">
                    <template v-for="option in field.select_options">
                        <option :value="option">{{option}}</option>
                    </template>
                </select>
            </template>
            <template v-else-if="field.type === 'text'">
                <label :for="field.name">{{ field.label }}</label>
                <input :type="field.type" :name="field.name" :id="field.name" :placeholder="field.placeholder">
            </template>
            <p>{{ field.description }}</p>
        </div>`
}


const app = Vue.createApp(vProjectCreationForm)
app.component('v-form-field', vFormField)
app.mount('#v_project_creation')