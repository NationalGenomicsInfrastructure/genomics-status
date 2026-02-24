// Import Ajv from the CDN
import Ajv from 'https://cdn.jsdelivr.net/npm/ajv@8.17.1/+esm';

const vProjectCreationMain = {
    data() {
        return {
            errorMessages: [],
            /* Maybe some of these attributes are more suitable in the vProjectCreationForm component 
            but it would be quite a lot of work to move it.*/
            conditionalLogic: [],
            fetched_data: {},
            formData: {},
            forms: [],
            jsonForm: {},
            lastSavedDraftTime: null,
            // These fields are mandatory by the genomics template https://github.com/ScilifelabDataCentre/scilifelab-metadata-templates 
            mandatory_udfs_ena: ['Library construction method', 'Library source', 'Library selection', 'Library strategy'],
            // These fields have special code associated to them which can not be reproduced by editing the form
            special_fields: ['project_name', 'user_account', 'researcher_name'],
            newJsonForm: {},
            showDebug: false,
            toplevelEditMode: false,
            validationErrors: [],
            validationErrorsPerField: {},
            // Validation of new form
            validationMissingMandatoryLimsUdfs: {},
            validationMissingMandatorySpecialFields: {},
            validationNewFormAjvErrors: ''
        }
    },
    computed: {
        fields() {
            if (this.jsonSchema === undefined) {
                return []
            }
            return this.getValue(this.jsonSchema, 'properties');
        },
        jsonSchema() {
            return this.$root.getValue(this.$root.jsonForm, 'json_schema');
        },
        newFormErrors() {
            const hasLimsUdfErrors = Object.keys(this.$root.validationMissingMandatoryLimsUdfs || {}).length > 0;
            const hasSpecialFieldErrors = Object.keys(this.$root.validationMissingMandatorySpecialFields || {}).length > 0;
            const hasAjvErrors = !!this.$root.validationNewFormAjvErrors;

            return hasLimsUdfErrors || hasSpecialFieldErrors || hasAjvErrors;
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
        fetch_list_of_forms() {
            let url = '/api/v1/project_creation_forms'
            axios
                .get(url)
                .then(response => {
                    this.$root.forms = response.data.forms
                })
                .catch(error => {
                    this.$root.errorMessages.push('Error fetching list of forms. Please try again or contact a system adminstrator.');
                    console.log(error)
                })
        },
        fetch_form(version) {
            let url = '/api/v1/project_creation_form'
            if (version !== undefined) {
                url = url + '?version=' + version
            }
            if (this.$root.toplevelEditMode) {
                url = url + '&edit_mode=true'
            }
            axios
                .get(url)
                .then(response => {
                    this.$root.jsonForm = response.data.form
                    if (this.$root.toplevelEditMode) {
                        this.$root.newJsonForm = JSON.parse(JSON.stringify(this.$root.jsonForm));
                    }
                })
                .catch(error => {
                    if (this.$root.toplevelEditMode) {
                        // If in edit mode, show a specific error message
                        this.$root.errorMessages.push('Error fetching form. This form might not be suitable for editing: ' + error.message);
                    } else {
                        this.$root.errorMessages.push('Error fetching form. Please try again or contact a system adminstrator.');
                    }
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
        /* Save draft methods */
        cancelDraft() {
            if (this.newJsonForm.status !== 'draft') {
                this.$root.errorMessages.push('Can only cancel draft when the form is in draft status.');
                return;
            }
            this.newJsonForm.status = 'retired';
            this.$root.saveNewForm();
            // Redirect to form list using regular javascript
            window.location.href = '/project_creation_forms';
        },
        saveDraft(background = false) {
            // Save the current newJsonForm as a draft by using the generic save endpoint
            // First make sure that the newJsonForm is a draft or valid
            if (this.newJsonForm.status !== 'draft' && this.newJsonForm.status !== 'valid') {
                this.$root.errorMessages.push('Can only save draft when the form is in draft or valid status.');
                return;
            }
            this.saveNewForm(background);
        },
        publishForm() {
            if (this.newJsonForm.status !== 'draft') {
                this.$root.errorMessages.push('Can only publish draft forms. Please save your changes before publishing.');
                return;
            }
            this.newJsonForm.status = 'valid';
            this.$root.saveNewForm();
            window.location.href = '/project_creation_forms';
        },
        saveNewForm(background = false) {
            // Save the current newJsonForm using the generic save endpoint
            axios
                .post('/api/v1/project_creation_form', {
                    form: this.newJsonForm,
                })
                .then(response => {
                    if (!background) {
                        alert('Draft saved successfully.');
                    }
                    this.lastSavedDraftTime = Date.now();
                    this.fetch_form(response.data.form._id);
                    return true
                })
                .catch(error => {
                    this.$root.errorMessages.push('Error saving draft. Please try again or contact a system adminstrator.');
                    console.log(error)
                    return false
                })
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
                if (options !== null && options.length === 0) {
                    this.$root.errorMessages.push(`No options available for field ${field} based on conditional logic. There is likely a contradition in the form or in the input data.`);
                }
            });
        },

        updateOptions() {
            this.conditionalLogic = [];
            if (this.jsonSchema.allOf === undefined) {
                return
            }
            this.jsonSchema.allOf.forEach(rule => {
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

            const validate = ajv.compile(this.jsonSchema);
            const valid = validate(this.formData);
            // Reset the validation errors
            this.validationErrors = [];
            this.validationErrorsPerField = {};

            if (!valid) {
                // Loop over the errors
                validate.errors.forEach(error => {
                    // Check if the instance path is a field
                    if (error.instancePath !== '') {
                        const field = error.instancePath.substring(1); // Remove the leading '/'
                        this.validationErrorsPerField[field] = this.validationErrorsPerField[field] || [];
                        this.validationErrorsPerField[field].push(error);
                    } else {
                        this.validationErrors.push(error.message);
                    }
                });
                return false;
            }
            return true;
        },
        validateNew() {
            console.log("Validating new JSON schema");
            const newJsonSchema = this.$root.getValue(this.$root.newJsonForm, 'json_schema')
            // If undefined no validation needed
            if (!newJsonSchema) {
                return;
            }
            // Reset validation results
            this.$root.validationMissingMandatoryLimsUdfs = {}
            this.$root.validationMissingMandatorySpecialFields = {}
            this.$root.validationNewFormAjvErrors = ''

            const ajv = new Ajv({strictSchema: false, allErrors: true});

            try {
                const validate = ajv.compile(newJsonSchema);
            } catch (error) {
                this.$root.validationNewFormAjvErrors = error.message
            }

            // Check that all mandatory fields are present in the jsonSchema properties
            this.special_fields.forEach(field => {
                if (!newJsonSchema.properties[field]) {
                    this.$root.validationMissingMandatorySpecialFields[field] = true;
                }
            });

            // Check that all mandatory fields are present in the jsonSchema properties
            const lims_udfs_in_form = Object.values(newJsonSchema.properties).map(field => field.ngi_form_lims_udf);
            this.mandatory_udfs_ena.forEach(mandatory_udf => {
                if (!lims_udfs_in_form.includes(mandatory_udf)) {
                    this.$root.validationMissingMandatoryLimsUdfs[mandatory_udf] = true;
                }
            });
        }
    },
    watch: {
        formData: {
            deep: true,
            handler: 'updateOptionsAndValidate'
        },
        newJsonForm: {
            deep: true,
            handler: 'validateNew'
        }
    }
}


const vProjectCreationForm = {
    name: 'v-project-creation-form',
    props: ['form_loaded', 'init_edit_mode', 'version_id'],
    data() {
        return {
            showDebug: false,
            isTryingOutForm: false,
        }
    },
    computed: {
        description() {
            return this.$root.getValue(this.$root.jsonForm, 'description');
        },
        instruction() {
            return this.$root.getValue(this.$root.jsonForm, 'instruction');
        },
        jsonForm() {
            return this.$root.jsonForm;
        },
        newJsonSchema() {
            return this.$root.getValue(this.$root.newJsonForm, 'json_schema');
        },
        fieldsPerGroup() {
            // group fields by their group identifier
            if (this.$root.jsonSchema === undefined) {
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
        formGroups() {
            if (this.$root.jsonForm === undefined) {
                return []
            }
            return this.$root.getValue(this.$root.jsonForm, 'form_groups');
        },
        sortedFormGroups() {
            // Sort groups by position for a consistent display order
            if (this.formGroups) {
                return Object.entries(this.formGroups).sort(([, a], [, b]) => a.position - b.position);
            }
            return [];
        },
        title() {
            return this.$root.getValue(this.$root.jsonForm, 'title');
        }
    },
    methods: {
        fields_for_given_group(group_identifier) {
            // Get the fields for a specific group
            if (this.fieldsPerGroup[group_identifier] === undefined) {
                return {}
            }
            return this.fieldsPerGroup[group_identifier];
        },
        submitForm() {
            const form_data = this.$root.formData;
            const form_metadata = {};
            form_metadata['title'] = this.$root.jsonForm['title'];
            form_metadata['version'] = this.$root.jsonForm['version'];
            const matchingResearcher = this.$root.fetched_data['researcher_name'].find(
                researcher => researcher.researcher_name === form_data['researcher_name'].trim()
            );
            form_data['researcher_id'] = matchingResearcher ? matchingResearcher.id : '';
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
                    this.$root.errorMessages.push('Error submitting form. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },

    },
    mounted() {
        if (!this.form_loaded) {
            this.$root.fetch_form(this.version_id);
        }
        if (this.init_edit_mode.toLowerCase() === 'true') {
            this.$root.toplevelEditMode = true;
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row mt-5">
                <template v-if="this.$root.errorMessages.length > 0">
                    <div class="alert alert-danger" role="alert">
                        <h3 v-for="error in this.$root.errorMessages">{{ error }}</h3>
                    </div>
                </template>
                <template v-if="this.jsonForm === {}">
                    <div class="alert alert-info" role="alert">
                        <h3>Loading...</h3>
                    </div>
                </template>
                <template v-else>
                    <div class="row">
                        <div class="col-auto">
                            <template v-if='this.$root.toplevelEditMode'>
                                <h1> Modifying project creation form</h1>
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



                    <template v-if="this.$root.toplevelEditMode && !this.isTryingOutForm">
                        <button class="btn btn-lg btn-primary col-auto ml-2" @click="this.isTryingOutForm = true">Preview form</button>
                    </template>
                    <template v-else>

                        <template v-if="this.$root.toplevelEditMode">
                            <button class="btn btn-lg btn-primary col-auto ml-2" @click="this.isTryingOutForm = false">Close form</button>
                            <h2 class="mt-2">{{ title }}</h2>
                        </template>
                        <p>{{ description }}</p>
                        <p>{{ instruction }}</p>

                        <form @submit.prevent="submitForm" class="mt-3 mb-5">
                            <template v-for="[group_identifier, form_group] in sortedFormGroups" :key="group_identifier">
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
                            <button type="submit" class="btn btn-lg btn-success mt-3" :disabled="this.$root.toplevelEditMode">Create Project in LIMS</button>
                        </form>
                    </template>
                    <template v-if="this.$root.toplevelEditMode">
                        <v-create-form></v-create-form>
                        <div class="card mt-4 mb-5">
                            <div class="card-body">
                                <h2 class="card-title">Changes </h2>
                                <div class="row">
                                    <button class="btn btn-lg btn-primary mt-4 ml-3 col-2" @click="this.$root.saveDraft">
                                        <i class="fa-solid fa-floppy-disk mr-1"></i> Save draft
                                    </button>
                                    <button class="btn btn-lg btn-success mt-4 ml-2 col-2" @click="this.$root.publishForm" :disabled="this.$root.newFormErrors">
                                        <i class="fa-solid fa-circle-check mr-1"></i> Publish form
                                    </button>
                                    <button class="btn btn-lg btn-danger mt-4 ml-2 col-2" @click="this.$root.cancelDraft">
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
            showConditionals: false,
            showSuggestions: false,
            suggestions: [],
            suggestionsLoading: false,
            userAccounts: {}
        };
    },
    computed: {
        conditionalsApplied() {
            return this.$root.getConditionalsFor(this.identifier)
        },
        description() {
            return this.field.description;
        },
        fieldEnum() {
            // Check if enum is defined on field
            if (this.field.enum == undefined) {
                return []
            }
            return this.field.enum;
        },
        formType() {
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
            return this.fieldEnum;
        },
        currentValue() {
            return this.$root.formData[this.identifier];
        },
        type() {
            return this.field.type;
        },
        /* Error handling */
        anyError() {
            return this.unallowedOption || this.validationErrors.length > 0;
        },
        unallowedOption() {
            // Highlight if the selected value is not allowed (based on conditional logic)
            if (this.currentValue === undefined) {
                return false;
            }

            // Check if options is empty object
            if (this.options === null || Object.keys(this.options).length === 0) {
                return false;
            }
            return !(this.options.includes(this.currentValue));
        },
        validationErrors() {
            // Check if there are validation errors for this field
            return this.$root.validationErrorsPerField[this.identifier] || [];
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
        onCustomDatalistChange() {
            /* Special hardcoded behaviour for user_account */
            if(this.identifier === 'user_account'){
                const val = this.$root.formData[this.identifier];
                if(val === ''){
                    this.$root.formData["project_name"] = '';
                    return;
                }
                const current_year = new Date().getFullYear().toString().slice(-2);
                // Match against first element of each suggestion tuple
                const is_in_suggestions = this.suggestions.some(s => s[0] === val);
                let ordinal = 1;
                if (is_in_suggestions){
                    this.fetch_data(this.identifier);
                    if (this.userAccounts[val]['year'] == current_year){
                        ordinal = parseInt(this.userAccounts[val]['latest_ordinal']) + 1;
                    }
                }
                this.$root.formData["project_name"] = `${val}_${current_year}_${String(ordinal).padStart(2, '0')}`;
            }
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
                            this.$root.fetched_data[display_in_field] = result;
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
                        this.$root.errorMessages.push('Error submitting form. Please try again or contact a system administrator.');
                    }
                })
        }
    },
    mounted() {
        // Initialize the form data for this field
        if (this.formType === 'boolean') {
            this.$root.formData[this.identifier] = false;
        } else if (this.formType === 'integer') {
            this.$root.formData[this.identifier] = 0;
        }
         else {
            this.$root.formData[this.identifier] = '';
        }

        if (this.formType === 'custom_datalist') {
            if(this.identifier!=='researcher_name'){
                let url = `/api/v1/project_count_details?detail_key=${this.identifier}`;
                    this.inputChangeTimeout = setTimeout(() => {
                        axios
                            .get(url,)
                            .then(response => {
                                if(this.identifier === 'user_account'){
                                    this.suggestions = Object.entries(response.data).map(([key, value]) =>
                                        [key, `${value.year}_${value.latest_ordinal}`]);
                                    this.userAccounts = response.data
                                }
                                else{
                                    this.suggestions = Object.entries(
                                        response.data
                                    ).sort((a, b) => b[1] - a[1])
                                }
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
        }
    },
    watch: {
        '$root.fetched_data.researcher_name': {
            deep: true,
            handler(newVal) {
                // Whenever formData changes, we can perform actions if needed
                // For now, we don't need to do anything here
                if(this.identifier === 'researcher_name'){
                    this.suggestions = newVal.map((item) =>
                        [item.researcher_name, '']
                    );
                    this.showSuggestions = true;
                }
            }
        }
    },
    template:
        /*html*/`
        <template v-if="this.visible">
            <div class="mb-3">
                <div class="row">
                    <label :for="identifier" class="form-label col-auto">{{ label }}</label>
                    <template v-if="anyError">
                        <div v-if="validationErrors.length > 0" class="col-auto text-danger ml-auto">
                            <strong>Validation errors for value '{{currentValue}}': </strong>
                            <span v-for="error in validationErrors" :key="error.message">{{ error.message }}</span>
                        </div>
                    </template>
                </div>
                <template v-if="this.formType === 'select'">
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

                <template v-if="this.formType === 'datalist'">
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
                <template v-if="this.formType === 'custom_datalist'">
                    <div class="datalist">
                        <input
                            class="form-control"
                            :aria-label="description"
                            v-model="this.$root.formData[identifier]"
                            :list="identifier+'_list'"
                            placeholder="Type to search..."
                            @change="onCustomDatalistChange"
                        />
                        <datalist :id="identifier+'_list'">
                            <option
                                v-for="(option, index) in suggestions"
                                :key="index"
                                :value="option[0]"
                            >
                                {{option[0]}} {{ option[1] ? ' (' + option[1] + ')' : '' }}
                            </option>
                        </datalist>
                    </div>
                </template>
                <template v-if="this.formType === 'string'">
                    <input class="form-control" :type="text" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
                </template>
                <template v-if="this.formType === 'date'">
                    <input class="form-control" type="date" :name="identifier" :id="identifier" v-model="this.$root.formData[identifier]">
                </template>
                <template v-if="this.formType === 'integer'">
                    <input class="form-control" :type="number" :name="identifier" :id="identifier" :placeholder="0" v-model.number="this.$root.formData[identifier]">
                </template>

                <template v-if="this.formType === 'boolean'">
                    <div class="form-check form-switch">
                        <label :for="identifier" class="form-check-label">{{ label }}</label>
                        <input class="form-check-input" type="checkbox" :name="identifier" :id="identifier" :placeholder="description" v-model="this.$root.formData[identifier]">
                    </div>
                </template>

                <p class="fst-italic">{{ field.description }}</p>
                <template v-if="this.conditionalsApplied.length > 0">
                    <a href="#" @click.prevent="showConditionals = !showConditionals">Conditional logic applied:</a>
                    <template v-if="showConditionals">
                        <ul v-for="condition in this.conditionalsApplied">
                            <li>
                                <h5>{{condition.description}}:</h5>
                                <template v-for="property_value, property_name, index in condition.condition.properties">
                                    <div v-if="index > 0">
                                        <strong>and</strong>
                                    </div>
                                    <div>
                                        {{property_name}} is any of
                                        <ul v-for="enum_value in property_value.enum">
                                            <li>{{enum_value}}</li>
                                        </ul>
                                    </div>
                                </template>
                                <strong>then</strong>
                                <div>
                                    Allowed values are
                                    <ul v-for="option in condition.options">
                                        <li>{{option}}</li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </template>
                </template>
            </div>
        </template>`
}

const vCreateFormList = {
    // The landing page for overview of all project creation forms
    name: 'v-create-form-list',
    computed: {

        draftForm() {
            // Return the single draft form or None
            let draft_form = this.$root.forms.find(form => form.value.status === 'draft');
            return draft_form ? draft_form : null;
        },
        formIsEditable() {
            // Returns true if the form is a draft,
            // Also returns true if the form is valid and there is no other draft version
            return (form) => {
                if (form.value.status === 'draft') {
                    return true;
                }
                const otherDrafts = this.$root.forms.filter(f => f.value.status === 'draft' && f.id !== form.id);
                return form.value.status === 'valid' && otherDrafts.length === 0;
            };
        },
        sortedForms() {
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
        },
        validForm() {
            // Return the single valid form
            let valid_form = this.$root.forms.find(form => form.value.status === 'valid');
            return valid_form ? valid_form : null;
        }
    },
    methods: {
        dateFormatter(dateString) {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    },
    mounted() {
        this.$root.fetch_list_of_forms()
    },
    template:
    /*html*/`
        <div class="container pb-5">
            <h1>Project creation forms</h1>
            <div class="row mb-5">
                <div class="col-6" v-if="validForm">
                    <div class="card">
                        <div class="card-body">
                            <h4 class="card-title">Valid Form: </h4>
                            <h5 class="card-subtitle mb-2 text-muted">{{ validForm.value.title }}:</h5>
                            <p class="card-text">Created {{ dateFormatter(validForm.value.created) }} by {{ validForm.value.owner.email }}</p>
                            <a class="btn btn-primary" v-if="this.formIsEditable(validForm)" :href="'/project_creation?edit_mode=true&version_id=' + validForm.id">Edit</a>
                        </div>
                    </div>
                </div>
                <div class="col-6" v-if="draftForm">
                    <div class="card">
                        <div class="card-body">
                            <h4 class="card-title">Draft Form: </h4>
                            <h5 class="card-subtitle mb-2 text-muted">{{ draftForm.value.title }}:</h5>
                            <p class="card-text">Created {{ dateFormatter(draftForm.value.created) }} by {{ draftForm.value.owner.email }}</p>
                            <a class="btn btn-primary" v-if="this.formIsEditable(draftForm)" :href="'/project_creation?edit_mode=true&version_id=' + draftForm.id">Edit</a>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3>All Forms</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Owner Email</th>
                            <th>Title</th>
                            <th>ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="form in this.sortedForms" :key="form.id">
                            <td>{{ form.value.status }}</td>
                            <td>{{ dateFormatter(form.value.created) }}</td>
                            <td>{{ form.value.owner.email }}</td>
                            <td>{{ form.value.title }}</td>
                            <td>{{ form.id }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        `
}


const vCreateForm = {
    name: 'v-create-form',
    data() {
        return {
            currentTime: new Date(),
            displayConditionalLogic: false,
            displayFields: false,
            displayMetadata: false,
            editModeDescription: false,
            editModeTitle: false,
            editModeInstruction: false,
            newCompositeConditionalIf: [],
            newCompositeConditionalThen: [],
            newConditionalIf: '',
            newConditionalThen: '',
            newField: '',
            showDebug: false,
            showHelp: false
        }
    },
    computed: {
        allOf() {
            return this.$root.getValue(this.newForm, 'allOf');
        },
        dateFormatAgo() {
            // Format the date to show how long ago it was
            const diffInSeconds = Math.floor((this.currentTime - new Date(this.$root.lastSavedDraftTime)) / 1000);
            // Current time is set when the component is mounted, while lastSavedDraftTime is updated on save
            // So negative time is very likely
            if (diffInSeconds < 0) {
                return 'very recently';
            }
            if (diffInSeconds < 60) {
                return `${diffInSeconds} seconds ago`;
            }
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} minutes ago`;
            }
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} hours ago`;
            }
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} days ago`;
        },
        fields() {
            return this.$root.getValue(this.newForm, 'properties');
        },
        newForm() {
            return this.$root.getValue(this.$root.newJsonForm, 'json_schema');
        },
        // Metadata fields
        formGroups() {
            return this.$root.getValue(this.$root.newJsonForm, 'form_groups');
        },
        canAddNewCondition() {
            // Check if both if and then fields are selected and exist in the schema
            if (this.newConditionalIf === '' || this.newConditionalThen === '') {
                return false;
            }
            const ifField = this.$root.getValue(this.newForm.properties, this.newConditionalIf);
            const thenField = this.$root.getValue(this.newForm.properties, this.newConditionalThen);
            return ifField !== undefined && thenField !== undefined;
        },
        canAddExtraConditionIf() {
            // Returns an object mapping conditional_index to whether extra condition can be added
            const result = {};
            this.newCompositeConditionalIf.forEach((fieldKey, index) => {
                if (fieldKey === '') {
                    result[index] = false;
                } else {
                    const field = this.$root.getValue(this.newForm.properties, fieldKey);
                    result[index] = field !== undefined;
                }
            });
            return result;
        },
        canAddExtraConditionThen() {
            // Returns an object mapping conditional_index to whether extra condition can be added
            const result = {};
            this.newCompositeConditionalThen.forEach((fieldKey, index) => {
                if (fieldKey === '') {
                    result[index] = false;
                } else {
                    const field = this.$root.getValue(this.newForm.properties, fieldKey);
                    result[index] = field !== undefined;
                }
            });
            return result;
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
            if (conditional.if.properties[this.newCompositeConditionalIf[conditional_index]] === undefined) {
                conditional.if.properties[this.newCompositeConditionalIf[conditional_index]] = { enum: [] };
                return
            } else {
                // do nothing
                return
            }
        },
        addExtraConditionThen(conditional_index) {
            // Add a new condition to the existing conditional logic
            const conditional = this.allOf[conditional_index];
            if (conditional.then.properties[this.newCompositeConditionalThen[conditional_index]] === undefined) {
                conditional.then.properties[this.newCompositeConditionalThen[conditional_index]] = { enum: [] };
                return
            } else {
                // do nothing
                return
            }
        },
        addNewField() {
            // Add a new field to the form
            if (this.newField === '') {
                alert('Please provide a field identifier');
                return;
            }
            if (this.fields[this.newField] !== undefined) {
                alert('Field with this identifier already exists');
                return;
            }
            // Create a new field with default values
            const newField = {
                ngi_form_type: 'string',
                ngi_form_label: this.newField,
                description: 'New field',
                type: 'string'
            };
            // Add the new field to the JSON schema
            this.newForm.properties[this.newField] = newField;
            // Reset the newField input
            this.newField = '';
            // Update the form data to include the new field
            this.$root.formData[this.newField] = '';
        },
        addPropertyToCondition(conditional) {
            // Add a new property to the conditional logic
            const newProperty = {
                description: 'New property',
                if: {
                    properties: {
                        [this.newConditionalIf]: {
                            enum: []
                        }
                    }
                },
                then: {
                    properties: {
                        [this.newConditionalThen]: {
                            enum: []
                        }
                    }
                }
            };
            this.allOf.push(newProperty);
        },
    },
    mounted() {
        setInterval(() => {
            this.currentTime = new Date();
        }, 5000);
    },
    watch: {
        // Auto save when sections are closed and when field edit modes are exited
        displayConditionalLogic(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        },
        displayFields(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        },
        displayMetadata(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        },
        editModeDescription(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        },
        editModeInstruction(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        },
        editModeTitle(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        }
    },
    template: 
        /*html*/`
        <div class="container pb-5">
            <div class="row mt-5">
                <div class="row mt-3 mb-3">
                    <div class="col-auto">
                        <h1>Update Form:
                            <button class="btn btn-light ml-2" @click="showHelp = !showHelp"><i class="fa fa-question"></i></button>
                        </h1>
                        <template v-if="this.$root.lastSavedDraftTime">
                            <small>Last saved draft: {{ this.dateFormatAgo }}</small>
                        </template>
                        <div v-if="showHelp" class="alert alert-info">
                            <h2>Modifying a Project Creation Form</h2>

                                <p>This guide explains how to modify a project creation form. The modification interface is divided into several sections: <strong>Form Metadata</strong>, <strong>Fields</strong>, and <strong>Conditional Logic</strong>.</p>

                                <h3>Edit Mode</h3>
                                <p>Each section and field has its own edit button (a pencil icon <i class="fa-solid fa-pen-to-square"></i>). Clicking this button enables editing only for that specific item. Click the checkmark icon (<i class="fa-solid fa-check"></i>) to leave edit mode for that item.</p>

                                <h3>Automatic Saving</h3>
                                <p><strong>Your changes are automatically saved as a draft</strong> when you:</p>
                                <ul>
                                    <li>Collapse any of the main sections (Form Metadata, Fields, or Conditional Logic)</li>
                                    <li>Exit edit mode for any field or metadata property (clicking the checkmark icon)</li>
                                </ul>
                                <p>The "Last saved draft" timestamp at the top of the page shows when the last auto-save occurred. You can also manually save at any time using the "Save draft" button at the bottom of the page.</p>

                                <h3>Form Metadata</h3>
                                <p>This section allows you to edit the general information about the form.</p>
                                <ul>
                                    <li><strong>Title, Description, and Instruction</strong>: These are text fields that describe the form's purpose and provide guidance to the user. You can edit them by enabling their respective edit modes.</li>
                                    <li><strong>Form Groups</strong>: Fields in the form are organized into groups. In this section, you can:
                                        <ul>
                                            <li><strong>Add a New Group</strong>: Provide a unique identifier and a display name.</li>
                                            <li><strong>Edit a Group</strong>: Change the display name of an existing group.</li>
                                            <li><strong>Reorder Groups</strong>: Use the "Move Up" and "Move Down" buttons to change the order in which groups appear on the form.</li>
                                            <li><strong>Remove a Group</strong>: Delete a group. Note that fields within that group will become "unassigned" but will not be deleted.</li>
                                        </ul>
                                    </li>
                                </ul>

                                <h3>Fields</h3>
                                <p>This section lists all the fields that make up the form. You can expand it to view and edit each field's properties.</p>
                                <p>For each field, you can modify:</p>
                                <ul>
                                    <li><strong>Identifier</strong>: The unique ID for the field.</li>
                                    <li><strong>Group</strong>: Which form group the field belongs to.</li>
                                    <li><strong>Description</strong>: Help text that appears below the field.</li>
                                    <li><strong>Type</strong>: The type of input, only a subset of json schema types are allowed: <code>String</code>, <code>Number</code> and <code>Boolean</code></li>
                                    <li><strong>Form Type</strong>: How the field should be displayed in the form, such as <code>String</code>, <code>Boolean</code> (checkbox), <code>Select</code> (dropdown), or <code>Datalist</code>. See section about Form Type below for a longer explanation.</li>
                                    <li><strong>Label</strong>: The display name for the field shown to the user.</li>
                                    <li><strong>LIMS UDF</strong>: The name of the UDF in LIMS where the data will be stored.</li>
                                    <li><strong>Allowed Values</strong>: For <code>Select</code> and <code>Datalist</code> types, you can define the list of options available to the user.</li>
                                    <li><strong>Visibility</strong>: You can add rules to show or hide a field based on the values of other fields.</li>
                                </ul>
                                <div class="ml-3">
                                    <h5>Form Type</h5>
                                    <p>Each field can be of different form types, which determine how the field is displayed in the form. The available form types are:</p>
                                    <ul>
                                        <li><strong>String</strong>: A text input.</li>
                                        <li><strong>Number</strong>: A numeric input field.</li>
                                        <li><strong>Boolean</strong>: A checkbox input.</li>
                                        <li><strong>Date</strong>: A date picker input field.</li>
                                        <li><strong>Select</strong>: A dropdown list or predefined options. Only predefined options are allowed.</li>
                                        <li><strong>Datalist</strong>: Text input, automatically filtering a list of predefined options. As with select, only predefined options are allowed.</li>
                                        <li><strong>Custom Datalist</strong>: Text input, automatically filtering a list of options. The options are dynamically fetched from the database, based on the recent years projects.
                                        The values are cached for 24 hours, so they are not always completely up to date. Only fields that are output from the couchdb view details_count can be used with this form type.
                                        </li>
                                    </ul>
                                </div>

                                <h3>Conditional Logic</h3>
                                <p>This section defines the dynamic behavior of the form. It consists of a set of rules in an "if-then" format.</p>
                                <ul>
                                    <li><strong>If</strong>: A condition based on the value of one or more fields.</li>
                                    <li><strong>Then</strong>: The consequence if the condition is met, which is usually to restrict the available options for another field.</li>
                                </ul>
                                <p>You can:</p>
                                <ul>
                                    <li><strong>Add a new condition</strong>: Define a new "if-then" rule from scratch.</li>
                                    <li><strong>Modify an existing condition</strong>: Change the fields or values in the "if" or "then" part.</li>
                                    <li><strong>Add more complexity</strong>: A single "if" or "then" can depend on multiple fields.</li>
                                    <li><strong>Remove a condition</strong>: Delete an entire rule.</li>
                                </ul>
                                <p>When creating a conditional, note the "show all options" option that will give you a better overview of which options are available for each field.</p>

                                <h3>Managing Your Changes</h3>
                                <p>At the bottom of the page, you will find buttons to manage your form:</p>
                                <ul>
                                    <li><strong>Save draft</strong>: Manually saves your current changes as a draft. While changes are automatically saved when you collapse sections or exit edit mode, you can use this button to save immediately and receive a confirmation message.</li>
                                    <li><strong>Publish form</strong>: Makes your saved draft the new "valid" version of the form, replacing the previous one. This makes your changes live for all users. You can only publish a form that has been saved as a draft.</li>
                                    <li><strong>Cancel draft</strong>: Permanently discards your draft and marks it as retired. This action cannot be undone. The previously valid form will remain active.</li>
                                </ul>
                                <p><strong>Note:</strong> Changes are not automatically published. You must explicitly click "Publish form" to make your draft the active form.</p>
                            </div>
                        </div>
                        <div v-if="this.$root.newFormErrors" class="alert alert-danger" role="alert">
                                <h3>Form Validation Errors</h3>
                                The edited form has some issues. These will have to be fixed before the draft can be published.
                                <template v-if="Object.keys(this.$root.validationMissingMandatoryLimsUdfs).length > 0">
                                    <h4>Mandatory LIMS udfs</h4>
                                    The following mandatory LIMS udfs are currently not assigned to any field:
                                    <ul v-for="(value, udf) in this.$root.validationMissingMandatoryLimsUdfs" :key="udf">
                                        <li>{{ udf }}</li>
                                    </ul>
                                </template>
                                <template v-if="Object.keys(this.$root.validationMissingMandatorySpecialFields).length > 0">
                                    <h4>Mandatory special fields</h4>
                                    The following mandatory special fields are currently missing:
                                    {{this.$root.validationMissingMandatorySpecialFields}}
                                </template>
                                <template v-if="this.$root.validationNewFormAjvErrors">
                                    {{this.$root.validationNewFormAjvErrors}}
                                </template>
                        </div>
                    </div>
                    <div class="col-auto ml-auto">

                        <button class="btn btn-sm btn-secondary ml-2" @click="showDebug = !showDebug">
                            <i class="fa fa-bug mr-2"></i>Toggle Debug Info
                        </button>
                    </div>
                </div>
                <template v-if="showDebug" class="card">
                    <pre>{{ this.$root.newJsonForm }}</pre>
                </template>
                <div class="pb-3 border-bottom">
                    <h2 class="mt-3" style="cursor: pointer;" @click="displayMetadata = !displayMetadata">
                        <i :class="displayMetadata ? 'fa-solid fa-caret-down' : 'fa-solid fa-caret-right'"></i>
                        Form Metadata
                    </h2>
                    <template v-if="this.displayMetadata">
                        <div class="ml-3">
                            <div>
                                <h5 class="mb-1">Title
                                    <button @click="editModeTitle = !editModeTitle" class="btn btn-lg ml-1">
                                        <template v-if="!editModeTitle">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </template>
                                        <template v-else>
                                            <i class="fa-solid fa-check"></i>
                                        </template>
                                    </button>
                                </h5>
                                <input :id="title" class="form-control" type="string" v-model="this.$root.newJsonForm['title']" :disabled="!editModeTitle">
                            </div>
                            <div>
                                <h5 class="mb-1">Description
                                    <button @click="editModeDescription = !editModeDescription" class="btn btn-lg ml-1">
                                        <template v-if="!editModeDescription">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </template>
                                        <template v-else>
                                            <i class="fa-solid fa-check"></i>
                                        </template>
                                    </button>
                                </h5>
                                <input :id="description" class="form-control" type="string" v-model="this.$root.newJsonForm['description']" :disabled="!editModeDescription">
                            </div>
                            <div>
                                <h5 class="mb-1">Instruction
                                    <button @click="editModeInstruction = !editModeInstruction" class="btn btn-lg ml-1">
                                        <template v-if="!editModeInstruction">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </template>
                                        <template v-else>
                                            <i class="fa-solid fa-check"></i>
                                        </template>
                                    </button>
                                </h5>
                                <input :id="instruction" class="form-control" type="text" v-model="this.$root.newJsonForm['instruction']" :disabled="!editModeInstruction">
                            </div>
                            <v-form-groups-editor :formGroups="this.formGroups"></v-form-groups-editor>
                        </div>
                    </template>
                </div>
                <div class="pb-3 border-bottom">
                    <h2 class="mt-3" style="cursor: pointer;" @click="displayFields = !displayFields">
                        <i :class="displayFields ? 'fa-solid fa-caret-down' : 'fa-solid fa-caret-right'"></i>
                        Fields
                    </h2>
                    <template v-if="this.displayFields">
                    <div class="ml-3">
                        <template v-for="(field, identifier) in fields" :key="identifier">
                            <template v-if="field.ngi_form_type !== undefined">
                                <v-update-form-field :field="field" :identifier="identifier"></v-update-form-field>
                            </template>
                        </template>
                        <div class="mb-3">
                            <h3>Add new field</h3>
                            <div>
                                <input class="form-control" type="text" placeholder="Field identifier" v-model="this.newField">
                                <button class="btn btn-primary mt-2" @click.prevent="this.addNewField()">Add new field</button>
                            </div>
                        </div>
                    </template>
                </div>
                <div>
                    <h2 class="mt-3" style="cursor: pointer;" @click="displayConditionalLogic = !displayConditionalLogic">
                        <i :class="displayConditionalLogic ? 'fa-solid fa-caret-down' : 'fa-solid fa-caret-right'"></i>
                        Conditional logic
                    </h2>
                    <template v-if="this.displayConditionalLogic">
                        <div class="ml-3">
                            <template v-for="(conditional, conditional_index) in this.allOf">
                                <div class="border-bottom pb-5">
                                    <v-conditional-edit-form
                                        :conditional="conditional"
                                        :conditional_index="conditional_index"
                                        @remove-condition="removeCondition">
                                    </v-conditional-edit-form>
                                    <div class="row">
                                        <div class="col-5">
                                            <div class="input-group">
                                                <select class="form-select" v-model="this.newCompositeConditionalIf[conditional_index]">
                                                    <template v-for="identifier in Object.keys(this.$root.fields)">
                                                        <option :value="identifier">{{identifier}}</option>
                                                    </template>
                                                </select>
                                                <button class="btn btn-outline-primary" @click.prevent="this.addExtraConditionIf(conditional_index)" :disabled="!canAddExtraConditionIf[conditional_index]">Add extra condition</button>
                                            </div>
                                        </div>
                                        <div class="col-5 offset-2">
                                            <div class="input-group">
                                                <select class="form-select" v-model="this.newCompositeConditionalThen[conditional_index]">
                                                    <template v-for="identifier in Object.keys(this.$root.fields)">
                                                        <option :value="identifier">{{identifier}}</option>
                                                    </template>
                                                </select>
                                                <button class="btn btn-outline-primary" @click.prevent="this.addExtraConditionThen(conditional_index)" :disabled="!canAddExtraConditionThen[conditional_index]">Add extra condition</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                                <h3 class="mt-5 border-top pt-3">Add condition</h3>
                                <div class="row">
                                    <div class="col-5">
                                        <select class="form-select" v-model="this.newConditionalIf">
                                            <template v-for="identifier in Object.keys(this.$root.fields)">
                                                <option :value="identifier">{{identifier}}</option>
                                            </template>
                                        </select>
                                    </div>
                                    <div class="col-2 text-center">
                                        <h2><i class="fa-solid fa-arrow-right"></i></h2>
                                    </div>
                                    <div class="col-5">
                                        <select class="form-select" v-model="this.newConditionalThen">
                                            <template v-for="identifier in Object.keys(this.$root.fields)">
                                                <option :value="identifier">{{identifier}}</option>
                                            </template>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary mt-2" @click.prevent="this.addPropertyToCondition()" :disabled="!canAddNewCondition">Add new condition</button>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    `
}

const vFormGroupsEditor = {
    name: 'v-form-groups-editor',
    props: {
        formGroups: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            newGroupIdentifier: '',
            newGroupDisplayName: '',
            fieldEditMode: false
        }
    },
    computed: {
        sortedFormGroups() {
            // Sort groups by position for a consistent display order
            if (this.formGroups) {
                return Object.entries(this.formGroups).sort(([, a], [, b]) => a.position - b.position);
            }
            return [];
        },
        nextPosition() {
            const positions = Object.values(this.formGroups).map(g => g.position);
            return positions.length > 0 ? Math.max(...positions) + 1 : 0;
        }
    },
    watch: {
        fieldEditMode(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        }
    },
    methods: {
        addGroup() {
            const identifier = this.newGroupIdentifier.trim();
            if (identifier && !this.formGroups[identifier]) {
                this.formGroups[identifier] = {
                    display_name: this.newGroupDisplayName,
                    position: this.nextPosition
                };
                // Reset input fields
                this.newGroupIdentifier = '';
                this.newGroupDisplayName = '';
            } else {
                alert('Group identifier cannot be empty and must be unique.');
            }
        },
        moveDown(identifier) {
            const group = this.formGroups[identifier];
            if (group) {
                const currentPosition = group.position;
                const nextGroup = Object.entries(this.formGroups).find(([_, g]) => g.position === currentPosition + 1);
                if (nextGroup) {
                    // Swap positions
                    this.formGroups[identifier].position = currentPosition + 1;
                    this.formGroups[nextGroup[0]].position = currentPosition;
                }
            }
        },
        moveUp(identifier) {
            const group = this.formGroups[identifier];
            if (group) {
                const currentPosition = group.position;
                const previousGroup = Object.entries(this.formGroups).find(([_, g]) => g.position === currentPosition - 1);
                if (previousGroup) {
                    // Swap positions
                    this.formGroups[identifier].position = currentPosition - 1;
                    this.formGroups[previousGroup[0]].position = currentPosition;
                }
            }
        },
        removeGroup(identifier) {
            if (confirm(`Are you sure you want to delete the group "${identifier}"?`)) {
                delete this.formGroups[identifier];
            }
        }
    },
    template: /*html*/`
        <h2 class="mt-3">Form Groups
            <button @click="fieldEditMode = !fieldEditMode" class="btn btn-lg ml-1">
                <template v-if="!fieldEditMode">
                    <i class="fa-solid fa-pen-to-square"></i>
                </template>
                <template v-else>
                    <i class="fa-solid fa-check"></i>
                </template>
            </button>
        </h2>
        <div class="ml-3 pb-3 border-bottom">
            <div v-for="[identifier, group] in sortedFormGroups" :key="identifier" class="mb-3 p-3 border rounded">
                <h5>{{ identifier }}</h5>
                <div class="form-group">
                    <label>Display Name</label>
                    <input type="text" class="form-control" v-model="group.display_name" :disabled="!fieldEditMode">
                </div>
                <div class="form-group mt-2">
                    <label>Position</label>
                    <input type="number" class="form-control" v-model.number="group.position" disabled>
                </div>
                <button v-if="fieldEditMode" class="btn btn-danger btn-sm mt-2" @click="removeGroup(identifier)">
                    <i class="fa-solid fa-trash mr-1"></i> Remove Group
                </button>
                <div v-if="fieldEditMode" class="btn btn-secondary btn-sm mt-2 ml-2" @click="moveUp(identifier)">
                    <i class="fa-solid fa-arrow-up mr-1"></i> Move Up
                </div>
                <div v-if="fieldEditMode" class="btn btn-secondary btn-sm mt-2 ml-2" @click="moveDown(identifier)">
                    <i class="fa-solid fa-arrow-down mr-1"></i> Move Down
                </div>
            </div>

            <div v-if="fieldEditMode" class="mt-4">
                <h3>Add New Group</h3>
                <div class="form-group">
                    <label>Identifier</label>
                    <input type="text" class="form-control" v-model="newGroupIdentifier" placeholder="e.g., project_summary">
                </div>
                <div class="form-group mt-2">
                    <label>Display Name</label>
                    <input type="text" class="form-control" v-model="newGroupDisplayName" placeholder="e.g., Project Summary">
                </div>
                <button class="btn btn-primary mt-2" @click="addGroup">Add Group</button>
            </div>
        </div>
    `
};

const vConditionalEditForm = {
    name: 'v-conditional-edit-form',
    props: ['conditional', 'conditional_index'],
    emits: ['remove-condition'],
    data() {
        return {
            fieldEditMode: false
        }
    },
    computed: {
        description() {
            return this.conditional.description;
        },
        propertyKeyIf() {
            return Object.keys(this.conditional.if.properties);
        },
        propertyKeyThen() {
            return Object.keys(this.conditional.then.properties);
        }
    },
    watch: {
        fieldEditMode(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        }
    },
    template:
        /*html*/`
        <div class="pb-3">
            <div class="row">
                <div class="mb-3">
                    <h3 class="mt-5 col-auto">{{conditional_index + 1}}. {{this.conditional.description}}
                        <template v-if="fieldEditMode">
                            <button @click="fieldEditMode = !fieldEditMode" class="btn btn-lg ml-1"><i class="fa-solid fa-check"></i></button>
                        </template>
                        <template v-else>
                            <button @click="fieldEditMode = !fieldEditMode" class="btn btn-lg ml-1"><i class="fa-solid fa-pen-to-square"></i></button>
                        </template>
                    </h3>
                    <div class="col-auto ml-auto">
                        <button v-if="fieldEditMode" class="btn btn-outline-danger" @click.prevent="$emit('remove-condition', conditional_index)">
                            Remove Condition <i class="fa-solid fa-trash ml-2"></i>
                        </button>
                    </div>
                    <div v-if="fieldEditMode">
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
                             :edit_mode="fieldEditMode">
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
                            :edit_mode="fieldEditMode">
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
        containsReplicates() {
            return this.enumValues.length !== new Set(this.enumValues).size;
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
        },
        sortedPropertyReferenceEnum() {
            // Return sorted enum values for display when showing all options
            if (!this.propertyReferenceIsEnum) {
                return [];
            }
            return [...this.propertyReference.enum].sort();
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
        <div v-if="property_index !== 0">
            AND
        </div>
        <div :class="{'mt-3': conditional_index > 0}">
            <h4 v-if="condition_type === 'if'">
                If <span class="fw-bold">{{propertyReferenceLabel}}</span> is any of
            </h4>
            <h4 v-else>
                Then <span class="fw-bold">{{propertyReferenceLabel}}</span> has to be one of
            </h4>
        </div>

        <template v-if="showAllOptions && propertyReferenceIsEnum">
            <template v-for="option in sortedPropertyReferenceEnum">
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
            <div class="p-3" :class="{'alert-danger': this.containsReplicates}">
                <template v-if="this.containsReplicates">
                    <p>The values contain at least one duplicated value!</p>
                </template>
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
            </div>
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
    props: ['field', 'identifier'],
    data() {
        return {
            fieldEditMode: false,
            showAllowedValues: false,
            selectedVisibleIfKey: '',
            visibleIfErrorMessage: ''
        }
    },
    computed: {
        description() {
            return this.field.description;
        },
        formType() {
            return this.field.ngi_form_type;
        },
        label() {
            return this.field.ngi_form_label;
        },
        newJsonForm() {
            return this.$root.newJsonForm;
        },
        newJsonSchema() {
            return this.$root.getValue(this.$root.newJsonForm, 'json_schema');
        },
        nrOfAllowedValues() {
            // Check if enum is defined on field
            if (this.newJsonSchema['properties'][this.identifier]['enum'] === undefined) {
                return 0
            }
            return this.newJsonSchema['properties'][this.identifier]['enum'].length;
        },
        currentValue() {
            return this.$root.formData[this.identifier];
        },
        type() {
            return this.field.type;
        },
        visibleIf() {
            return this.$root.getValue(this.field, 'ngi_form_visible_if');
        },
        canAddVisibleIf() {
            // Check if a valid field is selected and it exists in the schema
            if (this.selectedVisibleIfKey === '') {
                return false;
            }
            const referenceField = this.$root.getValue(this.newJsonSchema['properties'], this.selectedVisibleIfKey);
            return referenceField !== undefined;
        }
    },
    methods: {
        add_new_allowed() {
            if (this.newJsonSchema['properties'][this.identifier]['enum'] === undefined) {
                this.newJsonSchema['properties'][this.identifier]['enum'] = []
            }
            // Add a new empty allowed value
            this.newJsonSchema['properties'][this.identifier]['enum'].push('')
        },
        add_visible_if() {
            this.visibleIfErrorMessage = '';
            if (this.selectedVisibleIfKey === '') {
                this.visibleIfErrorMessage = 'Please select a field to add a conditional logic';
                return null
            }

            // Add the skeleton for a new conditional logic when the field should be visible
            if (this.newJsonSchema['properties'][this.identifier]['ngi_form_visible_if'] === undefined) {

                this.newJsonSchema['properties'][this.identifier]['ngi_form_visible_if'] = {
                    properties: {}
                }
            }

            if (this.newJsonSchema['properties'][this.identifier]['ngi_form_visible_if']['properties'][this.selectedVisibleIfKey] !== undefined) {
                this.visibleIfErrorMessage = 'This field is already included';
                return null
            }

            let referenceSelectedField = this.$root.getValue(this.newJsonSchema['properties'], this.selectedVisibleIfKey);
            let default_value = '';
            if (referenceSelectedField.enum !== undefined) {
                default_value = referenceSelectedField.enum[0];
            } else if (referenceSelectedField.ngi_form_type === 'date') {
                default_value = '';
            } else if (referenceSelectedField.type === 'boolean') {
                default_value = false;
            } else if (referenceSelectedField.type === 'string') {
                default_value = '';
            } else {
                default_value = null;
            }
            this.newJsonSchema['properties'][this.identifier]['ngi_form_visible_if']['properties'][this.selectedVisibleIfKey] = {
                enum: [default_value]
            }
        }
    },
    watch: {
        fieldEditMode(newValue) {
            if (!newValue) {
                this.$root.saveDraft(true);
            }
        }
    },
     template:
        /*html*/`
            <div class="mb-5">
                <h2>{{this.label}}
                <template v-if="fieldEditMode">
                    <button @click="fieldEditMode = !fieldEditMode" class="btn btn-lg ml-1"><i class="fa-solid fa-check"></i></button>
                </template>
                <template v-else>
                    <button @click="fieldEditMode = !fieldEditMode" class="btn btn-lg ml-1"><i class="fa-solid fa-pen-to-square"></i></button>
                </template>
                </h2>
                <div class="col">
                    <button class="btn btn-sm btn-danger" @click.prevent="delete this.newJsonSchema['properties'][identifier]">Remove field<i class="fa-solid fa-trash ml-2"></i>
                </div>
                <div>
                    <label :for="identifier" class="form-label">Identifier</label>
                    <input :id="identifier" class="form-control" type="string" v-model="identifier" :disabled="!fieldEditMode">
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_group'" class="form-label">Group</label>
                    <select :id="identifier + '_ngi_form_group'" class="form-control" v-model="this.newJsonSchema['properties'][identifier]['ngi_form_group']" :disabled="!fieldEditMode">
                        <template v-for="(form_group, group_identifier) in this.$root.getValue(this.newJsonForm, 'form_groups')">
                            <option :value="group_identifier">{{form_group.display_name}}</option>
                        </template>
                    </select>
                </div>
                <div>
                    <label :for="identifier + '_description'" class="form-label">Description</label>
                    <input :id="identifier + '_description'" class="form-control" type="string" v-model="this.newJsonSchema['properties'][identifier]['description']" :disabled="!fieldEditMode">
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_type'" class="form-label">Form Type</label>
                    <select :id="identifier + '_ngi_form_type'" class="form-control" v-model="this.newJsonSchema['properties'][identifier]['ngi_form_type']" :disabled="!fieldEditMode">
                        <option value="string">String</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                        <option value="datalist">Datalist (must select value in list)</option>
                        <option value="custom_datalist">Custom Datalist (fetch most used suggestions)</option>
                    </select>
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_label'" class="form-label">Label</label>
                    <input :id="identifier + '_ngi_form_label'" class="form-control" type="string" v-model="this.newJsonSchema['properties'][identifier]['ngi_form_label']" :disabled="!fieldEditMode">
                </div>
                <div>
                    <label :for="identifier + '_ngi_form_lims_udf'" class="form-label">LIMS UDF</label>
                    <input :id="identifier + '_ngi_form_lims_udf'" class="form-control" type="string" v-model="this.newJsonSchema['properties'][identifier]['ngi_form_lims_udf']" :disabled="!fieldEditMode">
                </div>
                <template v-if="(this.type === 'string') && (this.formType !== 'select')">
                    <div>
                        <label :for="identifier + '_pattern'" class="form-label">Pattern</label>
                        <input :id="identifier + '_pattern'" class="form-control" type="string" v-model="this.newJsonSchema['properties'][identifier]['pattern']" :disabled="!fieldEditMode">
                    </div>
                </template>
                <div>
                    <h3 class="mt-3">Visibility</h3>
                    <template v-if="this.visibleIf !== undefined">
                        <h4 class="mt-2">Visible only if</h4>
                        <div class="row">
                            <template v-for="(condition_key, condition_index) in Object.keys(this.visibleIf['properties'])">
                                <template v-if="condition_index > 0">
                                    <h4>AND</h4>
                                </template>
                                <div class="offset-1 col-11">
                                    <button v-if="fieldEditMode" class="btn btn-outline-danger" @click.prevent="delete this.newJsonSchema['properties'][identifier]['ngi_form_visible_if']['properties'][condition_key]">Remove field<i class="fa-solid fa-trash ml-2"></i></button>
                                    <v-visible-if-condition-edit-form :field_identifier="identifier" :condition_key="condition_key" :edit_mode="fieldEditMode"></v-visible-if-condition-edit-form>
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
                    <div v-if="fieldEditMode" class="row">
                        <div class="col-6">
                            <div class="input-group">
                                <select class="form-select" placeholder="test" v-model="this.selectedVisibleIfKey">
                                    <template v-for="identifier in Object.keys(this.$root.fields)">
                                        <option :value="identifier">{{identifier}}</option>
                                    </template>
                                </select>
                                <button class="btn btn-primary" @click.prevent="this.add_visible_if()" :disabled="!fieldEditMode || !canAddVisibleIf">Add conditional visibility</button>
                            </div>
                        </div>
                    </div>
                </div>
                <template v-if="(this.formType === 'select') || (this.formType === 'datalist')">
                    <div class="col-6">
                        <h3>Allowed values</h3>
                        <p>{{this.nrOfAllowedValues}} number of allowed values are added.</p>
                        <template v-if="this.showAllowedValues">
                            <button class="btn btn-danger mb-2" @click.prevent="this.showAllowedValues = false">Hide allowed values</button>
                            <template v-for="(option, index) in this.newJsonSchema['properties'][identifier]['enum']" :key="index">
                                <div class="input-group mb-3">
                                    <input :id="identifier + '_enum_'+index" class="form-control col-auto" type="string" v-model="this.newJsonSchema['properties'][identifier]['enum'][index]" :disabled="!fieldEditMode">
                                    <button v-if="fieldEditMode" class="btn btn-danger col-auto" @click.prevent="this.newJsonSchema['properties'][identifier]['enum'].splice(index, 1)">Remove<i class="fa-solid fa-trash ml-2"></i></button>
                                </div>
                            </template>
                            <button v-if="fieldEditMode" class="btn btn-primary" @click.prevent="this.add_new_allowed()">Add new allowed value</button>
                        </template>
                        <template v-else>
                            <button class="btn btn-primary" @click.prevent="this.showAllowedValues = true">Show allowed values</button>
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
            const condition = this.$root.getValue(this.newJsonSchema['properties'][this.field_identifier]['ngi_form_visible_if']['properties'], this.condition_key);
            if (condition === undefined) {
                return {'enum': ['']}
            }
            return condition;
        },        
        enumIf() {
            // The enum inside the condition
            return this.condition.enum;
        },
        newJsonSchema() {
            return this.$root.getValue(this.$root.newJsonForm, 'json_schema');
        },
        propertyReferenceIf() {
            // The property that is referenced in the condition
            return this.$root.getValue(this.newJsonSchema['properties'], this.condition_key)
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
        },
        sortedPropertyReferenceIfEnum() {
            // Return sorted enum values for display when showing all options
            if (!this.propertyReferenceIsEnumIf) {
                return [];
            }
            return [...this.propertyReferenceIf.enum].sort();
        }
    },
    template:
        /*html*/`
            <div class="mb-3">
                <h4>{{this.propertyReferenceIfLabel}}</h4>
                is any of
                <template v-if="this.showAllOptions && this.propertyReferenceIsEnumIf">
                    <template v-for="option in this.sortedPropertyReferenceIfEnum">
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
app.component('v-form-groups-editor', vFormGroupsEditor)
app.component('v-create-form-list', vCreateFormList)
app.component('v-create-form', vCreateForm)
app.component('v-update-form-field', vUpdateFormField)
app.component('v-conditional-edit-form', vConditionalEditForm)
app.mount('#v_project_creation')