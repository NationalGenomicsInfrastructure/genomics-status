const vProjectCreationForm = {
    data() {
        return {
          json_form: {},
          error_messages: []
        }
    },
    computed: {
        description() {
            return this.getValue(this.json_form, 'description');
        },
        instruction() {
            return this.getValue(this.json_form, 'instruction');
        },
        json_schema() {
            return this.getValue(this.json_form, 'json_schema');
        },
        fields() {
            if (this.json_schema === undefined) {
                return []
            }
            return this.getValue(this.json_schema, 'properties');
        },
        title() {
            return this.getValue(this.json_form, 'title');
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
        getValue(object, field) {
            // Get the value of a field or return a default value
            if (object[field] !== undefined) {
                return object[field]
            }
            return undefined
        },
        submitForm() {
            // Handle form submission
            console.log('Form submitted with the following data:');
            console.log(this.json_form);

            // Example: Send the form data to an API endpoint
            axios
                .post('/api/v1/submit_project_form', this.json_form)
                .then(response => {
                    alert('Form submitted successfully!');
                    console.log(response.data);
                })
                .catch(error => {
                    this.error_messages.push('Error submitting form. Please try again or contact a system administrator.');
                    console.log(error);
                });
        }
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
                    <template v-if="json_form === {}">
                        <div class="alert alert-info" role="alert">
                            <h3>Loading...</h3>
                        </div>
                    </template>
                    <template v-else>
                        <h1>{{ title }}</h1>
                        <h2>{{ description }}</h2>
                        <p>{{ instruction }}</p>
                        <form @submit.prevent="submitForm">
                            <template v-for="field in fields">
                                <template v-if="field.ngi_form_type !== undefined">
                                    <template v-if="field.ngi_form_type === 'select'">
                                        <v-form-select-field :field="field"></v-form-select-field>
                                    </template>

                                    <template v-else-if="field.ngi_form_type === 'string'">
                                        <v-form-text-field :field="field"></v-form-text-field>
                                    </template>

                                    <template v-else-if="field.ngi_form_type === 'boolean'">
                                        <v-form-boolean-field :field="field"></v-form-boolean-field>
                                    </template>
                                </template>
                            </template>
                            <button type="submit" class="btn btn-primary mt-3">Submit</button>
                        </form>
                    </template>
                </div>
            </div>
        </div>`
}

const vFormSelectField = {
    name: 'v-form-select-field',
    props: ['field'],
    computed: {
        description() {
            return this.field.description;
        },
        field_enum(){
            // Check if enum is defined on field
            if (this.field.enum == undefined) {
                return []
            }
            return this.field.enum;
        },
        form_type() {
            return this.field.ngi_form_type;
        },
        identifier() {
            return this.field.ngi_form_identifier;
        },
        label() {
            return this.field.ngi_form_label;
        },
        type() {
            return this.field.type;
        },
    },
    template:
        /*html*/`
        <div>
            <label :for="identifier" class="form-label">{{ label }}</label>
            <select class="form-select" :aria-label="description">
                <template v-for="option in field_enum">
                    <option :value="option">{{option}}</option>
                </template>
            </select>
            <p>{{ field.description }}</p>
        </div>`
}


const vFormTextField = {
    name: 'v-form-text-field',
    props: ['field'],
    computed: {
        description() {
            return this.field.description;
        },
        identifier() {
            return this.field.ngi_form_identifier;
        },
        label() {
            return this.field.ngi_form_label;
        },
        type() {
            return this.field.type;
        },
    },
    template:
        /*html*/`
        <div>
            <label :for="identifier" class="form-label">{{ label }}</label>
            <input class="form-control" :type="text" :name="identifier" :id="identifier" :placeholder="description">
            <p>{{ description }}</p>
        </div>`
}


const vFormBooleanField = {
    name: 'v-form-boolean-field',
    props: ['field'],
    computed: {
        description() {
            return this.field.description;
        },
        identifier() {
            return this.field.ngi_form_identifier;
        },
        label() {
            return this.field.ngi_form_label;
        },
        type() {
            return this.field.type;
        },
    },
    template:
        /*html*/`
        <div>
            <div class="form-check form-switch">
                <label :for="identifier" class="form-check-label">{{ label }}</label>
                <input class="form-check-input" type="checkbox" :name="identifier" :id="identifier" :placeholder="description">
            </div>
            <p>{{ description }}</p>
        </div>
        `
}

const app = Vue.createApp(vProjectCreationForm)
app.component('v-form-select-field', vFormSelectField)
app.component('v-form-text-field', vFormTextField)
app.component('v-form-boolean-field', vFormBooleanField)
app.mount('#v_project_creation')