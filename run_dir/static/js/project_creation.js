// Import Ajv from the CDN
import Ajv from 'https://cdn.jsdelivr.net/npm/ajv@8.17.1/+esm';

const vProjectCreationMain = {
    data() {
        return {
            error_messages: [],
            /* Maybe some of these attributes are more suitable in the vProjectCreationForm component 
            but it would be quite a lot of work to move it.*/
            conditionalLogic: [],
            formData: {},
            forms: [],
            json_form: {},
            new_json_form: {},
            showDebug: false,
            toplevel_edit_mode: false,
            validation_errors: [],
            validation_errors_per_field: {}
        }
    },
    computed: {
        fields() {
            if (this.json_schema === undefined) {
                return []
            }
            return this.getValue(this.json_schema, 'properties');
        },
        json_schema() {
            return this.$root.getValue(this.$root.json_form, 'json_schema');
        },
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
        fetch_list_of_forms() {
            let url = '/api/v1/project_creation_forms'
            axios
                .get(url)
                .then(response => {
                    this.$root.forms = response.data.forms
                })
                .catch(error => {
                    this.$root.error_messages.push('Error fetching list of forms. Please try again or contact a system adminstrator.');
                    console.log(error)
                })
        },
        fetch_form(version) {
            let url = '/api/v1/project_creation_form'
            if (version !== undefined) {
                url = url + '?version=' + version
            }
            axios
                .get(url)
                .then(response => {
                    this.$root.json_form = response.data.form
                    if (this.$root.toplevel_edit_mode) {
                        this.$root.new_json_form = JSON.parse(JSON.stringify(this.$root.json_form));
                    }
                })
                .catch(error => {
                    this.$root.error_messages.push('Error fetching form. Please try again or contact a system adminstrator.');
                    console.log(error)
                })
        },
        getConditionalsFor(field_identifier) {
            // Get the conditional logic for a specific field
            return this.conditionalLogic.filter(cond => {
                return cond.field === field_identifier
            });
        },
        getOptions(field_arg) {
            // Get the options for a specific field based on conditional logic
            const conditionals = this.getConditionalsFor(field_arg);
            if (conditionals.length === 0) {
                return null;
            }
            // Create the intersection of all options
            const options = conditionals.reduce((acc, cond) => {
                if (acc === null) {
                    return cond.options;
                }
                return acc.filter(option => cond.options.includes(option));
            }, null);

            return options;
        },
        getValue(object, field) {
            // Get the value of a field or return a default value
            if (object === undefined) {
                return undefined
            }
            if (object[field] !== undefined) {
                return object[field]
            }
            return undefined
        },
        setValuesBasedOnConditionals() {
            // Check all fields in the form data, set values according to option if only one option is available
            Object.keys(this.formData).forEach(field => {
                const conditionals = this.getConditionalsFor(field);
                if (conditionals.length === 0) {
                    return;
                }
                const options = conditionals.reduce((acc, cond) => {
                    if (acc === null) {
                        return cond.options;
                    }
                    return acc.filter(option => cond.options.includes(option));
                }, null);
                if (options !== null && options.length === 1) {
                    console.log(`Setting ${field} to ${options[0]} based on conditional logic`);
                    this.formData[field] = options[0];
                }
            });
        },
        updateOptions() {
            this.conditionalLogic = [];
            if (this.json_schema.allOf === undefined) {
                return
            }
            this.json_schema.allOf.forEach(rule => {
                if (this.$root.evaluateCondition(rule.if)) {
                    Object.keys(rule.then.properties).forEach(field => {
                        this.conditionalLogic.push({
                            field,
                            options: rule.then.properties[field].enum,
                            condition: rule.if,
                            description: rule.description
                        });
                    });
                }
            });
        },
        updateOptionsAndValidate() {
            this.updateOptions();
            // Apply options in cases where only one option is available
            this.$root.setValuesBasedOnConditionals();
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
        },
        validateNew() {
            // Validate the new JSON schema
            console.log("Validating new schema");
            const ajv = new Ajv({strictSchema: false, allErrors: true});
            const validate = ajv.compile(this.new_json_schema);
        }
    },
    watch: {
        formData: {
            deep: true,
            handler: 'updateOptionsAndValidate'
        },
        new_json_form: {
            deep: true,
            handler: 'validateNew()'
        }
    }
}


const vProjectCreationForm = {
    name: 'v-project-creation-form',
    props: ['form_loaded', 'init_edit_mode', 'version_id'],
    data() {
        return {
            showDebug: false,
            is_trying_out_form: false,
        }
    },
    computed: {
        description() {
            return this.$root.getValue(this.$root.json_form, 'description');
        },
        instruction() {
            return this.$root.getValue(this.$root.json_form, 'instruction');
        },
        json_form() {
            return this.$root.json_form;
        },
        new_json_schema() {
            return this.$root.getValue(this.$root.new_json_form, 'json_schema');
        },
        fields_per_group() {
            // group fields by their group identifier
            if (this.$root.json_schema === undefined) {
                return {}
            }

            const groupedFields = {};
            Object.keys(this.$root.fields).forEach(field => {
                const fieldGroup = this.$root.fields[field].ngi_form_group;
                if (fieldGroup === undefined) {
                    // If no group is defined, assign to a default group
                    if (groupedFields['unassigned'] === undefined) {
                        groupedFields['unassigned'] = {};
                    }
                    groupedFields['unassigned'][field] = this.$root.fields[field];
                } else {
                    if (groupedFields[fieldGroup] === undefined) {
                        groupedFields[fieldGroup] = {};
                    }
                    groupedFields[fieldGroup][field] = this.$root.fields[field];
                }
            });
            return groupedFields;
        },
        form_groups() {
            if (this.$root.json_form === undefined) {
                return []
            }
            return this.$root.getValue(this.$root.json_form, 'form_groups');
        },
        title() {
            return this.$root.getValue(this.$root.json_form, 'title');
        }
    },
    methods: {
        fields_for_given_group(group_identifier) {
            // Get the fields for a specific group
            if (this.fields_per_group[group_identifier] === undefined) {
                return {}
            }
            return this.fields_per_group[group_identifier];
        },
        submitForm() {
            const form_data = this.$root.formData;
            const form_metadata = {};
            form_metadata['title'] = this.$root.json_form['title'];
            form_metadata['version'] = this.$root.json_form['version'];
            axios
                .post('/api/v1/submit_project_creation_form', {
                    form_data: form_data,
                    form_metadata: form_metadata,
                })
                .then(response => {
                    console.log('Server response:', response.data);
                    if (response.data.success && response.data.project_id) {
                        alert(`Project created with ID: ${response.data.project_id}`);
                        // Clear the form data
                        this.$root.formData = {};
                    }
                    else{
                        alert("Hmm, something went wrong and no project id was generated. Please contact a system administrator.");
                    }
                })
                .catch(error => {
                    this.$root.error_messages.push('Error submitting form. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },

    },
    mounted() {
        if (!this.form_loaded) {
            this.$root.fetch_form(this.version_id);
        }
        if (this.init_edit_mode.toLowerCase() === 'true') {
            this.$root.toplevel_edit_mode = true;
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row mt-5">
                <template v-if="this.$root.error_messages.length > 0">
                    <div class="alert alert-danger" role="alert">
                        <h3 v-for="error in this.$root.error_messages">{{ error }}</h3>
                    </div>
                </template>
                <template v-if="this.json_form === {}">
                    <div class="alert alert-info" role="alert">
                        <h3>Loading...</h3>
                    </div>
                </template>
                <template v-else>
                    <div class="row">
                        <div class="col-auto">
                            <template v-if='this.$root.toplevel_edit_mode'>
                                <h1 class="text-danger"> Modifying project creation form</h1>
                            </template>
                            <template v-else>
                                <h1>{{ title }}</h1>
                            </template>
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
                            <pre>{{ this.$root.formData }}</pre>
                            <h3>conditionalLogic</h3>
                            <pre>{{ this.$root.conditionalLogic }}</pre>
                            <button class="btn btn-primary" @click="validate_form_with_schema">
                                <i class="fa fa-check mr-2"></i>Validate Form
                            </button>
                        </div>
                    </div>



                    <template v-if="this.$root.toplevel_edit_mode && !this.is_trying_out_form">
                        <button class="btn btn-lg btn-primary col-auto" @click="this.is_trying_out_form = true">Display form</button>
                    </template>
                    <template v-else>

                        <template v-if="this.$root.toplevel_edit_mode">
                            <button class="btn btn-lg btn-primary col-auto" @click="this.is_trying_out_form = false">Close form</button>
                            <h2 class="mt-2">{{ title }}</h2>
                        </template>
                        <p>{{ description }}</p>
                        <p>{{ instruction }}</p>

                        <form @submit.prevent="submitForm" class="mt-3 mb-5">
                            <template v-for="(form_group, group_identifier) in form_groups" :key="group_identifier">
                                <template v-if="Object.keys(this.fields_for_given_group(group_identifier)).length !== 0">
                                    <div class="mb-5">
                                        <h3>{{form_group.display_name}}</h3>
                                        <template v-for="(field, identifier) in this.fields_for_given_group(group_identifier)" :key="identifier">
                                            <template v-if="field.ngi_form_type !== undefined">
                                                <v-form-field :field="field" :identifier="identifier"></v-form-field>
                                            </template>
                                        </template>
                                    </div>
                                </template>
                            </template>
                            <button type="submit" class="btn btn-lg btn-success mt-3" :disabled="toplevel_edit_mode">Create Project in LIMS</button>
                        </form>
                    </template>
                    <template v-if="this.$root.toplevel_edit_mode">
                        <v-create-form></v-create-form>
                        <div class="card mt-4 mb-5">
                            <div class="card-body">
                                <h2 class="card-title">Changes </h2>
                                <div class="row">
                                    <button class="btn btn-lg btn-primary mt-4 ml-3 col-2" @click="this.saveDraft">
                                        <i class="fa-solid fa-floppy-disk mr-1"></i> Save draft
                                    </button>
                                    <button class="btn btn-lg btn-success mt-4 ml-2 col-2" @click="this.publishForm">
                                        <i class="fa-solid fa-circle-check mr-1"></i> Publish form
                                    </button>
                                    <button class="btn btn-lg btn-danger mt-4 ml-2 col-2" @click="this.cancelDraft">
                                        <i class="fa-solid fa-ban mr-1"></i> Cancel draft
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
            </div>
        </div>
    `
}

const vFormField = {
    name: 'v-form-field',
    props: ['field', 'identifier'],
    data() {
        return {
            cancelTokenSource: null,
            highlightedIndex: -1,
            inputChangeTimeout: null,
            showSuggestions: false,
            suggestions: [],
            suggestionsLoading: false,
        };
    },
    computed: {
        conditonalsApplied() {
            return this.$root.getConditionalsFor(this.identifier)
        },
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
        current_value() {
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
            if (this.current_value === undefined) {
                return false;
            }

            // Check if options is empty object
            if (this.options === null || Object.keys(this.options).length === 0) {
                return false;
            }
            return !(this.options.includes(this.current_value));
        },
        validation_errors() {
            // Check if there are validation errors for this field
            return this.$root.validation_errors_per_field[this.identifier] || [];
        },
        visible() {
            // Check if the field is visible based on conditional logic
            if (this.field.ngi_form_visible_if === undefined) {
                return true
            }
            const conditions = Object.keys(this.field.ngi_form_visible_if.properties).map(property => {

                if (this.$root.formData[property] === undefined) {
                    return false
                }

                // The visibility condition enum
                const condition_enum = this.field.ngi_form_visible_if.properties[property].enum;

                // Check if the property is in the enum
                if (condition_enum !== undefined) {
                    if (!condition_enum.includes(this.$root.formData[property])) {
                        return false
                    }
                }
                return true
            })

            // If all conditions are met, return true
            if (conditions.length === 0) {
                return true
            }

            // If any condition is not met, return false
            return conditions.every(condition => condition === true);
        }
    },
    methods: {
        async onInputChange(event) {
            // cancel previous request if it exists
            if (this.cancelTokenSource) {
                this.cancelTokenSource.cancel();
            }

            // Clear previous debounce timeout
            if (this.inputChangeTimeout) {
                clearTimeout(this.inputChangeTimeout);
            }

            this.cancelTokenSource = axios.CancelToken.source();

            const newValue = event.target.value;
            this.suggestionsLoading = true;
            if (!newValue) {
                this.suggestions = [];
                this.showSuggestions = false;
                this.suggestionsLoading = false;
                return;
            }

            // Call api to fetch suggestions
            let url = `/api/v1/project_count_details?detail_key=${this.identifier}&search_string=${newValue}`;
            this.inputChangeTimeout = setTimeout(() => {
                axios
                    .get(url, { cancelToken: this.cancelTokenSource.token })
                    .then(response => {
                        this.suggestions = Object.entries(
                            response.data
                        ).sort((a, b) => b[1] - a[1])
                        .slice(0, 10);
                        this.showSuggestions = true;
                        this.suggestionsLoading = false;
                    })
                    .catch(error => {
                        if (axios.isCancel(error)) {
                            console.log('Request cancelled:', error.message);
                        } else {
                            // Not important enough to annoy the user with an alert
                            console.log('Error fetching suggestions. Please try again or contact a system adminstrator.');
                            console.log(error)
                        }
                    })
                }, 500);
        },
        selectOption(event, option) {
            // Only proceed if left mouse button is clicked
            if (event.button === 0) {
                this.$root.formData[this.identifier] = option;
                this.showSuggestions = false;
                console.log("Inside button === 0")
            }
        },
        hideSuggestions(){
            setTimeout(() => {
                this.showSuggestions = false;
            }, 2000)
        },
        fetch_data(field_identifier) {
            let url = `/api/v1/project_creation_data_fetch`;
            axios
                .post(url,
                    {
                        [field_identifier]: this.$root.formData[field_identifier]
                    }
                )
                .then(response => {
                    if("result" in response.data){
                        const result = response.data["result"];
                        const display_in_field = response.data["field"]
                        if(Array.isArray(result) && result.length > 0){
                            if (this.$root.formData["fetched_data"] === undefined) {
                                this.$root.formData["fetched_data"] = {};
                            }
                            this.$root.formData["fetched_data"][display_in_field] = result;
                            const fieldSchema = this.$root.json_schema.properties[display_in_field];
                            if (!fieldSchema.enum) {
                                fieldSchema.enum = [];
                            }
                            // Clear existing enum and add new values
                            fieldSchema.enum = result.map(r => r[display_in_field]);
                        }
                    }
                })
                .catch(error => {
                    if (axios.isCancel(error)) {
                        console.log('Request cancelled:', error.message);
                    } else if (error.response && error.response.status === 400) {
                        // Handle specific 400 errors
                        const errorMessage = error.response.data?.message || error.response.data?.error || 'Bad request';
                        const errorCode = error.response.data?.code;
                        alert(`Error fetching suggestions: ${errorMessage} (Code: ${errorCode})`);
                    } else {
                        // Not important enough to annoy the user with an alert
                        console.log('Error fetching suggestions. Please try again or contact a system adminstrator.');
                        console.log(error)
                        this.$root.error_messages.push('Error submitting form. Please try again or contact a system administrator.');
                    }
                })
        }
    },
    mounted() {
        // Initialize the form data for this field
        if (this.form_type === 'boolean') {
            this.$root.formData[this.identifier] = false;
        } else {
            this.$root.formData[this.identifier] = '';
        }

        if (this.form_type === 'custom_datalist') {
            let url = `/api/v1/project_count_details?detail_key=${this.identifier}`;
            this.inputChangeTimeout = setTimeout(() => {
                axios
                    .get(url,)
                    .then(response => {
                        this.suggestions = Object.entries(
                            response.data
                        ).sort((a, b) => b[1] - a[1])
                        this.showSuggestions = true;
                        this.suggestionsLoading = false;
                    })
                    .catch(error => {
                        if (axios.isCancel(error)) {
                            console.log('Request cancelled:', error.message);
                        } else {
                            // Not important enough to annoy the user with an alert
                            console.log('Error fetching suggestions. Please try again or contact a system adminstrator.');
                            console.log(error)
                        }
                    })
                }, 500);
        }
    },
    template:
        /*html*/`
        <template v-if="this.visible">
            <div class="mb-3">
                <div class="row">
                    <label :for="identifier" class="form-label col-auto">{{ label }}</label>
                    <template v-if="any_error">
                        <div v-if="validation_errors.length > 0" class="col-auto text-danger ml-auto">
                            <strong>Validation errors for value '{{current_value}}': </strong>
                            <span v-for="error in validation_errors" :key="error.message">{{ error.message }}</span>
                        </div>
                    </template>
                </div>
                <template v-if="this.form_type === 'select'">
                    <select class="form-select"
                            :aria-label="description"
                            :class="{ 'bg-light text-muted': options.length === 0 }"
                            v-model="this.$root.formData[identifier]"
                            :disabled="options.length === 0">
                        <template v-for="option in options">
                            <option :value="option">{{option}}</option>
                        </template>
                    </select>
                </template>

                <template v-if="this.form_type === 'datalist'">
                    <input 
                        class="form-control"
                        :list="identifier+'_list'"
                        :aria-label="description"
                        v-model="this.$root.formData[identifier]"
                    />
                    <datalist :id="identifier+'_list'">
                        <template v-for="option in options">
                            <option :value="option">{{option}}</option>
                        </template>
                    </datalist>
                </template>
                <template v-if="this.form_type === 'custom_datalist'">
                    <div class="datalist">
                        <input
                            class="form-control"
                            :aria-label="description"
                            v-model="this.$root.formData[identifier]"
                            :list="identifier+'_list'"
                            placeholder="Type to search..."
                        />
                        <datalist :id="identifier+'_list'">
                            <option
                                v-for="(option, index) in suggestions"
                                :key="index"
                                :value="option[0]"
                            >
                                {{option[0]}} ({{option[1]}})
                            </option>
                        </datalist>
                    </div>
                </template>
                <template v-if="this.form_type === 'string'">
                    <input class="form-control" :type="text" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
                </template>

                <template v-if="this.form_type === 'boolean'">
                    <div class="form-check form-switch">
                        <label :for="identifier" class="form-check-label">{{ label }}</label>
                        <input class="form-check-input" type="checkbox" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
                    </div>
                </template>
                <template v-if="this.form_type === 'custom_string_data_fetch'">
                    <div class="input-group mb-3">
                        <input class="form-control"
                                        :type="text"
                                        class="form-control"
                                        :name="identifier"
                                        :id="identifier"
                                        :placeholder="description"
                                        v-model="this.$root.formData[identifier]"
                                        list="identifier+'_list'">
                        <button class="btn btn-secondary" type="button" @click.prevent="fetch_data(identifier)">Fetch suggestions</button>
                    </div>
                </template>

                <p class="fst-italic">{{ field.description }}</p>
                <template v-if="this.conditonalsApplied.length > 0">
                    <strong>Conditional logic applied:</strong>
                    <ul v-for="condition in this.conditonalsApplied">
                        <li>
                            "{{condition.description}}":
                            <template v-for="property_value, property_name in condition.condition.properties">
                                {{property_name}} in {{property_value.enum}} -> Allowed values: {{condition.options}}
                            </template>
                        </li>
                    </ul>
                </template>
            </div>
        </template>`
}

const vCreateFormList = {
    name: 'v-create-form-list',
    mounted() {
        this.$root.fetch_list_of_forms()
    },
    computed: {
        sorted_forms() {
            // Sort forms by status and created date
            return this.$root.forms.sort((a, b) => {
                if (a.value.status === b.value.status) {
                    return new Date(b.value.created) - new Date(a.value.created);
                } else {
                    // valid -> draft -> cancelled -> retired
                    const status_order = ['valid', 'draft', 'cancelled', 'retired'];
                    return status_order.indexOf(a.value.status) - status_order.indexOf(b.value.status);
                }
            });
        }
    },
    template:
    /*html*/`
        <div class="container pb-5">
            <h1>Project creation forms</h1>
            <table class="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Version</th>
                        <th>Description</th>
                        <th>Owner Email</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Links</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="form in this.sorted_forms" :key="form.id">
                        <td>{{ form.value.title }}</td>
                        <td>{{ form.value.version }}</td>
                        <td>{{ form.value.description}}</td>
                        <td>{{ form.value.owner.email }}</td>
                        <td>{{ form.value.status }}</td>
                        <td>{{ form.value.created }}</td>
                        <td><a :href="'/project_creation?edit_mode=true&version_id=' + form.id">Edit</a></td>
                    </tr>
                </tbody>
            </table>
        </div>
        `
}


const vCreateForm = {
    name: 'v-create-form',
    data() {
        return {
            display_conditional_logic: false,
            display_fields: false,
            edit_mode: false,
            new_composite_conditional_if: [],
            new_composite_conditional_then: [],
            new_conditional_if: '',
            new_conditional_then: '',
            showDebug: false
        }
    },
    computed: {
        newForm() {
            return this.$root.getValue(this.$root.new_json_form, 'json_schema');
        },
        fields() {
            return this.$root.getValue(this.newForm, 'properties');
        },
        allOf() {
            return this.$root.getValue(this.newForm, 'allOf');
        }
    },
    methods: {
        removeCondition(conditional_index) {
            // Remove the condition at the specified index
            this.allOf.splice(conditional_index, 1);
        },
        addExtraConditionIf(conditional_index) {
            // Add a new condition to the existing conditional logic
            const conditional = this.allOf[conditional_index];
            if (conditional.if.properties[this.new_composite_conditional_if[conditional_index]] === undefined) {
                conditional.if.properties[this.new_composite_conditional_if[conditional_index]] = { enum: [] };
                return
            } else {
                // do nothing
                return
            }
        },
        addExtraConditionThen(conditional_index) {
            // Add a new condition to the existing conditional logic
            const conditional = this.allOf[conditional_index];
            if (conditional.then.properties[this.new_composite_conditional_then[conditional_index]] === undefined) {
                conditional.then.properties[this.new_composite_conditional_then[conditional_index]] = { enum: [] };
                return
            } else {
                // do nothing
                return
            }
        },
        addNewField() {
            // Add a new field to the form
            if (this.new_field === '') {
                alert('Please provide a field identifier');
                return;
            }
            if (this.fields[this.new_field] !== undefined) {
                alert('Field with this identifier already exists');
                return;
            }
            // Create a new field with default values
            const newField = {
                ngi_form_type: 'string',
                ngi_form_label: this.new_field,
                description: 'New field',
                type: 'string',
                enum: []
            };
            // Add the new field to the JSON schema
            this.newForm.properties[this.new_field] = newField;
            // Reset the new_field input
            this.new_field = '';
            // Update the form data to include the new field
            this.$root.formData[this.new_field] = '';
        },
        addPropertyToCondition(conditional) {
            // Add a new property to the conditional logic
            const newProperty = {
                description: 'New property',
                if: {
                    properties: {
                        [this.new_conditional_if]: {
                            enum: []
                        }
                    }
                },
                then: {
                    properties: {
                        [this.new_conditional_then]: {
                            enum: []
                        }
                    }
                }
            };
            this.allOf.push(newProperty);
        },
        saveForm() {
            // TODO
            this.$root.json_form = this.$root.new_json_form;
        }
    },
    template: 
        /*html*/`
        <div class="container pb-5">
            <div class="row mt-5">
                <div class="row mt-3 mb-3">
                    <div class="col-auto">
                        <h1>Update Form:</h1>
                    </div>
                    <div class="col-auto ml-auto">
                        <button class="btn btn-sm btn-secondary" @click="edit_mode = !edit_mode">
                            <i class="fa fa-bug mr-2"></i>Toggle Edit Mode
                        </button>
                        <button class="btn btn-sm btn-secondary ml-2" @click="showDebug = !showDebug">
                            <i class="fa fa-bug mr-2"></i>Toggle Debug Info
                        </button>
                    </div>
                </div>
                <template v-if="showDebug" class="card">
                    <pre>{{ this.$root.new_json_form }}</pre>
                </template>
                <div class="ml-3 pb-3 border-bottom">
                    <h2 class="mt-3">Fields<button v-if="this.display_fields" class="btn btn-secondary ml-2" @click.prevent="this.display_fields = false">Hide fields</button></h2>
                    <template v-if="this.display_fields">
                        <template v-for="(field, identifier) in fields" :key="identifier">
                            <template v-if="field.ngi_form_type !== undefined">
                                <v-update-form-field :field="field" :identifier="identifier" :global_edit_mode="edit_mode"></v-update-form-field>
                            </template>
                        </template>
                        <div v-if="edit_mode" class="mb-3">
                            <h3>Add new field</h3>
                            <div>
                                <input class="form-control" type="text" placeholder="Field identifier" v-model="this.new_field">
                                <button class="btn btn-primary mt-2" @click.prevent="this.addNewField()">Add new field</button>
                            </div>
                        </div>
                        <button class="btn btn-danger" @click.prevent="this.display_fields = false">Hide fields</button>
                    </template>
                    <template v-else>
                        <button class="btn btn-primary" @click.prevent="this.display_fields = true">Show fields</button>
                    </template>
                </div>
                <div class="ml-3">
                    <h2 class="mt-3">Conditional logic <button v-if="this.display_conditional_logic" class="btn btn-secondary" @click.prevent="this.display_conditional_logic = false">Hide conditional logic</button></h2>
                    <template v-if="this.display_conditional_logic">
                        <template v-for="(conditional, conditional_index) in this.allOf">
                            <div class="border-bottom pb-5">
                                <v-conditional-edit-form
                                    :conditional="conditional"
                                    :conditional_index="conditional_index"
                                    @remove-condition="removeCondition"
                                    :global_edit_mode="this.edit_mode">
                                </v-conditional-edit-form>
                                <div v-if="edit_mode" class="row">
                                    <div class="col-5">
                                        <div class="input-group">
                                            <select class="form-select" placeholder="test" v-model="this.new_composite_conditional_if[conditional_index]">
                                                <template v-for="identifier in Object.keys(this.$root.fields)">
                                                    <option :value="identifier">{{identifier}}</option>
                                                </template>
                                            </select>
                                            <button class="btn btn-outline-primary" @click.prevent="this.addExtraConditionIf(conditional_index)">Add extra condition</button>
                                        </div>
                                    </div>
                                    <div class="col-5 offset-2">
                                        <div class="input-group">
                                            <select class="form-select" placeholder="test" v-model="this.new_composite_conditional_then[conditional_index]">
                                                <template v-for="identifier in Object.keys(this.$root.fields)">
                                                    <option :value="identifier">{{identifier}}</option>
                                                </template>
                                            </select>
                                            <button class="btn btn-outline-primary" @click.prevent="this.addExtraConditionThen(conditional_index)">Add extra condition</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <div v-if="edit_mode">
                            <h3 class="mt-5 border-top pt-3">Add condition</h3>
                            <div class="row">
                                <div class="col-5">
                                    <select class="form-select" v-model="this.new_conditional_if">
                                        <template v-for="identifier in Object.keys(this.$root.fields)">
                                            <option :value="identifier">{{identifier}}</option>
                                        </template>
                                    </select>
                                </div>
                                <div class="col-2 text-center">
                                    <h2><i class="fa-solid fa-arrow-right"></i></h2>
                                </div>
                                <div class="col-5">
                                    <select class="form-select" v-model="this.new_conditional_then">
                                        <template v-for="identifier in Object.keys(this.$root.fields)">
                                            <option :value="identifier">{{identifier}}</option>
                                        </template>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary" @click.prevent="this.addPropertyToCondition()">Add new condition</button>
                        <div class="mt-5 border-top pt-3">
                            <button class="btn btn-danger" @click.prevent="this.display_conditional_logic = false">Hide conditional logic</button>
                        </div>
                    </template>
                    <template v-else>
                        <button class="btn btn-primary" @click.prevent="this.display_conditional_logic = true">Show conditional logic</button>
                    </template>
                </div>
            </div>
        </div>
    `
}

const vConditionalEditForm = {
    name: 'v-conditional-edit-form',
    props: ['conditional', 'conditional_index', 'global_edit_mode'],
    emits: ['remove-condition'],
    data() {
        return {
            field_edit_mode: false
        }
    },
    computed: {
        description() {
            return this.conditional.description;
        },
        edit_mode() {
            return (this.field_edit_mode || this.global_edit_mode)
        },
        propertyKeyIf() {
            return Object.keys(this.conditional.if.properties);
        },
        propertyKeyThen() {
            return Object.keys(this.conditional.then.properties);
        }
    },
    template:
        /*html*/`
        <div class="pb-3">
            <div class="row">
                <div class="mb-3">
                    <h3 class="mt-5 col-auto">{{conditional_index + 1}}. {{this.conditional.description}}
                        <template v-if="edit_mode">
                            <button @click="field_edit_mode = !field_edit_mode" class="btn btn-lg ml-1"><i class="fa-solid fa-check"></i></button>
                        </template>
                        <template v-else>
                            <button @click="field_edit_mode = !field_edit_mode" class="btn btn-lg ml-1"><i class="fa-solid fa-pen-to-square"></i></button>
                        </template>
                    </h3>
                    <div class="col-auto ml-auto">
                        <button v-if="edit_mode" class="btn btn-outline-danger" @click.prevent="$emit('remove-condition', conditional_index)">
                            Remove Condition <i class="fa-solid fa-trash ml-2"></i>
                        </button>
                    </div>
                    <div v-if="edit_mode">
                        <label class="form-label">Condition name/description</label>
                        <input class="form-control" type="string" v-model="this.conditional.description"></input>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-5">
                    <template v-for="(if_property, if_property_index) in this.propertyKeyIf">
                        <v-conditional-edit-form-single-condition
                             :conditional="this.conditional"
                             :conditional_index="this.conditional_index"
                             :property="if_property"
                             :property_index="if_property_index"
                             :condition_type="'if'"
                             :edit_mode="edit_mode">
                        </v-conditional-edit-form-single-condition>
                    </template>

                </div>
                <div class="col-2 text-center">
                    <h2><i class="fa-solid fa-arrow-right"></i></h2>
                </div>
                <div class="col-5">
                    <template v-for="(then_property, then_property_index) in this.propertyKeyThen">
                        <v-conditional-edit-form-single-condition
                            :conditional="this.conditional" 
                            :conditional_index="this.conditional_index" 
                            :property="then_property" 
                            :property_index="then_property_index"
                            :condition_type="'then'"
                            :edit_mode="edit_mode">
                        </v-conditional-edit-form-single-condition>
                    </template>
                </div>
            </div>
        </div>
    `
}

const vConditionalEditFormSingleCondition = {
    name: 'v-conditional-edit-form-single-condition',
    props: ['conditional', 'conditional_index', 'property', 'property_index', 'condition_type', 'edit_mode'],
    data() {
        return {
            showAllOptions: false // Controls whether all options are shown
        };
    },
    computed: {
        conditionProperties() {
            // Access the correct condition properties based on condition_type
            return this.conditional[this.condition_type].properties;
        },
        enumValues() {
            // Get the enum values for the current property
            if (this.conditionProperties[this.property].enum === undefined) {
                return [];
            }
            return this.conditionProperties[this.property].enum;
        },
        propertyReference() {
            // Get the referenced property from the root fields
            return this.$root.getValue(this.$root.fields, this.property);
        },
        propertyReferenceLabel() {
            // Get the label of the referenced property
            if (this.propertyReference === undefined || this.propertyReference.ngi_form_label === undefined) {
                return this.property;
            }
            return this.propertyReference.ngi_form_label;
        },
        propertyReferenceIsEnum() {
            // Check if the referenced property is an enum
            return this.propertyReference?.enum !== undefined;
        },
        propertyReferenceIsBoolean() {
            // Check if the referenced property is a boolean
            return this.propertyReference?.type === 'boolean';
        }
    },
    methods: {
        addNewValue(option) {
            // Add a new value to the enum
            if (this.conditionProperties[this.property].enum === undefined) {
                this.conditionProperties[this.property].enum = [];
            }
            if (option !== undefined) {
                this.conditionProperties[this.property].enum.push(option);
            } else if (this.propertyReferenceIsBoolean) {
                this.conditionProperties[this.property].enum.push(false);
            } else if (this.propertyReferenceIsEnum) {
                this.conditionProperties[this.property].enum.push(this.propertyReference.enum[0]);
            } else {
                this.conditionProperties[this.property].enum.push('');
            }
        },
        removeValue(index) {
            // Remove a value from the enum
            this.conditionProperties[this.property].enum.splice(index, 1);
        }
    },
    template:
    /*html*/`
        <template v-if="property_index === 0" :class="{'mt-3': conditional_index > 0}">
            <h4 v-if="condition_type === 'if'">
                If <span class="fw-bold">{{propertyReferenceLabel}}</span> is any of
            </h4>
            <h4 v-else>
                Then <span class="fw-bold">{{propertyReferenceLabel}}</span> has to be one of
            </h4>
        </template>
        <template v-if="showAllOptions && propertyReferenceIsEnum">
            <template v-for="option in propertyReference.enum">
                <h4>
                    <template v-if="enumValues.includes(option)">
                        <button v-if="edit_mode" class="btn btn-success" @click.prevent="enumValues.splice(enumValues.indexOf(option), 1)">{{option}}</button>
                    </template>
                    <template v-else>
                        <button v-if="edit_mode" class="btn btn-secondary" @click.prevent="enumValues.push(option)">{{option}}</button>
                    </template>
                </h4>
            </template>
        </template>
        <template v-else>
            <template v-for="(value, index) in enumValues">
                <div class="mb-3">
                    <template v-if="!edit_mode">
                        <p>{{value}}</p>
                    </template>
                    <template v-else-if="propertyReferenceIsEnum">
                        <div class="input-group">
                            <select class="form-select" v-model="enumValues[index]">
                                <template v-for="option in propertyReference.enum">
                                    <option :value="option">{{option}}</option>
                                </template>
                            </select>
                            <button v-if="edit_mode" class="btn btn-outline-danger col-auto" @click.prevent="removeValue(index)"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </template>
                    <template v-else-if="propertyReferenceIsBoolean">
                        <div class="form-check form-switch">
                            <label :for="'boolean_switch_condition' + conditional_index + '_enumIndex' + index" class="form-check-label">{{enumValues[index]}}</label>
                            <input :id="'boolean_switch_condition' + conditional_index + '_enumIndex' + index" class="form-check-input" type="checkbox" v-model="enumValues[index]">
                        </div>
                        <button v-if="edit_mode" class="btn btn-outline-danger col-auto ml-2" @click.prevent="removeValue(index)"><i class="fa-solid fa-trash ml-2"></i></button>
                    </template>
                    <template v-else>
                        <div class="input-group">
                            <input class="form-control col-auto" type="string" v-model="enumValues[index]">
                            <button v-if="edit_mode" class="btn btn-outline-danger col-auto" @click.prevent="removeValue(index)"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </template>
                </div>
            </template>
        </template>
        <template v-if="showAllOptions">
            <a v-if="edit_mode" href="#" @click.prevent="showAllOptions = !showAllOptions">Show only selected options</a>
        </template>
        <template v-else>
            <button v-if="edit_mode" class="btn btn-outline-primary" @click.prevent="addNewValue()">Add value<i class="fa-solid fa-plus ml-2"></i></button>
            <template v-if="propertyReferenceIsEnum">
                <a v-if="edit_mode" class="ml-2" href="#" @click.prevent="showAllOptions = !showAllOptions">Show all options</a>
            </template>
        </template>
    `
}

const vUpdateFormField = {
    name: 'v-update-form-field',
    props: ['field', 'identifier', 'global_edit_mode'],
    data: function() {
        return {
            field_edit_mode: false,
            show_allowed_values: false,
            selectedVisibleIfKey: '',
            visibleIfErrorMessage: ''
        }
    },
    computed: {
        edit_mode() {
            return (this.global_edit_mode || this.field_edit_mode)
        },
        description() {
            return this.field.description;
        },
        form_type() {
            return this.field.ngi_form_type;
        },
        label() {
            return this.field.ngi_form_label;
        },
        new_json_form() {
            return this.$root.new_json_form;
        },
        new_json_schema() {
            return this.$root.getValue(this.$root.new_json_form, 'json_schema');
        },
        nr_of_allowed_values() {
            // Check if enum is defined on field
            if (this.new_json_schema['properties'][this.identifier]['enum'] === undefined) {
                return 0
            }
            return this.new_json_schema['properties'][this.identifier]['enum'].length;
        },
        current_value() {
            return this.$root.formData[this.identifier];
        },
        type() {
            return this.field.type;
        },
        visible_if() {
            return this.$root.getValue(this.field, 'ngi_form_visible_if');
        }
    },
    methods: {
        add_new_allowed() {
            if (this.new_json_schema['properties'][this.identifier]['enum'] === undefined) {
                this.new_json_schema['properties'][this.identifier]['enum'] = []
            }
            // Add a new empty allowed value
            this.new_json_schema['properties'][this.identifier]['enum'].push('')
        },
        add_visible_if() {
            this.visibleIfErrorMessage = '';
            if (this.selectedVisibleIfKey === '') {
                this.visibleIfErrorMessage = 'Please select a field to add a conditional logic';
                return null
            }

            // Add the skeleton for a new conditional logic when the field should be visible
            if (this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if'] === undefined) {

                this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if'] = {
                    properties: {}
                }
            }

            if (this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if']['properties'][this.selectedVisibleIfKey] !== undefined) {
                this.visibleIfErrorMessage = 'This field is already included';
                return null
            }

            let referenceSelectedField = this.$root.getValue(this.new_json_schema['properties'], this.selectedVisibleIfKey);
            let default_value = '';
            if (referenceSelectedField.enum !== undefined) {
                default_value = referenceSelectedField.enum[0];
            } else if (referenceSelectedField.type === 'boolean') {
                default_value = false;
            } else if (referenceSelectedField.type === 'string') {
                default_value = '';
            } else {
                default_value = null;
            }
            this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if']['properties'][this.selectedVisibleIfKey] = {
                enum: [default_value]
            }
        }
    },
     template:
        /*html*/`
            <div class="mb-5">
                <h2>{{this.label}}
                <template v-if="field_edit_mode">
                    <button @click="field_edit_mode = !field_edit_mode" class="btn btn-lg ml-1"><i class="fa-solid fa-check"></i></button>
                </template>
                <template v-else>
                    <button @click="field_edit_mode = !field_edit_mode" class="btn btn-lg ml-1"><i class="fa-solid fa-pen-to-square"></i></button>
                </template>
                </h2>
                <div>
                    <label :for="identifier" class="form-label">Identifier</label>
                    <input :id="identifier" class="form-control" type="string" v-model="identifier" :disabled="!edit_mode">
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_group'" class="form-label">Group</label>
                    <select :id="identifier + '_ngi_form_group'" class="form-control" v-model="this.new_json_schema['properties'][identifier]['ngi_form_group']" :disabled="!edit_mode">
                        <template v-for="(form_group, group_identifier) in this.new_json_form['form_groups']">
                            <option :value="group_identifier">{{form_group.display_name}}</option>
                        </template>
                    </select>
                </div>
                <div>
                    <label :for="identifier + '_description'" class="form-label">Description</label>
                    <input :id="identifier + '_description'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['description']" :disabled="!edit_mode">
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_type'" class="form-label">Form Type</label>
                    <select :id="identifier + '_ngi_form_type'" class="form-control" v-model="this.new_json_schema['properties'][identifier]['ngi_form_type']" :disabled="!edit_mode">
                        <option value="string">String</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select</option>
                        <option value="datalist">Datalist (must select value in list)</option>
                        <option value="custom_datalist">Custom Datalist (fetch most used suggestions)</option>
                    </select>
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_label'" class="form-label">Label</label>
                    <input :id="identifier + '_ngi_form_label'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['ngi_form_label']" :disabled="!edit_mode">
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_lims_udf'" class="form-label">LIMS UDF</label>
                    <input :id="identifier + '_ngi_form_lims_udf'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['ngi_form_lims_udf']" :disabled="!edit_mode">
                </div>
                <template v-if="(this.type === 'string') && (this.form_type !== 'select')">
                    <div>
                        <label :for="identifier + '_pattern'" class="form-label">Pattern</label>
                        <input :id="identifier + '_pattern'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['pattern']" :disabled="!edit_mode">
                    </div>
                </template>
                <div>
                    <h3 class="mt-3">Visibility</h3>
                    <template v-if="this.visible_if !== undefined">
                        <h4 class="mt-2">Visible only if</h4>
                        <div class="row">
                            <template v-for="(condition_key, condition_index) in Object.keys(this.visible_if['properties'])">
                                <template v-if="condition_index > 0">
                                    <h4>AND</h4>
                                </template>
                                <div class="offset-1 col-11">
                                    <button v-if="edit_mode" class="btn btn-outline-danger" @click.prevent="delete this.new_json_schema['properties'][identifier]['ngi_form_visible_if']['properties'][condition_key]">Remove field<i class="fa-solid fa-trash ml-2"></i></button>
                                    <v-visible-if-condition-edit-form :field_identifier="identifier" :condition_key="condition_key" :edit_mode="edit_mode"></v-visible-if-condition-edit-form>
                                </div>
                            </template>
                        </div>
                    </template>
                    <template v-else>
                        <h4 class="mt-2">Always visible</h4>
                    </template>
                    <template v-if="this.visibleIfErrorMessage !== ''">
                        <div class="alert alert-danger" role="alert">
                            <h4>{{ this.visibleIfErrorMessage }}</h4>
                        </div>
                    </template>
                    <div v-if="edit_mode" class="row">
                        <div class="col-6">
                            <div class="input-group">
                                <select class="form-select" placeholder="test" v-model="this.selectedVisibleIfKey">
                                    <template v-for="identifier in Object.keys(this.$root.fields)">
                                        <option :value="identifier">{{identifier}}</option>
                                    </template>
                                </select>
                                <button class="btn btn-primary" @click.prevent="this.add_visible_if()" :disabled="!edit_mode">Add conditional visibility</button>
                            </div>
                        </div>
                    </div>
                </div>
                <template v-if="(this.form_type === 'select') || (this.form_type === 'datalist')">
                    <div class="col-6">
                        <h3>Allowed values</h3>
                        <p>{{this.nr_of_allowed_values}} number of allowed values are added.</p>
                        <template v-if="this.show_allowed_values">
                            <button class="btn btn-danger mb-2" @click.prevent="this.show_allowed_values = false">Hide allowed values</button>
                            <template v-for="(option, index) in this.new_json_schema['properties'][identifier]['enum']" :key="index">
                                <div class="input-group mb-3">
                                    <input :id="identifier + '_enum_'+index" class="form-control col-auto" type="string" v-model="this.new_json_schema['properties'][identifier]['enum'][index]" :disabled="!edit_mode">
                                    <button v-if="edit_mode" class="btn btn-danger col-auto" @click.prevent="this.new_json_schema['properties'][identifier]['enum'].splice(index, 1)">Remove<i class="fa-solid fa-trash ml-2"></i></button>
                                </div>
                            </template>
                            <button v-if="edit_mode" class="btn btn-primary" @click.prevent="this.add_new_allowed()">Add new allowed value</button>
                        </template>
                        <template v-else>
                            <button class="btn btn-primary" @click.prevent="this.show_allowed_values = true">Show allowed values</button>
                        </template>
                    </div>
                </template>
            </div>
        `
}

const vVisibleIfConditionEditForm = {
    name: 'v-visible-if-condition-edit-form',
    props: ['field_identifier', 'condition_key', 'edit_mode'],
        data() {
        return {
            showAllOptions: false // Controls whether all options are shown
        };
    },
    computed: {
        condition() {
            const condition = this.$root.getValue(this.new_json_schema['properties'][this.field_identifier]['ngi_form_visible_if']['properties'], this.condition_key);
            if (condition === undefined) {
                return {'enum': ['']}
            }
            return condition;
        },        
        enumIf() {
            // The enum inside the condition
            return this.condition.enum;
        },
        new_json_schema() {
            return this.$root.getValue(this.$root.new_json_form, 'json_schema');
        },
        propertyReferenceIf() {
            // The property that is referenced in the condition
            return this.$root.getValue(this.new_json_schema['properties'], this.condition_key)
        },
        propertyReferenceIfLabel() {
            // The label of the property that is referenced in the condition
            if (this.propertyReferenceIf === undefined || this.propertyReferenceIf.ngi_form_label === undefined) {
                return this.condition_key
            }
            return this.propertyReferenceIf.ngi_form_label;
        },
        propertyReferenceIsEnumIf() {
            // Check if the property that is referenced is an enum
            if (this.propertyReferenceIf.enum === undefined) {
                return false
            }
            return true
        }
    },
    methods: {
        updateKey(index) {
            const currentKey = Object.keys(this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if']['properties'])[condition_index];
            const defaultValue = {'enum': []};
    
            // Delete the old key and set the new key with the same value
            delete this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if']['properties'][currentKey];
            this.new_json_schema['properties'][this.identifier]['ngi_form_visible_if']['properties'][this.selectedKey] = defaultValue
    
            // Reset the selectedKey to avoid confusion
            this.selectedKey = '';
        }
    },
    template:
        /*html*/`
            <div class="mb-3">
                <h4>{{this.propertyReferenceIfLabel}}</h4>
                is any of
                <template v-if="this.showAllOptions && this.propertyReferenceIsEnumIf">
                    <template v-for="option in this.propertyReferenceIf.enum">
                        <h4>
                            <template v-if="this.enumIf.includes(option)">
                                <button v-if="edit_mode" class="btn btn-success" @click.prevent="this.enumIf.splice(this.enumIf.indexOf(option), 1)">{{option}}</button>
                            </template>
                            <template v-else>
                                <button v-if="edit_mode" class="btn btn-secondary" @click.prevent="this.enumIf.push(option)">{{option}}</button>
                            </template>
                        </h4>
                    </template>
                </template>
                <template v-else>
                    <template v-if="this.propertyReferenceIsEnumIf">
                        <template v-for="(enumValue, index_enum) in this.enumIf">
                            <div class="row">
                                <div class="col-6">
                                    <div class="input-group mb-3">
                                        <template v-if="this.propertyReferenceIsEnumIf">
                                            <select class="form-select" v-model="this.enumIf[index_enum]" :disabled="!edit_mode">
                                                <template v-for="option in this.propertyReferenceIf.enum">
                                                    <option :value="option">{{option}}</option>
                                                </template>
                                            </select>
                                        </template>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <button v-if="edit_mode" class="btn btn-outline-danger" @click.prevent="this.enumIf.splice(index_enum, 1)">
                                        <i class="fa-solid fa-trash ml-2"></i>
                                    </button>
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-else>
                        <template v-for="(enumValue, index_enum) in this.enumIf">
                            <div class="input-group mb-3">
                                <input class="form-control col-auto" type="string" v-model="this.enumIf[index_enum]" :disabled="!edit_mode">
                                <button v-if="edit_mode" class="btn btn-outline-danger col-auto" @click.prevent="this.enumIf.splice(index_enum, 1)">
                                    <i class="fa-solid fa-trash ml-2"></i>
                                </button>
                            </div>
                        </template>
                    </template>
                </template>
                <template v-if="this.showAllOptions">
                    <a v-if="edit_mode" href="#" @click.prevent="this.showAllOptions = !this.showAllOptions">Show only selected options</a>
                </template>
                <template v-else>
                    <button v-if="edit_mode" class="btn btn-outline-primary" @click.prevent="this.enumIf.push('')">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <template v-if="this.propertyReferenceIsEnumIf">
                        <a v-if="edit_mode" class="ml-2" href="#" @click.prevent="this.showAllOptions = !this.showAllOptions">Show all options</a>
                    </template>
                </template>
            </div>
        `
}

const app = Vue.createApp(vProjectCreationMain)
app.component('v-project-creation-form', vProjectCreationForm)
app.component('v-conditional-edit-form-single-condition', vConditionalEditFormSingleCondition)
app.component('v-visible-if-condition-edit-form', vVisibleIfConditionEditForm)
app.component('v-form-field', vFormField)
app.component('v-create-form-list', vCreateFormList)
app.component('v-create-form', vCreateForm)
app.component('v-update-form-field', vUpdateFormField)
app.component('v-conditional-edit-form', vConditionalEditForm)
app.mount('#v_project_creation')