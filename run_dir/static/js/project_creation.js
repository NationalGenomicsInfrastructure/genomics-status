const vProjectCreationForm = {
    data() {
        return {
          conditionalLogic: [],
          error_messages: [],
          formData: {},
          json_form: {},
          showDebug: false,
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
        },
        getOptions(field_arg) {
            const condition = this.conditionalLogic.find(cond => cond.field === field_arg);
            return condition ? condition.options : null;
        },
        updateOptions() {
            this.conditionalLogic = [];
            if (this.json_schema.allOf === undefined) {
                return
            }
            this.json_schema.allOf.forEach(rule => {
                if (this.evaluateCondition(rule.if)) {
                    Object.keys(rule.then.properties).forEach(field => {
                        this.conditionalLogic.push({
                            field,
                            options: rule.then.properties[field].enum,
                            condition: rule.if
                        });
                    });
                }
            });
        },
        evaluateCondition(condition) {
            return Object.keys(condition.properties).every(field => {
                const fieldCondition = condition.properties[field];

                if (fieldCondition.enum) {
                    return fieldCondition.enum.includes(this.formData[field]);
                }
                if (fieldCondition.const !== undefined) {
                    return this.formData[field] === fieldCondition.const;
                }
                return true;
            });
        }
    },
    mounted() {
        this.fetch_form()
    },
    watch: {
        formData: {
            deep: true,
            handler: 'updateOptions'
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row mt-5">
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
                    <div class="row">
                        <div class="col-auto">
                            <h1>{{ title }}</h1>
                        </div>
                        <div class="col-auto ml-auto">
                            <button class="btn btn-sm btn-secondary" @click="showDebug = !showDebug">
                                <i class="fa fa-bug mr-2"></i>Toggle Debug Info
                            </button>
                        </div>
                    </div>
                    <div v-if="showDebug" class="card">
                        <div class="card-body">
                            <h2 class="card-title"> Debug information </h2>
                            <h3>Form Data</h3>
                            <pre>{{ formData }}</pre>
                            <h3>conditionalLogic</h3>
                            <pre>{{ conditionalLogic }}</pre>
                        </div>
                    </div>

                    <p>{{ description }}</p>
                    <p>{{ instruction }}</p>

                    <form @submit.prevent="submitForm" class="mt-3 mb-5">
                        <template v-for="(field, identifier) in fields" :key="identifier">
                            <template v-if="field.ngi_form_type !== undefined">
                                <template v-if="field.ngi_form_type === 'select'">
                                    <v-form-select-field :field="field" :identifier="identifier"></v-form-select-field>
                                </template>

                                <template v-else-if="field.ngi_form_type === 'string'">
                                    <v-form-text-field :field="field" :identifier="identifier"></v-form-text-field>
                                </template>

                                <template v-else-if="field.ngi_form_type === 'boolean'">
                                    <v-form-boolean-field :field="field" :identifier="identifier"></v-form-boolean-field>
                                </template>
                            </template>
                        </template>
                        <button type="submit" class="btn btn-lg btn-primary mt-3">Submit</button>
                    </form>
                </template>
            </div>
        </div>`
}

const vFormSelectField = {
    name: 'v-form-select-field',
    props: ['field', 'identifier'],
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
        label() {
            return this.field.ngi_form_label;
        },
        options() {
            let conditional_options = this.$root.getOptions(this.identifier);
            if (conditional_options !== null) {
                return conditional_options;
            }
            return this.field.enum;
        },
        selected_value() {
            return this.$root.formData[this.identifier];
        },
        type() {
            return this.field.type;
        },
        unallowed_option() {
            // Highlight if the selected value is not allowed (based on conditional logic)
            if (this.selected_value === undefined) {
                return false;
            }
            return !(this.options.includes(this.selected_value));
        }
    },
    template:
        /*html*/`
        <div>
            <template v-if="unallowed_option">
                <div class="alert alert-danger" role="alert">
                    <strong>Selected value {{ selected_value }} is not allowed, please update your selection.</strong>
                </div>
            </template>
            <label :for="identifier" class="form-label">{{ label }}</label>
            <select class="form-select" :aria-label="description" v-model="this.$root.formData[identifier]">
                <template v-for="option in options">
                    <option :value="option">{{option}}</option>
                </template>
            </select>
            <p>{{ field.description }}</p>
        </div>`
}


const vFormTextField = {
    name: 'v-form-text-field',
    props: ['field', 'identifier'],
    computed: {
        description() {
            return this.field.description;
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
            <input class="form-control" :type="text" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
            <p>{{ description }}</p>
        </div>`
}


const vFormBooleanField = {
    name: 'v-form-boolean-field',
    props: ['field', 'identifier'],
    computed: {
        description() {
            return this.field.description;
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
                <input class="form-check-input" type="checkbox" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
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