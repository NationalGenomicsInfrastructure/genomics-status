const vDemuxSampleInfoEditor = {
    data() {
        return {
            flowcell_id: '',
            demux_data: null,
            editedData: {},  // Stores edited settings per sample: { lane: { uuid: settings_object } }
            error_messages: [],
            loading: false,
            saving: false,
            viewMode: 'calculated',  // 'uploaded', 'calculated'
            selectedVersion: null,
            availableColumns: [
                { key: 'sample_id', label: 'Sample ID' },
                { key: 'sample_name', label: 'Sample Name' },
                { key: 'sample_project', label: 'Sample Project' },
                { key: 'sample_ref', label: 'Sample Ref' },
                { key: 'index_1', label: 'Index 1' },
                { key: 'index_2', label: 'Index 2' },
                { key: 'named_index', label: 'Named Index' },
                { key: 'recipe', label: 'Recipe' },
                { key: 'operator', label: 'Operator' },
                { key: 'description', label: 'Description' },
                { key: 'control', label: 'Control' },
                { key: 'mask_short_reads', label: 'Mask Short Reads' },
                { key: 'minimum_trimmed_read_length', label: 'Min Trimmed Length' },
                { key: 'override_cycles', label: 'Override Cycles' },
                { key: 'last_modified', label: 'Last Modified' }
            ],
            visibleColumns: ['sample_id', 'last_modified', 'index_1', 'index_2', 'recipe', 'override_cycles']
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
        calculatedData() {
            if (!this.demux_data || !this.demux_data.calculated) {
                return {};
            }
        },
        calculatedLanes() {
            if (!this.demux_data || !this.demux_data.calculated || !this.demux_data.calculated.lanes) {
                return {};
            }
            return this.demux_data.calculated.lanes;
        },
        calculatedSamplesFlat() {
            // Flatten calculated samples with their latest settings for table display
            // If there are edits, merge them with original data
            const result = {};

            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = [];

                Object.entries(laneData.samples).forEach(([uuid, sample]) => {
                    // Get the latest settings version
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];

                    // Check if there's an edited version for this sample
                    const editedSettings = this.editedData[lane]?.[uuid];
                    const finalSettings = editedSettings ? { ...latestSettings, ...editedSettings } : latestSettings;

                    result[lane].push({
                        uuid: uuid,
                        sample_id: sample.sample_id,
                        last_modified: sample.last_modified,
                        ...finalSettings
                    });
                });
            });

            return result;
        },
        columnLabel() {
            // Create a map of column keys to labels for quick lookup
            return this.availableColumns.reduce((acc, col) => {
                acc[col.key] = col.label;
                return acc;
            }, {});
        },
        hasChanges() {
            // Check if there are any unsaved changes
            return Object.keys(this.editedData).some(lane => {
                return Object.keys(this.editedData[lane] || {}).length > 0;
            });
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
                    // Reset edited data
                    this.editedData = {};
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
        },
        toggleColumn(columnKey) {
            const index = this.visibleColumns.indexOf(columnKey);
            if (index > -1) {
                this.visibleColumns.splice(index, 1);
            } else {
                this.visibleColumns.push(columnKey);
            }
        },
        isColumnVisible(columnKey) {
            return this.visibleColumns.includes(columnKey);
        },
        applyColumnPreset(preset) {
            if (preset === 'default') {
                this.visibleColumns = ['sample_id', 'last_modified', 'index_1', 'index_2', 'recipe', 'override_cycles'];
            } else if (preset === 'all') {
                this.visibleColumns = this.availableColumns.map(col => col.key);
            }
        },
        formatCellValue(value, columnKey) {
            if (columnKey === 'last_modified') {
                return this.formatTimestamp(value);
            }
            return value || 'N/A';
        },
        updateValue(lane, uuid, field, newValue) {
            // Initialize lane if it doesn't exist
            if (!this.editedData[lane]) {
                this.editedData[lane] = {};
            }
            // Initialize sample settings if it doesn't exist
            if (!this.editedData[lane][uuid]) {
                this.editedData[lane][uuid] = {};
            }

            // Get original value to compare
            const originalSample = this.calculatedLanes[lane]?.samples[uuid];
            if (originalSample) {
                const settingsVersions = Object.keys(originalSample.settings).sort().reverse();
                const latestSettings = originalSample.settings[settingsVersions[0]];
                const originalValue = latestSettings[field];

                // If value matches original, remove from edited data
                if (newValue === originalValue) {
                    delete this.editedData[lane][uuid][field];
                    // Clean up empty objects
                    if (Object.keys(this.editedData[lane][uuid]).length === 0) {
                        delete this.editedData[lane][uuid];
                    }
                    if (Object.keys(this.editedData[lane]).length === 0) {
                        delete this.editedData[lane];
                    }
                } else {
                    // Store the edited value
                    this.editedData[lane][uuid][field] = newValue;
                }
            } else {
                // No original found, just store the value
                this.editedData[lane][uuid][field] = newValue;
            }
        },
        saveChanges() {
            if (!this.hasChanges) {
                this.error_messages.push('No changes to save.');
                return;
            }

            this.error_messages = [];
            this.saving = true;

            // Prepare the data to send to the API
            // Convert editedData to the format expected by the backend
            const payload = {
                flowcell_id: this.flowcell_id,
                edited_settings: this.editedData  // { lane: { uuid: settings_object } }
            };

            axios.post(`/api/v1/demux_sample_info/${this.flowcell_id}`, payload)
                .then(response => {
                    // Refresh the data after successful save
                    this.demux_data = response.data;
                    // Clear edited data after successful save
                    this.editedData = {};
                    this.saving = false;
                    // Show success message
                    alert('Changes saved successfully!');
                })
                .catch(error => {
                    this.error_messages.push('Error saving changes. Please try again or contact a system administrator.');
                    console.error(error);
                    this.saving = false;
                });
        },
        discardChanges() {
            if (confirm('Are you sure you want to discard all unsaved changes?')) {
                // Clear all edited data
                this.editedData = {};
            }
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
                                    <label for="flowcell_id" class="form-label">Flowcell ID (if in doubt use 494d04a8ff2c4a44661da5330a0f93e7)</label>
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
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3 class="mb-0">Calculated Samples (by Lane)</h3>
                                <div v-if="hasChanges">
                                    <button
                                        class="btn btn-success me-2"
                                        @click="saveChanges"
                                        :disabled="saving">
                                        <span v-if="saving" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {{ saving ? 'Saving...' : 'Save Changes' }}
                                    </button>
                                    <button
                                        class="btn btn-secondary"
                                        @click="discardChanges"
                                        :disabled="saving">
                                        Discard Changes
                                    </button>
                                </div>
                            </div>

                            <!-- Column Configuration Menu -->
                            <div class="card mt-3 mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0">Column Configuration</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="mb-3">
                                                <label class="form-label">Presets:</label>
                                                <div class="btn-group" role="group">
                                                    <input type="radio" class="btn-check" name="columnPreset" id="presetDefault" value="default" @change="applyColumnPreset('default')" autocomplete="off" checked>
                                                    <label class="btn btn-outline-primary" for="presetDefault">Default</label>

                                                    <input type="radio" class="btn-check" name="columnPreset" id="presetAll" value="all" @change="applyColumnPreset('all')" autocomplete="off">
                                                    <label class="btn btn-outline-primary" for="presetAll">All</label>
                                                </div>
                                            </div>
                                            <p class="text-muted mb-2">Select columns to display:</p>
                                            <div class="d-flex flex-wrap gap-2">
                                                <div v-for="column in availableColumns" :key="column.key" class="form-check form-check-inline">
                                                    <input
                                                        class="form-check-input"
                                                        type="checkbox"
                                                        :id="'col-' + column.key"
                                                        :value="column.key"
                                                        :checked="isColumnVisible(column.key)"
                                                        @change="toggleColumn(column.key)">
                                                    <label class="form-check-label" :for="'col-' + column.key">
                                                        {{ column.label }}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tables per Lane -->
                            <div v-for="(samples, lane) in calculatedSamplesFlat" :key="lane" class="mt-4">
                                <h4>Lane {{ lane }}</h4>
                                <div class="table-responsive">
                                    <table class="table table-striped table-bordered table-sm">
                                        <thead>
                                            <tr class="darkth">
                                                <th v-for="columnKey in visibleColumns" :key="columnKey">
                                                    {{ columnLabel[columnKey] }}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="sample in samples" :key="sample.uuid">
                                                <td v-for="columnKey in visibleColumns" :key="columnKey">
                                                    <code v-if="columnKey === 'index_1' || columnKey === 'index_2'">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                                                    <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
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
