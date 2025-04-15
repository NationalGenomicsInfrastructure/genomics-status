// Import Ajv from the CDN
import Ajv from 'https://cdn.jsdelivr.net/npm/ajv@8.17.1/+esm';

const vProjectCreationForm = {
    data() {
        return {
          conditionalLogic: [],
          error_messages: [],
          formData: {},
          json_form: {},
          showDebug: false,
          validation_errors: [],
          validation_errors_per_field: {}
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
        },
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
        getOptions(field_arg) {
            const condition = this.conditionalLogic.find(cond => cond.field === field_arg);
            return condition ? condition.options : null;
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
        updateOptionsAndValidate() {
            this.updateOptions();
            // Validate the form data against the JSON schema
            this.validate_form_with_schema();
        },
        validate_form_with_schema() {
            // Validate the form data against the JSON schema
            // Create an instance of Ajv
            const ajv = new Ajv({strictSchema: false, allErrors: true}); // Options can be passed here if needed

            const validate = ajv.compile(this.json_schema);
            const valid = validate(this.formData);
            // Reset the validation errors
            this.validation_errors = [];
            this.validation_errors_per_field = {};

            if (!valid) {
                // Loop over the errors
                validate.errors.forEach(error => {
                    // Check if the instance path is a field
                    if (error.instancePath !== '') {
                        const field = error.instancePath.substring(1); // Remove the leading '/'
                        this.validation_errors_per_field[field] = this.validation_errors_per_field[field] || [];
                        this.validation_errors_per_field[field].push(error);
                    } else {
                        this.validation_errors.push(error.message);
                    }
                });
                return false;
            }
            return true;
        }
    },
    mounted() {
        this.fetch_form()
    },
    watch: {
        formData: {
            deep: true,
            handler: 'updateOptionsAndValidate'
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
                            <button class="btn btn-primary" @click="validate_form_with_schema">
                                <i class="fa fa-check mr-2"></i>Validate Form
                            </button>
                        </div>
                    </div>

                    <p>{{ description }}</p>
                    <p>{{ instruction }}</p>

                    <form @submit.prevent="submitForm" class="mt-3 mb-5">
                        <template v-for="(field, identifier) in fields" :key="identifier">
                            <template v-if="field.ngi_form_type !== undefined">
                                <v-form-field :field="field" :identifier="identifier"></v-form-field>
                            </template>
                        </template>
                        <button type="submit" class="btn btn-lg btn-primary mt-3">Submit</button>
                    </form>
                </template>
            </div>
        </div>`
}

const vFormField = {
    name: 'v-form-field',
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
            return this.field_enum;
        },
        selected_value() {
            return this.$root.formData[this.identifier];
        },
        type() {
            return this.field.type;
        },
        /* Error handling */
        any_error() {
            return this.unallowed_option || this.validation_errors.length > 0;
        },
        unallowed_option() {
            // Highlight if the selected value is not allowed (based on conditional logic)
            if (this.selected_value === undefined) {
                return false;
            }
            return !(this.options.includes(this.selected_value));
        },
        validation_errors() {
            // Check if there are validation errors for this field
            return this.$root.validation_errors_per_field[this.identifier] || [];
        }
    },
    template:
        /*html*/`
        <div>
            <template v-if="any_error">
                <div v-if="validation_errors.length > 0" class="alert alert-danger" role="alert">
                    <strong>Validation errors:</strong>
                    <ul>
                        <li v-for="error in validation_errors" :key="error.message">{{ error.message }}</li>
                    </ul>
                </div>
            </template>
            <label :for="identifier" class="form-label">{{ label }}</label>
            <template v-if="this.form_type === 'select'">
                <select class="form-select" :aria-label="description" v-model="this.$root.formData[identifier]">
                    <template v-for="option in options">
                        <option :value="option">{{option}}</option>
                    </template>
                </select>
            </template>

            <template v-else-if="this.form_type === 'string'">
                <input class="form-control" :type="text" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
            </template>

            <template v-else-if="this.form_type === 'boolean'">
                <div class="form-check form-switch">
                    <label :for="identifier" class="form-check-label">{{ label }}</label>
                    <input class="form-check-input" type="checkbox" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
                </div>
            </template>

            <p>{{ field.description }}</p>
        </div>`
}

const app = Vue.createApp(vProjectCreationForm)
app.component('v-form-field', vFormField)
app.mount('#v_project_creation')