// Centralized field configuration - single source of truth for all field metadata
const FIELD_CONFIG = {
    lane: {
        key: 'lane',
        label: 'Lane',
        backendKey: 'lane',
        settingsPath: ['per_sample_fields', 'Lane'],
        bulkEditable: false,
        historyDisplayName: 'Lane',
        topLevel: false
    },
    sample_id: {
        key: 'sample_id',
        label: 'Sample ID',
        backendKey: 'sample_id',
        settingsPath: ['per_sample_fields', 'Sample_ID'],
        bulkEditable: false,
        historyDisplayName: 'Sample ID',
        topLevel: false
    },
    sample_name: {
        key: 'sample_name',
        label: 'Sample Name',
        backendKey: 'sample_name',
        settingsPath: ['per_sample_fields', 'Sample_Name'],
        bulkEditable: false,
        historyDisplayName: 'Sample Name',
        topLevel: false
    },
    sample_project: {
        key: 'sample_project',
        label: 'Sample Project',
        backendKey: 'sample_project',
        settingsPath: ['per_sample_fields', 'Sample_Project'],
        bulkEditable: true,
        historyDisplayName: 'Sample Project',
        topLevel: false
    },
    project_name: {
        key: 'project_name',
        label: 'Project Name',
        backendKey: 'project_name',
        settingsPath: ['_sample', 'project_name'],
        bulkEditable: false,
        historyDisplayName: 'Project Name',
        topLevel: true
    },
    project_id: {
        key: 'project_id',
        label: 'Project ID',
        backendKey: 'project_id',
        settingsPath: ['_sample', 'project_id'],
        bulkEditable: false,
        historyDisplayName: 'Project ID',
        topLevel: true
    },
    sample_ref: {
        key: 'sample_ref',
        label: 'Sample Ref',
        backendKey: 'sample_ref',
        settingsPath: ['other_details', 'sample_ref'],
        bulkEditable: true,
        historyDisplayName: 'Sample Ref',
        topLevel: false
    },
    sample_type: {
        key: 'sample_type',
        label: 'Sample Type',
        backendKey: 'sample_type',
        settingsPath: ['other_details', 'sample_type'],
        bulkEditable: false,
        historyDisplayName: 'Sample Type',
        topLevel: false
    },
    config_sources: {
        key: 'config_sources',
        label: 'Config Sources (Stage 1)',
        backendKey: 'config_sources',
        settingsPath: ['other_details', 'config_sources'],
        bulkEditable: false,
        historyDisplayName: 'Config Sources',
        topLevel: false
    },
    index_1: {
        key: 'index_1',
        label: 'Index 1',
        backendKey: 'index',
        settingsPath: ['per_sample_fields', 'index'],
        bulkEditable: false,
        historyDisplayName: 'Index 1',
        topLevel: false
    },
    index_2: {
        key: 'index_2',
        label: 'Index 2',
        backendKey: 'index2',
        settingsPath: ['per_sample_fields', 'index2'],
        bulkEditable: false,
        historyDisplayName: 'Index 2',
        topLevel: false
    },
    index_length: {
        key: 'index_length',
        label: 'Index Length',
        backendKey: 'index_length',
        settingsPath: ['other_details', 'index_length'],
        bulkEditable: false,
        historyDisplayName: 'Index Length',
        topLevel: false
    },
    umi_length: {
        key: 'umi_length',
        label: 'UMI Length',
        backendKey: 'umi_length',
        settingsPath: ['other_details', 'umi_length'],
        bulkEditable: false,
        historyDisplayName: 'UMI Length',
        topLevel: false
    },
    umi_config: {
        key: 'umi_config',
        label: 'UMI Config',
        backendKey: 'umi_config',
        settingsPath: ['other_details', 'umi_config'],
        bulkEditable: true,
        historyDisplayName: 'UMI Config',
        topLevel: false,
        type: 'object'
    },
    named_index: {
        key: 'named_index',
        label: 'Named Index',
        backendKey: 'named_index',
        settingsPath: ['other_details', 'named_index'],
        bulkEditable: false,
        historyDisplayName: 'Named Index',
        topLevel: false
    },
    recipe: {
        key: 'recipe',
        label: 'Recipe',
        backendKey: 'recipe',
        settingsPath: ['other_details', 'recipe'],
        bulkEditable: true,
        historyDisplayName: 'Recipe',
        topLevel: false
    },
    operator: {
        key: 'operator',
        label: 'Operator',
        backendKey: 'operator',
        settingsPath: ['other_details', 'operator'],
        bulkEditable: true,
        historyDisplayName: 'Operator',
        topLevel: false
    },
    description: {
        key: 'description',
        label: 'Description',
        backendKey: 'description',
        settingsPath: ['_sample', 'description'],
        bulkEditable: true,
        historyDisplayName: 'Description',
        topLevel: true
    },
    control: {
        key: 'control',
        label: 'Control',
        backendKey: 'control',
        settingsPath: ['_sample', 'control'],
        bulkEditable: true,
        historyDisplayName: 'Control',
        topLevel: true
    },
    mask_short_reads: {
        key: 'mask_short_reads',
        label: 'Mask Short Reads',
        backendKey: 'mask_short_reads',
        settingsPath: ['per_sample_fields', 'MaskShortReads'],
        bulkEditable: true,
        historyDisplayName: 'Mask Short Reads',
        topLevel: false,
        type: 'number'
    },
    minimum_trimmed_read_length: {
        key: 'minimum_trimmed_read_length',
        label: 'Min Trimmed Length',
        backendKey: 'minimum_trimmed_read_length',
        settingsPath: ['per_sample_fields', 'MinimumTrimmedReadLength'],
        bulkEditable: true,
        historyDisplayName: 'Minimum Trimmed Read Length',
        topLevel: false,
        type: 'number'
    },
    override_cycles: {
        key: 'override_cycles',
        label: 'Override Cycles',
        backendKey: 'override_cycles',
        settingsPath: ['per_sample_fields', 'OverrideCycles'],
        bulkEditable: false,
        historyDisplayName: 'Override Cycles',
        topLevel: false
    },
    last_modified: {
        key: 'last_modified',
        label: 'Last Modified',
        backendKey: 'last_modified',
        settingsPath: ['_sample', 'last_modified'],
        bulkEditable: false,
        historyDisplayName: 'Last Modified',
        topLevel: true
    },
    trim_umi: {
        key: 'trim_umi',
        label: 'Trim UMI',
        backendKey: 'trim_umi',
        settingsPath: ['raw_samplesheet_settings', 'TrimUMI'],
        bulkEditable: true,
        historyDisplayName: 'Trim UMI',
        topLevel: false,
        type: 'boolean'
    },
    create_fastq_for_index_reads: {
        key: 'create_fastq_for_index_reads',
        label: 'Create FASTQ for Index Reads',
        backendKey: 'create_fastq_for_index_reads',
        settingsPath: ['raw_samplesheet_settings', 'CreateFastqForIndexReads'],
        bulkEditable: true,
        historyDisplayName: 'Create FASTQ for Index Reads',
        topLevel: false,
        type: 'boolean'
    },
    barcode_mismatches_index1: {
        key: 'barcode_mismatches_index1',
        label: 'Barcode Mismatches Index 1',
        backendKey: 'barcode_mismatches_index1',
        settingsPath: ['raw_samplesheet_settings', 'BarcodeMismatchesIndex1'],
        bulkEditable: true,
        historyDisplayName: 'Barcode Mismatches Index 1',
        topLevel: false,
        type: 'number'
    },
    barcode_mismatches_index2: {
        key: 'barcode_mismatches_index2',
        label: 'Barcode Mismatches Index 2',
        backendKey: 'barcode_mismatches_index2',
        settingsPath: ['raw_samplesheet_settings', 'BarcodeMismatchesIndex2'],
        bulkEditable: true,
        historyDisplayName: 'Barcode Mismatches Index 2',
        topLevel: false,
        type: 'number'
    }
};
// Constants for magic strings and default values
const CONSTANTS = {
    VIEW_MODES: {
        UPLOADED: 'uploaded',
        CALCULATED: 'calculated',
        GROUPED_NAMED_INDEX: 'grouped_named_index'
    },
    MODAL_TABS: {
        EDIT: 'edit',
        ADD: 'add',
        BULK: 'bulk'
    },
    DEFAULTS: {
        CONTROL: 'N',
        MASK_SHORT_READS: 0,
        MIN_TRIMMED_LENGTH: 0
    }
};
// Utility functions for common operations
const UTILS = {
    /**
     * Sort lanes numerically instead of alphabetically
     * @param {Array<string>} lanes - Array of lane identifiers
     * @returns {Array<string>} Sorted lanes
     */
    sortLanesNumerically(lanes) {
        return lanes.sort((a, b) => parseInt(a) - parseInt(b));
    },
    /**
     * Sort object keys as lanes and return new object with sorted keys
     * @param {Object} obj - Object with lane keys
     * @returns {Object} New object with lanes sorted numerically
     */
    sortLaneObject(obj) {
        return Object.keys(obj)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .reduce((acc, lane) => {
                acc[lane] = obj[lane];
                return acc;
            }, {});
    }
};
/**
 * ConfigInspectModal Component
 *
 * Modal for inspecting sample classification configuration details and sources.
 * Shows Stage 1 (stored settings) and historical versions.
 *
 * @component
 * @emits close - Emitted when modal should be closed
 * @emits toggle-source - Emitted when config source expansion is toggled
 */
const ConfigInspectModal = {
    name: 'ConfigInspectModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        sample: {
            type: Object,
            default: null
        },
        sources: {
            type: Array,
            default: () => []
        },
        expandedSources: {
            type: Array,
            default: () => []
        },
        classificationConfig: {
            type: Object,
            default: null
        },
        sortedSettings: {
            type: Array,
            default: () => []
        },
        // Pass method functions as props
        formatTimestamp: {
            type: Function,
            required: true
        },
        formatConfigValue: {
            type: Function,
            required: true
        },
        getConfigDetails: {
            type: Function,
            required: true
        },
        traceConfigValueSource: {
            type: Function,
            required: true
        },
        formatConfigSourceLabel: {
            type: Function,
            required: true
        },
        getAllBCLConvertSettings: {
            type: Function,
            required: true
        },
        wasBCLSettingManuallyEdited: {
            type: Function,
            required: true
        }
    },
    methods: {
        close() {
            this.$emit('close');
        },
        toggleSource(index) {
            this.$emit('toggle-source', index);
        },
        isSourceExpanded(index) {
            return this.expandedSources.includes(index);
        }
    },
    template: /*html*/`
        <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fa fa-cog"></i> Sample Classification Configuration Details
                        </h5>
                        <button type="button" class="btn-close btn-close-white" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Two-Stream Architecture Info -->
                        <div class="alert alert-info" role="alert">
                            <h6 class="alert-heading"><i class="fa fa-info-circle"></i> Understanding the Two-Stream Architecture</h6>
                            <p class="mb-2 small">
                                The system uses a <strong>two-stream approach</strong> to manage sample configurations:
                            </p>
                            <ul class="small mb-2">
                                <li><strong>Stage 1: Classification & Storage</strong> - Settings shown below are calculated and stored permanently in the database based on sample properties (6-tier classification system). These are your "gold standard" settings.</li>
                                <li><strong>Stage 2: Samplesheet Generation</strong> - When creating samplesheets, additional rules are applied dynamically (e.g., excluding TrimUMI for NoIndex samples or samples without UMI config). These adjustments are <em>not</em> stored in the database.</li>
                            </ul>
                            <p class="mb-0 small">
                                <i class="fa fa-lightbulb-o"></i> <strong>Note:</strong> The settings displayed here reflect Stage 1 (stored data). To see what will actually appear in generated samplesheets after Stage 2 rules are applied, download the samplesheets from the Samplesheets tab.
                            </p>
                        </div>
                        <!-- Current Settings -->
                        <div v-if="sample && sortedSettings.length > 0" class="mb-4">
                            <h5 class="text-info">
                                <i class="fa fa-check-circle"></i> Current Settings (Stage 1: Stored in Database)
                            </h5>
                            <p class="text-muted">These settings are permanently stored and represent the calculated configuration based on sample classification:</p>
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="text-muted">{{ formatTimestamp(sortedSettings[0][0]) }}</h6>
                                    <!-- Show config sources for current version -->
                                    <div v-if="sortedSettings[0][1].other_details?.config_sources && sortedSettings[0][1].other_details.config_sources.length > 0" class="alert alert-secondary small mb-3">
                                        <strong><i class="fa fa-stream"></i> Stage 1: Configuration sources applied (stored in database):</strong>
                                        <ol class="mb-0 mt-1">
                                            <li v-for="(source, idx) in sortedSettings[0][1].other_details.config_sources" :key="idx" class="font-monospace">
                                                {{ source }}
                                            </li>
                                        </ol>
                                        <div class="mt-2 fst-italic">
                                            <i class="fa fa-info-circle"></i> These sources show how Stage 1 calculated and stored your settings. Stage 2 samplesheet generation rules may dynamically adjust these for the final output.
                                        </div>
                                    </div>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-hover">
                                            <thead class="table-light">
                                                <tr>
                                                    <th style="width: 30%">Setting Name</th>
                                                    <th style="width: 45%">Value</th>
                                                    <th style="width: 25%">Source</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><strong>Sample Type</strong></td>
                                                    <td><code>{{ sortedSettings[0][1].other_details?.sample_type || 'N/A' }}</code></td>
                                                    <td>
                                                        <span v-if="traceConfigValueSource('sample_type')" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('sample_type')) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Index Length</strong></td>
                                                    <td><code>{{ formatConfigValue(sortedSettings[0][1].other_details?.index_length) }}</code></td>
                                                    <td><span class="badge bg-secondary">actual indices</span></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>UMI Config</strong></td>
                                                    <td><code>{{ formatConfigValue(sortedSettings[0][1].other_details?.umi_config) }}</code></td>
                                                    <td>
                                                        <span v-if="traceConfigValueSource('umi_config')" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('umi_config')) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Named Indices</strong></td>
                                                    <td><code>{{ sortedSettings[0][1].other_details?.named_index || 'N/A' }}</code></td>
                                                    <td>
                                                        <span v-if="traceConfigValueSource('named_indices')" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('named_indices')) }}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr v-if="getAllBCLConvertSettings(sortedSettings[0][1]) && Object.keys(getAllBCLConvertSettings(sortedSettings[0][1])).length > 0">
                                                    <td colspan="3" class="table-secondary">
                                                        <strong>BCLConvert Settings (Stage 1: Stored)</strong>
                                                        <span class="badge bg-info ms-2 small" title="These are the calculated and stored settings. Stage 2 may dynamically exclude some settings during samplesheet generation.">Stage 1</span>
                                                    </td>
                                                </tr>
                                                <tr v-for="(value, key) in getAllBCLConvertSettings(sortedSettings[0][1])" :key="key">
                                                    <td class="ps-4">{{ key }}</td>
                                                    <td>
                                                        <code v-if="value === 'EXCLUDE'" class="text-danger" title="This value is set to EXCLUDE in stored settings (rare - typically EXCLUDE is used in Stage 2 samplesheet generation rules)">EXCLUDE</code>
                                                        <code v-else>{{ value }}</code>
                                                    </td>
                                                    <td>
                                                        <span v-if="wasBCLSettingManuallyEdited(sortedSettings[0][0], key, value)" class="badge bg-warning text-dark">
                                                            Manual Edit
                                                        </span>
                                                        <span v-else-if="traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)" class="badge bg-info">
                                                            {{ formatConfigSourceLabel(traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)) }}
                                                        </span>
                                                        <span v-else class="badge bg-secondary">default</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Configuration Source Details -->
                        <div class="mt-4 mb-4">
                            <h5 class="text-info">
                                <i class="fa fa-list"></i> Stage 1: Configuration Source Details (Stored Settings)
                            </h5>
                            <p class="text-muted mb-3">
                                Detailed information about each Stage 1 configuration source that determined the stored settings.
                                Configurations are applied in order during classification (from least specific to most specific):
                            </p>
                            <div v-if="!classificationConfig" class="text-center">
                                <div class="spinner-border text-info" role="status">
                                    <span class="visually-hidden">Loading configuration...</span>
                                </div>
                                <p class="mt-2">Loading configuration details...</p>
                            </div>
                            <div v-else>
                                <div v-for="(source, index) in sources" :key="index" class="card mb-2">
                                    <div class="card-header">
                                        <button class="btn btn-link text-start w-100 text-decoration-none d-flex align-items-center"
                                            type="button"
                                            @click="toggleSource(index)">
                                            <span class="badge bg-primary me-2">{{ index + 1 }}</span>
                                            <strong class="flex-grow-1">{{ source }}</strong>
                                            <i class="fa" :class="isSourceExpanded(index) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                                        </button>
                                    </div>
                                    <div v-show="isSourceExpanded(index)" class="card-body">
                                        <div v-if="getConfigDetails(source)">
                                            <pre class="bg-light p-3 rounded mb-0"><code>{{ formatConfigValue(getConfigDetails(source)) }}</code></pre>
                                        </div>
                                        <div v-else class="alert alert-warning mb-0">
                                            Configuration details not available for this source.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Stage 2 Information -->
                            <div class="alert alert-warning mt-3" role="alert">
                                <h6 class="alert-heading"><i class="fa fa-stream"></i> Stage 2: Samplesheet Generation Rules (Not Shown Here)</h6>
                                <p class="mb-2 small">
                                    In addition to the stored settings above, <strong>conditional rules are applied dynamically</strong> when generating samplesheets. These rules:
                                </p>
                                <ul class="small mb-2">
                                    <li>May <strong>exclude settings</strong> from the samplesheet based on sample properties (e.g., excluding TrimUMI for samples without UMI configuration)</li>
                                    <li>Are <strong>not stored</strong> in the database or tracked in config_sources</li>
                                    <li>Apply to: NoIndex samples, standard samples without UMI, IDT UMI samples without UMI config, and control samples</li>
                                </ul>
                                <p class="mb-0 small">
                                    <i class="fa fa-download"></i> <strong>To see the final samplesheet output:</strong> Download the generated samplesheets from the Samplesheets tab. They reflect both Stage 1 (stored settings) and Stage 2 (dynamic rules).
                                </p>
                            </div>
                        </div>
                        <!-- Historical Settings -->
                        <div v-if="sample && sortedSettings.length > 1" class="mt-4">
                            <h3 class="text-secondary">
                                <i class="fa fa-history"></i> Historical Settings (Stage 1: Version History)
                            </h3>
                            <p class="text-muted">Previous versions of stored settings for this sample:</p>
                            <div class="card">
                                <div class="card-body">
                                    <div v-for="[timestamp, settings] in sortedSettings.slice(1)" :key="timestamp" class="mb-4 pb-3 border-bottom">
                                        <h6 class="text-muted">{{ formatTimestamp(timestamp) }}</h6>
                                        <!-- Show config sources for this specific version -->
                                        <div v-if="settings.other_details?.config_sources && settings.other_details.config_sources.length > 0" class="alert alert-secondary small mb-3">
                                            <strong><i class="fa fa-stream"></i> Stage 1: Configuration sources applied:</strong>
                                            <ol class="mb-0 mt-1">
                                                <li v-for="(source, idx) in settings.other_details.config_sources" :key="idx" class="font-monospace">
                                                    {{ source }}
                                                </li>
                                            </ol>
                                        </div>
                                        <div class="table-responsive">
                                            <table class="table table-sm table-hover">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th style="width: 30%">Setting Name</th>
                                                        <th style="width: 45%">Value</th>
                                                        <th style="width: 25%">Source</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td><strong>Sample Type</strong></td>
                                                        <td><code>{{ settings.other_details?.sample_type || 'N/A' }}</code></td>
                                                        <td>
                                                            <span v-if="traceConfigValueSource('sample_type')" class="badge bg-info">
                                                                {{ formatConfigSourceLabel(traceConfigValueSource('sample_type')) }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Index Length</strong></td>
                                                        <td><code>{{ formatConfigValue(settings.other_details?.index_length) }}</code></td>
                                                        <td><span class="badge bg-secondary">actual indices</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>UMI Config</strong></td>
                                                        <td><code>{{ formatConfigValue(settings.other_details?.umi_config) }}</code></td>
                                                        <td>
                                                            <span v-if="traceConfigValueSource('umi_config')" class="badge bg-info">
                                                                {{ formatConfigSourceLabel(traceConfigValueSource('umi_config')) }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Named Indices</strong></td>
                                                        <td><code>{{ settings.other_details?.named_index || 'N/A' }}</code></td>
                                                        <td>
                                                            <span v-if="traceConfigValueSource('named_indices')" class="badge bg-info">
                                                                {{ formatConfigSourceLabel(traceConfigValueSource('named_indices')) }}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr v-if="getAllBCLConvertSettings(settings) && Object.keys(getAllBCLConvertSettings(settings)).length > 0">
                                                        <td colspan="3" class="table-secondary">
                                                            <strong>BCLConvert Settings (Stage 1: Stored)</strong>
                                                        </td>
                                                    </tr>
                                                    <tr v-for="(value, key) in getAllBCLConvertSettings(settings)" :key="key">
                                                        <td class="ps-4">{{ key }}</td>
                                                        <td>
                                                            <code v-if="value === 'EXCLUDE'" class="text-danger" title="This value is set to EXCLUDE in stored settings (rare - typically EXCLUDE is used in Stage 2 samplesheet generation rules)">EXCLUDE</code>
                                                            <code v-else>{{ value }}</code>
                                                        </td>
                                                        <td>
                                                            <span v-if="wasBCLSettingManuallyEdited(timestamp, key, value)" class="badge bg-warning text-dark">
                                                                Manual Edit
                                                            </span>
                                                            <span v-else-if="traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)" class="badge bg-info">
                                                                {{ formatConfigSourceLabel(traceConfigValueSource('raw_samplesheet_settings', 'raw_samplesheet_settings.' + key)) }}
                                                            </span>
                                                            <span v-else class="badge bg-secondary">default</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="close">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `
};
/**
 * CustomConfigModal Component
 * 
 * Modal for creating or editing custom BCLConvert configurations.
 * Allows targeting specific projects/lanes with custom settings.
 * 
 * @component
 * @emits close - Emitted when modal should be closed
 * @emits save - Emitted when configuration should be saved
 * @emits update:formData - Emitted when form data changes
 */
const CustomConfigModal = {
    name: 'CustomConfigModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        editMode: {
            type: Boolean,
            default: false
        },
        formData: {
            type: Object,
            required: true
        },
        availableProjects: {
            type: Array,
            default: () => []
        },
        availableLanes: {
            type: Array,
            default: () => []
        },
        targetSamples: {
            type: Array,
            default: () => []
        }
    },
    methods: {
        close() {
            this.$emit('close');
        },
        save() {
            this.$emit('save');
        },
        updateFormField(field, value) {
            this.$emit('update:formData', {
                ...this.formData,
                [field]: value
            });
        }
    },
    template: /*html*/`
        <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fa fa-magic"></i> {{ editMode ? 'Edit Custom Configuration' : 'Create Custom Configuration' }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" @click="close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Two-Stream Architecture Info -->
                        <div class="alert alert-info mb-3" role="alert">
                            <h6 class="alert-heading"><i class="fa fa-info-circle"></i> Custom Configuration: Stage 1 (Stored Settings)</h6>
                            <p class="mb-1 small">
                                Custom configurations override <strong>Stage 1</strong> settings, which are permanently stored in the database.
                                These overrides will appear in the sample's config_sources and version history.
                            </p>
                            <p class="mb-0 small">
                                <strong>Note:</strong> Stage 2 samplesheet generation rules may still dynamically adjust these settings when creating samplesheets 
                                (e.g., excluding TrimUMI for samples without UMI configuration).
                            </p>
                        </div>
                        <p class="text-muted">Define custom BCLConvert settings to override the calculated settings for specific samples.</p>
                        <!-- Config Name and Target -->
                        <div class="row mb-4">
                            <div class="col-md-12 mb-3">
                                <label for="custom_config_name" class="form-label"><strong>Configuration Name:</strong></label>
                                <input type="text" class="form-control" id="custom_config_name" 
                                    :value="formData.name" 
                                    @input="updateFormField('name', $event.target.value)"
                                    placeholder="e.g., NovaSeq X Special Settings" 
                                    :readonly="editMode">
                                <small class="form-text text-muted">
                                    <span v-if="editMode">The name cannot be changed when editing an existing configuration.</span>
                                    <span v-else>A descriptive name for this custom configuration</span>
                                </small>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label for="custom_config_target_type" class="form-label"><strong>Target Type:</strong></label>
                                <select class="form-select" id="custom_config_target_type" 
                                    :value="formData.target_type" 
                                    @input="updateFormField('target_type', $event.target.value)">
                                    <option value="project">All lanes in project</option>
                                    <option value="lane">All projects in lane</option>
                                    <option value="project_lane">Specific project + lane</option>
                                </select>
                            </div>
                            <div class="col-md-4 mb-3" v-if="formData.target_type !== 'lane'">
                                <label for="custom_config_target_project" class="form-label"><strong>Target Project:</strong></label>
                                <select class="form-select" id="custom_config_target_project" 
                                    :value="formData.target_project" 
                                    @input="updateFormField('target_project', $event.target.value)"
                                    required>
                                    <option value="">-- Select Project --</option>
                                    <option v-for="project in availableProjects" :key="project" :value="project">
                                        {{ project }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-md-4 mb-3" v-if="formData.target_type !== 'project'">
                                <label for="custom_config_target_lane" class="form-label"><strong>Target Lane:</strong></label>
                                <select class="form-select" id="custom_config_target_lane" 
                                    :value="formData.target_lane" 
                                    @input="updateFormField('target_lane', $event.target.value)">
                                    <option value="">-- Select Lane --</option>
                                    <option v-for="lane in availableLanes" :key="lane" :value="lane">
                                        Lane {{ lane }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <!-- BCLConvert Settings -->
                        <div class="row mb-4">
                            <div class="col-md-12 mb-3">
                                <hr>
                                <h6 class="mb-2">
                                    <i class="fa fa-cog"></i> BCLConvert Settings (Stage 1: Stored Overrides)
                                </h6>
                                <p class="text-muted small mb-3">
                                    Configure settings to override the calculated Stage 1 values. These will be permanently stored.
                                    Leave settings at "Do not override" to keep the automatically calculated values.
                                </p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Trim UMI:</label>
                                <div class="form-check">
                                    <input type="radio" class="form-check-input" id="custom_trim_umi_yes" 
                                        :checked="formData.trim_umi === true"
                                        @change="updateFormField('trim_umi', true)">
                                    <label class="form-check-label" for="custom_trim_umi_yes">Yes</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" class="form-check-input" id="custom_trim_umi_no" 
                                        :checked="formData.trim_umi === false"
                                        @change="updateFormField('trim_umi', false)">
                                    <label class="form-check-label" for="custom_trim_umi_no">No</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" class="form-check-input" id="custom_trim_umi_default" 
                                        :checked="formData.trim_umi === null"
                                        @change="updateFormField('trim_umi', null)">
                                    <label class="form-check-label" for="custom_trim_umi_default">Do not override</label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Create FASTQ for Index Reads:</label>
                                <div class="form-check">
                                    <input type="radio" class="form-check-input" id="custom_create_fastq_yes" 
                                        :checked="formData.create_fastq_for_index_reads === true"
                                        @change="updateFormField('create_fastq_for_index_reads', true)">
                                    <label class="form-check-label" for="custom_create_fastq_yes">Yes</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" class="form-check-input" id="custom_create_fastq_no" 
                                        :checked="formData.create_fastq_for_index_reads === false"
                                        @change="updateFormField('create_fastq_for_index_reads', false)">
                                    <label class="form-check-label" for="custom_create_fastq_no">No</label>
                                </div>
                                <div class="form-check">
                                    <input type="radio" class="form-check-input" id="custom_create_fastq_default" 
                                        :checked="formData.create_fastq_for_index_reads === null"
                                        @change="updateFormField('create_fastq_for_index_reads', null)">
                                    <label class="form-check-label" for="custom_create_fastq_default">Do not override</label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="custom_barcode_mismatches_index1" class="form-label">Barcode Mismatches Index 1:</label>
                                <input type="number" class="form-control" id="custom_barcode_mismatches_index1" 
                                    :value="formData.barcode_mismatches_index1" 
                                    @input="updateFormField('barcode_mismatches_index1', $event.target.value ? Number($event.target.value) : null)"
                                    min="0" max="2" placeholder="Do not override">
                                <small class="form-text text-muted">0-2 mismatches allowed (leave blank to not override)</small>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="custom_barcode_mismatches_index2" class="form-label">Barcode Mismatches Index 2:</label>
                                <input type="number" class="form-control" id="custom_barcode_mismatches_index2" 
                                    :value="formData.barcode_mismatches_index2" 
                                    @input="updateFormField('barcode_mismatches_index2', $event.target.value ? Number($event.target.value) : null)"
                                    min="0" max="2" placeholder="Do not override">
                                <small class="form-text text-muted">0-2 mismatches allowed (leave blank to not override)</small>
                            </div>
                        </div>
                        <!-- Preview of Affected Samples -->
                        <div v-if="targetSamples.length > 0" class="alert alert-info">
                            <h6><i class="fa fa-info-circle"></i> Affected Samples ({{ targetSamples.length }})</h6>
                            <div class="mt-2" style="max-height: 200px; overflow-y: auto;">
                                <ul class="mb-0">
                                    <li v-for="target in targetSamples.slice(0, 20)" :key="target.lane + '_' + target.uuid">
                                        Lane {{ target.lane }}: {{ target.sample_id }}
                                    </li>
                                    <li v-if="targetSamples.length > 20">
                                        ... and {{ targetSamples.length - 20 }} more
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div v-else-if="formData.target_project || formData.target_type === 'lane'" class="alert alert-warning">
                            <i class="fa fa-exclamation-triangle"></i> No samples match the selected criteria.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="save">
                            <i class="fa fa-save"></i> {{ editMode ? 'Update Configuration' : 'Create Configuration' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
/**
 * SampleFormFields Component
 * 
 * Shared form fields for editing or adding a sample.
 * Handles all common sample fields and BCLConvert settings.
 * 
 * @component
 * @emits update:modelValue - Emitted when any form field changes
 */
const SampleFormFields = {
    name: 'SampleFormFields',
    props: {
        modelValue: {
            type: Object,
            required: true
        },
        mode: {
            type: String,
            default: 'edit',
            validator: (value) => ['edit', 'add'].includes(value)
        },
        isNewSample: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        formData: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            }
        },
        sampleIdReadonly() {
            return this.mode === 'edit' && !this.isNewSample;
        },
        overrideCyclesHelp() {
            return this.mode === 'edit' 
                ? '(auto-calculated from recipe and UMI config)'
                : '(leave empty - will be calculated after saving)';
        }
    },
    methods: {
        updateField(fieldName, value) {
            this.$emit('update:modelValue', {
                ...this.modelValue,
                [fieldName]: value
            });
        },
        sanitizeIndex(value) {
            return value.toUpperCase().replace(/[^ACGT]/g, '');
        },
        onIndexInput(fieldName, event) {
            const sanitized = this.sanitizeIndex(event.target.value);
            this.updateField(fieldName, sanitized);
        }
    },
    template: /*html*/`
        <div class="row">
            <!-- Sample ID -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_sample_id'" class="form-label">Sample ID:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_sample_id'" 
                    :value="formData.sample_id"
                    @input="updateField('sample_id', $event.target.value)"
                    :readonly="sampleIdReadonly">
                <small v-if="mode === 'add'" class="form-text text-muted">
                    Replace XXXX with a 3-4 digit number (e.g., 001 or 1001)
                </small>
            </div>
            <!-- Sample Name -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_sample_name'" class="form-label">Sample Name:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_sample_name'" 
                    :value="formData.sample_name"
                    @input="updateField('sample_name', $event.target.value)">
                <small v-if="mode === 'add'" class="form-text text-muted">
                    Replace XXXX with a 3-4 digit number (e.g., 001 or 1001)
                </small>
            </div>
            <!-- Sample Project -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_sample_project'" class="form-label">Sample Project:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_sample_project'" 
                    :value="formData.sample_project"
                    @input="updateField('sample_project', $event.target.value)"
                    readonly>
            </div>
            <!-- Sample Ref -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_sample_ref'" class="form-label">Sample Ref:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_sample_ref'" 
                    :value="formData.sample_ref"
                    @input="updateField('sample_ref', $event.target.value)">
            </div>
            <!-- Index 1 -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_index_1'" class="form-label">Index 1:</label>
                <input
                    type="text"
                    class="form-control font-monospace"
                    :id="mode + '_index_1'"
                    :value="formData.index_1"
                    @input="onIndexInput('index_1', $event)"
                    pattern="[ACGT]*"
                    title="Only ACGT characters are allowed">
            </div>
            <!-- Index 2 -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_index_2'" class="form-label">Index 2:</label>
                <input
                    type="text"
                    class="form-control font-monospace"
                    :id="mode + '_index_2'"
                    :value="formData.index_2"
                    @input="onIndexInput('index_2', $event)"
                    pattern="[ACGT]*"
                    title="Only ACGT characters are allowed">
            </div>
            <!-- Named Index -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_named_index'" class="form-label">Named Index:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_named_index'" 
                    :value="formData.named_index"
                    @input="updateField('named_index', $event.target.value)">
            </div>
            <!-- Recipe -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_recipe'" class="form-label">Recipe:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_recipe'" 
                    :value="formData.recipe"
                    @input="updateField('recipe', $event.target.value)">
            </div>
            <!-- Operator -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_operator'" class="form-label">Operator:</label>
                <input 
                    type="text" 
                    class="form-control" 
                    :id="mode + '_operator'" 
                    :value="formData.operator"
                    @input="updateField('operator', $event.target.value)">
            </div>
            <!-- Control -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_control'" class="form-label">Control:</label>
                <select 
                    class="form-select" 
                    :id="mode + '_control'" 
                    :value="formData.control"
                    @input="updateField('control', $event.target.value)">
                    <option value="N">N</option>
                    <option value="Y">Y</option>
                </select>
            </div>
            <!-- Description -->
            <div class="col-md-12 mb-3">
                <label :for="mode + '_description'" class="form-label">Description:</label>
                <textarea 
                    class="form-control" 
                    :id="mode + '_description'" 
                    :value="formData.description"
                    @input="updateField('description', $event.target.value)"
                    rows="2"></textarea>
            </div>
            <!-- Override Cycles -->
            <div class="col-md-12 mb-3">
                <label :for="mode + '_override_cycles'" class="form-label">
                    Override Cycles:
                    <span class="text-muted small">{{ overrideCyclesHelp }}</span>
                </label>
                <input 
                    type="text" 
                    class="form-control font-monospace bg-light" 
                    :id="mode + '_override_cycles'" 
                    :value="formData.override_cycles"
                    @input="updateField('override_cycles', $event.target.value)"
                    readonly>
            </div>
            <!-- BCLConvert Settings Section -->
            <div class="col-md-12 mb-3">
                <hr>
                <h6 class="mb-3">
                    <i class="fa fa-cog"></i> BCLConvert Settings
                    <span class="text-muted small">(Values not included use BCLConvert defaults)</span>
                </h6>
            </div>
            <!-- Trim UMI -->
            <div class="col-md-6 mb-3">
                <label class="form-label">Trim UMI:</label>
                <div class="form-check">
                    <input 
                        type="radio" 
                        class="form-check-input" 
                        :id="mode + '_trim_umi_yes'" 
                        :name="mode + '_trim_umi'"
                        :checked="formData.trim_umi === true"
                        @change="updateField('trim_umi', true)">
                    <label class="form-check-label" :for="mode + '_trim_umi_yes'">
                        Yes
                    </label>
                </div>
                <div class="form-check">
                    <input 
                        type="radio" 
                        class="form-check-input" 
                        :id="mode + '_trim_umi_no'" 
                        :name="mode + '_trim_umi'"
                        :checked="formData.trim_umi === false"
                        @change="updateField('trim_umi', false)">
                    <label class="form-check-label" :for="mode + '_trim_umi_no'">
                        No
                    </label>
                </div>
                <div class="form-check">
                    <input 
                        type="radio" 
                        class="form-check-input" 
                        :id="mode + '_trim_umi_default'" 
                        :name="mode + '_trim_umi'"
                        :checked="formData.trim_umi === null"
                        @change="updateField('trim_umi', null)">
                    <label class="form-check-label" :for="mode + '_trim_umi_default'">
                        Do not override
                    </label>
                </div>
            </div>
            <!-- Create FASTQ for Index Reads -->
            <div class="col-md-6 mb-3">
                <label class="form-label">Create FASTQ for Index Reads:</label>
                <div class="form-check">
                    <input 
                        type="radio" 
                        class="form-check-input" 
                        :id="mode + '_create_fastq_yes'" 
                        :name="mode + '_create_fastq'"
                        :checked="formData.create_fastq_for_index_reads === true"
                        @change="updateField('create_fastq_for_index_reads', true)">
                    <label class="form-check-label" :for="mode + '_create_fastq_yes'">
                        Yes
                    </label>
                </div>
                <div class="form-check">
                    <input 
                        type="radio" 
                        class="form-check-input" 
                        :id="mode + '_create_fastq_no'" 
                        :name="mode + '_create_fastq'"
                        :checked="formData.create_fastq_for_index_reads === false"
                        @change="updateField('create_fastq_for_index_reads', false)">
                    <label class="form-check-label" :for="mode + '_create_fastq_no'">
                        No
                    </label>
                </div>
                <div class="form-check">
                    <input 
                        type="radio" 
                        class="form-check-input" 
                        :id="mode + '_create_fastq_default'" 
                        :name="mode + '_create_fastq'"
                        :checked="formData.create_fastq_for_index_reads === null"
                        @change="updateField('create_fastq_for_index_reads', null)">
                    <label class="form-check-label" :for="mode + '_create_fastq_default'">
                        Do not override
                    </label>
                </div>
            </div>
            <!-- Barcode Mismatches Index 1 -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_barcode_mismatches_index1'" class="form-label">
                    Barcode Mismatches Index 1:
                </label>
                <input 
                    type="number" 
                    class="form-control" 
                    :id="mode + '_barcode_mismatches_index1'" 
                    :value="formData.barcode_mismatches_index1"
                    @input="updateField('barcode_mismatches_index1', $event.target.value ? Number($event.target.value) : null)"
                    min="0" 
                    max="2" 
                    placeholder="Default">
                <small class="form-text text-muted">0-2 mismatches allowed (leave blank for default)</small>
            </div>
            <!-- Barcode Mismatches Index 2 -->
            <div class="col-md-6 mb-3">
                <label :for="mode + '_barcode_mismatches_index2'" class="form-label">
                    Barcode Mismatches Index 2:
                </label>
                <input 
                    type="number" 
                    class="form-control" 
                    :id="mode + '_barcode_mismatches_index2'" 
                    :value="formData.barcode_mismatches_index2"
                    @input="updateField('barcode_mismatches_index2', $event.target.value ? Number($event.target.value) : null)"
                    min="0" 
                    max="2" 
                    placeholder="Default">
                <small class="form-text text-muted">0-2 mismatches allowed (leave blank for default)</small>
            </div>
        </div>
    `
};
/**
 * SampleTable Component
 * 
 * Reusable table component for displaying samples with configurable columns.
 * Used within ProjectLaneCard to render sample data in a consistent format.
 * 
 * @component
 * @emits openConfigModal - Emitted when inspect button is clicked
 * @emits openEditModal - Emitted when edit button is clicked
 */
const SampleTable = {
    name: 'SampleTable',
    props: {
        samples: {
            type: Array,
            required: true
        },
        lane: {
            type: String,
            required: true
        },
        visibleColumns: {
            type: Array,
            required: true
        },
        columnLabel: {
            type: Object,
            required: true
        },
        calculatedLanes: {
            type: Object,
            required: true
        },
        // Methods passed from parent
        getRowClasses: {
            type: Function,
            required: true
        },
        getCellClasses: {
            type: Function,
            required: true
        },
        getEditTooltip: {
            type: Function,
            required: true
        },
        isCodeFormattedColumn: {
            type: Function,
            required: true
        },
        formatCellValue: {
            type: Function,
            required: true
        },
        getActionButtonsConfig: {
            type: Function,
            required: true
        }
    },
    template: `
        <div class="table-responsive">
            <table class="table table-sm mb-0">
                <thead>
                    <tr class="darkth">
                        <th v-for="columnKey in visibleColumns" :key="columnKey">
                            {{ columnLabel[columnKey] }}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="sample in samples" :key="sample.uuid" :class="getRowClasses(lane, sample.uuid)">
                        <td v-for="columnKey in visibleColumns" :key="columnKey"
                            :class="getCellClasses(lane, sample.uuid, columnKey)"
                            :title="getEditTooltip(lane, sample.uuid, columnKey)">
                            <code v-if="isCodeFormattedColumn(columnKey)">{{ formatCellValue(sample[columnKey], columnKey) }}</code>
                            <span v-else>{{ formatCellValue(sample[columnKey], columnKey) }}</span>
                        </td>
                        <td>
                            <button
                                class="btn btn-sm btn-outline-info"
                                @click="$emit('openConfigModal', calculatedLanes[lane].sample_rows[sample.uuid], lane)"
                                :disabled="!getActionButtonsConfig(lane, sample).inspect.enabled"
                                :title="getActionButtonsConfig(lane, sample).inspect.title">
                                <i class="fa fa-info-circle"></i> Inspect
                            </button>
                            <button
                                class="btn btn-sm btn-outline-primary ml-1"
                                @click="$emit('openEditModal', lane, sample.uuid)"
                                :title="getActionButtonsConfig(lane, sample).edit.title">
                                <i class="fa fa-pencil"></i> Edit
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};
/**
 * ProjectLaneCard Component
 * 
 * Card wrapper for displaying samples organized by project and lane.
 * Supports optional grouping by named index with expandable sections.
 * 
 * @component
 * @emits openConfigModal - Emitted when inspect button is clicked in child SampleTable
 * @emits openEditModal - Emitted when edit button is clicked in child SampleTable
 */
const ProjectLaneCard = {
    name: 'ProjectLaneCard',
    components: {
        SampleTable
    },
    props: {
        title: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            default: ''
        },
        indexGroups: {
            type: Object,
            required: true
        },
        lane: {
            type: String,
            required: true
        },
        groupByNamedIndex: {
            type: Boolean,
            required: true
        },
        visibleColumns: {
            type: Array,
            required: true
        },
        columnLabel: {
            type: Object,
            required: true
        },
        calculatedLanes: {
            type: Object,
            required: true
        },
        // Methods passed from parent
        getRowClasses: {
            type: Function,
            required: true
        },
        getCellClasses: {
            type: Function,
            required: true
        },
        getEditTooltip: {
            type: Function,
            required: true
        },
        isCodeFormattedColumn: {
            type: Function,
            required: true
        },
        formatCellValue: {
            type: Function,
            required: true
        },
        getActionButtonsConfig: {
            type: Function,
            required: true
        }
    },
    template: `
        <div class="card">
            <div class="card-header bg-light">
                <h5 class="mb-0">
                    <i v-if="icon" :class="icon"></i> {{ title }}
                    <template v-if="groupByNamedIndex">
                        <small class="text-muted">({{ Object.values(indexGroups).flat().length }} sample{{ Object.values(indexGroups).flat().length !== 1 ? 's' : '' }})</small>
                    </template>
                    <template v-else>
                        <small class="text-muted">({{ indexGroups['_all_'].length }} sample{{ indexGroups['_all_'].length !== 1 ? 's' : '' }})</small>
                    </template>
                </h5>
            </div>
            <div class="card-body p-0">
                <!-- When NOT grouped by named index -->
                <sample-table
                    v-if="!groupByNamedIndex"
                    :samples="indexGroups['_all_']"
                    :lane="lane"
                    :visible-columns="visibleColumns"
                    :column-label="columnLabel"
                    :calculated-lanes="calculatedLanes"
                    :get-row-classes="getRowClasses"
                    :get-cell-classes="getCellClasses"
                    :get-edit-tooltip="getEditTooltip"
                    :is-code-formatted-column="isCodeFormattedColumn"
                    :format-cell-value="formatCellValue"
                    :get-action-buttons-config="getActionButtonsConfig"
                    @openConfigModal="(sample, lane) => $emit('openConfigModal', sample, lane)"
                    @openEditModal="(lane, uuid) => $emit('openEditModal', lane, uuid)">
                </sample-table>
                <!-- When grouped by named index -->
                <div v-else>
                    <div v-for="(samples, namedIndex) in indexGroups" :key="namedIndex" class="mb-3">
                        <div class="px-3 py-2 bg-white border-bottom">
                            <h6 class="mb-0">
                                <i class="fa fa-tags"></i> Named Index: <strong>{{ namedIndex }}</strong>
                                <small class="text-muted">({{ samples.length }} sample{{ samples.length !== 1 ? 's' : '' }})</small>
                            </h6>
                        </div>
                        <sample-table
                            :samples="samples"
                            :lane="lane"
                            :visible-columns="visibleColumns"
                            :column-label="columnLabel"
                            :calculated-lanes="calculatedLanes"
                            :get-row-classes="getRowClasses"
                            :get-cell-classes="getCellClasses"
                            :get-edit-tooltip="getEditTooltip"
                            :is-code-formatted-column="isCodeFormattedColumn"
                            :format-cell-value="formatCellValue"
                            :get-action-buttons-config="getActionButtonsConfig"
                            @openConfigModal="(sample, lane) => $emit('openConfigModal', sample, lane)"
                            @openEditModal="(lane, uuid) => $emit('openEditModal', lane, uuid)">
                        </sample-table>
                    </div>
                </div>
            </div>
        </div>
    `
};
const vDemuxSampleInfoEditor = {
    // Register child components
    components: {
        ConfigInspectModal,
        CustomConfigModal,
        SampleFormFields,
        SampleTable,
        ProjectLaneCard
    },
    data() {
        const config = window.STATUS_CONFIG || {};
        const defaultVisibleColumns = ['sample_name', 'last_modified', 'sample_type', 'index_1', 'index_2', 'umi_config', 'recipe', 'override_cycles'];
        // Derive availableColumns from FIELD_CONFIG
        const availableColumns = Object.values(FIELD_CONFIG)
            .filter(f => !f.key.includes('trim_umi') && !f.key.includes('create_fastq') && !f.key.includes('barcode_mismatches'))
            .map(f => ({ key: f.key, label: f.label }));
        // Derive bulkEditExcludedFields from FIELD_CONFIG
        const bulkEditExcludedFields = Object.values(FIELD_CONFIG)
            .filter(f => !f.bulkEditable)
            .map(f => f.key);
        return {
            fieldConfig: FIELD_CONFIG,
            limsUrl: config.lims_url || '',
            flowcell_id: '',
            demux_data: null,
            editedData: {},  // Stores edited settings per sample: { lane: { uuid: settings_object } }
            error_messages: [],
            loading: false,
            saving: false,
            viewMode: CONSTANTS.VIEW_MODES.CALCULATED,
            selectedVersion: null,
            availableColumns: availableColumns,
            visibleColumns: defaultVisibleColumns,
            defaultVisibleColumns: defaultVisibleColumns,
            bulkEditExcludedFields: bulkEditExcludedFields,
            showBulkEditModal: false,
            showUnifiedModal: false,
            unifiedModalTab: CONSTANTS.MODAL_TABS.EDIT,
            columnConfigCollapsed: true,
            groupByNamedIndex: false,
            groupByProjectFirst: false,
            saveComment: '',
            bulkEditAction: 'reverse_complement_index1',
            bulkEditProject: '',
            bulkEditLane: 'all',
            // Add Sample specific variables
            addSampleTargetProject: '',
            addSampleTargetLanes: [],  // Multiple lanes (at least one required)
            addSampleProjectWarnings: [],  // Warnings about inconsistent values in project
            showEditModal: false,
            editModalSample: null,
            editModalLane: null,
            editModalUuid: null,
            editModalIsNew: false,
            editFormData: {},
            fieldHistory: {},
            showFieldHistory: false,
            sampleClassificationConfig: null,  // Full sample classification configuration
            showConfigModal: false,
            configModalSources: [],
            configModalSample: null,
            expandedConfigSources: [],  // Track which config sources are expanded
            showCustomConfigModal: false,
            customConfigEditMode: false,  // Track if editing existing config
            customConfigEditIndex: null,  // Track which config is being edited
            customConfigFormData: {
                name: '',
                target_type: 'project',  // 'project', 'lane', or 'project_lane'
                target_project: '',
                target_lane: '',
                trim_umi: null,
                create_fastq_for_index_reads: null,
                barcode_mismatches_index1: null,
                barcode_mismatches_index2: null
            },
            customConfigsCollapsed: true  // Track custom configs section collapse state
        }
    },
    computed: {
        uploadedSamplesByLane() {
            if (!this.demux_data || !this.demux_data.uploaded_lims_info) {
                return {};
            }
            const grouped = {};
            this.demux_data.uploaded_lims_info.forEach(sample => {
                const lane = sample.lane;
                if (!grouped[lane]) {
                    grouped[lane] = [];
                }
                grouped[lane].push(sample);
            });
            // Sort lanes numerically
            return UTILS.sortLaneObject(grouped);
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
            // Flatten calculated sample_rows with their latest settings for table display
            // If there are edits, merge them with original data
            const result = {};
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = [];
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const latestSettings = this.getLatestSettings(sample);
                    result[lane].push(this.buildSampleObject(lane, uuid, sample, latestSettings));
                });
            });
            return result;
        },
        calculatedSamplesByLaneAndProject() {
            // Group samples by lane and then by project
            const result = {};
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = {};
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const latestSettings = this.getLatestSettings(sample);
                    const projectName = sample.project_name || 'Unknown Project';
                    if (!result[lane][projectName]) {
                        result[lane][projectName] = [];
                    }
                    result[lane][projectName].push(this.buildSampleObject(lane, uuid, sample, latestSettings));
                });
            });
            return result;
        },
        calculatedSamplesByLaneProjectAndNamedIndex() {
        // Group samples by lane, then by project, then optionally by named index
            const result = {};
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                result[lane] = {};
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const latestSettings = this.getLatestSettings(sample);
                    const sampleObj = this.buildSampleObject(lane, uuid, sample, latestSettings);
                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = sampleObj.named_index || 'No Named Index';
                    if (!result[lane][projectName]) {
                        result[lane][projectName] = {};
                    }
                    // Group by named index if enabled, otherwise use a default key
                    const groupKey = this.groupByNamedIndex ? namedIndex : '_all_';
                    if (!result[lane][projectName][groupKey]) {
                        result[lane][projectName][groupKey] = [];
                    }
                    result[lane][projectName][groupKey].push(sampleObj);
                });
            });
            return result;
        },
        calculatedSamplesByProjectLaneAndNamedIndex() {
            // Group samples by project first, then by lane, then optionally by named index
            const result = {};
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const latestSettings = this.getLatestSettings(sample);
                    const sampleObj = this.buildSampleObject(lane, uuid, sample, latestSettings);
                    const projectName = sample.project_name || 'Unknown Project';
                    const namedIndex = sampleObj.named_index || 'No Named Index';
                    if (!result[projectName]) {
                        result[projectName] = {};
                    }
                    if (!result[projectName][lane]) {
                        result[projectName][lane] = {};
                    }
                    // Group by named index if enabled, otherwise use a default key
                    const groupKey = this.groupByNamedIndex ? namedIndex : '_all_';
                    if (!result[projectName][lane][groupKey]) {
                        result[projectName][lane][groupKey] = [];
                    }
                    result[projectName][lane][groupKey].push(sampleObj);
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
        },
        availableProjects() {
            // Get unique list of projects from calculated sample_rows
            // Return objects with both project name and ID
            const projectsMap = new Map();
            Object.values(this.calculatedLanes).forEach(laneData => {
                Object.values(laneData.sample_rows).forEach(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    const projectName = sample.project_name || sampleProject;
                    const projectId = sample.project_id;
                    // Use project_id as key if available, otherwise use project name
                    const key = projectId || projectName;
                    if (key && !projectsMap.has(key)) {
                        projectsMap.set(key, {
                            id: projectId || '',
                            name: projectName || '',
                            displayName: projectId && projectName ? `${projectName} (${projectId})` : (projectName || projectId)
                        });
                    }
                });
            });
            return Array.from(projectsMap.values()).sort((a, b) => {
                // Sort by project ID if available, otherwise by name
                const aKey = a.id || a.name;
                const bKey = b.id || b.name;
                return aKey.localeCompare(bKey);
            });
        },
        availableLanes() {
            // Get list of lanes
            return UTILS.sortLanesNumerically(Object.keys(this.calculatedLanes));
        },
        projectLanes() {
            // Get lanes that contain the selected project
            // Check both bulkEditProject (for bulk operations) and addSampleTargetProject (for add sample)
            const targetProject = this.bulkEditProject || this.addSampleTargetProject;
            if (!targetProject) return [];
            const lanes = new Set();
            this.getSamplesForProject(targetProject).forEach(({ lane }) => {
                lanes.add(lane);
            });
            return UTILS.sortLanesNumerically(Array.from(lanes));
        },
        isSingleLaneProject() {
            return this.projectLanes.length === 1;
        },
        nextSampleId() {
            // Generate a sample ID template with project prefix and placeholder for manual entry
            // Format: ProjectPrefix_XXXX (user must replace XXXX with 3-4 digit number)
            const targetProject = this.bulkEditProject || this.addSampleTargetProject;
            if (!targetProject) return '';
            // Find all sample names for this project to extract the project prefix
            // Use Sample_Name instead of Sample_ID to avoid "Sample_" prefix
            const projectSamples = this.getSamplesForProject(targetProject);
            // Extract project prefix (part before first underscore)
            let projectPrefix = '';
            for (const { latestSettings } of projectSamples) {
                const sampleName = latestSettings.per_sample_fields?.Sample_Name;
                if (sampleName) {
                    const underscoreIndex = sampleName.indexOf('_');
                    if (underscoreIndex > 0) {
                        projectPrefix = sampleName.substring(0, underscoreIndex);
                        break; // Use first valid prefix found
                    }
                }
            }
            // Fallback to project name if no prefix found
            if (!projectPrefix) {
                projectPrefix = targetProject;
            }
            return projectPrefix + '_XXXX';
        },
        selectedProjectDetails() {
            // Get the project_id and project_name for the selected target project
            const targetProject = this.addSampleTargetProject;
            if (!targetProject) return { id: '', name: '' };
            // Find the project details from availableProjects
            const projectDetails = this.availableProjects.find(p =>
                p.id === targetProject || p.name === targetProject
            );
            if (projectDetails) {
                return {
                    id: projectDetails.id,
                    name: projectDetails.name
                };
            }
            // Fallback: if not found in availableProjects, use targetProject as name
            return { id: '', name: targetProject };
        },
        samplesheets() {
            // Return pre-generated samplesheets from the server
            if (!this.demux_data || !this.demux_data.samplesheets) return [];
            return this.demux_data.samplesheets;
        },
        customConfigTargetSamples() {
            // Get samples that match the custom config target criteria
            if (!this.demux_data) return [];
            // For "lane" type, we don't need target_project
            const needsProject = this.customConfigFormData.target_type !== 'lane';
            if (needsProject && !this.customConfigFormData.target_project) return [];
            const matchingSamples = [];
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                // Check if lane matches (if target_type includes lane filtering)
                const laneMatches = this.customConfigFormData.target_type === 'project' ||
                    this.customConfigFormData.target_lane === lane;
                if (!laneMatches) return;
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    // For "lane" type, include all projects; otherwise check for matching project
                    const projectMatches = this.customConfigFormData.target_type === 'lane' ||
                        sampleProject === this.customConfigFormData.target_project;
                    if (projectMatches) {
                        matchingSamples.push({
                            lane,
                            uuid,
                            sample_id: latestSettings.per_sample_fields?.Sample_ID,
                            sample,
                            latestSettings
                        });
                    }
                });
            });
            return matchingSamples;
        },
        sortedConfigModalSettings() {
            // Return settings sorted by timestamp in descending order (newest first)
            if (!this.configModalSample.settings) {
                return [];
            }
            return Object.entries(this.configModalSample.settings)
                .sort((a, b) => b[0].localeCompare(a[0])); // ISO timestamps sort lexicographically
        }
    },
    watch: {
        addSampleTargetProject(newProject) {
            // Update editFormData.sample_project when target project changes
            if (this.unifiedModalTab === CONSTANTS.MODAL_TABS.ADD && this.editFormData) {
                this.editFormData.sample_project = newProject || '';
                // Update sample_id and sample_name to next ID for this project
                const nextId = this.nextSampleId;
                // Sample_ID should be prefixed with 'Sample_', Sample_Name should not
                this.editFormData.sample_id = nextId ? 'Sample_' + nextId : '';
                this.editFormData.sample_name = nextId;
                // Pre-fill form with project-based defaults and show warnings if values differ
                this.updateAddSampleFormWithProjectDefaults(newProject);
            }
        },
        addSampleTargetLanes(newLanes) {
            // Update editModalLane when lanes change
            if (this.unifiedModalTab === CONSTANTS.MODAL_TABS.ADD && newLanes.length > 0) {
                this.editModalLane = newLanes[0];
            }
        }
    },
    methods: {
        // ===== Helper Methods for Sample Object Building (Refactoring #1) =====
        /**
         * Get the latest settings for a sample
         * @param {Object} sample - The sample object
         * @returns {Object} The latest settings object
         */
        getLatestSettings(sample) {
            if (!sample || !sample.settings) return {};
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            return sample.settings[settingsVersions[0]] || {};
        },
        // ===== Helper Methods for Project/Lane Matching (Refactoring #4) =====
        /**
         * Check if a sample matches a target project
         * @param {Object} sample - The sample object
         * @param {Object} latestSettings - The latest settings for the sample
         * @param {string} targetProject - The project identifier to match against
         * @returns {boolean} True if the sample belongs to the target project
         */
        projectMatches(sample, latestSettings, targetProject) {
            const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
            const projectId = sample.project_id;
            const projectName = sample.project_name;
            return sampleProject === targetProject || 
                   projectId === targetProject || 
                   projectName === targetProject;
        },
        /**
         * Get all samples that belong to a specific project
         * @param {string} targetProject - The project identifier
         * @param {string|null} filterLane - Optional lane filter
         * @returns {Array} Array of objects with {lane, uuid, sample, latestSettings}
         */
        getSamplesForProject(targetProject, filterLane = null) {
            const samples = [];
            Object.entries(this.calculatedLanes).forEach(([lane, laneData]) => {
                if (filterLane && lane !== filterLane) return;
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const latestSettings = this.getLatestSettings(sample);
                    if (this.projectMatches(sample, latestSettings, targetProject)) {
                        samples.push({ lane, uuid, sample, latestSettings });
                    }
                });
            });
            return samples;
        },
        // ===== Helper Methods for Bulk Field Handling (Refactoring #3) =====
        /**
         * Get a field value from a sample's settings based on the field configuration
         * @param {Object} sample - The sample object
         * @param {Object} settings - The settings object
         * @param {Array} settingsPath - Path to the field in settings
         * @param {boolean} topLevel - Whether the field is at the top level of sample
         * @returns {*} The field value
         */
        getFieldValueFromSettings(sample, settings, settingsPath, topLevel = false) {
            if (topLevel) {
                // Top-level field on sample object (e.g., description, control)
                return sample[settingsPath[1]];
            }
            // Nested field in settings
            let value = settings;
            for (const key of settingsPath) {
                value = value?.[key];
            }
            return value;
        },
        /**
         * Normalize a value for comparison (converts to string representation)
         * @param {*} value - The value to normalize
         * @param {string} type - The field type
         * @returns {string} Normalized value as string
         */
        normalizeForComparison(value, type) {
            if (value === undefined || value === null) return 'null';
            if (type === 'boolean' || type === 'number') return String(value);
            if (type === 'object') return JSON.stringify(value);
            return value;
        },
        /**
         * Denormalize a value back from string representation
         * @param {string} value - The normalized value
         * @param {string} type - The field type
         * @returns {*} The denormalized value
         */
        denormalizeValue(value, type) {
            if (value === 'null') return null;
            if (type === 'boolean') return value === 'true';
            if (type === 'number') return parseInt(value);
            if (type === 'object') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return null;
                }
            }
            return value;
        },
        /**
         * Get default value for a field
         * @param {string} fieldKey - The field key
         * @returns {*} Default value
         */
        getDefaultValue(fieldKey) {
            const defaults = {
                'sample_ref': '',
                'recipe': '',
                'operator': '',
                'control': 'N',
                'description': '',
                'mask_short_reads': 0,
                'minimum_trimmed_read_length': 0,
                'umi_config': null,
                'trim_umi': null,
                'create_fastq_for_index_reads': null,
                'barcode_mismatches_index1': null,
                'barcode_mismatches_index2': null
            };
            return defaults[fieldKey];
        },
        /**
         * Build a complete sample object with all fields, merging original and edited data
         * @param {string} lane - The lane number
         * @param {string} uuid - The sample UUID
         * @param {Object} sample - The raw sample object
         * @param {Object} latestSettings - The latest settings for the sample
         * @returns {Object} Complete sample object ready for display
         */
        buildSampleObject(lane, uuid, sample, latestSettings) {
            const editedSettings = this.editedData[lane]?.[uuid] || {};
            const per_sample_fields = latestSettings.per_sample_fields || {};
            const other_details = latestSettings.other_details || {};
            // Helper to get value from either edited or original
            const getValue = (editedKey, originalValue) => {
                return editedSettings[editedKey] !== undefined 
                    ? editedSettings[editedKey] 
                    : originalValue;
            };
            // Build the complete sample object
            return {
                uuid: uuid,
                lane: per_sample_fields.Lane,
                sample_id: getValue('sample_id', per_sample_fields.Sample_ID),
                sample_name: getValue('sample_name', per_sample_fields.Sample_Name),
                sample_project: getValue('sample_project', per_sample_fields.Sample_Project),
                project_name: sample.project_name,
                project_id: sample.project_id,
                last_modified: sample.last_modified,
                sample_ref: getValue('sample_ref', other_details.sample_ref),
                sample_type: other_details.sample_type,
                config_sources: other_details.config_sources,
                index_1: getValue('index_1', per_sample_fields.index),
                index_2: getValue('index_2', per_sample_fields.index2),
                index_length: other_details.index_length,
                umi_config: other_details.umi_config,
                named_index: getValue('named_index', other_details.named_index),
                recipe: getValue('recipe', other_details.recipe),
                operator: getValue('operator', other_details.operator),
                description: getValue('description', sample.description),
                control: getValue('control', sample.control),
                mask_short_reads: per_sample_fields.MaskShortReads,
                minimum_trimmed_read_length: per_sample_fields.MinimumTrimmedReadLength,
                override_cycles: getValue('override_cycles', per_sample_fields.OverrideCycles)
            };
        },
        // ===== End Helper Methods =====
        // ===== Template Helper Methods (Refactoring #6) =====
        /**
         * Check if a cell should show code formatting (for index columns)
         * @param {string} columnKey - The column key
         * @returns {boolean} True if cell should use code formatting
         */
        isCodeFormattedColumn(columnKey) {
            return columnKey === 'index_1' || columnKey === 'index_2';
        },
        /**
         * Get CSS classes for a table cell
         * @param {string} lane - The lane number
         * @param {string} uuid - The sample UUID
         * @param {string} columnKey - The column key
         * @returns {Object} Object with class names as keys and boolean values
         */
        getCellClasses(lane, uuid, columnKey) {
            return {
                'bg-info': this.isFieldEdited(lane, uuid, columnKey)
            };
        },
        /**
         * Get configuration for action buttons for a sample
         * @param {string} lane - The lane number
         * @param {Object} sample - The sample object
         * @returns {Object} Configuration object for buttons
         */
        getActionButtonsConfig(lane, sample) {
            const hasConfigSources = Array.isArray(sample.config_sources) && sample.config_sources.length > 0;
            return {
                inspect: {
                    enabled: hasConfigSources,
                    title: hasConfigSources 
                        ? 'View Stage 1 configuration details (stored settings)' 
                        : 'No configuration sources available',
                    onClick: () => this.openConfigModal(this.calculatedLanes[lane].sample_rows[sample.uuid], lane)
                },
                edit: {
                    enabled: true,
                    title: 'Edit sample',
                    onClick: () => this.openEditModal(lane, sample.uuid)
                }
            };
        },
        /**
         * Get the sample count text with proper pluralization
         * @param {number} count - Number of samples
         * @returns {string} Formatted count text
         */
        getSampleCountText(count) {
            return `${count} sample${count !== 1 ? 's' : ''}`;
        },
        /**
         * Check if a sample row should be highlighted
         * @param {string} lane - The lane number
         * @param {string} uuid - The sample UUID
         * @returns {Object} Object with class names
         */
        getRowClasses(lane, uuid) {
            return {
                'table-info': this.isSampleEdited(lane, uuid)
            };
        },
        // ===== End Template Helper Methods =====
        fetchSampleClassificationConfig() {
            // Fetch full sample classification configuration from the API
            if (this.sampleClassificationConfig) return; // Already loaded
            axios.get('/api/v1/sample_classification_config')
                .then(response => {
                    this.sampleClassificationConfig = response.data;
                })
                .catch(error => {
                    console.error('Failed to load sample classification config:', error);
                });
        },
        updateAddSampleFormWithProjectDefaults(targetProject) {
            // Pre-fill bulk-editable fields from existing project samples and warn if values differ
            this.addSampleProjectWarnings = [];
            if (!targetProject || !this.editFormData) {
                // Reset fields to defaults when no project is selected
                if (this.editFormData) {
                    // Use FIELD_CONFIG to reset all bulk-editable fields
                    Object.values(FIELD_CONFIG)
                        .filter(f => f.bulkEditable)
                        .forEach(fieldConfig => {
                            this.editFormData[fieldConfig.key] = this.getDefaultValue(fieldConfig.key);
                        });
                }
                return {};
            }
            // Collect all samples from this project using helper method
            const projectSamplesData = this.getSamplesForProject(targetProject);
            const projectSamples = projectSamplesData.map(({ sample, latestSettings }) => ({
                sample,
                settings: latestSettings
            }));
            if (projectSamples.length > 0) {
                // Get all bulk-editable fields from FIELD_CONFIG
                const bulkEditableFields = Object.values(FIELD_CONFIG)
                    .filter(f => f.bulkEditable && f.key !== 'sample_project'); // Exclude sample_project
                const fieldData = {};
                // For each bulk-editable field, collect values from all project samples
                bulkEditableFields.forEach(fieldConfig => {
                    const values = new Set();
                    projectSamples.forEach(({ sample, settings }) => {
                        const value = this.getFieldValueFromSettings(
                            sample,
                            settings,
                            fieldConfig.settingsPath,
                            fieldConfig.topLevel
                        );
                        // Normalize value for comparison
                        const normalizedValue = this.normalizeForComparison(
                            value !== undefined ? value : this.getDefaultValue(fieldConfig.key),
                            fieldConfig.type
                        );
                        values.add(normalizedValue);
                    });
                    const uniqueValues = Array.from(values);
                    // Check for inconsistency
                    if (uniqueValues.length > 1) {
                        const valuesDisplay = uniqueValues
                            .map(v => v === '' || v === 'null' ? '(empty)' : v)
                            .join(', ');
                        this.addSampleProjectWarnings.push(
                            `${fieldConfig.label}: Inconsistent values (${valuesDisplay})`
                        );
                    }
                    // Store the first (or only) value, denormalized
                    fieldData[fieldConfig.key] = this.denormalizeValue(
                        uniqueValues[0],
                        fieldConfig.type
                    );
                });
                // Update the edit form with these defaults
                Object.entries(fieldData).forEach(([key, value]) => {
                    this.editFormData[key] = value !== undefined && value !== null 
                        ? value 
                        : this.getDefaultValue(key);
                });
            }
            return {};
        },
        openConfigModal(sample, lane) {
            // Open modal to show config sources and their details
            const configSources = this.getConfigSources(sample);
            this.configModalSources = configSources;
            this.configModalSample = sample;
            this.expandedConfigSources = [];  // All cards collapsed by default
            this.showConfigModal = true;
            // Fetch config if not already loaded
            this.fetchSampleClassificationConfig();
        },
        closeConfigModal() {
            this.showConfigModal = false;
            this.configModalSources = [];
            this.configModalSample = null;
            this.expandedConfigSources = [];
        },
        openCustomConfigModal(configToEdit = null, configIndex = null) {
            // Open modal to create or edit custom configuration
            if (configToEdit) {
                // Edit mode - populate form with existing config
                this.customConfigEditMode = true;
                this.customConfigEditIndex = configIndex;
                this.customConfigFormData = {
                    name: configToEdit.name,
                    target_type: configToEdit.target_type,
                    target_project: configToEdit.target_project,
                    target_lane: configToEdit.target_lane || '',
                    trim_umi: configToEdit.raw_samplesheet_settings?.TrimUMI ?? null,
                    create_fastq_for_index_reads: configToEdit.raw_samplesheet_settings?.CreateFastqForIndexReads ?? null,
                    barcode_mismatches_index1: configToEdit.raw_samplesheet_settings?.BarcodeMismatchesIndex1 ?? null,
                    barcode_mismatches_index2: configToEdit.raw_samplesheet_settings?.BarcodeMismatchesIndex2 ?? null
                };
            } else {
                // Create mode - reset form
                this.customConfigEditMode = false;
                this.customConfigEditIndex = null;
                this.customConfigFormData = {
                    name: '',
                    target_type: 'project',
                    target_project: '',
                    target_lane: '',
                    trim_umi: null,
                    create_fastq_for_index_reads: null,
                    barcode_mismatches_index1: null,
                    barcode_mismatches_index2: null
                };
            }
            this.showCustomConfigModal = true;
        },
        closeCustomConfigModal() {
            this.showCustomConfigModal = false;
            // Reset the form state to prevent issues when reopening
            this.customConfigEditMode = false;
            this.customConfigEditIndex = null;
            this.customConfigFormData = {
                name: '',
                target_type: 'project',
                target_project: '',
                target_lane: '',
                trim_umi: null,
                create_fastq_for_index_reads: null,
                barcode_mismatches_index1: null,
                barcode_mismatches_index2: null
            };
        },
        saveCustomConfig() {
            // Validate inputs
            if (!this.customConfigFormData.name) {
                alert('Please provide a name for this custom configuration.');
                return;
            }
            // Target project is only required for 'project' and 'project_lane' types
            if ((this.customConfigFormData.target_type === 'project' || this.customConfigFormData.target_type === 'project_lane')
                && !this.customConfigFormData.target_project) {
                alert('Please select a target project.');
                return;
            }
            if ((this.customConfigFormData.target_type === 'lane' || this.customConfigFormData.target_type === 'project_lane')
                && !this.customConfigFormData.target_lane) {
                alert('Please select a target lane.');
                return;
            }
            // Check if at least one BCLConvert setting is configured
            const hasSettings = this.customConfigFormData.trim_umi !== null ||
                this.customConfigFormData.create_fastq_for_index_reads !== null ||
                this.customConfigFormData.barcode_mismatches_index1 !== null ||
                this.customConfigFormData.barcode_mismatches_index2 !== null;
            if (!hasSettings) {
                alert('Please configure at least one BCLConvert setting.');
                return;
            }
            // Build the custom config object
            const customConfig = {
                name: this.customConfigFormData.name,
                target_type: this.customConfigFormData.target_type,
                raw_samplesheet_settings: {},
                edit_mode: this.customConfigEditMode,
                edit_index: this.customConfigEditIndex
            };
            // Add target_project only if it's provided (not needed for "lane" type)
            if (this.customConfigFormData.target_project) {
                customConfig.target_project = this.customConfigFormData.target_project;
            }
            if (this.customConfigFormData.target_type !== 'project') {
                customConfig.target_lane = this.customConfigFormData.target_lane;
            }
            // Add only non-null BCLConvert settings
            if (this.customConfigFormData.trim_umi !== null) {
                customConfig.raw_samplesheet_settings.TrimUMI = this.customConfigFormData.trim_umi;
            }
            if (this.customConfigFormData.create_fastq_for_index_reads !== null) {
                customConfig.raw_samplesheet_settings.CreateFastqForIndexReads = this.customConfigFormData.create_fastq_for_index_reads;
            }
            if (this.customConfigFormData.barcode_mismatches_index1 !== null) {
                customConfig.raw_samplesheet_settings.BarcodeMismatchesIndex1 = this.customConfigFormData.barcode_mismatches_index1;
            }
            if (this.customConfigFormData.barcode_mismatches_index2 !== null) {
                customConfig.raw_samplesheet_settings.BarcodeMismatchesIndex2 = this.customConfigFormData.barcode_mismatches_index2;
            }
            // Send to backend
            this.error_messages = [];
            const payload = {
                flowcell_id: this.flowcell_id,
                custom_config: customConfig
            };
            axios.post(`/api/v1/demux_sample_info/${this.flowcell_id}/custom_config`, payload)
                .then(response => {
                    // Refresh the data after successful save
                    this.demux_data = response.data;
                    this.closeCustomConfigModal();
                    const action = this.customConfigEditMode ? 'updated' : 'created';
                    alert(`Custom configuration ${action} successfully!`);
                })
                .catch(error => {
                    this.error_messages.push('Error saving custom configuration. Please try again.');
                    console.error(error);
                });
        },
        toggleConfigSource(index) {
            // Toggle the expanded state of a config source
            const idx = this.expandedConfigSources.indexOf(index);
            if (idx > -1) {
                this.expandedConfigSources.splice(idx, 1);
            } else {
                this.expandedConfigSources.push(index);
            }
        },
        isConfigSourceExpanded(index) {
            // Check if a config source is expanded
            return this.expandedConfigSources.includes(index);
        },
        // ===== Config Source Parsing Helpers (Refactoring #5) =====
        /**
         * Get conditional rules for a given category and tier path
         * @param {string} category - The category (patterns, control_patterns, etc.)
         * @param {Array} tierParts - The tier path parts
         * @returns {Object|null} The conditional rules object
         */
        getConditionalRulesForCategory(category, tierParts) {
            const config = this.sampleClassificationConfig;
            switch (category) {
                case 'control_patterns':
                    return config.control_conditional_rules;
                case 'patterns':
                    const patternKey = tierParts[1];
                    return config.patterns?.[patternKey]?.conditional_rules;
                case 'other_general_sample_types':
                    const typeKey = tierParts[1];
                    return config.other_general_sample_types?.[typeKey]?.conditional_rules;
                case 'library_method_mapping':
                    const methodKey = tierParts.slice(1).join('.');
                    return config.library_method_mapping?.[methodKey]?.conditional_rules;
                case 'instrument_type_mapping':
                    return this.getInstrumentTypeConditionalRules(tierParts);
                default:
                    return null;
            }
        },
        /**
         * Get conditional rules for instrument type mappings
         * @param {Array} tierParts - The tier path parts
         * @returns {Object|null} The conditional rules object
         */
        getInstrumentTypeConditionalRules(tierParts) {
            const instrumentType = tierParts[1];
            const config = this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType];
            if (!config) return null;
            if (tierParts.length === 2) {
                // Instrument type level
                return config.conditional_rules;
            } else if (tierParts.length === 4 && tierParts[2] === 'run_modes') {
                // Run mode level
                const runMode = tierParts[3];
                return config.run_modes?.[runMode]?.conditional_rules;
            }
            return null;
        },
        /**
         * Parse a conditional rule from a config source string
         * @param {string} configSource - The config source string
         * @returns {Object|null} Parsed conditional rule or null
         */
        parseConditionalRule(configSource) {
            const parts = configSource.split('.conditional_rule.');
            if (parts.length !== 2) return null;
            const tierPath = parts[0];
            const ruleSpec = parts[1];
            const [settingName, ruleName] = ruleSpec.split(':');
            const tierParts = tierPath.split('.');
            const category = tierParts[0];
            const conditionalRules = this.getConditionalRulesForCategory(category, tierParts);
            if (conditionalRules && conditionalRules[settingName]) {
                const rule = conditionalRules[settingName].find(r => r.name === ruleName);
                if (rule) {
                    return {
                        _type: 'conditional_rule',
                        setting_name: settingName,
                        rule_name: ruleName,
                        rule: rule,
                        tier_path: tierPath
                    };
                }
            }
            return null;
        },
        /**
         * Parse instrument type configuration
         * @param {Array} restParts - The remaining path parts after 'instrument_type_mapping'
         * @returns {Object|null} The instrument type config or null
         */
        parseInstrumentTypeConfig(restParts) {
            const instrumentType = restParts[0];
            const config = this.sampleClassificationConfig.instrument_type_mapping?.[instrumentType];
            if (!config) return null;
            if (restParts.length === 1) {
                return config;
            } else if (restParts.length === 3 && restParts[1] === 'run_modes') {
                const runMode = restParts[2];
                return config.run_modes?.[runMode];
            }
            return null;
        },
        /**
         * Parse custom configuration
         * @param {string} configName - The custom config name
         * @returns {Object|null} The custom config or null
         */
        parseCustomConfig(configName) {
            if (!this.demux_data?.custom_configs) return null;
            return this.demux_data.custom_configs.find(c => c.name === configName) || null;
        },
        /**
         * Parse standard configuration (non-conditional, non-instrument, non-custom)
         * @param {string} category - The config category
         * @param {string} key - The config key
         * @returns {*} The configuration value
         */
        parseStandardConfig(category, key) {
            const config = this.sampleClassificationConfig;
            switch (category) {
                case 'bcl_convert_settings':
                    return config.bcl_convert_settings?.[key];
                case 'patterns':
                    return config.patterns?.[key];
                case 'other_general_sample_types':
                    return config.other_general_sample_types?.[key];
                case 'library_method_mapping':
                    return config.library_method_mapping?.[key];
                case 'control_patterns':
                    return { control_patterns: config.control_patterns };
                default:
                    return null;
            }
        },
        // ===== End Config Source Parsing Helpers =====
        getConfigDetails(configSource) {
            // Parse config source and return the configuration details
            if (!this.sampleClassificationConfig) return null;
            // Handle conditional rules specially
            if (configSource.includes('.conditional_rule.')) {
                return this.parseConditionalRule(configSource);
            }
            const parts = configSource.split('.');
            if (parts.length < 2) return null;
            const category = parts[0];
            const key = parts.slice(1).join('.');
            // Handle special categories
            if (category === 'instrument_type_mapping') {
                return this.parseInstrumentTypeConfig(parts.slice(1));
            }
            if (category === 'custom_config') {
                return this.parseCustomConfig(key);
            }
            // Handle standard configurations
            return this.parseStandardConfig(category, key);
        },
        formatConfigValue(value) {
            // Format configuration value for display
            if (value === null || value === undefined) {
                return 'null';
            }
            // Special handling for conditional rule objects
            if (typeof value === 'object' && value._type === 'conditional_rule') {
                const rule = value.rule;
                const parts = [];
                parts.push(`Setting: ${value.setting_name}`);
                parts.push(`Rule: ${value.rule_name}`);
                if (rule.description) {
                    parts.push(`Description: ${rule.description}`);
                }
                parts.push(`Action: ${rule.action}`);
                parts.push(`Value: ${JSON.stringify(rule.value)}`);
                parts.push(`Conditions: ${JSON.stringify(rule.conditions, null, 2)}`);
                return parts.join('\n');
            }
            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return String(value);
        },
        traceConfigValueSource(configKey, path = null) {
            // Trace which config source set a specific value
            // configKey can be 'sample_type', 'umi_config', 'named_indices', or 'raw_samplesheet_settings'
            // path is for nested values like 'raw_samplesheet_settings.BarcodeMismatchesIndex1'
            if (!this.configModalSources || !this.sampleClassificationConfig) return null;
            let lastSource = null;
            // Go through config sources in order
            for (const source of this.configModalSources) {
                // Special handling for conditional rules
                if (source.includes('.conditional_rule.')) {
                    // Extract setting name from conditional rule source
                    // Format: "patterns.idt_umi.conditional_rule.TrimUMI:exclude_if_no_umi_detected"
                    const conditionalRuleParts = source.split('.conditional_rule.');
                    if (conditionalRuleParts.length === 2) {
                        const ruleSpec = conditionalRuleParts[1]; // e.g., "TrimUMI:exclude_if_no_umi_detected"
                        const [settingName] = ruleSpec.split(':');
                        // Check if this conditional rule sets the setting we're looking for
                        if (path) {
                            // For raw_samplesheet_settings.TrimUMI, check if settingName matches
                            const pathParts = path.split('.');
                            if (pathParts[0] === 'raw_samplesheet_settings' && pathParts[1] === settingName) {
                                lastSource = source;
                            }
                        }
                    }
                    continue; // Skip the rest of processing for conditional rules
                }
                const config = this.getConfigDetails(source);
                if (!config) continue;
                if (path) {
                    // For nested paths like raw_samplesheet_settings.BarcodeMismatchesIndex1
                    const [topKey, ...restPath] = path.split('.');
                    let value = config[topKey];
                    for (const key of restPath) {
                        if (value && typeof value === 'object') {
                            value = value[key];
                        } else {
                            value = undefined;
                            break;
                        }
                    }
                    if (value !== undefined && value !== null) {
                        lastSource = source;
                    }
                } else {
                    // For top-level keys
                    if (config[configKey] !== undefined && config[configKey] !== null) {
                        lastSource = source;
                    }
                }
            }
            return lastSource;
        },
        getValueWithSource(configKey, value, path = null) {
            // Get a formatted display of value with its source
            const source = this.traceConfigValueSource(configKey, path);
            const sourceIndex = source ? this.configModalSources.indexOf(source) + 1 : null;
            return {
                value: value,
                source: source,
                sourceIndex: sourceIndex
            };
        },
        getAllBCLConvertSettings(sampleSettings) {
            // Get all BCLConvert settings including defaults from schema
            const allSettings = {};
            // If config is loaded, start with defaults
            if (this.sampleClassificationConfig) {
                const bclConvertDefaults = this.sampleClassificationConfig.bcl_convert_settings?.raw_samplesheet_settings || {};
                for (const [key, config] of Object.entries(bclConvertDefaults)) {
                    if (config.default !== undefined) {
                        allSettings[key] = config.default;
                    }
                }
            }
            // Override with actual settings from the sample (including EXCLUDE values)
            if (sampleSettings?.raw_samplesheet_settings) {
                Object.assign(allSettings, sampleSettings.raw_samplesheet_settings);
            }
            return allSettings;
        },
        isSettingsManuallyEdited(timestamp) {
            // Check if the settings at the given timestamp were manually edited
            if (!this.demux_data?.calculated?.version_history) return false;
            const versionInfo = this.demux_data.calculated.version_history[timestamp];
            if (!versionInfo) return false;
            // Manual edits have autogenerated: false
            return versionInfo.autogenerated === false;
        },
        wasBCLSettingManuallyEdited(timestamp, settingKey, currentValue) {
            // Check if a specific BCLConvert_Setting was manually changed from its original value
            if (!this.isSettingsManuallyEdited(timestamp)) return false;
            // Get the sample that has this timestamp
            const sample = this.configModalSample;
            if (!sample || !sample.settings) return false;
            // Get all timestamps sorted (oldest first)
            const timestamps = Object.keys(sample.settings).sort();
            if (timestamps.length < 2) return false; // No edits if only one version
            // Get the original (first) raw_samplesheet_settings
            const originalSettings = sample.settings[timestamps[0]].raw_samplesheet_settings || {};
            const originalValue = originalSettings[settingKey];
            // If current value differs from original, it was manually edited
            return currentValue !== originalValue;
        },
        getSamplesheetBCLSettings(settings) {
            // Helper method to get BCLConvert settings for samplesheet display
            return this.getAllBCLConvertSettings(settings);
        },
        formatConfigSourceLabel(source) {
            // Format config source string into readable label
            if (!source) return null;
            // Handle conditional rules specially
            if (source.includes('.conditional_rule.')) {
                const conditionalRuleParts = source.split('.conditional_rule.');
                if (conditionalRuleParts.length === 2) {
                    const ruleSpec = conditionalRuleParts[1]; // e.g., "TrimUMI:exclude_if_no_umi_detected"
                    const [settingName, ruleName] = ruleSpec.split(':');
                    return `Conditional rule: ${settingName} (${ruleName})`;
                }
            }
            const parts = source.split('.');
            const category = parts[0];
            if (category === 'patterns') {
                return `Pattern: ${parts[1]}`;
            } else if (category === 'library_method_mapping') {
                return `Library method: ${parts.slice(1).join('.')}`;
            } else if (category === 'instrument_type_mapping') {
                if (parts.length === 2) {
                    return `Instrument type: ${parts[1]}`;
                } else if (parts.length === 4 && parts[2] === 'run_modes') {
                    return `Run mode: ${parts[3]}`;
                }
                return `Instrument: ${parts.slice(1).join('.')}`;
            } else if (category === 'other_general_sample_types') {
                return `General type: ${parts[1]}`;
            } else if (category === 'control_patterns') {
                return 'Control pattern';
            } else if (category === 'custom_config') {
                return `Custom: ${parts.slice(1).join('.')}`;
            } else if (category === 'bcl_convert_settings') {
                return `Default: ${parts.slice(1).join('.')}`;
            }
            return source;
        },
        fetchDemuxInfo(updateHistory = true) {
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
                    // Update URL in browser history
                    if (updateHistory) {
                        const newUrl = `${window.location.pathname}?flowcell=${encodeURIComponent(this.flowcell_id)}`;
                        history.pushState({ flowcell: this.flowcell_id }, '', newUrl);
                    }
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
        backToList() {
            // Return to the flowcell list page
            window.location.href = '/y_flowcells';
        },
        formatTimestamp(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp).toLocaleString();
        },
        getSampleSettings(sampleUuid, lane) {
            if (!this.calculatedLanes[lane] || !this.calculatedLanes[lane].sample_rows[sampleUuid]) {
                return null;
            }
            const sample = this.calculatedLanes[lane].sample_rows[sampleUuid];
            // Get settings for the current version or the latest
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            return sample.settings[settingsVersions[0]];
        },
        toggleColumn(columnKey) {
            // Prevent toggling off mandatory columns
            if (columnKey === 'sample_id') return;
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
                this.visibleColumns = [...this.defaultVisibleColumns];
            } else if (preset === 'all') {
                this.visibleColumns = this.availableColumns.map(col => col.key);
            }
        },
        formatCellValue(value, columnKey) {
            if (columnKey === 'last_modified') {
                return this.formatTimestamp(value);
            }
            if (columnKey === 'config_sources') {
                // Format config_sources array as numbered list
                if (Array.isArray(value)) {
                    return value.map((src, i) => `${i + 1}. ${src}`).join(' → ');
                }
                return value || 'N/A';
            }
            if (columnKey === 'index_length' || columnKey === 'umi_length') {
                // Format array as "i7/i5" notation
                if (Array.isArray(value)) {
                    return `[${value[0]}, ${value[1]}]`;
                }
                return 'N/A';
            }
            if (columnKey === 'umi_config') {
                // Format umi_config object as a compact string
                if (typeof value === 'object' && value !== null) {
                    const parts = [];
                    for (const [key, config] of Object.entries(value)) {
                        if (config.length > 0) {
                            parts.push(`${key}:${config.position}(${config.length})`);
                        }
                    }
                    return parts.length > 0 ? parts.join(', ') : 'No UMIs';
                }
                return 'N/A';
            }
            return value || 'N/A';
        },
        isFieldEditable(columnKey) {
            // Determine which fields should be editable
            // Start with index fields, can expand to others later
            const editableFields = ['index_1', 'index_2', 'sample_name', 'sample_ref', 'named_index', 'description', 'operator', 'override_cycles'];
            return editableFields.includes(columnKey);
        },
        isFieldEdited(lane, uuid, field) {
            // Check if a specific field has been edited
            return this.editedData[lane]?.[uuid]?.[field] !== undefined;
        },
        isSampleEdited(lane, uuid) {
            // Check if any field in the sample has been edited
            return this.editedData[lane]?.[uuid] && Object.keys(this.editedData[lane][uuid]).length > 0;
        },
        getOriginalValue(lane, uuid, field) {
            // Get the original value before any edits
            const laneData = this.calculatedLanes[lane];
            if (!laneData || !laneData.sample_rows[uuid]) return null;
            const sample = laneData.sample_rows[uuid];
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];
            return latestSettings[field];
        },
        getEditTooltip(lane, uuid, field) {
            // Generate tooltip text showing before and after values
            if (!this.isFieldEdited(lane, uuid, field)) return '';
            const originalValue = this.getOriginalValue(lane, uuid, field) || 'N/A';
            const newValue = this.editedData[lane][uuid][field] || 'N/A';
            return `Before: ${originalValue}\nAfter: ${newValue}`;
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
            // Map frontend field names to backend storage locations
            const fieldMapping = {
                'sample_id': ['per_sample_fields', 'Sample_ID'],
                'sample_name': ['per_sample_fields', 'Sample_Name'],
                'sample_project': ['per_sample_fields', 'Sample_Project'],
                'project_id': ['sample_row', 'project_id'],
                'project_name': ['sample_row', 'project_name'],
                'index_1': ['per_sample_fields', 'index'],
                'index_2': ['per_sample_fields', 'index2'],
                'sample_ref': ['other_details', 'sample_ref'],
                'named_index': ['other_details', 'named_index'],
                'recipe': ['other_details', 'recipe'],
                'operator': ['other_details', 'operator'],
                'override_cycles': ['per_sample_fields', 'OverrideCycles'],
                'trim_umi': ['raw_samplesheet_settings', 'TrimUMI'],
                'create_fastq_for_index_reads': ['raw_samplesheet_settings', 'CreateFastqForIndexReads'],
                'barcode_mismatches_index1': ['raw_samplesheet_settings', 'BarcodeMismatchesIndex1'],
                'barcode_mismatches_index2': ['raw_samplesheet_settings', 'BarcodeMismatchesIndex2'],
                'control': ['sample_row', 'control'],
                'description': ['sample_row', 'description']
            };
            // Get original value to compare
            const originalSample = this.calculatedLanes[lane]?.sample_rows[uuid];
            if (originalSample) {
                const settingsVersions = Object.keys(originalSample.settings).sort().reverse();
                const latestSettings = originalSample.settings[settingsVersions[0]];
                let originalValue;
                // Get the original value from the correct location
                if (fieldMapping[field]) {
                    const [section, key] = fieldMapping[field];
                    if (section === 'sample_row') {
                        // Top-level sample field
                        originalValue = originalSample[key];
                    } else {
                        // Settings field
                        originalValue = latestSettings[section]?.[key];
                    }
                } else {
                    // Fallback for unmapped fields
                    originalValue = latestSettings[field];
                }
                // Normalize null/undefined/empty string for comparison
                // For raw_samplesheet_settings numeric fields, null, undefined, and empty string all mean "not set"
                let normalizedOriginal = originalValue === undefined ? null : originalValue;
                let normalizedNew = newValue === undefined ? null : newValue;
                // Also normalize empty strings and NaN to null for numeric fields
                if (field === 'barcode_mismatches_index1' || field === 'barcode_mismatches_index2') {
                    if (normalizedNew === '' || Number.isNaN(normalizedNew)) {
                        normalizedNew = null;
                    }
                    if (normalizedOriginal === '' || Number.isNaN(normalizedOriginal)) {
                        normalizedOriginal = null;
                    }
                }
                // If value matches original, remove from edited data
                if (normalizedNew === normalizedOriginal) {
                    delete this.editedData[lane][uuid][field];
                    // Clean up empty objects
                    if (Object.keys(this.editedData[lane][uuid]).length === 0) {
                        delete this.editedData[lane][uuid];
                    }
                    if (Object.keys(this.editedData[lane]).length === 0) {
                        delete this.editedData[lane];
                    }
                } else {
                    // Store the edited value (use normalized value to ensure consistency)
                    this.editedData[lane][uuid][field] = normalizedNew;
                }
            } else {
                // No original found, normalize value for consistency
                let normalizedNew = newValue === undefined ? null : newValue;
                if (field === 'barcode_mismatches_index1' || field === 'barcode_mismatches_index2') {
                    if (normalizedNew === '' || Number.isNaN(normalizedNew)) {
                        normalizedNew = null;
                    }
                }
                this.editedData[lane][uuid][field] = normalizedNew;
            }
        },
        saveChanges() {
            if (!this.hasChanges) {
                this.error_messages.push('No changes to save.');
                return;
            }
            this.error_messages = [];
            this.saving = true;
            // Map frontend field names to backend field names using FIELD_CONFIG
            const frontendToBackendFieldMap = Object.values(FIELD_CONFIG).reduce((map, fieldConfig) => {
                map[fieldConfig.key] = fieldConfig.backendKey;
                return map;
            }, {});
            // Transform editedData to use backend field names
            const transformedEditedData = {};
            Object.entries(this.editedData).forEach(([lane, samples]) => {
                transformedEditedData[lane] = {};
                Object.entries(samples).forEach(([uuid, fields]) => {
                    transformedEditedData[lane][uuid] = {};
                    Object.entries(fields).forEach(([frontendField, value]) => {
                        const backendField = frontendToBackendFieldMap[frontendField] || frontendField;
                        transformedEditedData[lane][uuid][backendField] = value;
                    });
                });
            });
            // Prepare the data to send to the API
            const payload = {
                flowcell_id: this.flowcell_id,
                edited_settings: transformedEditedData,  // { lane: { uuid: settings_object } }
                comment: this.saveComment || ''  // Optional user comment
            };
            axios.put(`/api/v1/demux_sample_info/${this.flowcell_id}`, payload)
                .then(response => {
                    // Refresh the data after successful save
                    this.demux_data = response.data;
                    // Clear edited data and comment after successful save
                    this.editedData = {};
                    this.saveComment = '';
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
        },
        getConfigSources(sample) {
            // Extract config_sources from the sample's latest settings
            if (!sample || !sample.settings) return [];
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];
            const other_details = latestSettings.other_details || {};
            return other_details.config_sources || [];
        },
        computeFieldHistory(sample) {
            // Compute the history of changes for each field
            if (!sample || !sample.settings) return {};
            const history = {};
            const settingsVersions = Object.keys(sample.settings).sort(); // oldest first
            // Build field paths from FIELD_CONFIG
            const fieldPaths = Object.values(FIELD_CONFIG)
                .filter(f => f.historyDisplayName) // Only fields with history display
                .reduce((map, fieldConfig) => {
                    // Convert settingsPath to the format used by history tracking
                    let path = [...fieldConfig.settingsPath];
                    if (fieldConfig.topLevel) {
                        // Top-level fields on sample object
                        path = ['_sample', fieldConfig.settingsPath[1]];
                    }
                    map[fieldConfig.historyDisplayName] = path;
                    return map;
                }, {});
            // Track the history for each field
            Object.entries(fieldPaths).forEach(([displayName, path]) => {
                const changes = [];
                let previousValue = undefined;
                settingsVersions.forEach(timestamp => {
                    const settings = sample.settings[timestamp];
                    let currentValue;
                    if (path[0] === '_sample') {
                        // Top-level field on sample
                        currentValue = sample[path[1]];
                    } else {
                        // Nested field in settings
                        const section = settings[path[0]];
                        currentValue = section?.[path[1]];
                    }
                    // Only track if value changed
                    if (currentValue !== previousValue) {
                        changes.push({
                            timestamp: timestamp,
                            value: currentValue === undefined || currentValue === null ? '(not set)' : currentValue,
                            rawValue: currentValue
                        });
                        previousValue = currentValue;
                    }
                });
                // Only include fields that actually changed (more than 1 value)
                if (changes.length > 1) {
                    history[displayName] = changes;
                }
            });
            return history;
        },
        formatTimestamp(timestamp) {
            // Format ISO timestamp to human-readable format
            // Format: "YYYY-MM-DD HH:MM:SS"
            try {
                const date = new Date(timestamp);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            } catch (e) {
                return timestamp;
            }
        },
        openBulkEditModal() {
            this.showUnifiedModal = true;
            this.unifiedModalTab = CONSTANTS.MODAL_TABS.BULK;
            this.bulkEditProject = '';
            this.bulkEditLane = '';
            this.bulkEditAction = 'reverse_complement_index1';
        },
        updateProjectLaneSelection() {
            // When project changes, update lane selection
            if (this.isSingleLaneProject) {
                this.bulkEditLane = this.projectLanes[0];
            } else if (this.projectLanes.length > 0) {
                this.bulkEditLane = 'all';
            } else {
                this.bulkEditLane = '';
            }
        },
        closeBulkEditModal() {
            this.showBulkEditModal = false;
            this.showUnifiedModal = false;
        },
        closeUnifiedModal() {
            this.showUnifiedModal = false;
            this.editModalSample = null;
        },
        openEditModal(lane, uuid) {
            // Open edit modal for an existing sample
            const laneData = this.calculatedLanes[lane];
            if (!laneData || !laneData.sample_rows[uuid]) return;
            this.showUnifiedModal = true;
            this.unifiedModalTab = CONSTANTS.MODAL_TABS.EDIT;
            const sample = laneData.sample_rows[uuid];
            const settingsVersions = Object.keys(sample.settings).sort().reverse();
            const latestSettings = sample.settings[settingsVersions[0]];
            // Check if there are already edits for this sample
            const currentSettings = this.editedData[lane]?.[uuid] || {};
            // Populate form data with current values (edited or original)
            this.editFormData = {
                sample_id: currentSettings.sample_id || latestSettings.per_sample_fields?.Sample_ID,
                sample_name: currentSettings.sample_name || latestSettings.per_sample_fields?.Sample_Name,
                sample_project: currentSettings.sample_project || latestSettings.per_sample_fields?.Sample_Project,
                sample_ref: currentSettings.sample_ref || latestSettings.other_details?.sample_ref,
                index_1: currentSettings.index_1 || latestSettings.per_sample_fields?.index || '',
                index_2: currentSettings.index_2 || latestSettings.per_sample_fields?.index2 || '',
                named_index: currentSettings.named_index || latestSettings.other_details?.named_index || '',
                recipe: currentSettings.recipe || latestSettings.other_details?.recipe || '',
                operator: currentSettings.operator || latestSettings.other_details?.operator || '',
                description: currentSettings.description || sample.description || '',
                control: currentSettings.control || sample.control || 'N',
                override_cycles: currentSettings.override_cycles || latestSettings.per_sample_fields?.OverrideCycles || '',
                trim_umi: currentSettings.trim_umi !== undefined ? currentSettings.trim_umi : (latestSettings.raw_samplesheet_settings?.TrimUMI !== undefined ? latestSettings.raw_samplesheet_settings.TrimUMI : null),
                create_fastq_for_index_reads: currentSettings.create_fastq_for_index_reads !== undefined ? currentSettings.create_fastq_for_index_reads : (latestSettings.raw_samplesheet_settings?.CreateFastqForIndexReads !== undefined ? latestSettings.raw_samplesheet_settings.CreateFastqForIndexReads : null),
                barcode_mismatches_index1: currentSettings.barcode_mismatches_index1 !== undefined ? currentSettings.barcode_mismatches_index1 : (latestSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex1 !== undefined ? latestSettings.raw_samplesheet_settings.BarcodeMismatchesIndex1 : null),
                barcode_mismatches_index2: currentSettings.barcode_mismatches_index2 !== undefined ? currentSettings.barcode_mismatches_index2 : (latestSettings.raw_samplesheet_settings?.BarcodeMismatchesIndex2 !== undefined ? latestSettings.raw_samplesheet_settings.BarcodeMismatchesIndex2 : null)
            };
            this.editModalLane = lane;
            this.editModalUuid = uuid;
            this.editModalSample = sample;
            this.editModalIsNew = false;
            this.showFieldHistory = false;
            // Compute field history
            this.fieldHistory = this.computeFieldHistory(sample);
        },
        openEditModalForNewSample(lane = null, project = null) {
            // Open edit modal for a new sample
            // Initialize add sample selections based on what was provided
            if (lane && project) {
                // Both provided (from specific context)
                this.addSampleTargetLanes = [lane];
                this.addSampleTargetProject = project;
            } else if (lane) {
                // Only lane provided
                this.addSampleTargetLanes = [lane];
                this.addSampleTargetProject = '';
            } else if (project) {
                // Only project provided - get lanes for this project
                this.addSampleTargetProject = project;
                // projectLanes computed property will populate based on project
                this.addSampleTargetLanes = [];
            } else {
                // Nothing provided, start fresh
                this.addSampleTargetProject = '';
                this.addSampleTargetLanes = [];
            }
            const newSampleId = this.nextSampleId;
            // Generate a new UUID for the sample
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            // Populate form data with empty defaults initially
            this.editFormData = {
                sample_id: newSampleId,
                sample_name: newSampleId,
                sample_project: this.addSampleTargetProject,
                sample_ref: '',
                index_1: '',
                index_2: '',
                named_index: '',
                recipe: '',
                operator: '',
                description: '',
                control: CONSTANTS.DEFAULTS.CONTROL,
                override_cycles: '',
                mask_short_reads: CONSTANTS.DEFAULTS.MASK_SHORT_READS,
                minimum_trimmed_read_length: CONSTANTS.DEFAULTS.MIN_TRIMMED_LENGTH,
                umi_config: null,
                trim_umi: null,
                create_fastq_for_index_reads: null,
                barcode_mismatches_index1: null,
                barcode_mismatches_index2: null
            };
            // Pre-fill bulk-editable fields from project samples (if project is set)
            this.updateAddSampleFormWithProjectDefaults(this.addSampleTargetProject);
            this.editModalLane = this.addSampleTargetLanes[0] || null;
            this.editModalUuid = uuid;
            this.editModalSample = null;
            this.editModalIsNew = true;
            this.showUnifiedModal = true;
            this.unifiedModalTab = CONSTANTS.MODAL_TABS.ADD;
        },
        closeEditModal() {
            this.showEditModal = false;
            this.showUnifiedModal = false;
            this.editModalSample = null;
            this.editModalLane = null;
            this.editModalUuid = null;
            this.editModalIsNew = false;
            this.editFormData = {};
            this.fieldHistory = {};
            this.showFieldHistory = false;
        },
        saveEditModal() {
            // Validation for Add Sample tab
            if (this.unifiedModalTab === CONSTANTS.MODAL_TABS.ADD) {
                if (this.addSampleTargetLanes.length === 0) {
                    alert('Please select at least one target lane.');
                    return;
                }
                // Validate Sample ID format: Sample_ProjectPrefix_XXXX where XXXX is 3-4 digits
                const sampleId = this.editFormData.sample_id;
                const sampleName = this.editFormData.sample_name;
                // Sample ID should start with "Sample_"
                if (!sampleId.startsWith('Sample_')) {
                    alert('Sample ID must start with "Sample_" (e.g., Sample_P12345_1001)');
                    return;
                }
                // Remove "Sample_" prefix to get the project part
                const sampleIdWithoutPrefix = sampleId.substring(7); // Remove "Sample_"
                const lastUnderscoreIndex = sampleIdWithoutPrefix.lastIndexOf('_');
                if (lastUnderscoreIndex <= 0) {
                    alert('Sample ID must have format: Sample_ProjectPrefix_XXXX (e.g., Sample_P12345_1001)');
                    return;
                }
                const numPartId = sampleIdWithoutPrefix.substring(lastUnderscoreIndex + 1);
                if (!/^\d{3,4}$/.test(numPartId)) {
                    alert('Sample ID must have 3 or 4 digits after the last underscore (e.g., Sample_P12345_001 or Sample_P12345_1001).\nPlease replace XXXX with your sample number.');
                    return;
                }
                // Validate Sample Name format: ProjectPrefix_XXXX (without "Sample_" prefix)
                const lastUnderscoreIndexName = sampleName.lastIndexOf('_');
                if (lastUnderscoreIndexName <= 0) {
                    alert('Sample Name must have format: ProjectPrefix_XXXX (e.g., P12345_1001)');
                    return;
                }
                const numPartName = sampleName.substring(lastUnderscoreIndexName + 1);
                if (!/^\d{3,4}$/.test(numPartName)) {
                    alert('Sample Name must have 3 or 4 digits after the last underscore (e.g., P12345_001 or P12345_1001).\nPlease replace XXXX with your sample number.');
                    return;
                }
                // Check that Sample ID and Sample Name match (Sample ID = "Sample_" + Sample Name)
                if (sampleId !== 'Sample_' + sampleName) {
                    alert('Sample ID must be "Sample_" + Sample Name.\nSample ID: ' + sampleId + '\nShould be: Sample_' + sampleName);
                    return;
                }
            }
            // Save the edited sample data
            const lane = this.editModalLane;
            const uuid = this.editModalUuid;
            if (this.editModalIsNew && this.unifiedModalTab === CONSTANTS.MODAL_TABS.ADD) {
                // Use the selected lanes
                const targetLanes = this.addSampleTargetLanes;
                const timestamp = new Date().toISOString();
                const projectDetails = this.selectedProjectDetails;
                const newSettings = {
                    ...this.editFormData,
                    sample_project: this.addSampleTargetProject || undefined,
                    project_id: projectDetails.id || undefined,
                    project_name: projectDetails.name || undefined,
                    flowcell_id: this.flowcell_id,
                    mask_short_reads: 0,
                    minimum_trimmed_read_length: 0
                };
                // Add sample to all target lanes
                targetLanes.forEach(targetLane => {
                    const laneSpecificSettings = {
                        ...newSettings,
                        lane: targetLane
                    };
                    // Add to editedData
                    if (!this.editedData[targetLane]) {
                        this.editedData[targetLane] = {};
                    }
                    this.editedData[targetLane][uuid] = laneSpecificSettings;
                    // Add to the actual data structure for immediate display
                    if (!this.demux_data.calculated.lanes[targetLane]) {
                        this.demux_data.calculated.lanes[targetLane] = { sample_rows: {} };
                    }
                    this.demux_data.calculated.lanes[targetLane].sample_rows[uuid] = {
                        sample_id: laneSpecificSettings.sample_id,
                        project_id: projectDetails.id,
                        project_name: projectDetails.name,
                        last_modified: timestamp,
                        settings: {
                            [timestamp]: laneSpecificSettings
                        }
                    };
                });
                if (targetLanes.length === 1) {
                    alert(`Added new sample ${newSettings.sample_id} to lane ${targetLanes[0]}`);
                } else {
                    alert(`Added new sample ${newSettings.sample_id} to ${targetLanes.length} lanes: ${targetLanes.map(l => 'Lane ' + l).join(', ')}`);
                }
            } else if (this.editModalIsNew) {
                // Add new sample to the data structure (legacy path)
                const timestamp = new Date().toISOString();
                const projectDetails = this.selectedProjectDetails;
                const newSettings = {
                    ...this.editFormData,
                    project_id: projectDetails.id || undefined,
                    project_name: projectDetails.name || undefined,
                    lane: lane,
                    flowcell_id: this.flowcell_id,
                    mask_short_reads: 0,
                    minimum_trimmed_read_length: 0
                };
                // Add to editedData
                if (!this.editedData[lane]) {
                    this.editedData[lane] = {};
                }
                this.editedData[lane][uuid] = newSettings;
                // Add to the actual data structure for immediate display
                if (!this.demux_data.calculated.lanes[lane]) {
                    this.demux_data.calculated.lanes[lane] = { sample_rows: {} };
                }
                this.demux_data.calculated.lanes[lane].sample_rows[uuid] = {
                    sample_id: newSettings.sample_id,
                    project_id: projectDetails.id,
                    project_name: projectDetails.name,
                    last_modified: timestamp,
                    settings: {
                        [timestamp]: newSettings
                    }
                };
                alert(`Added new sample ${newSettings.sample_id} to lane ${lane}`);
            } else {
                // Update existing sample - only save changed fields
                Object.keys(this.editFormData).forEach(field => {
                    let newValue = this.editFormData[field];
                    // Sanitize raw_samplesheet_settings number fields: convert NaN or empty string to null
                    if (field === 'barcode_mismatches_index1' || field === 'barcode_mismatches_index2') {
                        if (newValue === '' || Number.isNaN(newValue)) {
                            newValue = null;
                        }
                    }
                    this.updateValue(lane, uuid, field, newValue);
                });
                alert(`Updated sample in lane ${lane}`);
            }
            this.closeEditModal();
        },
        reverseComplement(sequence) {
            // Reverse complement a DNA sequence
            const complement = {
                'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C',
                'a': 't', 't': 'a', 'c': 'g', 'g': 'c',
                'N': 'N', 'n': 'n'
            };
            return sequence.split('').reverse().map(base => complement[base] || base).join('');
        },
        applyBulkEdit() {
            if (!this.bulkEditProject) {
                alert('Please select a project.');
                return;
            }
            let editCount = 0;
            const lanesToEdit = this.bulkEditLane === 'all' ? this.projectLanes : [this.bulkEditLane];
            lanesToEdit.forEach(lane => {
                const laneData = this.calculatedLanes[lane];
                if (!laneData) return;
                Object.entries(laneData.sample_rows).forEach(([uuid, sample]) => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    const projectId = sample.project_id;
                    const projectName = sample.project_name;
                    // Check if this sample matches the selected project
                    if (sampleProject === this.bulkEditProject || projectId === this.bulkEditProject || projectName === this.bulkEditProject) {
                        if (this.bulkEditAction === 'reverse_complement_index1') {
                            const currentIndex = this.editedData[lane]?.[uuid]?.index_1 || latestSettings.per_sample_fields?.index;
                            if (currentIndex) {
                                const newIndex = this.reverseComplement(currentIndex);
                                this.updateValue(lane, uuid, 'index_1', newIndex);
                                editCount++;
                            }
                        } else if (this.bulkEditAction === 'reverse_complement_index2') {
                            const currentIndex = this.editedData[lane]?.[uuid]?.index_2 || latestSettings.per_sample_fields?.index2;
                            if (currentIndex) {
                                const newIndex = this.reverseComplement(currentIndex);
                                this.updateValue(lane, uuid, 'index_2', newIndex);
                                editCount++;
                            }
                        }
                    }
                });
            });
            alert(`Applied ${this.bulkEditAction} to ${editCount} sample(s) in project ${this.bulkEditProject}`);
            this.closeBulkEditModal();
        },
        addNewSample() {
            const newSampleId = this.nextSampleId;
            const lane = this.bulkEditLane;
            // Generate a new UUID for the sample
            const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            // Get template settings from an existing sample in the same project
            let templateSettings = null;
            Object.values(this.calculatedLanes).some(laneData => {
                return Object.values(laneData.sample_rows).some(sample => {
                    const settingsVersions = Object.keys(sample.settings).sort().reverse();
                    const latestSettings = sample.settings[settingsVersions[0]];
                    const sampleProject = latestSettings.per_sample_fields?.Sample_Project;
                    const projectId = sample.project_id;
                    const projectName = sample.project_name;
                    // Match against Sample_Project, project_id, or project_name
                    if (sampleProject === this.bulkEditProject || projectId === this.bulkEditProject || projectName === this.bulkEditProject) {
                        templateSettings = { ...latestSettings };
                        return true;
                    }
                });
            });
            // Create new sample settings
            const timestamp = new Date().toISOString();
            const newSettings = templateSettings ? {
                ...templateSettings,
                sample_id: newSampleId,
                sample_name: newSampleId,
                lane: lane
            } : {
                sample_id: newSampleId,
                sample_name: newSampleId,
                    sample_project: this.bulkEditProject,
                sample_ref: '',
                index_1: '',
                index_2: '',
                named_index: '',
                recipe: '',
                operator: '',
                description: '',
                control: 'N',
                mask_short_reads: 0,
                minimum_trimmed_read_length: 0,
                override_cycles: '',
                lane: lane,
                flowcell_id: this.flowcell_id
            };
            // Add to editedData (which will be sent to backend on save)
            if (!this.editedData[lane]) {
                this.editedData[lane] = {};
            }
            this.editedData[lane][uuid] = newSettings;
            // Also add to the actual data structure for immediate display
            if (!this.demux_data.calculated.lanes[lane]) {
                this.demux_data.calculated.lanes[lane] = { sample_rows: {} };
            }
            this.demux_data.calculated.lanes[lane].sample_rows[uuid] = {
                sample_id: newSampleId,
                last_modified: timestamp,
                settings: {
                    [timestamp]: newSettings
                }
            };
            alert(`Added new sample ${newSampleId} to lane ${lane}`);
            this.closeBulkEditModal();
        },
        generateSamplesheetContent(samplesheet) {
            // Convert JSON samplesheet to Illumina v2 CSV format
            const lines = [];
            // [Header] section
            lines.push('[Header]');
            for (const [key, value] of Object.entries(samplesheet.Header)) {
                lines.push(`${key},${value}`);
            }
            lines.push('');
            // [BCLConvert_Settings] section
            lines.push('[BCLConvert_Settings]');
            // Add BCLConvert settings in standard order
            const settingsOrder = ['SoftwareVersion', 'MinimumTrimmedReadLength', 'MaskShortReads'];
            for (const key of settingsOrder) {
                if (samplesheet.raw_samplesheet_settings[key] !== undefined) {
                    lines.push(`${key},${samplesheet.raw_samplesheet_settings[key]}`);
                }
            }
            // Add remaining settings
            for (const [key, value] of Object.entries(samplesheet.raw_samplesheet_settings)) {
                if (!settingsOrder.includes(key)) {
                    lines.push(`${key},${value}`);
                }
            }
            lines.push('');
            // [BCLConvert_Data] section
            lines.push('[BCLConvert_Data]');
            lines.push('Lane,Sample_ID,Sample_Name,index,index2,Sample_Project,OverrideCycles');
            // Add sample rows
            for (const sample of samplesheet.BCLConvert_Data) {
                lines.push(`${sample.Lane},${sample.Sample_ID},${sample.Sample_Name},${sample.index},${sample.index2},${sample.Sample_Project},${sample.OverrideCycles}`);
            }
            return lines.join('\n');
        },
        downloadSamplesheet(samplesheet) {
            // Convert JSON samplesheet to CSV and download
            const content = this.generateSamplesheetContent(samplesheet);
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', samplesheet.filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        handlePopState(event) {
            // Handle browser back/forward buttons
            const urlParams = new URLSearchParams(window.location.search);
            const flowcellId = urlParams.get('flowcell');
            if (flowcellId) {
                this.flowcell_id = flowcellId;
                this.fetchDemuxInfo(false); // false = don't push to history again
            } else {
                // Clear data if no flowcell in URL
                this.flowcell_id = '';
                this.demux_data = null;
                this.error_messages = [];
            }
        }
    },
    mounted() {
        // Check if flowcell ID is in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const flowcellId = urlParams.get('flowcell');
        if (flowcellId) {
            this.flowcell_id = flowcellId;
            this.fetchDemuxInfo(false); // false = don't push to history on initial load
        }
        // Listen for browser back/forward navigation
        window.addEventListener('popstate', this.handlePopState);
    },
    unmounted() {
        // Clean up event listener
        window.removeEventListener('popstate', this.handlePopState);
    },
    template: 
        /*html*/`
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <h1>Y Flowcells</h1>
                    <!-- Input form (shown when no flowcell loaded) -->
                    <div v-if="!demux_data" class="card mt-4 mb-4">
                        <div class="card-body">
                            <p class="mb-3">
                                <a href="/y_flowcells" class="btn btn-sm btn-outline-primary">
                                    <i class="fa fa-list me-1"></i> View Flowcell List
                                </a>
                            </p>
                            <label class="form-label"><strong>Enter a flowcell ID:</strong></label>
                                <div class="row g-2 align-items-end">
                                    <div class="col-auto flex-grow-1">
                                        <input
                                            type="text"
                                            class="form-control"
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
                        <!-- Back button -->
                        <div class="mb-3">
                            <button class="btn btn-outline-secondary" @click="backToList">
                                <i class="fa fa-arrow-left mr-2"></i>Back to Flowcell List
                            </button>
                        </div>
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
                                    <dt class="col-sm-3">Run Setup:</dt>
                                    <dd class="col-sm-9">{{ demux_data.metadata.run_setup || 'N/A' }}</dd>
                                    <dt class="col-sm-3">Setup LIMS Step ID:</dt>
                                    <dd class="col-sm-9">
                                        <a v-if="demux_data.metadata.setup_lims_step_id && limsUrl"
                                           :href="limsUrl + '/clarity/work-complete/' + demux_data.metadata.setup_lims_step_id"
                                           target="_blank"
                                           rel="noopener noreferrer">
                                            {{ demux_data.metadata.setup_lims_step_id }}
                                        </a>
                                        <span v-else>{{ demux_data.metadata.setup_lims_step_id || 'N/A' }}</span>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                        <!-- Tabs Navigation -->
                        <ul class="nav nav-tabs mt-4" role="tablist">
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === CONSTANTS.VIEW_MODES.CALCULATED }"
                                    @click.prevent="viewMode = CONSTANTS.VIEW_MODES.CALCULATED"
                                    href="#">
                                    By Lane
                                </a>
                            </li>
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === CONSTANTS.VIEW_MODES.UPLOADED }"
                                    @click.prevent="viewMode = CONSTANTS.VIEW_MODES.UPLOADED"
                                    href="#">
                                    Uploaded Info
                                </a>
                            </li>
                            <li class="nav-item" role="presentation" v-if="versionTimestamps.length > 0">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === 'history' }"
                                    @click.prevent="viewMode = 'history'"
                                    href="#">
                                    Version History
                                </a>
                            </li>
                            <li class="nav-item" role="presentation">
                                <a
                                    class="nav-link"
                                    :class="{ active: viewMode === 'samplesheets' }"
                                    @click.prevent="viewMode = 'samplesheets'"
                                    href="#">
                                    Samplesheets
                                    <span class="badge bg-primary ms-1">{{ samplesheets.length }}</span>
                                </a>
                            </li>
                        </ul>
                        <!-- Tab Content -->
                        <div class="tab-content mt-3">
                            <!-- Uploaded Info tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === CONSTANTS.VIEW_MODES.UPLOADED }">
                                <h3>Uploaded Info from LIMS</h3>
                                <div v-for="(sample_rows, lane) in uploadedSamplesByLane" :key="lane" class="mt-3">
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
                                            <tr v-for="(sample, index) in sample_rows" :key="index">
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
                            <!-- Calculated Samples tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === CONSTANTS.VIEW_MODES.CALCULATED }">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h3 class="mb-0">Calculated Samples (by Lane)</h3>
                                    <div>
                                        <button
                                            class="btn btn-success me-2"
                                            @click="openEditModalForNewSample()">
                                            <i class="fa fa-plus"></i> Add Sample
                                        </button>
                                        <button
                                            class="btn btn-primary me-2"
                                            @click="openBulkEditModal">
                                            <i class="fa fa-edit"></i> Bulk Edit Actions
                                        </button>
                                        <button
                                            class="btn btn-info me-2"
                                            @click="openCustomConfigModal()">
                                            <i class="fa fa-magic"></i> Custom Config
                                        </button>
                                        <span v-if="hasChanges">
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
                                        </span>
                                    </div>
                                </div>
                                <!-- Save Comment Field (shown when there are changes) -->
                                <div v-if="hasChanges" class="card mt-3 mb-3 border-info">
                                    <div class="card-body">
                                        <label for="saveComment" class="form-label">
                                            <i class="fa fa-comment"></i> <strong>Change Comment (optional)</strong>
                                        </label>
                                        <textarea
                                            class="form-control"
                                            id="saveComment"
                                            v-model="saveComment"
                                            rows="2"
                                            placeholder="Describe the changes you made (optional)..."
                                            :disabled="saving"></textarea>
                                        <small class="text-muted">This comment will be saved in the version history.</small>
                                    </div>
                                </div>
                                <!-- Column Configuration Menu -->
                                <div class="card mt-3 mb-4">
                                    <div class="card-header" @click="columnConfigCollapsed = !columnConfigCollapsed" style="cursor: pointer;">
                                        <h5 class="mb-0">
                                            <i class="fa" :class="columnConfigCollapsed ? 'fa-caret-right' : 'fa-caret-down'"></i>
                                            Column Configuration
                                        </h5>
                                    </div>
                                    <div class="card-body" v-show="!columnConfigCollapsed">
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
                                                            :disabled="column.key === 'sample_id'"
                                                            @change="toggleColumn(column.key)">
                                                        <label class="form-check-label" :for="'col-' + column.key" :class="{ 'text-muted': column.key === 'sample_id' }">
                                                            {{ column.label }}
                                                            <span v-if="column.key === 'sample_id'" class="badge bg-secondary ms-1">Required</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Custom Configurations -->
                                <div v-if="demux_data && demux_data.custom_configs && demux_data.custom_configs.length > 0" class="card mt-3 mb-4">
                                    <div class="card-header" @click="customConfigsCollapsed = !customConfigsCollapsed" style="cursor: pointer;">
                                        <h5 class="mb-0">
                                            <i class="fa" :class="customConfigsCollapsed ? 'fa-caret-right' : 'fa-caret-down'"></i>
                                            Custom Configurations
                                            <span class="badge bg-info ms-2">{{ demux_data.custom_configs.length }}</span>
                                        </h5>
                                    </div>
                                    <div class="card-body" v-show="!customConfigsCollapsed">
                                        <p class="text-muted mb-3">
                                            Custom configurations that have been applied to samples in this flowcell.
                                        </p>
                                        <div v-for="(config, index) in demux_data.custom_configs" :key="index" class="card mb-2">
                                            <div class="card-body">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 class="mb-1">
                                                            <i class="fa fa-magic text-info"></i>
                                                            <strong>{{ config.name }}</strong>
                                                        </h6>
                                                        <div class="text-muted small">
                                                            <div><strong>Target:</strong>
                                                                <span v-if="config.target_type === 'project'">All lanes in project {{ config.target_project }}</span>
                                                                <span v-else-if="config.target_type === 'lane'">All projects in lane {{ config.target_lane }}</span>
                                                                <span v-else>Project {{ config.target_project }} in lane {{ config.target_lane }}</span>
                                                            </div>
                                                            <div v-if="config.created_at"><strong>Created:</strong> {{ new Date(config.created_at).toLocaleString() }}</div>
                                                            <div v-if="config.created_by"><strong>Created by:</strong> {{ config.created_by }}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <button class="btn btn-sm btn-outline-primary" @click="openCustomConfigModal(config, index)" title="Edit">
                                                            <i class="fa fa-edit"></i> Edit
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="mt-2">
                                                    <strong>BCLConvert Settings:</strong>
                                                    <ul class="mb-0 mt-1 small">
                                                        <li v-if="config.raw_samplesheet_settings.TrimUMI !== undefined">
                                                            TrimUMI:
                                                            <code v-if="config.raw_samplesheet_settings.TrimUMI === 'EXCLUDE'" class="text-danger">Do not include</code>
                                                            <code v-else>{{ config.raw_samplesheet_settings.TrimUMI }}</code>
                                                        </li>
                                                        <li v-if="config.raw_samplesheet_settings.CreateFastqForIndexReads !== undefined">
                                                            CreateFastqForIndexReads:
                                                            <code v-if="config.raw_samplesheet_settings.CreateFastqForIndexReads === 'EXCLUDE'" class="text-danger">Do not include</code>
                                                            <code v-else>{{ config.raw_samplesheet_settings.CreateFastqForIndexReads }}</code>
                                                        </li>
                                                        <li v-if="config.raw_samplesheet_settings.BarcodeMismatchesIndex1 !== undefined">
                                                            BarcodeMismatchesIndex1: <code>{{ config.raw_samplesheet_settings.BarcodeMismatchesIndex1 }}</code>
                                                        </li>
                                                        <li v-if="config.raw_samplesheet_settings.BarcodeMismatchesIndex2 !== undefined">
                                                            BarcodeMismatchesIndex2: <code>{{ config.raw_samplesheet_settings.BarcodeMismatchesIndex2 }}</code>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Grouping Order Toggle -->
                                <div class="card mt-3 mb-3">
                                    <div class="card-body">
                                        <div class="form-check form-switch">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                id="groupByProjectFirstToggle"
                                                v-model="groupByProjectFirst">
                                            <label class="form-check-label" for="groupByProjectFirstToggle">
                                                <strong>Group by Project → Lanes</strong>
                                                <small class="text-muted d-block">
                                                    <span v-if="!groupByProjectFirst">Currently: Lanes → Projects (samples grouped by lane, then by project)</span>
                                                    <span v-else>Currently: Projects → Lanes (samples grouped by project, then by lane)</span>
                                                </small>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <!-- Named Index Grouping Toggle -->
                                <div class="card mt-3 mb-3">
                                    <div class="card-body">
                                        <div class="form-check form-switch">
                                            <input
                                                class="form-check-input"
                                                type="checkbox"
                                                id="groupByNamedIndexToggle"
                                                v-model="groupByNamedIndex">
                                            <label class="form-check-label" for="groupByNamedIndexToggle">
                                                <strong>Group by Named Index</strong>
                                                <small class="text-muted d-block">Display samples grouped by their index name (useful for 10X samples and index expansion workflows)</small>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <!-- Tables grouped by Lane → Project -->
                                <div v-if="!groupByProjectFirst">
                                    <div v-for="(projects, lane) in calculatedSamplesByLaneProjectAndNamedIndex" :key="lane" class="mt-4">
                                        <h4>Lane {{ lane }}</h4>
                                        <project-lane-card
                                            v-for="(indexGroups, projectName) in projects"
                                            :key="projectName"
                                            class="mb-4"
                                            :title="projectName"
                                            icon="fa fa-folder-open"
                                            :index-groups="indexGroups"
                                            :lane="lane"
                                            :group-by-named-index="groupByNamedIndex"
                                            :visible-columns="visibleColumns"
                                            :column-label="columnLabel"
                                            :calculated-lanes="calculatedLanes"
                                            :get-row-classes="getRowClasses"
                                            :get-cell-classes="getCellClasses"
                                            :get-edit-tooltip="getEditTooltip"
                                            :is-code-formatted-column="isCodeFormattedColumn"
                                            :format-cell-value="formatCellValue"
                                            :get-action-buttons-config="getActionButtonsConfig"
                                            @openConfigModal="openConfigModal"
                                            @openEditModal="openEditModal">
                                        </project-lane-card>
                                    </div>
                                </div> <!-- end Lane → Project grouping -->
                                <!-- Tables grouped by Project → Lane -->
                                <div v-else>
                                    <div v-for="(lanes, projectName) in calculatedSamplesByProjectLaneAndNamedIndex" :key="projectName" class="mt-4">
                                        <h4><i class="fa fa-folder-open"></i> {{ projectName }}</h4>
                                        <project-lane-card
                                            v-for="(indexGroups, lane) in lanes"
                                            :key="lane"
                                            class="mb-4"
                                            :title="'Lane ' + lane"
                                            :index-groups="indexGroups"
                                            :lane="lane"
                                            :group-by-named-index="groupByNamedIndex"
                                            :visible-columns="visibleColumns"
                                            :column-label="columnLabel"
                                            :calculated-lanes="calculatedLanes"
                                            :get-row-classes="getRowClasses"
                                            :get-cell-classes="getCellClasses"
                                            :get-edit-tooltip="getEditTooltip"
                                            :is-code-formatted-column="isCodeFormattedColumn"
                                            :format-cell-value="formatCellValue"
                                            :get-action-buttons-config="getActionButtonsConfig"
                                            @openConfigModal="openConfigModal"
                                            @openEditModal="openEditModal">
                                        </project-lane-card>
                                    </div>
                                </div> <!-- end Project → Lane grouping -->
                            </div> <!-- end Calculated Samples tab-pane -->
                            <!-- Version History tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === 'history' }">
                                <h3>Version History {{viewMode}}</h3>
                                <h5>Inside</H5>
                                <div v-if="versionTimestamps.length === 0" class="alert alert-info">
                                    No version history available.
                                </div>
                                <div v-else>
                                    <div v-for="timestamp in versionTimestamps" :key="timestamp" class="card mb-3">
                                        <div class="card-header">
                                            <h5 class="mb-0">{{ formatTimestamp(timestamp) }}</h5>
                                        </div>
                                        <div class="card-body">
                                            <dl class="row mb-0">
                                                <dt class="col-sm-3">Generated By:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].generated_by || 'N/A' }}</dd>
                                                <dt class="col-sm-3">Autogenerated:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].autogenerated ? 'Yes' : 'No' }}</dd>
                                                <dt class="col-sm-3">Auto Run:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].auto_run ? 'Yes' : 'No' }}</dd>
                                                <dt class="col-sm-3">Comment:</dt>
                                                <dd class="col-sm-9">{{ demux_data.calculated.version_history[timestamp].comment || 'None' }}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Samplesheets tab -->
                            <div class="tab-pane fade" :class="{ 'show active': viewMode === 'samplesheets' }">
                                <h3>Illumina v2 Samplesheets</h3>
                                <p class="text-muted">Generated samplesheets grouped by lane and BCLConvert settings. Projects with different settings are split into separate samplesheets.</p>
                                <div v-if="samplesheets.length === 0" class="alert alert-info">
                                    No samplesheets available. Please ensure data is loaded.
                                </div>
                                <div v-else>
                                    <div v-for="(samplesheet, index) in samplesheets" :key="index" class="card mb-4">
                                        <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 class="mb-0">
                                                    <i class="fa fa-file-text"></i> Lane {{ samplesheet.lane }} - {{ samplesheet.projects.join(', ') }}
                                                </h5>
                                                <small class="text-muted">{{ samplesheet.sample_count }} sample{{ samplesheet.sample_count !== 1 ? 's' : '' }}</small>
                                            </div>
                                            <button class="btn btn-primary btn-sm" @click="downloadSamplesheet(samplesheet)">
                                                <i class="fa fa-download"></i> Download
                                            </button>
                                        </div>
                                        <div class="card-body">
                                            <!-- Samplesheet Preview -->
                                            <div>
                                                <h6 class="text-muted">Preview:</h6>
                                                <pre class="bg-light p-3 rounded" style="max-height: 400px; overflow-y: auto;"><code>{{ generateSamplesheetContent(samplesheet) }}</code></pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> <!-- end tab-content -->
                    </template>
                <!-- Unified Sample Management Modal with Tabs -->
                    <div v-if="showUnifiedModal" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); overflow-y: auto;">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Sample Management</h5>
                                    <div class="ms-auto me-2">
                                        <button
                                            v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.EDIT && !editModalIsNew && Object.keys(fieldHistory).length > 0"
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary"
                                            @click="showFieldHistory = !showFieldHistory">
                                            <i class="fa" :class="showFieldHistory ? 'fa-eye-slash' : 'fa-history'"></i>
                                            {{ showFieldHistory ? 'Hide History' : 'Show Field History' }}
                                        </button>
                                    </div>
                                    <button type="button" class="btn-close" @click="closeUnifiedModal"></button>
                                </div>
                                <!-- Nav Tabs -->
                                <ul class="nav nav-tabs px-3 pt-2" style="border-bottom: 1px solid #dee2e6;">
                                    <li class="nav-item">
                                        <a class="nav-link" :class="{ active: unifiedModalTab === CONSTANTS.MODAL_TABS.EDIT }" @click="unifiedModalTab = CONSTANTS.MODAL_TABS.EDIT" href="javascript:void(0)">
                                            <i class="fa fa-edit"></i> Edit Sample
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" :class="{ active: unifiedModalTab === CONSTANTS.MODAL_TABS.ADD }" @click="unifiedModalTab = CONSTANTS.MODAL_TABS.ADD" href="javascript:void(0)">
                                            <i class="fa fa-plus"></i> Add Sample
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" :class="{ active: unifiedModalTab === CONSTANTS.MODAL_TABS.BULK }" @click="unifiedModalTab = CONSTANTS.MODAL_TABS.BULK" href="javascript:void(0)">
                                            <i class="fa fa-cogs"></i> Bulk Operations
                                        </a>
                                    </li>
                                </ul>
                                <div class="modal-body">
                                    <!-- Tab: Edit Sample -->
                                    <div v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.EDIT" class="tab-pane-content">
                                    <!-- Config Sources Info (only for existing samples) -->
                                    <div v-if="!editModalIsNew && editModalSample" class="row mb-3">
                                        <div class="col-12">
                                            <div class="card bg-light border-info">
                                                <div class="card-body">
                                                    <h6 class="card-title text-info">
                                                        <i class="fa fa-info-circle"></i> Configuration Sources Applied
                                                    </h6>
                                                    <p class="mb-2 small text-muted">The following configurations were applied to generate this sample's current settings:</p>
                                                    <ol class="mb-0">
                                                        <li v-for="(source, index) in getConfigSources(editModalSample)" :key="index" class="font-monospace small">
                                                            {{ source }}
                                                        </li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Field History (only for existing samples when toggled) -->
                                    <div v-if="!editModalIsNew && showFieldHistory && Object.keys(fieldHistory).length > 0" class="row mb-3">
                                        <div class="col-12">
                                            <div class="card border-warning">
                                                <div class="card-body">
                                                    <h6 class="card-title text-warning">
                                                        <i class="fa fa-history"></i> Field History
                                                    </h6>
                                                    <p class="mb-3 small text-muted">Historical changes to individual fields for this sample:</p>
                                                    <!-- Iterate through each field that has history -->
                                                    <div v-for="(changes, fieldName) in fieldHistory" :key="fieldName" class="mb-3">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <strong class="text-primary">{{ fieldName }}:</strong>
                                                            <span class="badge bg-secondary ms-2">{{ changes.length }} change{{ changes.length !== 1 ? 's' : '' }}</span>
                                                        </div>
                                                        <div class="border-start border-2 border-primary ps-3">
                                                            <div v-for="(change, idx) in changes" :key="idx" class="mb-2">
                                                                <div class="d-flex align-items-start">
                                                                    <span class="badge bg-light text-dark me-2" style="min-width: 180px;">
                                                                        <i class="fa fa-clock"></i>
                                                                        {{ formatTimestamp(change.timestamp) }}
                                                                    </span>
                                                                    <span class="font-monospace flex-grow-1">
                                                                        <span v-if="change.value === null || change.value === undefined || change.value === ''" class="text-muted fst-italic">
                                                                            (empty)
                                                                        </span>
                                                                        <span v-else-if="typeof change.value === 'boolean'">
                                                                            <span :class="change.value ? 'text-success' : 'text-danger'">
                                                                                {{ change.value ? 'Yes' : 'No' }}
                                                                            </span>
                                                                        </span>
                                                                        <span v-else>
                                                                            {{ change.value }}
                                                                        </span>
                                                                        <span v-if="idx === changes.length - 1" class="badge bg-success ms-2">Current</span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <!-- Empty state (shouldn't happen if we check Object.keys length) -->
                                                    <div v-if="Object.keys(fieldHistory).length === 0" class="text-muted fst-italic">
                                                        No field history available for this sample.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Sample Form Fields -->
                                    <SampleFormFields
                                        v-model="editFormData"
                                        :is-new-sample="editModalIsNew"
                                        mode="edit" />
                                    </div> <!-- End Edit Sample Tab -->
                                    <!-- Tab: Add Sample -->
                                    <div v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.ADD" class="tab-pane-content">
                                        <!-- Target Selection -->
                                        <div class="card border-primary mb-3">
                                            <div class="card-header bg-primary text-white">
                                                <h6 class="mb-0"><i class="fa fa-crosshairs"></i> Where to add the sample?</h6>
                                            </div>
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Lane(s): <span class="text-danger">*</span></label>
                                                        <div class="border rounded p-2" style="max-height: 200px; overflow-y: auto;">
                                                            <div class="form-check">
                                                                <input type="checkbox" class="form-check-input" id="addSample_allLanes"
                                                                    :checked="addSampleTargetLanes.length === availableLanes.length"
                                                                    @change="addSampleTargetLanes = $event.target.checked ? availableLanes.slice() : []">
                                                                <label class="form-check-label" for="addSample_allLanes">
                                                                    <strong>All Lanes</strong>
                                                                </label>
                                                            </div>
                                                            <hr class="my-1">
                                                            <div v-for="lane in availableLanes" :key="lane" class="form-check">
                                                                <input type="checkbox" class="form-check-input" :id="'addSample_lane_' + lane"
                                                                    :value="lane" v-model="addSampleTargetLanes">
                                                                <label class="form-check-label" :for="'addSample_lane_' + lane">
                                                                    Lane {{ lane }}
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <small class="form-text text-muted">Select at least one lane (required)</small>
                                                    </div>
                                                    <div class="col-md-6 mb-3">
                                                        <label for="addSample_project" class="form-label">Project:</label>
                                                        <select class="form-select" id="addSample_project" v-model="addSampleTargetProject">
                                                            <option value="">-- None --</option>
                                                            <option v-for="project in availableProjects" :key="project.id || project.name" :value="project.id || project.name">
                                                                {{ project.displayName }}
                                                            </option>
                                                        </select>
                                                        <small class="form-text text-muted">Optional: select if sample belongs to a project</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Sample form fields (same as edit, but for new sample) -->
                                        <div v-if="addSampleTargetLanes.length > 0" class="alert alert-success">
                                            <strong><i class="fa fa-check-circle"></i> Adding sample to Lane(s):</strong> {{ addSampleTargetLanes.map(l => 'Lane ' + l).join(', ') }}<br>
                                            <strong>Project:</strong> {{ addSampleTargetProject || 'None' }}<br>
                                            <small class="d-block mt-1"><strong>Sample ID Template:</strong> Sample_{{ nextSampleId || 'ProjectID_XXXX' }} <em class="text-muted">(replace XXXX with your sample number)</em></small>
                                            <small class="d-block mt-1"><strong>Sample Name Template:</strong> {{ nextSampleId || 'ProjectID_XXXX' }} <em class="text-muted">(same as Sample ID but without the Sample_ prefix)</em></small>
                                        </div>
                                        <!-- Warning for inconsistent project values -->
                                        <div v-if="addSampleTargetLanes.length > 0 && addSampleProjectWarnings.length > 0" class="alert alert-info">
                                            <strong><i class="fa fa-info-circle"></i> Inconsistent Field Values Detected:</strong>
                                            <p class="mb-1 mt-2">The following fields have different values across samples in this project. The form has been pre-filled with values from the first sample, but you may want to review these fields:</p>
                                            <ul class="mb-0 mt-2">
                                                <li v-for="(warning, idx) in addSampleProjectWarnings" :key="idx">{{ warning }}</li>
                                            </ul>
                                        </div>
                                        <!-- Info about manual sample addition -->
                                        <div v-if="addSampleTargetLanes.length > 0" class="alert alert-info">
                                            <strong><i class="fa fa-info-circle"></i> Note:</strong>
                                            Manually added samples require you to fill in all fields. Unlike LIMS-uploaded samples, Stage 1 processing rules will not be applied.
                                        </div>
                                        <div v-else-if="addSampleTargetLanes.length === 0" class="alert alert-warning">
                                            <i class="fa fa-exclamation-triangle"></i> Please select at least one lane above to continue
                                        </div>
                                        <div v-if="addSampleTargetLanes.length > 0">
                                            <!-- Sample Form Fields Component -->
                                            <SampleFormFields
                                                v-model="editFormData"
                                                :is-new-sample="true"
                                                mode="add" />
                                        </div> <!-- End conditional form fields -->
                                    </div> <!-- End Add Sample Tab -->
                                    <!-- Tab: Bulk Operations -->
                                    <div v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.BULK" class="tab-pane-content">
                                        <div class="mb-3">
                                            <label for="bulkEditAction_unified" class="form-label">Action:</label>
                                            <select class="form-select" id="bulkEditAction_unified" v-model="bulkEditAction" @change="updateProjectLaneSelection">
                                                <option value="reverse_complement_index1">Reverse Complement Index 1</option>
                                                <option value="reverse_complement_index2">Reverse Complement Index 2</option>
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <label for="bulkEditProject_unified" class="form-label">Project:</label>
                                            <select class="form-select" id="bulkEditProject_unified" v-model="bulkEditProject" @change="updateProjectLaneSelection" required>
                                                <option value="">-- Select Project --</option>
                                                <option v-for="project in availableProjects" :key="project" :value="project">
                                                    {{ project }}
                                                </option>
                                            </select>
                                        </div>
                                        <div class="mb-3" v-if="bulkEditProject">
                                            <label for="bulkEditLane_unified" class="form-label">Lane:</label>
                                            <select class="form-select" id="bulkEditLane_unified" v-model="bulkEditLane" :disabled="isSingleLaneProject">
                                                <option v-if="!isSingleLaneProject" value="all">All Lanes</option>
                                                <option v-for="lane in projectLanes" :key="lane" :value="lane">
                                                    Lane {{ lane }}
                                                </option>
                                            </select>
                                            <small v-if="isSingleLaneProject" class="form-text text-muted">
                                                This project is only present in one lane.
                                            </small>
                                        </div>
                                    </div> <!-- End Bulk Operations Tab -->
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" @click="closeUnifiedModal">Cancel</button>
                                    <button v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.EDIT" type="button" class="btn btn-primary" @click="saveEditModal">
                                        {{ editModalIsNew ? 'Add Sample' : 'Save Changes' }}
                                    </button>
                                    <button v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.ADD" type="button" class="btn btn-success" @click="saveEditModal"
                                        :disabled="addSampleTargetLanes.length === 0">
                                        <i class="fa fa-plus"></i> Add Sample
                                    </button>
                                    <button v-if="unifiedModalTab === CONSTANTS.MODAL_TABS.BULK" type="button" class="btn btn-primary" @click="applyBulkEdit">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Configuration Details Modal Component -->
                    <ConfigInspectModal
                        :show="showConfigModal"
                        :sample="configModalSample"
                        :sources="configModalSources"
                        :expanded-sources="expandedConfigSources"
                        :classification-config="sampleClassificationConfig"
                        :sorted-settings="sortedConfigModalSettings"
                        :format-timestamp="formatTimestamp"
                        :format-config-value="formatConfigValue"
                        :get-config-details="getConfigDetails"
                        :trace-config-value-source="traceConfigValueSource"
                        :format-config-source-label="formatConfigSourceLabel"
                        :get-all-bclconvert-settings="getAllBCLConvertSettings"
                        :was-bclsetting-manually-edited="wasBCLSettingManuallyEdited"
                        @close="closeConfigModal"
                        @toggle-source="toggleConfigSource" />
                    <!-- Custom Config Modal Component -->
                    <CustomConfigModal
                        :show="showCustomConfigModal"
                        :edit-mode="customConfigEditMode"
                        :form-data="customConfigFormData"
                        :available-projects="availableProjects"
                        :available-lanes="Object.keys(calculatedLanes)"
                        :target-samples="customConfigTargetSamples"
                        @close="closeCustomConfigModal"
                        @save="saveCustomConfig"
                        @update:formData="customConfigFormData = $event" />
                </div>
            </div>
        </div>
        `
};
const app = Vue.createApp(vDemuxSampleInfoEditor);
app.mount('#demux_sample_info_editor_main');
