const vSamplesheetEditor = {
    data() {
        return {
            flowcell_id: '',
            samplesheet: null,
            error_messages: [],
            loading: false
        }
    },
    methods: {
        fetchSamplesheet() {
            // Clear previous errors
            this.error_messages = [];
            
            if (!this.flowcell_id.trim()) {
                this.error_messages.push('Please enter a flowcell ID.');
                return;
            }
            
            this.loading = true;
            
            axios.get(`/api/v1/samplesheet/${this.flowcell_id}`)
                .then(response => {
                    this.samplesheet = response.data;
                    this.loading = false;
                })
                .catch(error => {
                    this.error_messages.push(`Error fetching samplesheet data for flowcell ${this.flowcell_id}. Please try again or contact a system administrator.`);
                    console.error(error);
                    this.loading = false;
                });
        }
    },
    mounted() {
        // Check if flowcell ID is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const flowcellId = urlParams.get('flowcell');
        
        if (flowcellId) {
            this.flowcell_id = flowcellId;
            this.fetchSamplesheet();
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Samplesheet Editor</h1>

                    <!-- Flowcell ID input -->
                    <div class="card mt-4 mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Fetch Samplesheet</h5>
                            <div class="row g-3 align-items-end">
                                <div class="col-auto">
                                    <label for="flowcell_id" class="form-label">Flowcell ID</label>
                                    <input
                                        type="text"
                                        class="form-control"
                                        id="flowcell_id"
                                        v-model="flowcell_id"
                                        placeholder="e.g., 20231115_A01234_0123_ABCDEFGHIJ"
                                        @keyup.enter="fetchSamplesheet">
                                </div>
                                <div class="col-auto">
                                    <button
                                        class="btn btn-primary"
                                        @click="fetchSamplesheet"
                                        :disabled="loading">
                                        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {{ loading ? 'Loading...' : 'Fetch Samplesheet' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error messages -->
                    <template v-if="error_messages.length > 0">
                        <div class="alert alert-danger" role="alert">
                            <h3 v-for="error in error_messages">{{ error }}</h3>
                        </div>
                    </template>

                    <!-- Loading state -->
                    <template v-if="loading && !samplesheet">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Loading samplesheet data...</p>
                        </div>
                    </template>

                    <!-- Samplesheet data -->
                    <template v-if="samplesheet">
                        <h2>Flowcell: {{ samplesheet.flowcell_id }}</h2>

                        <!-- Metadata Card -->
                        <div class="card mt-4" v-if="samplesheet.metadata">
                            <div class="card-header">
                                <h5 class="mb-0">Flowcell Information</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <dl class="row">
                                            <dt class="col-sm-5">Full Name:</dt>
                                            <dd class="col-sm-7">{{ samplesheet.metadata.full_name || 'Unknown' }}</dd>

                                            <dt class="col-sm-5">Position:</dt>
                                            <dd class="col-sm-7">{{ samplesheet.metadata.position || 'Unknown' }}</dd>

                                            <dt class="col-sm-5">Instrument:</dt>
                                            <dd class="col-sm-7">{{ samplesheet.metadata.instrument || 'Unknown' }}</dd>

                                            <dt class="col-sm-5">Run Setup:</dt>
                                            <dd class="col-sm-7">{{ samplesheet.metadata.run_setup || 'Unknown' }}</dd>
                                        </dl>
                                    </div>
                                    <div class="col-md-6">
                                        <dl class="row">
                                            <dt class="col-sm-4">Samples:</dt>
                                            <dd class="col-sm-8">{{ samplesheet.metadata.num_samples }}</dd>

                                            <dt class="col-sm-4">Lanes:</dt>
                                            <dd class="col-sm-8">{{ samplesheet.metadata.num_lanes }}</dd>

                                            <dt class="col-sm-4">Projects:</dt>
                                            <dd class="col-sm-8">
                                                <span v-if="samplesheet.metadata.projects && samplesheet.metadata.projects.length > 0">
                                                    <span v-for="(project, idx) in samplesheet.metadata.projects" :key="project.id || project.name">
                                                        <a v-if="project.id"
                                                           :href="'/project/' + project.id"
                                                           class="text-decoration-none">
                                                            {{ project.name }} ({{ project.id }})
                                                        </a>
                                                        <span v-else>{{ project.name }}</span>
                                                        <span v-if="idx < samplesheet.metadata.projects.length - 1">, </span>
                                                    </span>
                                                </span>
                                                <span v-else>None</span>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <table class="table table-striped table-bordered">
                                <thead>
                                    <tr class="darkth">
                                        <th>FCID</th>
                                        <th>Lane</th>
                                        <th>Sample ID</th>
                                        <th>Sample Name</th>
                                        <th>Sample Ref</th>
                                        <th>Index</th>
                                        <th>Index2</th>
                                        <th>Description</th>
                                        <th>Control</th>
                                        <th>Recipe</th>
                                        <th>Operator</th>
                                        <th>Sample Project</th>
                                    </tr>
                                </thead>
                                <tfoot>
                                    <tr class="darkth">
                                        <th>FCID</th>
                                        <th>Lane</th>
                                        <th>Sample ID</th>
                                        <th>Sample Name</th>
                                        <th>Sample Ref</th>
                                        <th>Index</th>
                                        <th>Index2</th>
                                        <th>Description</th>
                                        <th>Control</th>
                                        <th>Recipe</th>
                                        <th>Operator</th>
                                        <th>Sample Project</th>
                                    </tr>
                                </tfoot>
                                <tbody>
                                    <tr v-for="(sample, index) in samplesheet.samples" :key="index">
                                        <td>{{ sample.FCID }}</td>
                                        <td>{{ sample.Lane }}</td>
                                        <td>{{ sample.Sample_ID }}</td>
                                        <td>{{ sample.Sample_Name }}</td>
                                        <td>{{ sample.Sample_Ref }}</td>
                                        <td><code>{{ sample.index }}</code></td>
                                        <td><code>{{ sample.index2 }}</code></td>
                                        <td>{{ sample.Description }}</td>
                                        <td>{{ sample.Control }}</td>
                                        <td>{{ sample.Recipe }}</td>
                                        <td>{{ sample.Operator }}</td>
                                        <td>{{ sample.Sample_Project }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        `
};

const app = Vue.createApp(vSamplesheetEditor);
app.mount('#samplesheet_editor_main');
