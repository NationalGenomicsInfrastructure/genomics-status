// Import Ajv from the CDN
import Ajv from 'https://cdn.jsdelivr.net/npm/ajv@8.17.1/+esm';

const vProjectCreationForm = {
    data() {
        return {
          conditionalLogic: [],
          error_messages: [],
          formData: {},
          isEditingForm: false,
          json_form: {},
          new_json_form: {},
          initiated: false,
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
        new_json_schema() {
            return this.getValue(this.new_json_form, 'json_schema');
        },
        fields() {
            if (this.json_schema === undefined) {
                return []
            }
            return this.getValue(this.json_schema, 'properties');
        },
        fields_per_group() {
            // group fields by their group identifier
            if (this.json_schema === undefined) {
                return {}
            }

            // iterate over the this.fields and group them by their group identifier
            const groupedFields = {};
            Object.keys(this.fields).forEach(field => {
                const fieldGroup = this.fields[field].ngi_form_group;
                if (fieldGroup === undefined) {
                    // If no group is defined, assign to a default group
                    if (groupedFields['unassigned'] === undefined) {
                        groupedFields['unassigned'] = {};
                    }
                    groupedFields['unassigned'][field] = this.fields[field];
                } else {
                    if (groupedFields[fieldGroup] === undefined) {
                        groupedFields[fieldGroup] = {};
                    }
                    groupedFields[fieldGroup][field] = this.fields[field];
                }
            });
            return groupedFields;
        },
        form_groups() {
            if (this.json_form === undefined) {
                return []
            }
            return this.getValue(this.json_form, 'form_groups');
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
        fields_for_given_group(group_identifier) {
            // Get the fields for a specific group
            if (this.fields_per_group[group_identifier] === undefined) {
                return {}
            }
            return this.fields_per_group[group_identifier];
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
        startEditForm(){
            // Only allow it to be iniatied once.
            if (!this.initiated) {
                this.isEditingForm = true;
                this.new_json_form = JSON.parse(JSON.stringify(this.$root.json_form));
                this.initiated = true;
            }
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
            this.setValuesBasedOnConditionals();
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
    mounted() {
        this.fetch_form()
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
                        <button type="submit" class="btn btn-lg btn-primary mt-3">Submit</button>
                    </form>
                </template>
            </div>
        </div>
        <v-create-form></v-create-form>
        `
}

const vFormField = {
    name: 'v-form-field',
    props: ['field', 'identifier'],
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
    mounted() {
        // Initialize the form data for this field
        if (this.form_type === 'boolean') {
            this.$root.formData[this.identifier] = false;
        } else {
            this.$root.formData[this.identifier] = '';
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
                    <select class="form-select" :aria-label="description" v-model="this.$root.formData[identifier]">
                        <template v-for="option in options">
                            <option :value="option">{{option}}</option>
                        </template>
                    </select>
                </template>

                <template v-if="this.form_type === 'datalist'">
                    <input class="form-control" :list="identifier+'_list'" :aria-label="description" v-model="this.$root.formData[identifier]">
                        <datalist :id="identifier+'_list'">
                            <template v-for="option in options">
                                <option :value="option">{{option}}</option>
                            </template>
                        </datalist>
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

                <p class="fst-italic">{{ field.description }}</p>
                <template v-if="this.conditonalsApplied.length > 0">
                    <strong>Conditional logic applied:</strong>
                    <ul v-for="condition in this.conditonalsApplied">
                        <li>
                            {{condition.description}} -> Allowed values: {{condition.options}}
                        </li>
                    </ul>
                </template>
            </div>
        </template>`
}

const vCreateForm = {
    name: 'v-create-form',
    data() {
        return {
            display_conditional_logic: false,
            display_fields: false,
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
            this.$root.json_form = this.$root.new_json_form;
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row mt-5">
                <template v-if="!this.$root.isEditingForm">
                    <button class="btn btn-lg btn-primary mt-3" @click="this.$root.startEditForm">Edit form</button>
                </template>
                <template v-else>
                    <div class="row">
                        <div class="col-auto">
                            <h1>Update Form:</h1>
                        </div>
                        <div class="col-auto ml-auto">
                            <button class="btn btn-sm btn-secondary" @click="showDebug = !showDebug">
                                <i class="fa fa-bug mr-2"></i>Toggle Debug Info
                            </button>
                        </div>
                    </div>
                    <template v-if="showDebug" class="card">
                        <pre>{{ this.$root.new_json_form }}</pre>
                    </template>
                    <div>
                        <h2 class="mt-3">Fields</h2>
                        <template v-if="this.display_fields">
                            <template v-for="(field, identifier) in fields" :key="identifier">
                                <template v-if="field.ngi_form_type !== undefined">
                                    <v-update-form-field :field="field" :identifier="identifier"></v-update-form-field>
                                </template>                                
                            </template>
                            <button class="btn btn-danger" @click.prevent="this.display_fields = false">Hide fields</button>
                        </template>
                        <template v-else>
                            <button class="btn btn-primary" @click.prevent="this.display_fields = true">Show fields</button>
                        </template>
                    </div>

                    <div>
                        <h2 class="mt-3">Conditional logic</h2>
                        <template v-if="this.display_conditional_logic">
                            <template v-for="(conditional, conditional_index) in this.allOf">
                                <v-conditional-edit-form :conditional="conditional" :conditional_index="conditional_index"></v-conditional-edit-form>
                            </template>
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
                            <button class="btn btn-primary" @click.prevent="this.addPropertyToCondition()">Add new condition</button>
                            <div class="mt-5 border-top pt-3">
                                <button class="btn btn-danger" @click.prevent="this.display_conditional_logic = false">Hide conditional logic</button>
                            </div>
                        </template>
                        <template v-else>
                            <button class="btn btn-primary" @click.prevent="this.display_conditional_logic = true">Show conditional logic</button>
                        </template>
                    </div>
                    <div class="row">
                        <button class="btn btn-lg btn-primary mt-3" @click="this.saveForm">Save form</button>
                    </div>
                </template>
            </div>
        </div>
    `
}

const vConditionalEditForm = {
    name: 'v-conditional-edit-form',
    props: ['conditional', 'conditional_index'],
    data() {
        return {
            showAllOptionsIf: false,
            showAllOptionsThen: false
        }
    },
    computed: {
        description() {
            return this.conditional.description;
        },
        propertyReferenceIf() {
            return this.$root.getValue(this.$root.fields, this.propertyKeyIf)
        },
        propertyReferenceThen() {
            return this.$root.getValue(this.$root.fields, this.propertyKeyThen)
        },
        propertyReferenceIsEnumIf() {
            // Check if the property that is referenced is an enum
            if (this.propertyReferenceIf.enum === undefined) {
                return false
            }
            return true
        },
        propertyReferenceIsBooleanIf() {
            // Check if the property that is referenced is a boolean
            if (this.propertyReferenceIf.type === 'boolean') {
                return true
            }
        },
        propertyReferenceIsBooleanThen() {
            // Check if the property that is referenced is a boolean
            if (this.propertyReferenceThen.type === 'boolean') {
                return true
            }
        },
        propertyReferenceIsEnumThen() {
            // Check if the property that is referenced is an enum
            if (this.propertyReferenceThen.enum === undefined) {
                return false
            }
            return true
        },
        propertyReferenceDisplayNameIf() {
            if (this.propertyReferenceIf === undefined || this.propertyReferenceIf.ngi_form_label === undefined) {
                return this.propertyKeyIf
            }
            
            return this.$root.getValue(this.propertyReferenceIf, 'ngi_form_label')
        },
        propertyReferenceDisplayNameThen() {
            if (this.propertyReferenceThen === undefined || this.propertyReferenceThen.ngi_form_label === undefined) {
                return this.propertyKeyThen
            }

            return this.$root.getValue(this.propertyReferenceThen, 'ngi_form_label')
        },
        propertyKeyIf() {
            return Object.keys(this.conditional.if.properties)[0];
        },
        propertyKeyThen() {
            return Object.keys(this.conditional.then.properties)[0];
        },
        propertyObjectIf() {
            return this.$root.getValue(this.conditional.if.properties, this.propertyKeyIf);
        },
        propertiesThen() {
            return this.conditional.then.properties;
        },
        enumIf() {
            if (this.propertyObjectIf.enum === undefined) {
                return []
            }
            return this.conditional.if.properties[this.propertyKeyIf]['enum'];
        },
        enumThen() {
            if (this.propertiesThen[this.propertyKeyThen]['enum'] === undefined) {
                return []
            }
            return this.conditional.then.properties[this.propertyKeyThen]['enum'];
        }
    },
    methods: {
        removeIfEnum(index_enum) {
            // Remove the enum value from the "if" conditional
            this.conditional.if.properties[this.propertyKeyIf]['enum'].splice(index_enum, 1);
        },
        addNewConditionalValueIf(option) {
            // Add a new allowed value to the "if" conditional
            if (this.conditional.if.properties[this.propertyKeyIf]['enum'] === undefined) {
                this.conditional.if.properties[this.propertyKeyIf]['enum'] = [];
            }
            if (option !== undefined) {
                this.conditional.if.properties[this.propertyKeyIf]['enum'].push(option);
            } else if (this.propertyReferenceIsBooleanIf) {
                this.conditional.if.properties[this.propertyKeyIf]['enum'].push(false);
            } else if (this.propertyReferenceIsEnumIf) {
                this.conditional.if.properties[this.propertyKeyIf]['enum'].push(this.propertyReferenceIf.enum[0]);
            } else {
                this.conditional.if.properties[this.propertyKeyIf]['enum'].push('');
            }
        },
        removeThenEnum(index_enum) {
            // Remove the enum value from the "then" conditional
            this.conditional.then.properties[this.propertyKeyThen]['enum'].splice(index_enum, 1);
        },
        addNewConditionalValueThen(option) {
            // Add a new allowed value to the "then" conditional
            if (this.conditional.then.properties[this.propertyKeyThen]['enum'] === undefined) {
                this.conditional.then.properties[this.propertyKeyThen]['enum'] = [];
            }
            if (option !== undefined) {
                this.conditional.then.properties[this.propertyKeyThen]['enum'].push(option);
            } else if (this.propertyReferenceIsBooleanThen) {
                this.conditional.then.properties[this.propertyKeyThen]['enum'].push(false);
            } else if (this.propertyReferenceIsEnumThen) {
                this.conditional.then.properties[this.propertyKeyThen]['enum'].push(this.propertyReferenceThen.enum[0]);
            } else {
                this.conditional.then.properties[this.propertyKeyThen]['enum'].push('');
            }
        },
        removeConditionalValueThen(option) {
            // Remove a specific value from the "then" enum
            const option_index = this.conditional.then.properties[this.propertyKeyThen]['enum'].indexOf(option);
            this.conditional.then.properties[this.propertyKeyThen]['enum'].splice(option_index, 1);
        }
    },
    template:
        /*html*/`

        <div class="border-bottom pb-3">
            <div class="row">
                <div class="col-12 mb-3">
                    <h3 class="mt-5">{{conditional_index + 1}}. {{this.conditional.description}}</h3>
                    <label class="form-label">Condition name/description</label>
                    <input class="form-control" type="string" v-model="this.conditional.description"></input>
                </div>
            </div>
            <div class="row">
                <div class="col-5">
                    <h4>If <span class="fw-bold">{{this.propertyReferenceDisplayNameIf}}</span> is any of</h4>
                    <template v-if="this.showAllOptionsIf && this.propertyReferenceIsEnumIf">
                        <template v-for="option in this.propertyReferenceIf.enum">
                            <h4>
                                <template v-if="this.conditional.if.properties[this.propertyKeyIf]['enum'].includes(option)">
                                    <button class="btn btn-success" @click.prevent="this.removeConditionalValueIf(option)">{{option}}</button>
                                </template>
                                <template v-else>
                                    <button class="btn btn-secondary" @click.prevent="this.addNewConditionalValueIf(option)">{{option}}</button>
                                </template>
                            </h4>
                        </template>
                    </template>
                    <template v-else>
                        <template v-for="(enumValue, index_enum) in this.enumIf">
                            <div class="input-group mb-3">
                                <template v-if="this.propertyReferenceIsEnumIf">
                                    <select class="form-select" v-model="this.conditional.if.properties[this.propertyKeyIf]['enum'][index_enum]">
                                        <template v-for="option in this.propertyReferenceIf.enum">
                                            <option :value="option">{{option}}</option>
                                        </template>
                                    </select>
                                </template>
                                <template v-else>
                                    <input class="form-control col-auto" type="string" v-model="this.conditional.if.properties[this.propertyKeyIf]['enum'][index_enum]">
                                </template>
                                <button class="btn btn-outline-danger col-auto" @click.prevent="this.removeIfEnum(index_enum)"><i class="fa-solid fa-trash ml-2"></i></button>
                            </div>
                        </template>
                    </template>
                    <template v-if="this.showAllOptionsIf">
                        <a href="#" @click.prevent="this.showAllOptionsIf = !this.showAllOptionsIf">Show only selected options</a>
                    </template>
                    <template v-else>
                        <button class="btn btn-outline-primary" @click.prevent="addNewConditionalValueIf"><i class="fa-solid fa-plus"></i></button>
                        <template v-if="this.propertyReferenceIsEnumIf">
                            <a class="ml-2" href="#" v-if="this.propertyReferenceIsEnumIf" @click.prevent="this.showAllOptionsIf = !this.showAllOptionsIf">Show all options</a>
                        </template>
                    </template>
                </div>
                <div class="col-2 text-center">
                    <h2><i class="fa-solid fa-arrow-right"></i></h2>
                </div>
                <div class="col-5">
                    <h4>then <span class="fw-bold">{{this.propertyReferenceDisplayNameThen}}</span> has to be one of</h4>
                    <template v-if="this.showAllOptionsThen && this.propertyReferenceIsEnumThen">
                        <template v-for="option in this.propertyReferenceThen.enum">
                            <h4>
                                <template v-if="this.enumThen.includes(option)">
                                    <button class="btn btn-success" @click.prevent="this.removeConditionalValueThen(option)">{{option}}</button>
                                </template>
                                <template v-else>
                                    <button class="btn btn-secondary" @click.prevent="this.addNewConditionalValueThen(option)">{{option}}</button>
                                </template>
                            </h4>
                        </template>
                    </template>
                    <template v-else>
                        <template v-for="(enumValue, index_enum) in this.enumThen">
                            <div class="input-group mb-3">
                                <template v-if="this.propertyReferenceIsEnumThen">
                                    <select class="form-select" v-model="this.conditional.then.properties[this.propertyKeyThen]['enum'][index_enum]">
                                        <template v-for="option in this.propertyReferenceThen.enum">
                                            <option :value="option">{{option}}</option>
                                        </template>
                                    </select>
                                </template>
                                <template v-else>
                                    <input class="form-control col-auto" type="string" v-model="this.conditional.then.properties[this.propertyKeyThen]['enum'][index_enum]">
                                </template>
                                <button class="btn btn-outline-danger col-auto" @click.prevent="this.removeThenEnum(index_enum)"><i class="fa-solid fa-trash ml-2"></i></button>
                            </div>
                        </template>
                    </template>
                    <template v-if="this.showAllOptionsThen">
                        <a href="#" @click.prevent="this.showAllOptionsThen = !this.showAllOptionsThen">Show only selected options</a>
                    </template>
                    <template v-else>
                        <button class="btn btn-outline-primary" @click.prevent="addNewAllowedValueThen"><i class="fa-solid fa-plus"></i></button>
                        <template v-if="this.propertyReferenceIsEnumThen">
                            <a class="ml-2" href="#" @click.prevent="this.showAllOptionsThen = !this.showAllOptionsThen">Show all options</a>
                        </template>
                    </template>
                </div>
            </div>
        </div>
    `
}

const vUpdateFormField = {
    name: 'v-update-form-field',
    props: ['field', 'identifier'],
    data: function() {
        return {
            show_allowed_values: false,
            selectedVisibleIfKey: '',
            visibleIfErrorMessage: ''
        }
    },
    computed: {        
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
        },

    },
    template:
        /*html*/`
        <div class="mb-5">
            <h2>{{this.label}}</h2>
            <div>
                <label :for="identifier" class="form-label">Identifier</label>
                <input :id="identifier" class="form-control" type="string"  v-model="identifier">
            </div>
            <div>
                <label :for="identifier + '_ngi_form_group'" class="form-label">Group</label>
                <select :id="identifier + '_ngi_form_group'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['ngi_form_group']">
                    <template v-for="(form_group, group_identifier) in this.new_json_form['form_groups']">
                        <option :value="group_identifier">{{form_group.display_name}}</option>
                    </template>
                </select>
            </div>
            <div>
                <label :for="identifier + '_description'" class="form-label">Description</label>
                <input :id="identifier + '_description'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['description']">
            </div>
            <div>
                <label :for="identifier + '_ngi_form_type'" class="form-label">Form Type</label>
                <select :id="identifier + '_ngi_form_type'" class="form-control" v-model="this.new_json_schema['properties'][identifier]['ngi_form_type']">
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                    <option value="select">Select</option>
                    <option value="datalist">Datalist</option>
                </select>

            </div>
            <div>
                <label :for="identifier + '_ngi_form_label'" class="form-label">Label</label>
                <input :id="identifier + '_ngi_form_label'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['ngi_form_label']">
            </div>
            <div>
                <label :for="identifier + '_ngi_form_lims_udf'" class="form-label">LIMS UDF</label>
                <input :id="identifier + '_ngi_form_lims_udf'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['ngi_form_lims_udf']">
            </div>
            <template v-if="(this.type === 'string') && (this.form_type !== 'select')">
                <div>
                    <label :for="identifier + '_pattern'" class="form-label">Pattern</label>
                    <input :id="identifier + '_pattern'" class="form-control" type="string" v-model="this.new_json_schema['properties'][identifier]['pattern']">
                </div>
                <div class="form-check form-switch">
                    <!-- Get Suggestions -->
                    <label :for="identifier + '_ngi_form_get_suggestions'" class="form-check-label">Get Suggestions (will fetch used values to suggest) </label>
                    <input :for="identifier + '_ngi_form_get_suggestions'" class="form-check-input" type="checkbox" v-model="this.new_json_schema['properties'][identifier]['ngi_form_get_suggestions']">
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
                                <button class="btn btn-outline-danger" @click.prevent="delete this.new_json_schema['properties'][identifier]['ngi_form_visible_if']['properties'][condition_key]">Remove field<i class="fa-solid fa-trash ml-2"></i></button>
                                <v-visible-if-condition-edit-form :field_identifier="identifier" :condition_key="condition_key"></v-visible-if-condition-edit-form>
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
                <div class="row">
                    <div class="col-6">
                        <div class="input-group">
                            <select class="form-select" placeholder="test" v-model="this.selectedVisibleIfKey">
                                <template v-for="identifier in Object.keys(this.$root.fields)">
                                    <option :value="identifier">{{identifier}}</option>
                                </template>
                            </select>
                            <button class="btn btn-primary" @click.prevent="this.add_visible_if()">Add conditional visibility</button>
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
                                <input :id="identifier + '_enum_'+index" class="form-control col-auto" type="string" v-model="this.new_json_schema['properties'][identifier]['enum'][index]">
                                <button class="btn btn-danger col-auto" @click.prevent="this.new_json_schema['properties'][identifier]['enum'].splice(index, 1)">Remove<i class="fa-solid fa-trash ml-2"></i></button>
                            </div>
                        </template>
                        <button class="btn btn-primary" @click.prevent="this.add_new_allowed()">Add new allowed value</button>
                    </template>
                    <template v-else>
                        <button class="btn btn-primary" @click.prevent="this.show_allowed_values = true">Show allowed values</button>
                    </template>
                </div>
            </template>
        </div>`
}

const vVisibleIfConditionEditForm = {
    name: 'v-visible-if-condition-edit-form',
    props: ['field_identifier', 'condition_key'],
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
                <h4>{{this.propertyReferenceIfLabel}} </h4>
                is any of
                <template v-if="this.showAllOptions && this.propertyReferenceIsEnumIf">
                    <template v-for="option in this.propertyReferenceIf.enum">
                        <h4>
                            <template v-if="this.enumIf.includes(option)">
                                <button class="btn btn-success" @click.prevent="this.enumIf.splice(this.enumIf.indexOf(option), 1)">{{option}}</button>
                            </template>
                            <template v-else>
                                <button class="btn btn-secondary" @click.prevent="this.enumIf.push(option)">{{option}}</button>
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
                                            <select class="form-select" v-model="this.enumIf[index_enum]">
                                                <template v-for="option in this.propertyReferenceIf.enum">
                                                    <option :value="option">{{option}}</option>
                                                </template>
                                            </select>
                                        </template>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-outline-danger" @click.prevent="this.enumIf.splice(index_enum, 1)"><i class="fa-solid fa-trash ml-2"></i></button>
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-else>
                        <template v-for="(enumValue, index_enum) in this.enumIf">
                            <div class="input-group mb-3">
                                <input class="form-control col-auto" type="string" v-model="this.enumIf[index_enum]">
                                <button class="btn btn-outline-danger col-auto" @click.prevent="this.enumIf.splice(index_enum, 1)"><i class="fa-solid fa-trash ml-2"></i></button>
                            </div>
                        </template>
                    </template>
                </template>
                <template v-if="this.showAllOptions">
                    <a href="#" @click.prevent="this.showAllOptions = !this.showAllOptions">Show only selected options</a>
                </template>
                <template v-else>
                    <button class="btn btn-outline-primary" @click.prevent="this.enumIf.push('')"><i class="fa-solid fa-plus"></i></button>
                    <template v-if="this.propertyReferenceIsEnumIf">
                        <a class="ml-2" href="#" @click.prevent="this.showAllOptions = !this.showAllOptions">Show all options</a>
                    </template>
                </template>
            </div>`
}

const app = Vue.createApp(vProjectCreationForm)
app.component('v-visible-if-condition-edit-form', vVisibleIfConditionEditForm)
app.component('v-form-field', vFormField)
app.component('v-create-form', vCreateForm)
app.component('v-update-form-field', vUpdateFormField)
app.component('v-conditional-edit-form', vConditionalEditForm)
app.mount('#v_project_creation')