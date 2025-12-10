const vDemuxSampleInfoEditor = {
    data() {
        return {
            flowcell_id: '',
            demux_data: null,
            error_messages: [],
            loading: false,
            viewMode: 'uploaded',  // 'uploaded', 'calculated', 'history'
            selectedVersion: null
        }
    },
    computed: {
        uploadedSamplesByLane() {
            if (!this.demux_data || !this.demux_data.uploaded_info) {
                return {};
            }

            const grouped = {};
            this.demux_data.uploaded_info.forEach(sample => {
                const lane = sample.lane;
                if (!grouped[lane]) {
                    grouped[lane] = [];
                }
                grouped[lane].push(sample);
            });

            // Sort lanes numerically
            return Object.keys(grouped)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .reduce((acc, lane) => {
                    acc[lane] = grouped[lane];
                    return acc;
                }, {});
        },
        versionTimestamps() {
            if (!this.demux_data || !this.demux_data.calculated || !this.demux_data.calculated.version_history) {
                return [];
            }
            return Object.keys(this.demux_data.calculated.version_history).sort().reverse();
        },
        currentVersion() {
            if (!this.selectedVersion && this.versionTimestamps.length > 0) {
                return this.versionTimestamps[0];
            }
            return this.selectedVersion;
        },
        versionInfo() {
            if (!this.demux_data || !this.currentVersion) {
                return null;
            }
            return this.demux_data.calculated.version_history[this.currentVersion];
        },
        calculatedLanes() {
            if (!this.demux_data || !this.demux_data.calculated || !this.demux_data.calculated.lanes) {
                return {};
            }
            return this.demux_data.calculated.lanes;
        }
    },
    methods: {
        fetchDemuxInfo() {
            // Clear previous errors
            this.error_messages = [];
            
            if (!this.flowcell_id.trim()) {
                this.error_messages.push('Please enter a flowcell ID.');
                return;
            }
            
            this.loading = true;
            
            axios.get(`/api/v1/demux_sample_info/${this.flowcell_id}`)
                .then(response => {
                    this.demux_data = response.data;
                    this.selectedVersion = null; // Reset to latest
                    this.loading = false;
                })
                .catch(error => {
                    if (error.response && error.response.status === 404) {
                        this.error_messages.push(`No demux sample info found for flowcell ${this.flowcell_id}.`);
                    } else {
                        this.error_messages.push(`Error fetching demux sample info for flowcell ${this.flowcell_id}. Please try again or contact a system administrator.`);
                    }
                    console.error(error);
                    this.loading = false;
                });
        },
        formatTimestamp(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp).toLocaleString();
        },
        getSampleSettings(sampleUuid, lane) {
            if (!this.calculatedLanes[lane] || !this.calculatedLanes[lane].samples[sampleUuid]) {
                return null;
            }
            const sample = this.calculatedLanes[lane].samples[sampleUuid];
            // Get settings for the current version or the latest
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            return sample.settings[settingsVersions[0]];
        }
    },
    mounted() {
        // Check if flowcell ID is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const flowcellId = urlParams.get('flowcell');
        
        if (flowcellId) {
            this.flowcell_id = flowcellId;
            this.fetchDemuxInfo();
        }
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Demux Sample Info Editor</h1>

                    <!-- Flowcell ID input -->
                    <div class="card mt-4 mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Fetch Demux Sample Info</h5>
                            <div class="row g-3 align-items-end">
                                <div class="col-auto">
                                    <label for="flowcell_id" class="form-label">Flowcell ID</label>
                                    <input
                                        type="text"
                                        class="form-control"
                                        id="flowcell_id"
                                        v-model="flowcell_id"
                                        placeholder="e.g., 233KCWLT4"
                                        @keyup.enter="fetchDemuxInfo">
                                </div>
                                <div class="col-auto">
                                    <button
                                        class="btn btn-primary"
                                        @click="fetchDemuxInfo"
                                        :disabled="loading">
                                        <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {{ loading ? 'Loading...' : 'Fetch Data' }}
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
                    <template v-if="loading && !demux_data">
                        <div class="text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p>Loading demux sample info...</p>
                        </div>
                    </template>

                    <!-- Demux data -->
                    <template v-if="demux_data">
                        <h2>Flowcell: {{ demux_data.flowcell_id }}</h2>

                        <!-- Metadata Card -->
                        <div class="card mt-4" v-if="demux_data.metadata">
                            <div class="card-header">
                                <h5 class="mb-0">Metadata</h5>
                            </div>
                            <div class="card-body">
                                <dl class="row">
                                    <dt class="col-sm-3">Number of Lanes:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.num_lanes }}</dd>

                                    <dt class="col-sm-3">Instrument ID:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.instrument_id || 'N/A' }}</dd>

                                    <dt class="col-sm-3">Run Setup:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.run_setup || 'N/A' }}</dd>

                                    <dt class="col-sm-3">Setup LIMS Step ID:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.setup_lims_step_id || 'N/A' }}</dd>
                                </dl>
                            </div>
                        </div>

                        <!-- Version History Card -->
                        <div class="card mt-4" v-if="versionTimestamps.length > 0">
                            <div class="card-header">
                                <h5 class="mb-0">Version History</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="versionSelect" class="form-label">Select Version:</label>
                                    <select class="form-select" id="versionSelect" v-model="selectedVersion">
                                        <option :value="null">Latest ({{ formatTimestamp(versionTimestamps[0]) }})</option>
                                        <option v-for="timestamp in versionTimestamps" :key="timestamp" :value="timestamp">
                                            {{ formatTimestamp(timestamp) }}
                                        </option>
                                    </select>
                                </div>
                                <div v-if="versionInfo">
                                    <dl class="row mb-0">
                                        <dt class="col-sm-3">Generated By:</dt>
                                        <dd class="col-sm-9">{{ versionInfo.generated_by || 'N/A' }}</dd>

                                        <dt class="col-sm-3">Autogenerated:</dt>
                                        <dd class="col-sm-9">{{ versionInfo.autogenerated ? 'Yes' : 'No' }}</dd>

                                        <dt class="col-sm-3">Auto Run:</dt>
                                        <dd class="col-sm-9">{{ versionInfo.auto_run ? 'Yes' : 'No' }}</dd>

                                        <dt class="col-sm-3">Comment:</dt>
                                        <dd class="col-sm-9">{{ versionInfo.comment || 'None' }}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <!-- View Options -->
                        <div class="card mt-4">
                            <div class="card-header">
                                <h5 class="mb-0">View Mode</h5>
                            </div>
                            <div class="card-body">
                                <div class="btn-group" role="group" aria-label="View mode selection">
                                    <input type="radio" class="btn-check" name="viewMode" id="viewUploaded" value="uploaded" v-model="viewMode" autocomplete="off" checked>
                                    <label class="btn btn-outline-primary" for="viewUploaded">Uploaded Info</label>

                                    <input type="radio" class="btn-check" name="viewMode" id="viewCalculated" value="calculated" v-model="viewMode" autocomplete="off">
                                    <label class="btn btn-outline-primary" for="viewCalculated">Calculated Samples</label>
                                </div>
                            </div>
                        </div>

                        <!-- Uploaded Info view -->
                        <div class="mt-4" v-if="viewMode === 'uploaded'">
                            <h3>Uploaded Info from LIMS</h3>
                            <div v-for="(samples, lane) in uploadedSamplesByLane" :key="lane" class="mt-3">
                                <h4>Lane {{ lane }}</h4>
                                <table class="table table-striped table-bordered table-sm">
                                    <thead>
                                        <tr class="darkth">
                                            <th>Flowcell ID</th>
                                            <th>Sample ID</th>
                                            <th>Sample Name</th>
                                            <th>Sample Ref</th>
                                            <th>Index 1</th>
                                            <th>Index 2</th>
                                            <th>Description</th>
                                            <th>Control</th>
                                            <th>Recipe</th>
                                            <th>Operator</th>
                                            <th>Sample Project</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(sample, index) in samples" :key="index">
                                            <td>{{ sample.flowcell_id }}</td>
                                            <td>{{ sample.sample_id }}</td>
                                            <td>{{ sample.sample_name }}</td>
                                            <td>{{ sample.sample_ref }}</td>
                                            <td><code>{{ sample.index_1 }}</code></td>
                                            <td><code>{{ sample.index_2 }}</code></td>
                                            <td>{{ sample.description }}</td>
                                            <td>{{ sample.control }}</td>
                                            <td>{{ sample.recipe }}</td>
                                            <td>{{ sample.operator }}</td>
                                            <td>{{ sample.sample_project }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Calculated Samples view -->
                        <div class="mt-4" v-if="viewMode === 'calculated'">
                            <h3>Calculated Samples (by Lane)</h3>
                            <div v-for="(laneData, lane) in calculatedLanes" :key="lane" class="mt-3">
                                <h4>Lane {{ lane }}</h4>
                                <div class="accordion" :id="'accordion-lane-' + lane">
                                    <div v-for="(sample, uuid) in laneData.samples" :key="uuid" class="accordion-item">
                                        <h2 class="accordion-header" :id="'heading-' + uuid">
                                            <button class="accordion-button collapsed" type="button" 
                                                    data-bs-toggle="collapse" 
                                                    :data-bs-target="'#collapse-' + uuid"
                                                    aria-expanded="false">
                                                <strong>{{ sample.sample_id }}</strong>
                                                <span class="ms-3 text-muted">UUID: {{ uuid }}</span>
                                                <span class="ms-3 text-muted">Last modified: {{ formatTimestamp(sample.last_modified) }}</span>
                                            </button>
                                        </h2>
                                        <div :id="'collapse-' + uuid" 
                                             class="accordion-collapse collapse" 
                                             :aria-labelledby="'heading-' + uuid"
                                             :data-bs-parent="'#accordion-lane-' + lane">
                                            <div class="accordion-body">
                                                <h6>Settings History ({{ Object.keys(sample.settings).length }} version(s))</h6>
                                                <div v-for="(settings, timestamp) in sample.settings" :key="timestamp" class="mb-3">
                                                    <div class="card">
                                                        <div class="card-header bg-light">
                                                            <strong>Version: {{ formatTimestamp(timestamp) }}</strong>
                                                        </div>
                                                        <div class="card-body">
                                                            <div class="row">
                                                                <div class="col-md-6">
                                                                    <dl class="row mb-0">
                                                                        <dt class="col-sm-6">Sample Name:</dt>
                                                                        <dd class="col-sm-6">{{ settings.sample_name }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Sample Project:</dt>
                                                                        <dd class="col-sm-6">{{ settings.sample_project }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Sample Ref:</dt>
                                                                        <dd class="col-sm-6">{{ settings.sample_ref }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Index 1:</dt>
                                                                        <dd class="col-sm-6"><code>{{ settings.index_1 }}</code></dd>
                                                                        
                                                                        <dt class="col-sm-6">Index 2:</dt>
                                                                        <dd class="col-sm-6"><code>{{ settings.index_2 }}</code></dd>
                                                                        
                                                                        <dt class="col-sm-6">Named Index:</dt>
                                                                        <dd class="col-sm-6">{{ settings.named_index }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Control:</dt>
                                                                        <dd class="col-sm-6">{{ settings.control }}</dd>
                                                                    </dl>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <dl class="row mb-0">
                                                                        <dt class="col-sm-6">Recipe:</dt>
                                                                        <dd class="col-sm-6">{{ settings.recipe }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Operator:</dt>
                                                                        <dd class="col-sm-6">{{ settings.operator }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Description:</dt>
                                                                        <dd class="col-sm-6">{{ settings.description }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Mask Short Reads:</dt>
                                                                        <dd class="col-sm-6">{{ settings.mask_short_reads }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Min Trimmed Length:</dt>
                                                                        <dd class="col-sm-6">{{ settings.minimum_trimmed_read_length }}</dd>
                                                                        
                                                                        <dt class="col-sm-6">Override Cycles:</dt>
                                                                        <dd class="col-sm-6">{{ settings.override_cycles || 'None' }}</dd>
                                                                    </dl>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        `
};

const app = Vue.createApp(vDemuxSampleInfoEditor);
app.mount('#demux_sample_info_editor_main');
