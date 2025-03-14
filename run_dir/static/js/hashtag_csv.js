const vHashtagCSV = {
    data() {
        return {
            antibody_columns: [
                'Antibody 1',
                'Antibody 2',
                'Antibody 3'
            ],
            chosen_project: null,
            assignments: {},
            overrule_four_digit_disabled: false,
            possible_antibodies: {},
            project_suggestions: [],
            project_details: {},
            project_samples: {},
            search_term: '',
            error_messages: []
        }
    },
    computed: {
        assignments_csv() {
            // Create a CSV string from the assignments object
            let csv = 'Sample_ID,Antibodies\n';
            Object.keys(this.assignments).forEach(sample_id => {
                let sample_values = Object.values(this.assignments[sample_id]);
                // Remove all None values
                sample_values = sample_values.filter(value => value !== 'None');
                csv += sample_id + ',' + sample_values.join(';') + '\n';
            });
            return csv;
        },
        has_mix_three_digit_four_digit() {
            // Check if the project sample id contains a mix of three and four digit numbers
            let sample_ids = Object.keys(this.project_samples);
            let three_digit = sample_ids.filter(sample_id => sample_id.split('_')[1].length === 3);
            let four_digit = sample_ids.filter(sample_id => sample_id.split('_')[1].length === 4);
            return three_digit.length > 0 && four_digit.length > 0;
        },
        order_title() {
            if ('order_details' in this.project_details) {
                return this.project_details['order_details']['title'];
            }
            return '';
        },
        possible_antibodies_assigned_first() {
            // Return the possible antibodies with the ones that are already assigned first
            let possible_antibodies = Object.values(this.possible_antibodies);
            let assigned_antibodies_first = [];
            let assigned_antibodies_last = [];
            possible_antibodies.forEach(antibody => {
                if (this.unique_assigned_antibodies.includes(antibody['Product nr'])) {
                    assigned_antibodies_first.push(antibody);
                } else {
                    assigned_antibodies_last.push(antibody);
                }
            });
            return assigned_antibodies_first.concat(assigned_antibodies_last);
        },
        unique_assigned_antibodies() {
            let all_assigned_antibodies = [];
            Object.keys(this.assignments).forEach(sample_id => {
                let sample_assigned_antibodies = Object.values(this.assignments[sample_id]);
                all_assigned_antibodies = all_assigned_antibodies.concat(sample_assigned_antibodies);
            });
            return [...new Set(all_assigned_antibodies)];
        }
    },
    methods: {
        addAntibodyColumn() {
            let column_to_be_added = 'Antibody ' + (this.antibody_columns.length + 1)
            this.antibody_columns.push(column_to_be_added);
            // Add the column to all sample assignments
            Object.keys(this.assignments).forEach(sample_id => {
                this.assignments[sample_id][column_to_be_added] = 'None';
            });
        },
        clearAssignments(sample_id) {
            Object.keys(this.assignments[sample_id]).forEach(antibody_column => {
                this.assignments[sample_id][antibody_column] = 'None';
            });
        },
        containsDuplicateValues(antibody_ids) {
            // Remove Nones
            let values = Object.values(antibody_ids).filter(value => value !== 'None');
            return new Set(values).size !== values.length;
        },
        fetchPossibleAntibodies() {
            axios
                .get('/api/v1/configs/possible_antibodies_sc')
                .then(response => {
                    if (response.data !== null) {
                        this.possible_antibodies = response.data['possible_antibodies'];
                        // Add a None option to the possible antibodies
                        this.possible_antibodies['None'] = {};
                        let first_key = Object.keys(this.possible_antibodies)[0];
                        Object.keys(this.possible_antibodies[first_key]).forEach(key => {
                            this.possible_antibodies['None'][key] = 'None';
                        });
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching possible antibodies. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },
        fetchProjectDetails(project_id) {
            axios
                .get(`/api/v1/project_summary/${project_id}`)
                .then(response => {
                    if (response.data !== null) {
                        this.project_details = response.data;
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching project details for project ' + project_id + '. Please try again or contact a system administrator.');
                    console.log(error);
                });

            axios
                .get(`/api/v1/project/${project_id}`)
                .then(response => {
                    if (response.data !== null) {
                        this.project_samples = response.data;
                        Object.keys(this.project_samples).forEach(sample_id => {
                            this.assignments[sample_id] = {};

                            this.antibody_columns.forEach(column => {
                                this.assignments[sample_id][column] = 'None';
                            });
                        });
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching sample details for project ' + project_id + '. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },
        isDisabled(sample_id) {
            // When having a mix of three-digit and four-digit sample IDs, 
            // normally we only allow three digit samples to have antibody assignments.

            // If there 
            if (!this.has_mix_three_digit_four_digit) {
                return false;
            }

            if (this.overrule_four_digit_disabled) {
                return false;
            }

            return sample_id.split('_')[1].length === 4
        },
        removeAntibodyColumn() {
            let column_to_be_removed = this.antibody_columns.pop();
            // Remove the column from all sample assignments
            Object.keys(this.assignments).forEach(sample_id => {
                delete this.assignments[sample_id][column_to_be_removed];
            });
        },
        replicateFirstValue() {
            // Copy the first row of the table to all other rows
            let first_sample = Object.keys(this.project_samples)[0];
            let first_sample_values = this.assignments[first_sample];
            Object.keys(this.assignments).forEach(sample_id => {
                if (!this.isDisabled(sample_id)) {
                    Object.keys(first_sample_values).forEach(antibody_column => {
                        this.assignments[sample_id][antibody_column] = first_sample_values[antibody_column];
                    });
                }
            });
        },
        searchProject(search_term) {
            axios
                .get(`/api/v1/project_search/${search_term}`)
                .then(response => {
                    if (response.data !== null) {
                        this.project_suggestions = response.data;
                    }
                })
                .catch(error => {
                    this.error_messages.push('Error fetching project suggestions for search term ' + search_term + '. Please try again or contact a system administrator.');
                    console.log(error);
                });
        },
        selectProject(project_name_string) {
            let project_id = project_name_string.split(', ')[0];
            this.chosen_project = project_id;
            this.search_term = '';
            this.project_suggestions = [];
            this.assignments = {};
            this.fetchProjectDetails(project_id);
        },
        toggleOverrule() {
            if (this.overrule_four_digit_disabled) {
                this.overrule_four_digit_disabled = false;
                // Clear assignments for four digit samples
                Object.keys(this.assignments).forEach(sample_id => {
                    if (this.isDisabled(sample_id)) {
                        Object.keys(this.assignments[sample_id]).forEach(antibody_column => {
                            this.assignments[sample_id][antibody_column] = 'None';
                        });
                    }
                });
            } else {
                this.overrule_four_digit_disabled = true;
            }
        },
        triggerDownload() {
            // Generated by AI and used without shame
            // Create a Blob from the CSV string
            const blob = new Blob([this.assignments_csv], { type: 'text/csv' });

            // Create a URL for the Blob
            const url = URL.createObjectURL(blob);

            // Create a temporary anchor element to trigger the download
            const a = document.createElement('a');
            a.href = url;
            // Timestamp date, hours and minute string
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '_').slice(0, 13);

            a.download = `${this.chosen_project}_${timestamp}.csv`; // Set the desired file name

            // Append the anchor to the body
            document.body.appendChild(a);

            // Trigger a click event on the anchor to start the download
            a.click();

            // Remove the anchor from the document
            document.body.removeChild(a);

            // Revoke the object URL to free up memory
            URL.revokeObjectURL(url);
        }
    },
    mounted() {
        this.fetchPossibleAntibodies();
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Hashtag CSV</h1>
                    <p>
                        This page enables the creation and download of a CSV file with all the hashtag information for a chosen project. 
                        The created csv file can then be parsed by LIMS to assign sample level UDFs with corresponding antibody IDs
                    </p>
                    <div class="card p-3">
                        <div class="row">
                            <div class="col-6">
                                <div class="form-group mb-3">
                                    <label class="form-label" for="project">Choose project</label>
                                    <input type="text" class="form-control" id="project" v-model="search_term" @keyup="searchProject(search_term)" placeholder="Search for project">
                                </div>
                                <div v-for="project in project_suggestions.slice(0, 25)" :key="project.id" class="mb-2 col-5">
                                    <button class="btn btn-primary w-100" @click="selectProject(project.name)">
                                        {{ project.name }}
                                    </button>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="pl-3 py-3">
                                    <template v-if="chosen_project">
                                        <h1 class="mb-3">{{chosen_project}} <small>- <a class="text-decoration-none" :href="'/project/' + chosen_project" target="_blank">project page <i class="fa-solid fa-arrow-up-right-from-square"></i></a></small></h1>
                                        <ul>
                                            <li>{{project_details['project_name']}}</li>
                                            <li>{{project_details['application']}}</li>
                                            <li>{{project_details['library_construction_method']}}</li>
                                            <li>{{project_details['reference_genome']}}</li>
                                            <li>{{order_title}}</li>
                                        </ul>
                                    </template>
                                    <template v-else>
                                        <h1>No project selected</h1>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-3">
                        <template v-if="chosen_project">
                            <div class="my-4">
                                <h1>Create CSV</h1>
                                <div class="my-4">
                                    <h2>CSV preview</h2>
                                    <pre>{{assignments_csv}}</pre>
                                </div>
                                <div class="mb-3">
                                    <button class="btn btn-primary mr-2" @click="this.addAntibodyColumn"><i class="fa-solid fa-plus mr-2"></i>Add Antibody Column</button>
                                    <button class="btn btn-primary mr-2" @click="this.removeAntibodyColumn"><i class="fa-solid fa-minus mr-2"></i>Remove Antibody Column</button>
                                    <button class="btn btn-primary" @click="this.replicateFirstValue"><i class="fa-solid fa-copy mr-2"></i>Replicate first values of first row</button>
                                    <template v-if="has_mix_three_digit_four_digit">
                                    <button class="btn btn-secondary float-right" @click="toggleOverrule()">
                                        <template v-if="overrule_four_digit_disabled">
                                                Disable four digit samples
                                            </template>
                                            <template v-else>
                                                Enable four digit samples
                                            </template>
                                        </button>
                                    </template>
                                </div>
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Sample</th>
                                            <th scope="col">User submitted name</th>
                                            <th scope="col" v-for="antibody_column in antibody_columns">
                                                {{antibody_column}}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="sample in project_samples" :class="{'table-secondary': isDisabled(sample['scilife_name']), 'table-danger': containsDuplicateValues(assignments[sample['scilife_name']])}">
                                            <th scope="row">{{sample['scilife_name']}}</th>
                                            <th scope="row">{{sample['customer_name']}}</th>
                                            <td v-for="antibody_column in antibody_columns" :key="antibody_column">
                                                <select class="form-select" aria-label="Default select example" v-model="assignments[sample['scilife_name']][antibody_column]" :disabled="isDisabled(sample['scilife_name'])">
                                                    <template v-for="(antibody, key) in possible_antibodies" :key="key">
                                                        <option :value="key">{{ antibody['Nickname'] }}</option>
                                                    </template>
                                                </select>
                                            </td>
                                            <td><button class="btn" @click="clearAssignments(sample['scilife_name'])" :disabled="isDisabled(sample['scilife_name'])"><i class="fa-solid fa-eraser"></i></button></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <button class="btn btn-lg btn-primary float-right mt-4" @click="triggerDownload">Download CSV</button>
                            </div>
                        </template>
                        <template v-else>
                            <h1 class="my-4">No project selected</h2>
                        </template>
                    </div>
                    <div class="row mt-5">
                        <h1>Antibodies</h1>
                        <p>Items added to any sample are highlighted in green</p>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th scope="col">Nickname</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Product nr</th>
                                    <th scope="col">Species</th>
                                    <th scope="col">For 10X method</th>
                                    <th scope="col">Total-Seq version</th>
                                    <th scope="col">URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="antibody in possible_antibodies_assigned_first" :class="{'table-success': unique_assigned_antibodies.includes(antibody['Product nr'])}">
                                    <td>{{ antibody['Nickname'] }}</td>
                                    <td>{{ antibody['Name'] }}</td>
                                    <td>{{ antibody['Product nr'] }}</td>
                                    <td>{{ antibody['Species'] }}</td>
                                    <td>{{ antibody['For 10X method'] }}</td>
                                    <td>{{ antibody['Total-Seq version'] }}</td>
                                    <td>
                                        <template v-if="antibody['URL'] !== 'None'">
                                            <a :href="antibody['URL']">{{ antibody['URL'] }}</a>
                                        </template>
                                        <template v-else>
                                            None
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`
}


const app = Vue.createApp(vHashtagCSV)
app.mount('#v_hashtag_csv')